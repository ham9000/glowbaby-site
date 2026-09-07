import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { previewServer } from "./preview-hero.mjs";
import { lightModes } from "../src/components/home/hero-scene-config.ts";

async function findBrowser() {
  const candidates = process.env.HERO_BROWSER_PATH ? [process.env.HERO_BROWSER_PATH] : [
    path.join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  for (const candidate of candidates) {
    try { await fs.access(candidate); return candidate; }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  throw new Error("Set HERO_BROWSER_PATH to an installed Chromium/Edge browser. No browser is downloaded automatically.");
}

async function connectProtocol(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const entry = pending.get(message.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
      else entry.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
  });
  socket.addEventListener("close", () => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error("Poster browser closed before capture completed"));
    }
    pending.clear();
  });
  return {
    socket,
    errors,
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Browser command timed out: ${method}`));
        }, 30000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function evaluate(protocol, expression) {
  const result = await protocol.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

if (typeof WebSocket === "undefined") throw new Error("Poster capture requires Node.js 22 or newer.");
const executable = await findBrowser();
await fs.mkdir(".local-assets", { recursive: true });
const profile = await fs.mkdtemp(path.resolve(".local-assets", "poster-browser-"));
let browser, protocol, startupError;
let browserLog = "";
try {
  await new Promise((resolve, reject) => {
    previewServer.once("error", reject);
    previewServer.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${previewServer.address().port}`;
  browser = spawn(executable, [
    "--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
    "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  browser.once("error", (error) => { startupError = error; });
  browser.stderr.on("data", (data) => { browserLog = (browserLog + data).slice(-4000); });
  let port;
  for (let attempt = 0; attempt < 200; attempt++) {
    if (startupError) throw startupError;
    if (browser.exitCode !== null) throw new Error(`Poster browser exited (${browser.exitCode}): ${browserLog}`);
    try {
      port = Number((await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]);
      if (port) break;
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    await delay(100);
  }
  if (!port) throw new Error(`Poster browser did not start: ${browserLog}`);
  const endpoint = `http://127.0.0.1:${port}`;
  const response = await fetch(`${endpoint}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Unable to create poster browser tab: HTTP ${response.status}`);
  const target = await response.json();
  protocol = await connectProtocol(target.webSocketDebuggerUrl);
  await protocol.send("Page.enable");
  await protocol.send("Runtime.enable");
  await protocol.send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 1072, deviceScaleFactor: 1, mobile: false });

  const renders = [];
  for (const { id: mode } of lightModes) {
    protocol.errors.length = 0;
    const url = `${origin}/?capture=1&mode=${mode}`;
    await protocol.send("Page.navigate", { url });
    let ready = false;
    for (let attempt = 0; attempt < 300; attempt++) {
      if (protocol.errors.length) throw new Error(protocol.errors.join("\n"));
      const state = await evaluate(protocol, "({ url: location.href, ready: document.body?.dataset.ready, error: document.body?.dataset.error })");
      if (state.url !== url) { await delay(100); continue; }
      if (state.error) throw new Error(state.error);
      if (state.ready === "true") { ready = true; break; }
      await delay(100);
    }
    if (!ready) throw new Error(`Timed out rendering ${mode}`);
    const { data } = await protocol.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    if (protocol.errors.length) throw new Error(protocol.errors.join("\n"));
    const state = await evaluate(protocol, "({ url: location.href, ready: document.body?.dataset.ready, error: document.body?.dataset.error })");
    if (state.url !== url || state.error || state.ready !== "true") throw new Error(state.error ?? `Scene became unavailable while capturing ${mode}`);
    const png = Buffer.from(data, "base64");
    const meta = await sharp(png).metadata();
    if (meta.width !== 1200 || meta.height !== 1072) throw new Error(`Unexpected ${mode} capture size: ${meta.width}x${meta.height}`);
    renders.push({ mode, png, webp: await sharp(png).webp({ quality: 88 }).toBuffer() });
  }
  // Do not overwrite any poster until every mode renders successfully.
  await fs.mkdir(path.join("public", "hero"), { recursive: true });
  for (const { mode, png, webp } of renders) {
    await fs.writeFile(path.join(".local-assets", `stroller-${mode}.png`), png);
    await fs.writeFile(path.join("public", "hero", `stroller-render-${mode}.webp`), webp);
    console.log(`${mode}: fresh 1200x1072 scene render, ${webp.length} bytes`);
  }
} finally {
  try {
    if (protocol?.socket.readyState === WebSocket.OPEN) await protocol.send("Browser.close");
  } finally {
    protocol?.socket.close();
    if (browser?.pid && browser.exitCode === null) {
      for (let attempt = 0; attempt < 50 && browser.exitCode === null; attempt++) await delay(100);
      if (browser.exitCode === null) {
        browser.kill();
        for (let attempt = 0; attempt < 50 && browser.exitCode === null; attempt++) await delay(100);
      }
    }
    previewServer.closeAllConnections();
    try {
      await new Promise((resolve, reject) => previewServer.close((error) => {
        if (error && error.code !== "ERR_SERVER_NOT_RUNNING") reject(error);
        else resolve();
      }));
    } finally {
      await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  }
}
