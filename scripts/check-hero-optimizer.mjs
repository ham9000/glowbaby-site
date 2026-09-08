import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

const folder = path.join(".local-assets", `optimizer-check-${process.pid}`);
const source = path.join(folder, "source.glb");
const output = path.join(folder, "output.glb");
const script = path.join("scripts", "prepare-hero-assets.mjs");
let checks = 0;

function run(input, destination, options = [], expectedError) {
  const result = spawnSync(process.execPath, [script, input, destination, ...options], { encoding: "utf8" });
  assert.ifError(result.error);
  if (expectedError) {
    assert.notEqual(result.status, 0, "Invalid conversion must fail");
    assert.match(result.stderr, expectedError);
    checks++;
    return null;
  }
  assert.equal(result.status, 0, result.stderr);
  checks++;
  return JSON.parse(result.stdout);
}

try {
  await fs.mkdir(folder, { recursive: true });
  const document = new Document();
  const buffer = document.createBuffer();
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#778899" } }).png().toBuffer();
  const texture = document.createTexture("grid").setImage(image).setMimeType("image/png");
  const mesh = document.createMesh("grid");
  for (const [name, segments, offset] of [["large", 24, 0], ["small", 1, 2]]) {
    const positions = [], normals = [], uvs = [], indices = [];
    for (let y = 0; y <= segments; y++) {
      for (let x = 0; x <= segments; x++) {
        positions.push(offset + x / segments, y / segments, 0);
        normals.push(0, 0, 1);
        uvs.push(x / segments, y / segments);
      }
    }
    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const a = y * (segments + 1) + x, b = a + 1, c = a + segments + 1, d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    const accessor = (type, values) => document.createAccessor().setBuffer(buffer).setType(type).setArray(new Float32Array(values));
    mesh.addPrimitive(document.createPrimitive()
      .setMaterial(document.createMaterial(name).setBaseColorTexture(texture).setRoughnessFactor(name === "large" ? 0.5 : 1))
      .setAttribute("POSITION", accessor("VEC3", positions))
      .setAttribute("NORMAL", accessor("VEC3", normals))
      .setAttribute("TEXCOORD_0", accessor("VEC2", uvs))
      .setIndices(document.createAccessor().setBuffer(buffer).setType("SCALAR").setArray(new Uint32Array(indices))));
  }
  const scene = document.createScene().addChild(document.createNode().setMesh(mesh));
  document.getRoot().setDefaultScene(scene);
  await new NodeIO().write(source, document);
  const original = await fs.readFile(source);
  const noSimplification = run(source, output, ["--local-only"]);
  assert.equal(noSimplification.before.triangles, 1154);
  assert.equal(noSimplification.after.triangles, 1154, "Default path must retain CAD triangle count");
  assert.equal(noSimplification.simplification, null);
  const permitted = run(source, output, ["--web-delivery-permitted"]);
  assert.equal(permitted.after.triangles, 1154, "An explicit delivery permission remains supported");

  const optimized = run(source, output, ["--local-only", "--target-triangles", "400", "--simplify-error", "0.001"]);
  assert.ok(optimized.after.triangles <= 400);
  assert.equal(optimized.after.primitives, 2);
  assert.equal(optimized.after.materials, 2);
  assert.deepEqual(optimized.after.primitiveDetails.map((primitive) => primitive.material), ["large", "small"]);
  assert.ok(optimized.after.primitiveDetails.every((primitive) => primitive.attributes.includes("NORMAL") && primitive.attributes.includes("TEXCOORD_0")));
  assert.equal(optimized.after.textures.length, 1);
  assert.ok(optimized.after.textures.every((entry) => entry.mimeType === "image/webp" && Math.max(...entry.size) <= 1024));
  assert.equal(optimized.textureSize, 1024);
  const reducedTexture = run(source, output, ["--local-only", "--texture-size", "512"]);
  assert.equal(reducedTexture.textureSize, 512);
  assert.ok(reducedTexture.after.textures.every((entry) => Math.max(...entry.size) <= 512));
  await MeshoptDecoder.ready;
  const decoded = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder }).read(output);
  assert.ok(decoded.getRoot().listExtensionsRequired().some((extension) => extension.extensionName === "EXT_meshopt_compression"));
  const successful = await fs.readFile(output);
  run(source, output, ["--local-only", "--target-triangles", "1"], /budget.*(?:exhausted|not reached)/i);
  assert.deepEqual(await fs.readFile(output), successful, "Budget failure must not overwrite a previous output");
  for (const options of [
    ["--target-triangles", "1.5"],
    ["--target-triangles", "NaN"],
    ["--target-triangles", "400", "--simplify-error", "0.01"],
    ["--target-triangles", "400", "--simplify-error", "0"],
    ["--simplify-error", "0.001"],
    ["--texture-size", "500"],
    ["--texture-size", "64"],
    ["--texture-size", "2048"],
    ["--unknown", "400"],
    ["--target-triangles", "400", "--target-triangles", "200"],
  ]) {
    run(source, output, ["--local-only", ...options], /positive integer|simplify-error|texture-size|Invalid or duplicate option/);
  }
  run(source, output, [], /Usage:/);
  run(source, source, ["--local-only"], /original source separate/);
  const alias = path.join(folder, "source-alias.glb");
  await fs.link(source, alias);
  run(source, alias, ["--local-only"], /original source separate/);
  run(source, path.join("public", "optimizer-check.glb"), ["--local-only"], /must stay inside .local-assets/);
  const junction = path.join(folder, "escape");
  await fs.symlink(process.cwd(), junction, process.platform === "win32" ? "junction" : "dir");
  run(source, path.join(junction, "optimizer-check.glb"), ["--local-only"], /must stay inside .local-assets/);
  assert.deepEqual(await fs.readFile(source), original, "Original source must remain untouched");
  assert.deepEqual(await fs.readFile(output), successful, "Rejected conversions must preserve the previous output");
  console.log(`Optimizer: ${checks} checks passed (explicit budgets, default topology, materials/UVs, Meshopt/WebP, source/privacy guards).`);
} finally {
  await fs.rm(folder, { recursive: true, force: true });
}
