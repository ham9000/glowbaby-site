import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";

await fs.mkdir(".local-assets/channel-check", { recursive: true });
for (const name of ["hero-scene-config", "glowbaby-channel"]) {
  const input = await fs.readFile(`src/components/home/${name}.ts`, "utf8");
  const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('"./hero-scene-config"', '"./hero-scene-config.mjs"');
  await fs.writeFile(`.local-assets/channel-check/${name}.mjs`, output);
}
const { createChannelGeometry } = await import("../.local-assets/channel-check/glowbaby-channel.mjs");
const { heroSceneConfig: { channel: c } } = await import("../.local-assets/channel-check/hero-scene-config.mjs");
for (const inner of [false, true]) {
  const geometry = createChannelGeometry(inner);
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
  const bounds = geometry.boundingBox;
  if (!inner) {
    assert.ok(Math.abs(bounds.max.y - bounds.min.y - c.height * c.profileScale) < 1e-7);
    assert.ok(Math.abs(bounds.max.x - (c.radiusX + c.width / 2)) < 1e-7);
  }
  console.log(`${inner ? "Inner light" : "Outer diffuser"}: closed seam, finite normals, valid indices, ${geometry.index.count / 3} triangles`);
  geometry.dispose();
}
