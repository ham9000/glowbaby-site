import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { runInNewContext } from "node:vm";
import { gzipSync } from "node:zlib";
import ts from "typescript";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [formatSource, clientSource, mediaSource, sceneSource, configSource] = await Promise.all([
  read("../src/lib/hero-asset-format.ts"), read("../src/lib/hero-asset-client.ts"),
  read("../src/components/home/interactive-hero-media.tsx"), read("../src/components/home/stroller-hero-scene.ts"),
  read("../src/components/home/hero-scene-config.ts"),
]);
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function evaluate(source, dependencies = {}, globals = {}) {
  const compiledModule = { exports: {} };
  runInNewContext(compile(source), {
    module: compiledModule, exports: compiledModule.exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected runtime dependency: ${name}`);
      const value = dependencies[name];
      return typeof value === "function" ? value() : value;
    },
    Uint8Array, ArrayBuffer, DataView, TextEncoder, TextDecoder, AbortController, DOMException,
    Blob, DecompressionStream,
    atob, btoa, ...globals,
  });
  return compiledModule.exports;
}
const format = evaluate(formatSource);
const { heroSceneConfig: config, lightModes } = evaluate(configSource);
const glbJson = new TextEncoder().encode('{"asset":{"version":"2.0"}}  ');
const paddedJson = new Uint8Array(Math.ceil(glbJson.length / 4) * 4).fill(32);
paddedJson.set(glbJson);
const glb = new ArrayBuffer(20 + paddedJson.length);
const glbView = new DataView(glb);
[0x46546c67, 2, glb.byteLength, paddedJson.length, 0x4e4f534a].forEach((value, index) => glbView.setUint32(index * 4, value, true));
new Uint8Array(glb, 20).set(paddedJson);
const models = { stroller: glb, bottom: glb.slice(0), top: glb.slice(0) };
const rawKey = webcrypto.getRandomValues(new Uint8Array(32));
const key = await webcrypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const compressedBundle = gzipSync(new Uint8Array(format.packHeroModels(models)), { level: 9 });
const cipher = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, compressedBundle));
const packet = new Uint8Array(iv.length + cipher.length);
packet.set(iv); packet.set(cipher, iv.length);
const envelope = format.wrapEncryptedHero(packet);
const oversizedCompressed = gzipSync(new Uint8Array(format.MAX_HERO_BUNDLE_BYTES + 1), { level: 9 });
const oversizedIv = webcrypto.getRandomValues(new Uint8Array(12));
const oversizedCipher = new Uint8Array(await webcrypto.subtle.encrypt(
  { name: "AES-GCM", iv: oversizedIv, tagLength: 128 },
  key,
  oversizedCompressed,
));
const oversizedPacket = new Uint8Array(oversizedIv.length + oversizedCipher.length);
oversizedPacket.set(oversizedIv);
oversizedPacket.set(oversizedCipher, oversizedIv.length);
const oversizedEnvelope = format.wrapEncryptedHero(oversizedPacket);
const id = "a".repeat(32);
const validGrant = () => ({
  assetUrl: `/api/hero/asset/${id}`, grant: id, key: Buffer.from(rawKey).toString("base64"), expiresAt: Date.now() + 90_000,
});
const jsonResponse = (value) => Response.json(value);
const assetResponse = () => new Response(envelope, { headers: { "content-type": "application/octet-stream" } });
function delivery(fetcher, extras = {}) {
  return evaluate(clientSource, { "./hero-asset-format": format }, {
    isSecureContext: true, crypto: webcrypto, fetch: fetcher, ...extras,
  }).loadHeroModels;
}
let calls = [], keyExtractable;
const guardedCrypto = { subtle: {
  importKey(...args) { keyExtractable = args[3]; return webcrypto.subtle.importKey(...args); },
  decrypt: webcrypto.subtle.decrypt.bind(webcrypto.subtle),
} };
const load = delivery(async (url, init) => {
  calls.push(url);
  assert.equal(init.method, "POST");
  assert.equal(init.body, undefined);
  assert.equal(init.credentials, "same-origin");
  assert.equal(init.cache, "no-store");
  assert.equal(init.redirect, "error");
  assert.equal(init.headers[format.HERO_VIEWER_HEADER], "1");
  if (url === "/api/hero/session") return jsonResponse(validGrant());
  assert.equal(init.headers[format.HERO_GRANT_HEADER], id);
  return assetResponse();
}, { crypto: guardedCrypto });
const delivered = await load(new AbortController().signal);
for (const name of ["stroller", "bottom", "top"]) assert.deepEqual(Buffer.from(delivered[name]), Buffer.from(glb));
assert.deepEqual(calls, ["/api/hero/session", `/api/hero/asset/${id}`]);
assert.equal(keyExtractable, false);

let expiredReady = 0;
await assert.rejects(delivery(async () => jsonResponse({ ...validGrant(), expiresAt: Date.now() - 1 }))(
  new AbortController().signal,
  () => { expiredReady++; },
));
assert.equal(expiredReady, 0, "Expired access must not start the scene engine");

for (const mutate of [
  (grant) => ({ ...grant, assetUrl: `https://other.example/api/hero/asset/${id}` }),
  (grant) => ({ ...grant, assetUrl: `//other.example/api/hero/asset/${id}` }),
  (grant) => ({ ...grant, assetUrl: `${grant.assetUrl}?key=secret` }),
  (grant) => ({ ...grant, grant: "../bad" }),
  (grant) => ({ ...grant, key: "bad" }),
  (grant) => ({ ...grant, expiresAt: "tomorrow" }),
  () => null,
]) {
  let requests = 0;
  await assert.rejects(delivery(async () => { requests++; return jsonResponse(mutate(validGrant())); })(new AbortController().signal));
  assert.equal(requests, 1, "Invalid grants must never request the asset");
}
for (const expired of ["once", "always", "local"]) {
  let sessions = 0, assets = 0;
  const retry = delivery(async (url) => {
    if (url === "/api/hero/session") {
      sessions++;
      return jsonResponse({ ...validGrant(), ...(expired === "local" ? { expiresAt: Date.now() - 1 } : {}) });
    }
    assets++;
    return expired === "always" || assets === 1 ? new Response(null, { status: 401 }) : assetResponse();
  });
  if (expired === "once") await retry(new AbortController().signal);
  else await assert.rejects(retry(new AbortController().signal));
  assert.equal(sessions, 2, "Grant retry must be bounded to one renewal");
  assert.equal(assets, expired === "local" ? 0 : 2);
}
for (const invalid of ["tampered", "wrong-magic", "wrong-mime", "oversize", "oversized-plain", "denied"]) {
  let requests = 0;
  const broken = delivery(async (url) => {
    requests++;
    if (url === "/api/hero/session") return jsonResponse(validGrant());
    if (invalid === "denied") return new Response(null, { status: 403 });
    if (invalid === "oversize") return new Response(new Uint8Array(format.MAX_HERO_BUNDLE_BYTES + 33), { headers: { "content-type": "application/octet-stream" } });
    if (invalid === "oversized-plain") return new Response(oversizedEnvelope, { headers: { "content-type": "application/octet-stream" } });
    if (invalid === "wrong-mime") return new Response(envelope, { headers: { "content-type": "text/html" } });
    const corrupted = envelope.slice();
    corrupted[invalid === "wrong-magic" ? 0 : corrupted.length - 1] ^= 1;
    return new Response(corrupted, { headers: { "content-type": "application/octet-stream" } });
  });
  await assert.rejects(broken(new AbortController().signal));
  assert.equal(requests, 2, "Non-expiry errors must not loop or retry");
}
for (const extras of [{ isSecureContext: false }, { crypto: {} }]) {
  await assert.rejects(delivery(() => assert.fail("Unsupported crypto must not fetch"), extras)(new AbortController().signal));
}
const cancelled = new AbortController();
cancelled.abort();
await assert.rejects(delivery(() => assert.fail("Aborted requests must not fetch"))(cancelled.signal), { name: "AbortError" });
console.log("Hero delivery: real AES-GCM, request contract, invalid grants/envelopes, size budget, bounded renewal, crypto gates and abort passed.");

class Events {
  listeners = new Map();
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  emit(name, event = {}) { for (const callback of this.listeners.get(name) ?? []) callback(event); }
}
const flush = () => new Promise(setImmediate);
function componentHarness(options = {}) {
  const hooks = [];
  let cursor = 0, effect, cleanup, mounted = false, tree, observer;
  const host = {};
  const width = Object.assign(new Events(), { matches: options.desktop ?? true });
  const motion = Object.assign(new Events(), { matches: options.reducedMotion ?? false });
  const coarse = Object.assign(new Events(), { matches: options.coarse ?? false });
  const connection = Object.assign(new Events(), { saveData: options.saveData, effectiveType: options.effectiveType });
  const record = { delivery: 0, engine: 0, probe: 0, disposed: 0, active: [], modes: [], order: [], signal: null };
  const document = Object.assign(new Events(), {
    hidden: false,
    createElement() {
      record.probe++;
      return { getContext: () => options.webgl === false ? null : { getExtension: () => ({ loseContext() {} }) } };
    },
  });
  const handle = {
    setActive(value) { record.active.push(value); },
    setMode(value) { record.modes.push(value); },
    dispose() { record.disposed++; },
  };
  const jsx = (type, props) => {
    if (props.ref) props.ref.current = host;
    return { type, props };
  };
  const { InteractiveHeroMedia } = evaluate(mediaSource, {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: {
      useRef(initial) { const index = cursor++; return hooks[index] ??= { current: initial }; },
      useState(initial) {
        const index = cursor++;
        if (!(index in hooks)) hooks[index] = initial;
        return [hooks[index], (value) => { hooks[index] = value; }];
      },
      useEffect(callback) { if (!mounted) effect = callback; },
    },
    "next/image": { default: "image" },
    "./hero-scene-config": evaluate(configSource),
    ...Object.fromEntries(Array.from(lightModes, ({ id }) => [
      `../../../public/hero/stroller-render-${id}.webp`, { default: `${id}-poster` },
    ])),
    "../../lib/hero-asset-client": { async loadHeroModels(signal, onDeliveryReady) {
      record.delivery++; record.signal = signal; record.order.push("delivery");
      if (options.access) await options.access(signal, record.delivery);
      onDeliveryReady?.();
      if (options.load) await options.load(signal, record.delivery);
      record.order.push("decrypted");
      return models;
    } },
    "./stroller-hero-scene": () => {
      record.engine++; record.order.push("engine");
      if (options.engineError) throw options.engineError;
      return { async createHeroScene(_host, mode, onFailure, data, signal) {
        assert.equal(data, models, "Production must pass decrypted model buffers");
        assert.equal(signal, record.signal);
        record.modes.push(mode);
        record.fail = onFailure;
        if (options.create) await options.create();
        return handle;
      } };
    },
  }, {
    isSecureContext: options.secure ?? true, crypto: options.crypto ?? webcrypto, document,
    DecompressionStream: options.decompression === false ? undefined : DecompressionStream,
    navigator: { connection, deviceMemory: options.memory ?? 8 },
    matchMedia: (query) => query.includes("min-width") ? width : query.includes("pointer: coarse") ? coarse : motion,
    ResizeObserver: class {},
    IntersectionObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
      disconnect() { observer = null; }
    },
  });
  const render = () => {
    cursor = 0;
    tree = InteractiveHeroMedia(options.sceneAvailable === undefined ? {} : { sceneAvailable: options.sceneAvailable });
    if (!mounted) { mounted = true; cleanup = effect(); }
    return tree;
  };
  const find = (predicate, node = tree) => {
    if (!node || typeof node !== "object") return undefined;
    if (predicate(node)) return node;
    const children = [node.props?.children].flat(Infinity).filter((child) => child !== undefined);
    return children.map((child) => find(predicate, child)).find(Boolean);
  };
  render();
  return {
    record, document, width, motion, coarse, connection, render, find,
    visible(value = true) { observer?.([{ isIntersecting: value }]); },
    toggle3D() {
      render();
      const button = find((node) => node.props.role === "switch");
      assert.ok(button, "Expected the compact 3D switch");
      button.props.onClick();
    },
    unmount() { cleanup?.(); },
  };
}
const desktop = componentHarness({ sceneAvailable: true });
desktop.visible();
await flush();
assert.ok(lightModes.some(({ id }) => desktop.find((node) => node.type === "image").props.src === `${id}-poster`));
assert.equal(desktop.find((node) => node.type === "image").props.draggable, false, "The poster must not start native image dragging");
const viewport = desktop.find((node) => node.props.className === "interactive-hero-stage");
let contextMenuPrevented = false;
viewport.props.onContextMenu({ preventDefault() { contextMenuPrevented = true; } });
assert.equal(contextMenuPrevented, true, "Viewport long presses must not open a native context menu");
assert.equal(desktop.find((node) => node.props.className === "interactive-hero").props.onContextMenu, undefined, "Selection protection must not include the controls or caption");
desktop.render();
assert.equal(desktop.record.delivery, 1);
assert.equal(desktop.record.engine, 1);
assert.ok(desktop.find((node) => node.props.role === "switch").props["aria-checked"]);
const modeGroup = desktop.find((node) => node.props.className === "hero-mode-controls");
const modeButtons = modeGroup.props.children.flat().filter((node) => node?.props?.["aria-pressed"] !== undefined);
assert.deepEqual(Array.from(modeButtons, (node) => node.props.children.at(-1)), Array.from(lightModes, (item) => item.label));
assert.ok(modeGroup.props.children.flat().some((node) => node?.props?.role === "switch"), "3D belongs beside the modes");
assert.equal(desktop.find((node) => node.props.className === "interactive-hero-stage").props.children.flat().some((node) => node?.type === "button"), false);
for (const [index, item] of lightModes.entries()) {
  modeButtons[index].props.onClick();
  desktop.render();
  assert.equal(desktop.record.modes.at(-1), item.id, "Mode selection reaches the live scene");
  assert.equal(desktop.find((node) => node.type === "image").props.src, `${item.id}-poster`, "Every mode has the matching fallback");
  assert.equal(desktop.find((node) => node.props["aria-live"] === "polite").props.children, item.description);
}
desktop.document.hidden = true;
desktop.document.emit("visibilitychange");
assert.equal(desktop.record.active.at(-1), false);
desktop.document.hidden = false;
desktop.document.emit("visibilitychange");
assert.equal(desktop.record.active.at(-1), true);
desktop.visible(false);
desktop.width.matches = false;
desktop.width.emit("change");
assert.equal(desktop.record.disposed, 1, "Width ineligibility must dispose even offscreen");
assert.equal(desktop.record.signal.aborted, true);
desktop.unmount();

const mobile = componentHarness({ sceneAvailable: true, desktop: false });
mobile.visible();
await flush();
assert.equal(mobile.record.delivery, 0);
assert.equal(mobile.record.engine, 0);
mobile.toggle3D();
await flush();
assert.equal(mobile.record.delivery, 1);
mobile.toggle3D();
assert.equal(mobile.record.signal.aborted, true);
assert.equal(mobile.record.disposed, 1);
mobile.width.matches = true; mobile.width.emit("change");
mobile.visible(false); mobile.visible(true);
await flush();
assert.equal(mobile.record.delivery, 1, "Explicit image selection suppresses automatic re-entry");
mobile.unmount();

const wideTouch = componentHarness({ sceneAvailable: true, desktop: true, coarse: true });
wideTouch.visible();
await flush();
assert.equal(wideTouch.record.delivery, 0, "Touch devices must opt into inspection even at desktop widths");
assert.equal(wideTouch.record.engine, 0);
wideTouch.toggle3D();
await flush();
assert.equal(wideTouch.record.delivery, 1);
wideTouch.coarse.matches = false; wideTouch.coarse.emit("change");
wideTouch.coarse.matches = true; wideTouch.coarse.emit("change");
assert.equal(wideTouch.record.disposed, 0, "Explicit inspection persists across input-device changes");
wideTouch.unmount();
assert.ok([...wideTouch.coarse.listeners.values()].every((listeners) => listeners.size === 0));

for (const gates of [
  {}, { sceneAvailable: false }, { reducedMotion: true }, { saveData: true }, { effectiveType: "2g" },
  { effectiveType: "slow-2g" }, { memory: 2 }, { secure: false }, { crypto: {} }, { decompression: false }, { webgl: false },
]) {
  const fallback = componentHarness({ sceneAvailable: true, ...gates, ...(Object.keys(gates).length ? {} : { sceneAvailable: undefined }) });
  fallback.visible();
  await flush();
  fallback.render();
  assert.equal(fallback.record.delivery, 0);
  assert.equal(fallback.record.engine, 0);
  assert.equal(fallback.find((node) => node.props.role === "switch"), undefined);
  fallback.unmount();
}
const retry = componentHarness({ sceneAvailable: true, access(_signal, attempt) { if (attempt === 1) throw new Error("Denied"); } });
retry.visible();
await flush();
assert.equal(retry.record.engine, 0, "Access failure must not download Three");
retry.render();
assert.match(retry.find((node) => node.props.role === "status").props.children, /couldn’t load/);
retry.toggle3D();
await flush();
assert.equal(retry.record.engine, 1);
retry.record.fail();
retry.render();
assert.equal(retry.find((node) => node.props.role === "switch").props["aria-checked"], false);
retry.unmount();

for (const reason of ["cancel", "unmount", "motion", "hidden"]) {
  let release;
  const pending = componentHarness({ sceneAvailable: true, load: () => new Promise((resolve) => { release = resolve; }) });
  pending.visible();
  await flush();
  if (reason === "cancel") pending.toggle3D();
  if (reason === "unmount") pending.unmount();
  if (reason === "motion") { pending.motion.matches = true; pending.motion.emit("change"); }
  if (reason === "hidden") { pending.document.hidden = true; pending.document.emit("visibilitychange"); }
  assert.equal(pending.record.signal.aborted, true, `${reason} must abort delivery`);
  assert.equal(pending.record.engine, 1, "Three starts while encrypted asset delivery is pending");
  release();
  await flush();
  assert.equal(pending.record.modes.length, 0, `${reason} must invalidate a late delivery`);
  if (reason !== "unmount") pending.unmount();
}
const engineFailure = componentHarness({
  sceneAvailable: true,
  engineError: new Error("Chunk failed"),
  load: (signal) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }),
});
engineFailure.visible();
await flush();
await flush();
assert.equal(engineFailure.record.signal.aborted, true, "Engine failure must abort parallel model delivery");
engineFailure.render();
assert.match(engineFailure.find((node) => node.props.role === "status").props.children, /couldn.t load/i);
engineFailure.unmount();

let releaseScene;
const lateScene = componentHarness({ sceneAvailable: true, create: () => new Promise((resolve) => { releaseScene = resolve; }) });
lateScene.visible();
await flush();
lateScene.toggle3D();
releaseScene();
await flush();
assert.equal(lateScene.record.disposed, 1, "A scene resolving after cancellation must be disposed");
lateScene.unmount();
console.log("Hero controller: deterministic poster, desktop progression, mobile opt-in, all capability gates, pause, cancel, retries and stale-generation cleanup passed.");

const pointerStart = sceneSource.indexOf("    let targetX =");
const pointerEnd = sceneSource.indexOf("    const setMode =", pointerStart);
assert.ok(pointerStart > 0 && pointerEnd > pointerStart);
const canvas = Object.assign(new Events(), {
  style: {}, captures: new Set(),
  getBoundingClientRect: () => ({ width: 500, height: 500 }),
  setPointerCapture(id) { this.captures.add(id); },
  hasPointerCapture(id) { return this.captures.has(id); },
  releasePointerCapture(id) { this.captures.delete(id); },
});
const pointer = evaluate(`
  let active = true, disposed = false, removeListeners = () => {};
  const lost = () => {};
  ${sceneSource.slice(pointerStart, pointerEnd)}
  exports.state = () => ({ targetX, targetY, pitch, yaw, pointerId, dragging });
  exports.angles = (x, y) => { pitch = x; yaw = y; };
  exports.cleanup = () => removeListeners();
`, {}, {
  canvas, config,
  THREE: { MathUtils: { clamp: (value, min, max) => Math.min(max, Math.max(min, value)) } },
});
const emit = (name, properties = {}) => canvas.emit(name, {
  isPrimary: true, pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, clientX: 100, clientY: 100, ...properties,
});
emit("pointermove", { clientX: 400 });
assert.equal(pointer.state().targetY, 0, "Hover must never move the scene");
emit("pointerdown", { button: 2 });
assert.equal(pointer.state().pointerId, null);
emit("pointerdown", { isPrimary: false });
assert.equal(pointer.state().pointerId, null);
emit("pointerdown");
assert.equal(canvas.hasPointerCapture(1), true);
emit("pointermove", { pointerId: 2, clientX: 500 });
assert.equal(pointer.state().targetY, 0);
emit("pointermove", { clientX: 900, clientY: -800 });
assert.equal(pointer.state().targetY, 1);
assert.equal(pointer.state().targetX, -1);
emit("pointerup", { pointerId: 2 });
assert.equal(pointer.state().dragging, true);
emit("pointerup");
assert.equal(pointer.state().targetY, 0);
assert.equal(canvas.captures.size, 0);
pointer.angles(config.interaction.pitch * 0.25, config.interaction.yaw * 0.7);
emit("pointerdown");
assert.equal(pointer.state().targetX, 0.25);
assert.equal(pointer.state().targetY, 0.7, "Re-grab must use the actual returning camera angle");
emit("lostpointercapture");
assert.equal(pointer.state().pointerId, null);
pointer.angles(0, 0);
emit("pointerdown");
emit("pointermove", { buttons: 0 });
assert.equal(pointer.state().pointerId, null);
emit("pointerdown", { pointerType: "touch" });
assert.equal(pointer.state().dragging, true, "Touch inspection starts immediately, without a hold");
assert.equal(canvas.hasPointerCapture(1), true);
emit("pointermove", { pointerType: "touch", clientY: 120 });
assert.equal(pointer.state().targetX, 0.08, "Vertical drags inspect instead of scrolling");
emit("pointermove", { pointerType: "touch", clientX: 200 });
assert.equal(pointer.state().targetY, 0.4);
emit("pointercancel", { pointerType: "touch" });
assert.equal(pointer.state().targetY, 0);
assert.equal(canvas.captures.size, 0);
assert.equal(canvas.style.touchAction, "pinch-zoom", "Reserve single-finger inspection without disabling native pinch zoom");
emit("pointerdown", { pointerType: "touch" });
pointer.cleanup();
assert.equal(canvas.captures.size, 0);
assert.ok([...canvas.listeners.values()].every((listeners) => listeners.size === 0));
assert.equal(config.interaction.yaw, Math.PI / 24);
assert.equal(config.interaction.pitch, Math.PI / 90);
assert.equal(config.interaction.damping, 5);
assert.equal(config.interaction.returnDamping, 3);
assert.ok(Math.exp(-config.interaction.returnDamping) < 0.05, "The camera returns 95% of the way in one second");
assert.match(sceneSource, /const damping = dragging \? config\.interaction\.damping : config\.interaction\.returnDamping/);
assert.match(sceneSource, /loader\.parseAsync\(buffer, ""\)/);
assert.doesNotMatch(compile(sceneSource), /require\([^)]*hero-asset/);
console.log("Hero interaction: immediate two-axis dragging, limits, re-grab continuity, secondary pointers, pinch-zoom policy, capture cleanup and slow return passed.");
