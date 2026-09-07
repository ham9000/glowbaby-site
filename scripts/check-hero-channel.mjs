import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";

await fs.mkdir(".local-assets/channel-check", { recursive: true });
for (const name of ["hero-scene-config", "glowbaby-channel"]) {
  const input = await fs.readFile(`src/components/home/${name}.ts`, "utf8");
  const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('"./hero-scene-config"', '"./hero-scene-config.mjs"');
  await fs.writeFile(`.local-assets/channel-check/${name}.mjs`, output);
}
const { createChannelGeometry, createLightMaterial } = await import("../.local-assets/channel-check/glowbaby-channel.mjs");
const { heroSceneConfig } = await import("../.local-assets/channel-check/hero-scene-config.mjs");
const c = heroSceneConfig.channel;
const material = createLightMaterial();
for (const [key, value] of Object.entries(heroSceneConfig.emission)) {
  if (key === "activationSeconds") continue;
  assert.equal(material.uniforms[key === "base" ? "emissionBase" : key].value, value, "Emission tuning must reach the light shader");
}
material.dispose();
function checkGeometry(geometry) {
  const positions = geometry.getAttribute("position");
  const stride = positions.count / (c.segments + 1);
  const normals = geometry.getAttribute("normal");
  for (let j = 0; j < stride; j++) {
    for (const axis of ["X", "Y", "Z"]) {
      assert.equal(positions[`get${axis}`](j), positions[`get${axis}`](c.segments * stride + j), "Perimeter must close without a gap");
      assert.equal(normals[`get${axis}`](j), normals[`get${axis}`](c.segments * stride + j), "Seam normals must match");
    }
  }
  for (const index of geometry.index.array) assert.ok(index < positions.count);
  assert.ok([...positions.array, ...normals.array].every(Number.isFinite));
  geometry.computeBoundingBox();
}
const original = { rotation: c.rotation, profileScale: c.profileScale };
try {
  for (const inner of [false, true]) {
    for (const scale of [original.profileScale, original.profileScale * 0.6]) {
      c.profileScale = scale;
      c.rotation = 0;
      const baseline = createChannelGeometry(inner);
      checkGeometry(baseline);
      const bounds = baseline.boundingBox;
      if (!inner) {
        assert.ok(Math.abs(bounds.max.y - bounds.min.y - c.height * scale) < 1e-7);
        assert.ok(Math.abs(bounds.max.x - (c.radiusX + c.width * scale / 2)) < 1e-7);
        assert.ok(Math.abs(bounds.max.z - (c.radiusZ + c.width * scale / 2)) < 1e-7);
      }
      for (const rotation of [original.rotation, Math.PI / 2, Math.PI / 5]) {
        c.rotation = rotation;
        const geometry = createChannelGeometry(inner);
        checkGeometry(geometry);
        const cos = Math.cos(rotation), sin = Math.sin(rotation);
        for (const name of ["position", "normal"]) {
          const before = baseline.getAttribute(name), after = geometry.getAttribute(name);
          for (let i = 0; i < before.count; i++) {
            assert.ok(Math.abs(after.getX(i) - (before.getX(i) * cos + before.getZ(i) * sin)) < 1e-6, `${name}: rotate the oval, not its angular phase`);
            assert.ok(Math.abs(after.getZ(i) - (-before.getX(i) * sin + before.getZ(i) * cos)) < 1e-6);
            assert.equal(after.getY(i), before.getY(i));
          }
        }
        if (rotation === Math.PI / 2) {
          assert.ok(Math.abs(geometry.boundingBox.max.x - bounds.max.z) < 1e-7, "A quarter turn swaps the oval axes");
          assert.ok(Math.abs(geometry.boundingBox.max.z - bounds.max.x) < 1e-7);
        }
        geometry.dispose();
      }
      console.log(`${inner ? "Inner light" : "Outer diffuser"}: closed seam, rotated positions/normals, scaled envelope, ${baseline.index.count / 3} triangles`);
      baseline.dispose();
    }
  }
} finally {
  Object.assign(c, original);
}
