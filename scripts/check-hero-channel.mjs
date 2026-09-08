import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { Box3, Color, LinearSRGBColorSpace, Matrix3, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

await fs.mkdir(".local-assets/channel-check", { recursive: true });
for (const name of ["hero-scene-config", "glowbaby-channel", "glowbaby-model"]) {
  const input = await fs.readFile(`src/components/home/${name}.ts`, "utf8");
  const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('"./hero-scene-config"', '"./hero-scene-config.mjs"');
  await fs.writeFile(`.local-assets/channel-check/${name}.mjs`, output);
}
const { createChannelGeometry, createLightMaterial, sampleChannelPath, sampleLightColor, lightPaletteGLSL } = await import("../.local-assets/channel-check/glowbaby-channel.mjs");
const { gradientColors, gradientStops, heroSceneConfig } = await import("../.local-assets/channel-check/hero-scene-config.mjs");
const { alignGlowbabyParts } = await import("../.local-assets/channel-check/glowbaby-model.mjs");
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
assert.equal(gradientStops[0].position, 0);
assert.deepEqual([...new Set(gradientStops.map(({ color }) => color))], [...gradientColors], "Keep the configured rainbow palette in order");
for (const [index, { color, position }] of gradientStops.entries()) {
  assert.ok(position >= 0 && position < 1 && (index === 0 || position > gradientStops[index - 1].position), "Gradient stops must advance around the ring");
  const expected = new Color(color);
  const sampled = sampleLightColor(new Color(), position, 0, "flow");
  assert.ok(sampled.toArray().every((value, channel) => Math.abs(value - expected.toArray()[channel]) < 1e-6), "Gradient stops use the configured colors");
  for (const value of new Color().setStyle(color, LinearSRGBColorSpace).toArray()) assert.ok(lightPaletteGLSL.includes(value.toFixed(6)), "GPU and CPU use the same gradient colors");
  const next = gradientStops[index + 1] ?? { color: gradientStops[0].color, position: 1 };
  const middle = (position + next.position) / 2;
  const blended = new Color().setStyle(color, LinearSRGBColorSpace).lerp(new Color().setStyle(next.color, LinearSRGBColorSpace), 0.5).convertSRGBToLinear();
  for (const time of [0, 1 / heroSceneConfig.colorRotationSpeed, -1 / heroSceneConfig.colorRotationSpeed]) {
    const value = sampleLightColor(new Color(), middle, time, "flow");
    assert.ok(value.toArray().every((channel, axis) => Math.abs(channel - blended.toArray()[axis]) < 1e-10), "Uneven segments interpolate continuously and repeat in either direction");
  }
  assert.ok(lightPaletteGLSL.includes(`(position - ${position.toFixed(6)}) / ${(next.position - position).toFixed(6)}`), "GPU and CPU share segment spacing");
}
const yellow = gradientStops.find(({ color }) => color === gradientColors[2]);
const green = gradientStops.filter(({ color }) => color === gradientColors[3]);
assert.equal(green.length, 2, "Green has a sustained section, not just a single turning point");
assert.ok(green[0].position - yellow.position < 1 / gradientColors.length, "Yellow-to-green stays more compact than the old equal-stop interval");
assert.ok(green[1].position - green[0].position > 1 / gradientColors.length, "The green hold occupies more than one old color interval");
const transition = Array.from({ length: 129 }, (_, index) => sampleLightColor(
  new Color(), yellow.position + (green[0].position - yellow.position) * index / 128, 0, "flow",
).convertLinearToSRGB());
for (let i = 1; i < transition.length; i++) {
  assert.ok(transition[i].r <= transition[i - 1].r + 1e-6, "Yellow eases progressively into green");
  assert.ok(transition[i - 1].r - transition[i].r < 0.02, "No abrupt color step within the yellow-green transition");
}
assert.ok(transition.at(-2).r < 0.001, "The blend eases gently into the green hold, with no hard boundary");
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
for (let i = 0; i < 1024; i++) {
  const angle = i / 1024 * Math.PI * 2;
  const { position, normal } = sampleChannelPath(angle);
  assert.ok(Math.abs(normal.length() - 1) < 1e-9, "Fitted path normals are unit length");
  const wall = position.clone().addScaledVector(normal, -(c.width * c.profileScale / 2 + c.clearance));
  assert.ok(Math.abs(Math.hypot(wall.x, wall.z) - c.bodyRadius) < 1e-9, "The same end radius continues around the whole circle");
  assert.ok(Math.abs(Math.hypot(position.x, position.z) - (c.bodyRadius + c.width * c.profileScale / 2 + c.clearance)) < 1e-9, "Expanding the sides preserves the previous top and bottom extent");
  const before = sampleChannelPath(angle - 1e-7).position;
  const after = sampleChannelPath(angle + 1e-7).position;
  assert.ok(Math.abs(after.sub(before).normalize().dot(normal)) < 1e-5, "The path stays smooth all the way around the circle");
}
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
function checkOutwardProfile(geometry, inner, scale) {
  const positions = geometry.getAttribute("position");
  const stride = positions.count / (c.segments + 1);
  const inset = inner ? c.wallThickness * scale : 0;
  const half = c.width * scale / 2 - inset;
  const halfHeight = c.height * scale / 2 - inset;
  const centerY = c.y + c.height * scale / 2;
  for (let i = 0; i < c.segments; i++) {
    const { position, normal } = sampleChannelPath(i / c.segments * Math.PI * 2);
    const profile = Array.from({ length: stride - 1 }, (_, j) => {
      const vertex = new Vector3().fromBufferAttribute(positions, i * stride + j);
      return { outward: vertex.clone().sub(position).dot(normal), y: vertex.y - centerY };
    });
    assert.ok(Math.abs(profile[0].outward + half) < 1e-7 && Math.abs(profile[1].outward + half) < 1e-7, "Flat back faces the body");
    assert.ok(Math.abs(profile[0].y - halfHeight) < 1e-7 && Math.abs(profile[1].y + halfHeight) < 1e-7, "Flat back is vertical, not underneath the tube");
    const outermost = profile.reduce((a, b) => a.outward > b.outward ? a : b);
    assert.ok(Math.abs(outermost.outward - half) < 1e-7 && Math.abs(outermost.y) < 1e-7, "Rounded face projects furthest outward at mid-height, not upward");
    for (const point of profile.slice(2)) {
      assert.ok(Math.abs(Math.hypot(point.outward - (half - halfHeight), point.y) - halfHeight) < 1e-7, "Outward face keeps the supplied semicircular profile");
    }
  }
}
const original = { rotation: c.rotation, profileScale: c.profileScale };
try {
  for (const inner of [false, true]) {
    for (const scale of [original.profileScale, original.profileScale * 0.6]) {
      c.profileScale = scale;
      c.rotation = 0;
      const baseline = createChannelGeometry(inner);
      checkGeometry(baseline);
      checkOutwardProfile(baseline, inner, scale);
      const bounds = baseline.boundingBox;
      if (inner) {
        const inset = c.wallThickness * scale;
        assert.ok(Math.abs(bounds.min.y - c.y - inset) < 1e-7, "Emitter sits inside the diffuser's lower wall");
        assert.ok(Math.abs(bounds.max.y - (c.y + c.height * scale - inset)) < 1e-7, "Emitter fills the upper channel instead of leaving a tall transparent recess");
        assert.ok(Math.abs(bounds.max.x - (c.bodyRadius + c.clearance + c.width * scale - inset)) < 1e-7, "Inner and outer profiles maintain the configured wall thickness");
      }
      if (!inner) {
        assert.ok(Math.abs(bounds.max.y - bounds.min.y - c.height * scale) < 1e-7);
        assert.ok(Math.abs(bounds.max.x - (c.bodyRadius + c.clearance + c.width * scale)) < 1e-7);
        assert.ok(Math.abs(bounds.max.z - bounds.max.x) < 1e-7, "Circular channel has equal width and depth");
        if (scale === original.profileScale) {
          assert.ok(bounds.min.y > 0.00159 && bounds.max.y < 0.01798, "Sideways profile stays between the outer retaining beads and below the mounting tabs");
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

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const models = [];
const modelDirectory = process.argv.includes("--local-model") ? ".local-assets" : "public/models/hero";
for (const name of ["bottom", "top"]) {
  const bytes = await fs.readFile(`${modelDirectory}/${name}.glb`);
  models.push((await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")).scene);
}
const [bottom, top] = models;
bottom.updateMatrixWorld(true);
let maximumEndGap = 0;
for (const side of [0, Math.PI]) {
  for (let i = 0; i <= 16; i++) {
    const relativeAngle = -0.7 + i * 1.4 / 16;
    // The retained side-access opening interrupts the middle of the -X wall.
    if (side === Math.PI && Math.abs(relativeAngle) < 0.15) continue;
    const { position, normal } = sampleChannelPath(side + relativeAngle);
    const back = position.addScaledVector(normal, -c.width * c.profileScale / 2);
    back.y = c.y + c.height * c.profileScale / 2;
    const ray = new Raycaster(back.clone().addScaledVector(normal, 0.01), normal.clone().negate(), 0, 0.02);
    const [hit] = ray.intersectObject(bottom, true);
    assert.ok(hit, "The fitted end must face an actual CAD wall");
    maximumEndGap = Math.max(maximumEndGap, hit.point.distanceTo(back));
  }
}
assert.ok(maximumEndGap < 0.00025, "The channel back follows both actual rounded ends within 0.25 mm, including CAD tessellation");
console.log(`Rounded-end fit: maximum gap ${(maximumEndGap * 1000).toFixed(3)} mm against the loaded CAD.`);
const beforeBase = new Box3().setFromObject(bottom);
const beforeTop = new Box3().setFromObject(top);
const sourceCenter = beforeBase.getCenter(new Vector3());
const beforeTopCenter = beforeTop.getCenter(new Vector3());
const lid = alignGlowbabyParts(bottom, top);
lid.updateMatrixWorld(true);
const afterTop = new Box3().setFromObject(lid);
const afterCenter = afterTop.getCenter(new Vector3());
assert.ok(Math.abs(afterTop.min.y - (heroSceneConfig.assembly.topOffset - heroSceneConfig.assembly.topInset)) < 1e-7, "The lid's locating ribs insert into the body instead of holding the lid above it");
assert.ok(afterTop.getSize(new Vector3()).distanceTo(beforeTop.getSize(new Vector3())) < 1e-7, "Flipping the lid preserves its dimensions");
for (const axis of ["x", "z"]) {
  assert.ok(Math.abs(afterCenter[axis] - (beforeTopCenter[axis] - sourceCenter[axis])) < 1e-7, "Flipping retains the lid's source-relative footprint");
}
let flatFaceVertices = 0;
const seatingPlanes = new Map();
top.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const positions = mesh.geometry.getAttribute("position");
  const normals = mesh.geometry.getAttribute("normal");
  const normalMatrix = new Matrix3().getNormalMatrix(mesh.matrixWorld);
  for (let i = 0; i < positions.count; i++) {
    if (normals.getY(i) > -0.999) continue;
    const normal = new Vector3().fromBufferAttribute(normals, i).applyNormalMatrix(normalMatrix);
    const position = new Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
    assert.ok(normal.y > 0.999, "The authored flat underside now faces upward");
    assert.ok(Math.abs(position.y - afterTop.max.y) < 1e-5, "The flat face is the topmost lid surface");
    flatFaceVertices++;
  }
  const indices = mesh.geometry.getIndex();
  for (let i = 0; i < indices.count; i += 3) {
    const vertices = [0, 1, 2].map(offset => indices.getX(i + offset));
    if (vertices.some(index => normals.getY(index) < 0.999)) continue;
    const [a, b, c] = vertices.map(index => new Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld));
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
    const plane = a.y.toFixed(5);
    seatingPlanes.set(plane, (seatingPlanes.get(plane) ?? 0) + area);
  }
});
assert.ok(flatFaceVertices > 0, "Exercise actual CAD flat-face vertices");
const [seatingHeight] = [...seatingPlanes].sort((a, b) => b[1] - a[1])[0];
assert.ok(Math.abs(Number(seatingHeight) - heroSceneConfig.assembly.topOffset) < 1e-5, "The broad underside of the flipped plate meets the body's rim");
assert.ok(Math.abs(heroSceneConfig.attachment.y - heroSceneConfig.attachment.size[1] / 2 - afterTop.max.y) < 1e-5, "Attachment bands rest on the flipped flat lid");
for (const model of models) model.traverse((mesh) => {
  if (!mesh.isMesh) return;
  mesh.geometry.dispose();
  for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
});
console.log("Model assembly: flat lid faces upward, dimensions and shared X/Z alignment preserved.");
