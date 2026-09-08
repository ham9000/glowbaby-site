import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { Color } from "three";

await fs.mkdir(".local-assets/channel-check", { recursive: true });
for (const name of ["hero-scene-config", "glowbaby-channel"]) {
  const input = await fs.readFile(`src/components/home/${name}.ts`, "utf8");
  const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('"./hero-scene-config"', '"./hero-scene-config.mjs"');
  await fs.writeFile(`.local-assets/channel-check/${name}.mjs`, output);
}
const { createChannelGeometry, createLightMaterial, sampleLightColor, lightPaletteGLSL } = await import("../.local-assets/channel-check/glowbaby-channel.mjs");
const { gradientColors, heroSceneConfig } = await import("../.local-assets/channel-check/hero-scene-config.mjs");
const c = heroSceneConfig.channel;
const material = createLightMaterial();
const holiday = heroSceneConfig.holiday;
for (let stripe = 0; stripe < holiday.stripes; stripe++) {
  for (const [offset, color] of [[0.25, holiday.white], [0.75, holiday.red]]) {
    const sampled = sampleLightColor(new Color(), (stripe + offset) / holiday.stripes, 0, "holiday");
    assert.deepEqual(sampled.toArray(), color, "Candy-cane bands alternate between the configured colors");
    const revolution = 1 / heroSceneConfig.colorRotationSpeed;
    assert.deepEqual(sampleLightColor(new Color(), (stripe + offset) / holiday.stripes, revolution, "holiday").toArray(), color, "Holiday bands complete a full rotation");
    const opposite = offset === 0.25 ? holiday.red : holiday.white;
    assert.deepEqual(sampleLightColor(new Color(), (stripe + offset) / holiday.stripes, revolution / (holiday.stripes * 2), "holiday").toArray(), opposite, "Red and white bands rotate past a fixed point");
  }
}
const seamStart = sampleLightColor(new Color(), 0, 0, "holiday");
const seamEnd = sampleLightColor(new Color(), 1, 0, "holiday");
assert.ok(seamStart.toArray().every((value, index) => Math.abs(value - seamEnd.toArray()[index]) < 1e-10), "Holiday palette closes around the ring");
for (const color of [...holiday.red, ...holiday.white]) assert.ok(lightPaletteGLSL.includes(color.toFixed(6)), "GPU and CPU use the same holiday colors");
for (const [index, color] of gradientColors.entries()) {
  const expected = new Color(color);
  const sampled = sampleLightColor(new Color(), index / gradientColors.length, 0, "flow");
  assert.ok(sampled.toArray().every((value, channel) => Math.abs(value - expected.toArray()[channel]) < 1e-10), "Gradient stops use the configured colors");
  for (const value of expected.toArray()) assert.ok(lightPaletteGLSL.includes(value.toFixed(6)), "GPU and CPU use the same gradient colors");
}
const gradientSeam = sampleLightColor(new Color(), 1, 0, "flow");
assert.ok(gradientSeam.toArray().every((value, index) => Math.abs(value - new Color(gradientColors[0]).toArray()[index]) < 1e-10), "Gradient palette closes around the ring");
assert.doesNotMatch(material.fragmentShader, /vUv\.y/, "Color divisions stay straight across the diffuser profile");
assert.ok(holiday.spillSoftness > holiday.softness && holiday.spillSoftness < 1, "Ground transitions soften the bands without losing full red and white");
assert.ok(lightPaletteGLSL.includes(`time * ${heroSceneConfig.colorRotationSpeed.toFixed(6)}`), "GPU bands use the shared rotation speed");
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
        if (scale === original.profileScale) {
          assert.ok(bounds.min.y < 0 && bounds.max.y > heroSceneConfig.assembly.topOffset, "Diffuser must cover the full printed base height");
        }
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
