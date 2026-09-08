import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Logger, NodeIO, Primitive, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, join, prune, reorder, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { ShapeUtils, Vector2 } from "three";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(projectRoot, ".local-assets", "bottom-source.glb");
const outputPath = path.join(projectRoot, ".local-assets", "bottom.glb");
const sourceSHA256 = "f1b0c570379a69d66cf56e8a53fd9775cc459e2ece27986cff03223b8dfe7dd6";
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

// Face IDs refer to this hash-locked CAD export, not to the joined/optimized preview.
// Upper strap loops, rear apertures, side channels, threads and interior bosses stay intact.
const tunnelFaces = new Set([...range(77, 84), ...range(89, 96)]);
const tabFaces = new Set([...range(85, 88), ...range(163, 171), ...range(234, 236)]);
const removedFaces = new Set([...tunnelFaces, ...tabFaces]);
const outerFace = 14;
const innerFace = 154;
const seamTolerance = 1e-8;
const hash = (data) => createHash("sha256").update(data).digest("hex");
const pointKey = (point) => point.map((value) => Math.round(value / seamTolerance)).join(",");
const edgeKey = (a, b) => [pointKey(a), pointKey(b)].sort().join("|");

function primitives(document) {
  return document.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
}

function triangles(primitive) {
  const position = primitive.getAttribute("POSITION");
  const indices = primitive.getIndices().getArray();
  return Array.from({ length: indices.length / 3 }, (_, i) => (
    [0, 1, 2].map((corner) => position.getElement(indices[i * 3 + corner], []))
  ));
}

function collectEdges(faces) {
  const edges = new Map();
  faces.forEach((face, faceId) => {
    for (const triangle of triangles(face)) {
      for (let i = 0; i < 3; i++) {
        const a = triangle[i], b = triangle[(i + 1) % 3];
        const key = edgeKey(a, b);
        if (!edges.has(key)) edges.set(key, []);
        edges.get(key).push({ faceId, a, b });
      }
    }
  });
  return edges;
}

function anomalies(edges) {
  return [...edges].filter(([, owners]) => owners.length !== 2)
    .map(([key, owners]) => [key, owners.length]).sort(([a], [b]) => a.localeCompare(b));
}

function triangleFingerprint(faces) {
  const records = [];
  for (const face of faces) {
    const semantics = face.listSemantics().sort();
    const attributes = semantics.map((semantic) => face.getAttribute(semantic));
    const indices = face.getIndices().getArray();
    for (let i = 0; i < indices.length; i += 3) {
      const corners = [0, 1, 2].map((corner) => JSON.stringify(
        attributes.map((attribute) => attribute.getElement(indices[i + corner], [])),
      ));
      // Meshopt may cyclically rotate indices, but must not change winding or vertex attributes.
      const rotations = [0, 1, 2].map((offset) => (
        [...corners.slice(offset), ...corners.slice(0, offset)].join(";")
      ));
      records.push(`${face.getMaterial()?.getName()}:${semantics}:${rotations.sort()[0]}`);
    }
  }
  return hash(records.sort().join("\n"));
}

function boundaryLoops(edges) {
  const outgoing = new Map();
  for (const edge of edges) {
    const key = pointKey(edge.a);
    assert(!outgoing.has(key), "Repair boundary branches; refusing ambiguous geometry.");
    outgoing.set(key, edge);
  }
  const loops = [];
  while (outgoing.size) {
    const start = outgoing.keys().next().value;
    const loop = [];
    let key = start;
    do {
      const edge = outgoing.get(key);
      assert(edge, "Repair boundary is not a closed, consistently oriented ring.");
      loop.push(edge.a);
      outgoing.delete(key);
      key = pointKey(edge.b);
    } while (key !== start);
    loops.push(loop);
  }
  return loops;
}

function loopBounds(loop) {
  return {
    min: [0, 1, 2].map((axis) => Math.min(...loop.map((point) => point[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...loop.map((point) => point[axis]))),
  };
}

function addPatch(document, mesh, wall, loop, normalZ) {
  const faces = ShapeUtils.triangulateShape(loop.map(([x, y]) => new Vector2(x, y)), []);
  assert.equal(faces.length, loop.length - 2);
  const indices = [];
  for (const face of faces) {
    const [a, b, c] = face.map((i) => loop[i]);
    const crossZ = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    assert(Math.abs(crossZ) > 1e-15, "Degenerate wall patch.");
    indices.push(...(crossZ * normalZ > 0 ? face : [face[0], face[2], face[1]]));
  }
  const buffer = document.getRoot().listBuffers()[0];
  const accessor = (type, array) => document.createAccessor().setBuffer(buffer).setType(type).setArray(array);
  const patch = document.createPrimitive()
    .setAttribute("POSITION", accessor("VEC3", new Float32Array(loop.flat())))
    .setAttribute("NORMAL", accessor("VEC3", new Float32Array(loop.flatMap(() => [0, 0, normalZ]))))
    .setIndices(accessor("SCALAR", new Uint16Array(indices)))
    .setMaterial(wall.getMaterial());
  mesh.addPrimitive(patch);
  return patch;
}

function hitAtXY(triangle, x, y, z) {
  const [a, b, c] = triangle;
  const determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(determinant) < 1e-16) return false;
  const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / determinant;
  const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / determinant;
  return u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9
    && Math.abs(u * a[2] + v * b[2] + (1 - u - v) * c[2] - z) < seamTolerance;
}

function verifyCoverage(sourceWalls, outputFaces, patches) {
  let samples = 0;
  for (const { loop, wallId } of patches) {
    const box = loopBounds(loop), z = loop[0][2];
    const patchTriangles = ShapeUtils.triangulateShape(loop.map(([x, y]) => new Vector2(x, y)), [])
      .map((face) => face.map((i) => loop[i]));
    const original = sourceWalls.get(wallId);
    const result = outputFaces.flatMap(triangles).filter((triangle) => (
      triangle.every((point) => Math.abs(point[2] - z) < seamTolerance)
    ));
    for (let ix = 0; ix < 19; ix++) {
      for (let iy = 0; iy < 19; iy++) {
        const x = box.min[0] + (box.max[0] - box.min[0]) * (ix + 0.37) / 19;
        const y = box.min[1] + (box.max[1] - box.min[1]) * (iy + 0.41) / 19;
        if (!patchTriangles.some((triangle) => hitAtXY(triangle, x, y, z))) continue;
        assert(!original.some((triangle) => hitAtXY(triangle, x, y, z)), "Patch overlaps an existing wall.");
        assert(result.some((triangle) => hitAtXY(triangle, x, y, z)), "Former opening is not filled.");
        samples++;
      }
    }
  }
  return samples;
}

async function canonical(filename) {
  try {
    return await fs.realpath(filename);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return path.join(await canonical(path.dirname(filename)), path.basename(filename));
  }
}

export async function cleanBottomPreview(sourceData) {
  assert.equal(hash(sourceData), sourceSHA256, "Unknown original CAD export; face IDs must be re-investigated.");
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
  const io = new NodeIO().setLogger(new Logger(Logger.Verbosity.WARN))
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
  const document = await io.readBinary(new Uint8Array(sourceData));
  const root = document.getRoot(), sourceFaces = primitives(document);
  assert.equal(root.listMeshes().length, 1);
  assert.equal(root.listNodes().length, 1);
  assert.equal(root.listNodes()[0].getName(), "whole_body_Cut001");
  assert.equal(sourceFaces.length, 803);
  for (const face of sourceFaces) {
    assert.equal(face.getMode(), Primitive.Mode.TRIANGLES);
    assert.deepEqual(face.listSemantics().sort(), ["NORMAL", "POSITION"]);
  }
  const mesh = root.listMeshes()[0];
  const sourceWalls = new Map([outerFace, innerFace].map((faceId) => [faceId, triangles(sourceFaces[faceId])]));
  assert.equal(sourceFaces.flatMap(triangles).length, 50305);
  assert.equal(sourceFaces.filter((_, faceId) => removedFaces.has(faceId)).flatMap(triangles).length, 370);
  const beforeBounds = getBounds(root.listScenes()[0]);
  const beforeMatrix = root.listNodes()[0].getWorldMatrix();
  const sourceEdges = collectEdges(sourceFaces);
  const sourceAnomalies = anomalies(sourceEdges);
  const retained = sourceFaces.filter((_, i) => !removedFaces.has(i));
  const retainedFingerprint = triangleFingerprint(retained);
  const interfaces = new Map([[outerFace, []], [innerFace, []]]);
  for (const owners of sourceEdges.values()) {
    const deleted = owners.filter(({ faceId }) => removedFaces.has(faceId));
    const kept = owners.filter(({ faceId }) => !removedFaces.has(faceId));
    if (!deleted.length || !kept.length) continue;
    assert.equal(owners.length, 2, "Non-manifold repair seam.");
    assert(interfaces.has(kept[0].faceId), "Deletion touches CAD outside the two intended wall surfaces.");
    interfaces.get(kept[0].faceId).push(kept[0]);
  }
  assert.equal(interfaces.get(outerFace).length, 20);
  assert.equal(interfaces.get(innerFace).length, 16);

  const patches = [];
  for (const [wallId, edges] of interfaces) {
    const loops = boundaryLoops(edges);
    assert.equal(loops.length, wallId === outerFace ? 4 : 3);
    for (const loop of loops) {
      const box = loopBounds(loop);
      assert(box.min[0] > -0.036 && box.max[0] < 0.037 && box.min[1] > 0.0018 && box.max[1] < 0.018);
      assert(box.max[2] - box.min[2] < seamTolerance);
      patches.push({ loop, wallId });
    }
  }
  for (const faceId of removedFaces) mesh.removePrimitive(sourceFaces[faceId]);
  const patchPrimitives = patches.map(({ loop, wallId }) => (
    addPatch(document, mesh, sourceFaces[wallId], loop, wallId === outerFace ? 1 : -1)
  ));
  const repairedFaces = mesh.listPrimitives();
  assert.equal(triangleFingerprint(retained), retainedFingerprint, "Unrelated CAD triangles changed.");
  assert.equal(patchPrimitives.flatMap(triangles).length, 22);
  assert.deepEqual(anomalies(collectEdges(repairedFaces)), sourceAnomalies, "Repair introduced open/non-manifold edges.");
  const repairedEdges = collectEdges(repairedFaces);
  for (const edges of interfaces.values()) {
    for (const { a, b } of edges) {
      const owners = repairedEdges.get(edgeKey(a, b));
      assert.equal(owners.length, 2, "Repair seam is not watertight.");
      assert.equal(pointKey(owners[0].a), pointKey(owners[1].b), "Repair winding is inverted.");
    }
  }
  const expectedFingerprint = triangleFingerprint(repairedFaces);
  const expectedBounds = getBounds(root.listScenes()[0]);
  assert.deepEqual(expectedBounds.min, beforeBounds.min);
  assert.deepEqual(expectedBounds.max.slice(0, 2), beforeBounds.max.slice(0, 2));
  assert.equal(expectedBounds.max[2], 0.0713319182395935);
  assert(!repairedFaces.flatMap(triangles).flat().some(([x, y, z]) => (
    Math.abs(x) < 0.0101 && y < 0.006 && z > sourceWalls.get(outerFace)[0][0][2] + seamTolerance
  )), "Middle tab geometry remains outside the wall.");

  await document.transform(
    dedup(), join({ keepMeshes: true }), weld(), prune({ keepAttributes: true }),
    reorder({ encoder: MeshoptEncoder, target: "size" }),
  );
  // No quantize() or lossy filters: preserve every retained CAD position and normal exactly.
  document.createExtension(EXTMeshoptCompression).setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  const output = await io.writeBinary(document);
  const decoded = await io.readBinary(output);
  const decodedFaces = primitives(decoded);
  assert.equal(triangleFingerprint(decodedFaces), expectedFingerprint, "Serialized CAD attributes/triangles changed.");
  assert.deepEqual(getBounds(decoded.getRoot().listScenes()[0]), expectedBounds);
  assert.deepEqual(decoded.getRoot().listNodes()[0].getWorldMatrix(), beforeMatrix);
  assert.deepEqual(anomalies(collectEdges(decodedFaces)), sourceAnomalies);
  const coverageSamples = verifyCoverage(sourceWalls, decodedFaces, patches);
  const millimeters = (box) => Object.fromEntries(Object.entries(box).map(([key, values]) => (
    [key, values.map((value) => value * 1000)]
  )));
  return {
    output,
    report: {
      sourceSHA256, outputSHA256: hash(output), sourceBytes: sourceData.byteLength, outputBytes: output.byteLength,
      removedFaces: [...removedFaces].sort((a, b) => a - b),
      sourceTriangles: 50305, removedTriangles: 370, retainedTriangles: 49935,
      patchTriangles: 22, outputTriangles: decodedFaces.flatMap(triangles).length,
      watertightRepairEdges: 36, coverageSamples,
      preservedSourceOpenEdges: sourceAnomalies.filter(([key, count]) => (
        count === 1 && key.split("|")[0] !== key.split("|")[1]
      )).length,
      preservedSourceDegenerateSelfEdges: sourceAnomalies.filter(([key]) => (
        key.split("|")[0] === key.split("|")[1]
      )).length,
      preservedSourceNonmanifoldEdges: sourceAnomalies.filter(([, count]) => count > 2).length,
      retainedTriangleAttributesSHA256: retainedFingerprint,
      beforeBoundsMm: millimeters(beforeBounds), afterBoundsMm: millimeters(expectedBounds),
      beforeCenterMm: beforeBounds.min.map((value, i) => (value + beforeBounds.max[i]) * 500),
      afterCenterMm: expectedBounds.min.map((value, i) => (value + expectedBounds.max[i]) * 500),
      patches: patches.map(({ loop, wallId }) => ({ wallId, boundsMm: millimeters(loopBounds(loop)) })),
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--help") {
    console.log("Usage: node scripts\\clean-bottom-preview.mjs [--check]\n"
      + "Hash-locked, lossless repair of three +Z wall ports and the middle external tab.\n"
      + "Reads .local-assets\\bottom-source.glb; writes ONLY .local-assets\\bottom.glb.\n"
      + "--check rebuilds in memory and verifies the existing preview without writing files.");
    return;
  }
  assert(args.length === 0 || (args.length === 1 && args[0] === "--check"), "Unknown arguments; use --help.");
  assert.equal(await canonical(sourcePath), sourcePath, "Source must not be a symbolic link.");
  assert.equal(await canonical(outputPath), outputPath, "Output must not escape .local-assets through symbolic links.");
  const sourceStat = await fs.stat(sourcePath);
  const outputStat = await fs.stat(outputPath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  assert(!outputStat || sourceStat.dev !== outputStat.dev || sourceStat.ino !== outputStat.ino, "Never overwrite source.");
  const { output, report } = await cleanBottomPreview(await fs.readFile(sourcePath));
  if (args[0] === "--check") {
    assert.equal(hash(await fs.readFile(outputPath)), report.outputSHA256, "Preview is stale; run without --check.");
  } else {
    await fs.writeFile(outputPath, output);
    assert.equal(hash(await fs.readFile(outputPath)), report.outputSHA256, "Written preview verification failed.");
  }
  assert.equal(hash(await fs.readFile(sourcePath)), sourceSHA256, "Original CAD export changed.");
  console.log(JSON.stringify({ mode: args[0] === "--check" ? "verified" : "generated", ...report }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
