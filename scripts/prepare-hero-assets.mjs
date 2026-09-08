import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { Logger, NodeIO, Primitive, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { compactPrimitive, dedup, dequantize, prune, weld, join, meshopt, textureCompress } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const usage = `Usage: node scripts\\prepare-hero-assets.mjs INPUT.glb OUTPUT.glb PERMISSION [--target-triangles N] [--simplify-error E] [--texture-size N]
PERMISSION: --local-only (output strictly inside .local-assets), or --web-delivery-permitted (verify source license first).
Without --target-triangles, no triangle simplification is performed: use this for topology-preserving product CAD.
--target-triangles: positive integer, a hard budget for this explicit input file only; failure leaves output unchanged.
--simplify-error: positive relative Meshopt appearance-error limit, default/maximum 0.001 (0.1% of mesh extent).
--texture-size: power-of-two maximum from 128 to 1024 pixels, default 1024.
Simplification preserves material boundaries, UV seams, borders and bounding extrema; normals/UVs have weight 1.
The error limit is never increased automatically. A failed budget requires a deliberate target/error change.
Textures become WebP at the selected limit; geometry uses Meshopt with 14-bit positions. Visual review remains required.`;
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--help") {
  console.log(usage);
  process.exit(0);
}
const [source, destination, permission, ...options] = args;
if (!source || !destination || !["--local-only", "--web-delivery-permitted"].includes(permission)) {
  throw new Error(usage);
}
const settings = new Map();
for (let i = 0; i < options.length; i += 2) {
  const key = options[i], value = options[i + 1];
  if (!["--target-triangles", "--simplify-error", "--texture-size"].includes(key) || settings.has(key) || !value || value.startsWith("--")) {
    throw new Error(`Invalid or duplicate option: ${key}\n${usage}`);
  }
  settings.set(key, Number(value));
}
const targetTriangles = settings.get("--target-triangles");
const simplifyError = settings.get("--simplify-error") ?? 0.001;
const textureSize = settings.get("--texture-size") ?? 1024;
if (targetTriangles !== undefined && (!Number.isSafeInteger(targetTriangles) || targetTriangles < 1)) {
  throw new Error("--target-triangles must be a positive integer.");
}
if (settings.has("--simplify-error") && targetTriangles === undefined) {
  throw new Error("--simplify-error requires --target-triangles.");
}
if (!Number.isFinite(simplifyError) || simplifyError <= 0 || simplifyError > 0.001) {
  throw new Error("--simplify-error must be greater than 0 and at most 0.001 (0.1%).");
}
if (!Number.isSafeInteger(textureSize) || textureSize < 128 || textureSize > 1024 || (textureSize & (textureSize - 1)) !== 0) {
  throw new Error("--texture-size must be a power-of-two integer from 128 to 1024.");
}

function inside(directory, filename) {
  const relative = path.relative(directory, filename);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalDestination(filename) {
  try {
    return await fs.realpath(filename);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return path.join(await canonicalDestination(path.dirname(filename)), path.basename(filename));
  }
}

const inputPath = await fs.realpath(source);
const outputPath = await canonicalDestination(path.resolve(destination));
const sourceStat = await fs.stat(inputPath);
const outputStat = await fs.stat(outputPath).catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return null;
});
if (path.relative(inputPath, outputPath) === "" || (outputStat && sourceStat.dev === outputStat.dev && sourceStat.ino === outputStat.ino)) {
  throw new Error("Keep the original source separate.");
}
if (permission === "--local-only") {
  const localRoot = path.resolve(".local-assets");
  const realLocalRoot = await canonicalDestination(localRoot);
  if (!inside(localRoot, path.resolve(destination)) || !inside(realLocalRoot, outputPath)
    || path.relative(localRoot, realLocalRoot) !== "") {
    throw new Error("--local-only output must stay inside .local-assets without escaping through symbolic links.");
  }
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().setLogger(new Logger(Logger.Verbosity.WARN))
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const sourceData = await fs.readFile(inputPath);
const doc = await io.readBinary(new Uint8Array(sourceData));

function triangleCount(primitive) {
  const count = primitive.getIndices()?.getCount() ?? primitive.getAttribute("POSITION")?.getCount() ?? 0;
  switch (primitive.getMode()) {
    case Primitive.Mode.TRIANGLES: return count / 3;
    case Primitive.Mode.TRIANGLE_FAN:
    case Primitive.Mode.TRIANGLE_STRIP: return Math.max(0, count - 2);
    default: return 0;
  }
}

function summary(document) {
  const root = document.getRoot();
  const primitives = root.listMeshes().flatMap((mesh) => mesh.listPrimitives());
  const boxes = root.listScenes().map(getBounds).filter((box) => [...box.min, ...box.max].every(Number.isFinite));
  return {
    meshes: root.listMeshes().length,
    primitives: primitives.length,
    materials: root.listMaterials().length,
    triangles: primitives.reduce((sum, primitive) => sum + triangleCount(primitive), 0),
    bounds: boxes.length ? {
      min: [0, 1, 2].map((axis) => Math.min(...boxes.map((box) => box.min[axis]))),
      max: [0, 1, 2].map((axis) => Math.max(...boxes.map((box) => box.max[axis]))),
    } : null,
    primitiveDetails: primitives.map((primitive) => ({
      triangles: triangleCount(primitive),
      material: primitive.getMaterial()?.getName() ?? null,
      attributes: primitive.listSemantics(),
    })),
    textures: root.listTextures().map((texture) => ({
      name: texture.getName(), size: texture.getSize(), mimeType: texture.getMimeType(),
    })),
  };
}

function checkBounds(before, after, relativeTolerance) {
  if (!before || !after) throw new Error("Cannot verify bounds: input must contain a nonempty scene.");
  const extent = Math.max(...before.max.map((value, axis) => value - before.min[axis]));
  const tolerance = Math.max(extent * relativeTolerance, 1e-7);
  for (const side of ["min", "max"]) {
    if (before[side].some((value, axis) => Math.abs(value - after[side][axis]) > tolerance)) {
      throw new Error(`Bounds changed beyond tolerance ${tolerance}; output not written.`);
    }
  }
}

function simplifyToBudget(document) {
  const primitives = document.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
  if (document.getRoot().listSkins().length || document.getRoot().listAnimations().length
    || primitives.some((primitive) => primitive.getMode() !== Primitive.Mode.TRIANGLES || primitive.listTargets().length)) {
    throw new Error("--target-triangles supports static triangle meshes only.");
  }
  // Small seam-constrained parts get their allocation first, so larger parts absorb any shortfall.
  primitives.sort((a, b) => triangleCount(a) - triangleCount(b));
  let remainingSource = primitives.reduce((sum, primitive) => sum + triangleCount(primitive), 0);
  let remainingTarget = targetTriangles;
  const measurements = [];
  for (const primitive of primitives) {
    const before = triangleCount(primitive);
    if (remainingTarget >= remainingSource) break;
    if (remainingTarget < 1) throw new Error("Triangle budget exhausted; output not written.");
    const target = Math.max(1, Math.floor(before * remainingTarget / remainingSource));
    const position = primitive.getAttribute("POSITION");
    const positions = position.getArray();
    const indices = new Uint32Array(primitive.getIndices().getArray());
    const attributes = primitive.listSemantics().filter((semantic) => semantic === "NORMAL" || /^TEXCOORD_\d+$/.test(semantic))
      .map((semantic) => primitive.getAttribute(semantic));
    const stride = attributes.reduce((sum, attribute) => sum + attribute.getElementSize(), 0);
    const values = new Float32Array(position.getCount() * stride);
    for (let i = 0; i < position.getCount(); i++) {
      let offset = i * stride;
      for (const attribute of attributes) {
        values.set(attribute.getElement(i, []), offset);
        offset += attribute.getElementSize();
      }
    }
    const lock = new Uint8Array(position.getCount());
    const min = position.getMin([]), max = position.getMax([]);
    for (let i = 0; i < position.getCount(); i++) {
      if ([0, 1, 2].some((axis) => min[axis] !== max[axis]
        && (positions[i * 3 + axis] === min[axis] || positions[i * 3 + axis] === max[axis]))) {
        lock[i] = 1;
      }
    }
    // Index-only simplification retains original attribute values; no sloppy/permissive collapse or component pruning.
    const [result, error] = MeshoptSimplifier.simplifyWithAttributes(
      indices, positions, 3, values, stride, Array(stride).fill(1), lock, target * 3, simplifyError, ["LockBorder"],
    );
    if (!Number.isFinite(error) || error > simplifyError * (1 + 1e-6) || !result.length) {
      throw new Error(`Simplification exceeded its error limit (${error}); output not written.`);
    }
    const originalIndices = primitive.getIndices();
    primitive.setIndices(document.createAccessor().setType("SCALAR").setArray(result));
    if (originalIndices.listParents().length === 1) originalIndices.dispose();
    compactPrimitive(primitive);
    const after = triangleCount(primitive);
    measurements.push({
      material: primitive.getMaterial()?.getName() ?? null, before, requested: target, after,
      relativeAppearanceError: error,
      localErrorScale: MeshoptSimplifier.getScale(positions, 3),
      lockedVertices: lock.reduce((sum, value) => sum + value, 0),
    });
    remainingSource -= before;
    remainingTarget -= after;
  }
  const actual = summary(document).triangles;
  if (actual > targetTriangles) {
    throw new Error(`Triangle budget not reached: ${actual} > ${targetTriangles} at error limit ${simplifyError}; output not written.`);
  }
  return measurements;
}

const before = summary(doc);
await doc.transform(dedup(), join({ keepMeshes: true }), weld(), prune({ keepAttributes: true, keepSolidTextures: true }));
let simplification = null;
if (targetTriangles !== undefined) {
  await doc.transform(dequantize(), weld());
  simplification = { targetTriangles, errorLimit: simplifyError, attributeWeight: 1, lockBorder: true, primitives: simplifyToBudget(doc) };
  checkBounds(before.bounds, summary(doc).bounds, 1e-6);
}
const preserved = doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives()).map((primitive) => ({
  primitive, material: primitive.getMaterial(), semantics: primitive.listSemantics(),
}));
await doc.transform(
  prune({ keepAttributes: true, keepSolidTextures: true }),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [textureSize, textureSize] }),
  meshopt({ encoder: MeshoptEncoder, level: "high", quantizePosition: 14 }),
);
for (const { primitive, material, semantics } of preserved) {
  if (primitive.getMaterial() !== material) {
    throw new Error(`Material assignment changed for ${material?.getName()}; output not written.`);
  }
  const missing = semantics.filter((semantic) => !primitive.getAttribute(semantic));
  if (missing.length) throw new Error(`Vertex attributes removed: ${missing.join(", ")}; output not written.`);
}
// Validate the serialized/decompressed deliverable, not just the pre-encoding document.
const outputData = await io.writeBinary(doc);
const after = summary(await io.readBinary(outputData));
checkBounds(before.bounds, after.bounds, 2 / (2 ** 14 - 1));
if (targetTriangles !== undefined && after.triangles > targetTriangles) {
  throw new Error(`Encoded output exceeds triangle budget: ${after.triangles}; output not written.`);
}
if (targetTriangles === undefined && after.triangles !== before.triangles) {
  throw new Error("Triangle count changed without an explicit simplification target; output not written.");
}
if (after.textures.some((texture) => texture.mimeType !== "image/webp" || !texture.size || Math.max(...texture.size) > textureSize)) {
  throw new Error(`Encoded textures exceed the WebP/${textureSize}px budget; output not written.`);
}
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, outputData);
console.log(JSON.stringify({
  before, after, simplification, textureSize, sourceBytes: sourceData.byteLength, outputBytes: outputData.byteLength,
  sourceSHA256: createHash("sha256").update(sourceData).digest("hex"),
  outputSHA256: createHash("sha256").update(outputData).digest("hex"),
}, null, 2));
