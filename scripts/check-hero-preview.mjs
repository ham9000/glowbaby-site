import assert from "node:assert/strict";
import { previewServer } from "./preview-hero.mjs";
import { heroSceneConfig } from "../src/components/home/hero-scene-config.ts";

try {
  await new Promise((resolve, reject) => {
    previewServer.once("error", reject);
    previewServer.listen(0, "127.0.0.1", resolve);
  });
  const response = await fetch(`http://127.0.0.1:${previewServer.address().port}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const inline = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline, "The real preview module must be present");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction("document", "location", "createHeroScene", "config", "console", inline.replace(/import[^;]+;/g, ""));

  for (const failure of ["none", "load", "initialization-callback", "still-throw", "still-callback", "late-callback"]) {
    const dataset = {};
    const status = { textContent: "" };
    let onFailure, stillFrames = 0;
    const document = {
      body: { dataset },
      querySelector: (selector) => selector === "#status" ? status : {},
      querySelectorAll: () => [],
    };
    const createScene = async (_host, _mode, callback) => {
      onFailure = callback;
      if (failure === "load") throw new Error("Simulated model failure");
      if (failure === "initialization-callback") callback();
      return {
        setActive() {},
        setMode() {},
        dispose() {},
        renderStill() {
          stillFrames++;
          if (failure === "still-throw") throw new Error("Simulated renderer failure");
          if (failure === "still-callback") callback();
        },
      };
    };
    await run(document, { search: "?capture=1&mode=flow" }, createScene, {}, { error() {} });
    if (failure === "late-callback") {
      assert.equal(dataset.ready, "true");
      onFailure();
    }
    if (failure === "none") {
      assert.equal(stillFrames, 1);
      assert.equal(dataset.ready, "true");
      assert.equal(dataset.error, undefined);
    } else {
      assert.ok(dataset.error, `${failure}: failures must be visible to the capture command`);
      assert.equal(dataset.ready, undefined, `${failure}: a failed render must never remain ready`);
      assert.equal(status.textContent, dataset.error);
    }
  }
  const heroDataset = {};
  const heroConfig = { camera: { position: [], target: [], fov: 0 } };
  await run({
    body: { dataset: heroDataset },
    querySelector: (selector) => selector === "#status" ? { textContent: "" } : {},
    querySelectorAll: () => [],
  }, { search: "?capture=1&mode=flow&hero=1" }, async () => ({
    setActive() {}, setMode() {}, dispose() {}, renderStill() {},
  }), heroConfig, { error() {} });
  assert.equal(heroDataset.hero, "true");
  assert.deepEqual(heroConfig.camera.position, [1.52, .74, 1.8]);
  assert.deepEqual(heroConfig.camera.target, [0, .40, 0]);
  assert.equal(heroConfig.camera.fov, 34);
  const detailConfig = { camera: {}, assembly: {}, attachment: { offsetsX: [-1, 1] } };
  await run({
    body: { dataset: {} },
    querySelector: (selector) => selector === "#status" ? { textContent: "" } : {},
    querySelectorAll: () => [],
  }, { search: "?capture=1&detail=1" }, async () => ({
    setActive() {}, setMode() {}, dispose() {}, renderStill() {},
  }), detailConfig, { error() {} });
  assert.equal(detailConfig.strollerHeight, 0, "Device-only review hides the stroller");
  assert.deepEqual(detailConfig.attachment.offsetsX, [], "Synthetic stroller straps must not obscure the actual CAD lid in device-only review");
  for (const preset of ["wide", "studio"]) {
    const dataset = {};
    const captureConfig = structuredClone(heroSceneConfig);
    await run({
      body: { dataset },
      querySelector: (selector) => selector === "#status" ? { textContent: "" } : {},
      querySelectorAll: () => [],
    }, { search: `?capture=1&mode=visibility&${preset}=1` }, async (_host, mode, _failure, _models, _signal, _viewport, options) => {
      assert.equal(mode, "visibility");
      assert.equal(options.studio, preset === "studio");
      if (preset === "studio") {
        assert.equal(captureConfig.strollerHeight, 0);
        assert.deepEqual(captureConfig.attachment.offsetsX, []);
        assert.deepEqual(captureConfig.channel, heroSceneConfig.channel, "Studio presentation must preserve actual device geometry");
        assert.ok(captureConfig.environment.key.intensity > heroSceneConfig.environment.key.intensity, "Studio light should reveal the dark housing");
      } else {
        assert.equal(captureConfig.strollerHeight, heroSceneConfig.strollerHeight);
        assert.deepEqual(captureConfig.assembly, heroSceneConfig.assembly, "The wide image preserves the actual mounting position");
      }
      return { setActive() {}, setMode() {}, dispose() {}, renderStill() {} };
    }, captureConfig, { error() {} });
    assert.equal(dataset[preset], "true", "Presentation captures use the full rectangular viewport");
    assert.equal(dataset.ready, "true");
  }
  const websiteInteraction = structuredClone(heroSceneConfig.interaction);
  for (const search of ["", "?detail=1", "?capture=1", "?capture=1&detail=1", "?capture=1&hero=1"]) {
    const previewConfig = structuredClone(heroSceneConfig);
    await run({
      body: { dataset: {} },
      querySelector: (selector) => selector === "#status" ? { textContent: "" } : {},
      querySelectorAll: () => [],
    }, { search }, async () => {
      if (search.includes("capture=1")) {
        assert.deepEqual(previewConfig.interaction, websiteInteraction, "Poster captures retain the website's interaction settings");
      } else {
        assert.equal(previewConfig.interaction.yaw, Math.PI, "Debug dragging covers a full 360-degree horizontal range");
        assert.equal(previewConfig.interaction.pitch, Math.PI / 2, "Debug dragging allows top and underside inspection");
        assert.equal(previewConfig.interaction.returnDamping, 0, "Debug camera stays at the inspected angle after release");
      }
      return { setActive() {}, setMode() {}, dispose() {}, renderStill() {} };
    }, previewConfig, { error() {} });
  }
  assert.deepEqual(heroSceneConfig.interaction, websiteInteraction, "Preview overrides never mutate the shared website defaults");
  console.log("Preview: deterministic capture and five model/render/context failure paths passed.");
} finally {
  previewServer.closeAllConnections();
  await new Promise((resolve, reject) => previewServer.close((error) => {
    if (error && error.code !== "ERR_SERVER_NOT_RUNNING") reject(error);
    else resolve();
  }));
}
