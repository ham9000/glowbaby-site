import fs from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld, meshopt, textureCompress } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

// Explicit files only; originals remain outside public. Do not pass licensed=false assets.
const [source, destination, permission] = process.argv.slice(2);
const localOnly = destination && permission === "--local-only" && path.resolve(destination).startsWith(path.resolve(".local-assets") + path.sep);
if (!source || !destination || (!localOnly && permission !== "--web-delivery-permitted")) {
  throw new Error("Usage: node scripts/prepare-hero-assets.mjs INPUT.glb OUTPUT.glb --web-delivery-permitted (verify source license first), or --local-only with output inside .local-assets/");
}
if (path.resolve(source) === path.resolve(destination)) throw new Error("Keep the original source separate.");
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(source);
const summary = () => ({
  meshes: doc.getRoot().listMeshes().length,
  materials: doc.getRoot().listMaterials().length,
  triangles: doc.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION")?.getCount() ?? 0) / 3, 0), 0),
  textures: doc.getRoot().listTextures().map((t) => ({ name: t.getName(), size: t.getSize() })),
});
const before = summary();
await doc.transform(dedup(), weld(), prune(), textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await fs.mkdir(path.dirname(destination), { recursive: true });
await io.write(destination, doc);
console.log(JSON.stringify({ before, after: summary(), sourceBytes: (await fs.stat(source)).size, outputBytes: (await fs.stat(destination)).size }, null, 2));
