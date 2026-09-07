// Local-only assembly review. Never serves the invoice or the source archives.
// Plaintext purchased geometry is never copied to public.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { lightModes } from "../src/components/home/hero-scene-config.ts";

const root = process.cwd();
const modules = ["hero-scene-config", "glowbaby-channel", "stroller-hero-scene"];
const assets = { "stroller.glb": "stroller-optimized.glb", "bottom.glb": "bottom.glb", "top.glb": "top.glb" };
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Glowbaby local assembly preview</title>
<style>body{margin:0;background:#171827;color:#e2d8f6;font:14px system-ui}#scene{position:relative;width:100vw;height:calc(100vw / 1.12);max-height:90vh}#scene canvas,#viewport{position:absolute;inset:0}#viewport{pointer-events:none}nav{display:flex;gap:8px;justify-content:center;padding:12px}button{padding:12px 20px;border-radius:24px;border:1px solid #cbbce4;background:white}#status{text-align:center}body[data-capture]{background:transparent}body[data-capture] #scene{width:100vw;height:100vh;max-height:none}body[data-capture] #viewport{right:13.3333%;bottom:13.3333%}body[data-capture] nav,body[data-capture] #status{display:none}</style>
<div id="scene"><div id="viewport"></div></div><nav>${lightModes.map(mode => `<button data-mode="${mode.id}">${mode.label}</button>`).join("")}<button id="freeze">Freeze for poster</button></nav><p id="status">Loading local models…</p>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">import {createHeroScene} from '/modules/stroller-hero-scene.js'; import {heroSceneConfig as config} from '/modules/hero-scene-config.js';
const status=document.querySelector('#status'),params=new URLSearchParams(location.search);
const fail=message=>{status.textContent=message;document.body.dataset.error=message;delete document.body.dataset.ready;};
if(params.has('capture'))document.body.dataset.capture='true';
if(params.has('detail')){config.strollerHeight=0;config.assembly.position=[0,0.05,0];config.camera.position=[0.29,0.25,0.35];config.camera.target=[0,0.07,0];}
try{const handle=await createHeroScene(document.querySelector('#scene'),params.get('mode')||'flow',()=>fail('Rendering failed'),undefined,undefined,document.querySelector('#viewport'));
if(document.body.dataset.error){handle.dispose();throw new Error(document.body.dataset.error);}
handle.setActive(true);if(!document.body.dataset.error)status.textContent='Actual Glowbaby CAD • local review only';
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{handle.setMode(button.dataset.mode);handle.setActive(true);});
document.querySelector('#freeze').onclick=()=>handle.setActive(false);
if(params.has('capture')){handle.renderStill();if(!document.body.dataset.error)document.body.dataset.ready='true';}
}catch(error){fail(error.message);console.error(error);}</script></html>`;

export const previewServer = http.createServer(async (request, response) => {
  try {
    const port = previewServer.address().port;
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const origin = request.headers.origin;
    if (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin)) { response.writeHead(403).end(); return; }
    response.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/") { response.setHeader("Content-Type", "text/html"); response.end(html); return; }
    const name = url.pathname.split("/").pop();
    if (url.pathname === `/models/hero/${name}` && assets[name]) {
      response.setHeader("Content-Type", "model/gltf-binary"); response.end(await fs.readFile(path.join(root, ".local-assets", assets[name]))); return;
    }
    if (url.pathname.startsWith("/modules/") && modules.includes(name.replace(/\.js$/, ""))) {
      const source = await fs.readFile(path.join(root, "src/components/home", name.replace(/\.js$/, ".ts")), "utf8");
      let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
      for (const moduleName of modules) code = code.replaceAll(`"./${moduleName}"`, `"./${moduleName}.js"`);
      response.setHeader("Content-Type", "text/javascript"); response.end(code); return;
    }
    if (url.pathname.startsWith("/three/")) {
      const threeRoot = path.join(root, "node_modules/three");
      const file = path.resolve(threeRoot, url.pathname.slice(7));
      if (!file.startsWith(threeRoot + path.sep) || !file.endsWith(".js")) { response.writeHead(403).end(); return; }
      response.setHeader("Content-Type", "text/javascript"); response.end(await fs.readFile(file)); return;
    }
    response.writeHead(404).end();
  } catch { response.writeHead(500).end("Local preview asset unavailable"); }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.HERO_PREVIEW_PORT ?? 3010);
  previewServer.listen(port, "127.0.0.1", () => console.log(`Local-only hero preview: http://127.0.0.1:${port}`));
}
