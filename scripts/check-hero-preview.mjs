import assert from "node:assert/strict";
import { previewServer } from "./preview-hero.mjs";

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
  assert.deepEqual(heroConfig.camera.position, [1.05, .72, 1.72]);
  assert.deepEqual(heroConfig.camera.target, [0, .43, 0]);
  assert.equal(heroConfig.camera.fov, 34);
  console.log("Preview: deterministic capture and five model/render/context failure paths passed.");
} finally {
  previewServer.closeAllConnections();
  await new Promise((resolve, reject) => previewServer.close((error) => {
    if (error && error.code !== "ERR_SERVER_NOT_RUNNING") reject(error);
    else resolve();
  }));
}
