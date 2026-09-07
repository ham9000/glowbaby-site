import assert from "node:assert/strict";
import {
  HERO_MODEL_KEYS, MAX_HERO_BUNDLE_BYTES,
  packHeroModels, unpackHeroModels, wrapEncryptedHero, unwrapEncryptedHero,
} from "../src/lib/hero-asset-format.ts";

function model(metadata) {
  const json = new TextEncoder().encode(JSON.stringify(metadata));
  const length = Math.ceil(json.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, length, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer, 20).fill(32);
  new Uint8Array(buffer, 20, json.length).set(json);
  return buffer;
}

const models = Object.fromEntries(HERO_MODEL_KEYS.map((key, index) => [key, model({ asset: { version: "2.0" }, extras: { index } })]));
const packed = packHeroModels(models);
const unpacked = unpackHeroModels(packed);
assert.deepEqual(Object.keys(unpacked), [...HERO_MODEL_KEYS]);
for (const key of HERO_MODEL_KEYS) assert.deepEqual(unpacked[key], models[key], "Model bytes must remain unchanged");
assert.throws(() => unpackHeroModels(packed.slice(0, -1)), /bounds/);
assert.throws(() => unpackHeroModels(new ArrayBuffer(MAX_HERO_BUNDLE_BYTES + 1)), /size/);
const wrongMagic = packed.slice(0);
new DataView(wrongMagic).setUint32(0, 0);
assert.throws(() => unpackHeroModels(wrongMagic), /Unsupported/);
const wrongLength = packed.slice(0);
new DataView(wrongLength).setUint32(4, 0xffffffff, true);
assert.throws(() => unpackHeroModels(wrongLength), /bounds/);
const trailing = new Uint8Array(packed.byteLength + 1);
trailing.set(new Uint8Array(packed));
assert.throws(() => unpackHeroModels(trailing.buffer), /Unexpected data/);
const badModel = models.stroller.slice(0);
new DataView(badModel).setUint32(8, badModel.byteLength - 4, true);
assert.throws(() => packHeroModels({ ...models, stroller: badModel }), /complete GLB/);
const badChunk = models.stroller.slice(0);
new DataView(badChunk).setUint32(12, 0xffffffff, true);
assert.throws(() => packHeroModels({ ...models, stroller: badChunk }), /chunk bounds/);
const secondJson = new Uint8Array(models.top, 12);
const duplicate = new Uint8Array(models.stroller.byteLength + secondJson.length);
duplicate.set(new Uint8Array(models.stroller));
duplicate.set(secondJson, models.stroller.byteLength);
new DataView(duplicate.buffer).setUint32(8, duplicate.length, true);
assert.throws(() => packHeroModels({ ...models, stroller: duplicate.buffer }), /Duplicate.*metadata/);
for (const key of ["buffers", "images"]) {
  const external = model({ asset: { version: "2.0" }, [key]: [{ uri: "https://example.invalid/private-model" }] });
  assert.throws(() => packHeroModels({ ...models, top: external }), /own textures and buffers/);
}
const embedded = model({ asset: { version: "2.0" }, buffers: [{ uri: "data:application/octet-stream;base64,AAAA" }] });
assert.deepEqual(unpackHeroModels(packHeroModels({ ...models, top: embedded })).top, embedded);

const packet = new Uint8Array(48).fill(11);
const envelope = wrapEncryptedHero(packet);
assert.deepEqual(unwrapEncryptedHero(envelope), packet);
const padded = new Uint8Array(envelope.length + 20);
padded.set(envelope, 7);
assert.deepEqual(unwrapEncryptedHero(padded.subarray(7, 7 + envelope.length)), packet, "Respect typed-array offsets");
assert.throws(() => wrapEncryptedHero(new Uint8Array(27)), /size/);
assert.throws(() => unwrapEncryptedHero(new Uint8Array(31)), /size/);
const badEnvelope = envelope.slice();
badEnvelope[0] = 0;
assert.throws(() => unwrapEncryptedHero(badEnvelope), /Unsupported/);
console.log("Hero format: lossless model bundle, bounds, version, self-contained resources and encrypted envelope checks passed.");
