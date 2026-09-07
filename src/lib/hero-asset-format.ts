export const HERO_MODEL_KEYS = ["stroller", "bottom", "top"] as const;
export type HeroModelKey = (typeof HERO_MODEL_KEYS)[number];
export type HeroModelBuffers = Record<HeroModelKey, ArrayBuffer>;
export type HeroAccessGrant = {
  assetUrl: string;
  grant: string;
  key: string;
  expiresAt: number;
};

export const HERO_VIEWER_HEADER = "x-glowbaby-viewer";
export const HERO_GRANT_HEADER = "x-glowbaby-grant";
export const MAX_HERO_BUNDLE_BYTES = 5 * 1024 * 1024;

const BUNDLE_MAGIC = 0x31484247; // GBH1, little endian.
const ENVELOPE_MAGIC = 0x31454247; // GBE1.
const HEADER_BYTES = 16;
const ENCRYPTION_OVERHEAD = 12 + 16;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateGlb(buffer: ArrayBuffer) {
  if (buffer.byteLength < 20 || buffer.byteLength > MAX_HERO_BUNDLE_BYTES) throw new Error("Invalid hero model size");
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength) {
    throw new Error("Hero models must be complete GLB 2.0 files");
  }
  let offset = 12;
  let metadata: unknown;
  let hasBinaryChunk = false;
  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) throw new Error("Truncated hero model chunk");
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    if (length % 4 !== 0 || offset + 8 + length > buffer.byteLength) throw new Error("Invalid hero model chunk bounds");
    if (offset === 12) {
      if (type !== 0x4e4f534a) throw new Error("Hero model metadata is missing");
      metadata = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(buffer, offset + 8, length)));
    } else if (type === 0x4e4f534a) {
      throw new Error("Duplicate hero model metadata");
    }
    if (type === 0x004e4942) {
      if (hasBinaryChunk) throw new Error("Duplicate hero model binary chunk");
      hasBinaryChunk = true;
    }
    offset += 8 + length;
  }
  if (!isRecord(metadata) || !isRecord(metadata.asset) || metadata.asset.version !== "2.0") {
    throw new Error("Invalid hero model metadata");
  }
  // The protected bundle must not trigger separate texture/buffer downloads.
  for (const key of ["buffers", "images"]) {
    const entries = metadata[key];
    if (entries === undefined) continue;
    if (!Array.isArray(entries)) throw new Error(`Invalid hero model ${key}`);
    for (const entry of entries) {
      if (!isRecord(entry) || (entry.uri !== undefined && (typeof entry.uri !== "string" || !entry.uri.startsWith("data:")))) {
        throw new Error("Hero models must contain their own textures and buffers");
      }
    }
  }
}

export function packHeroModels(models: HeroModelBuffers): ArrayBuffer {
  const lengths = HERO_MODEL_KEYS.map((key) => {
    validateGlb(models[key]);
    return models[key].byteLength;
  });
  const total = HEADER_BYTES + lengths.reduce((sum, length) => sum + length, 0);
  if (total > MAX_HERO_BUNDLE_BYTES) throw new Error("Hero bundle exceeds the 5 MiB delivery budget");
  const bundle = new ArrayBuffer(total);
  const view = new DataView(bundle);
  view.setUint32(0, BUNDLE_MAGIC, true);
  let offset = HEADER_BYTES;
  for (let index = 0; index < HERO_MODEL_KEYS.length; index++) {
    view.setUint32(4 + index * 4, lengths[index], true);
    new Uint8Array(bundle, offset, lengths[index]).set(new Uint8Array(models[HERO_MODEL_KEYS[index]]));
    offset += lengths[index];
  }
  return bundle;
}

export function unpackHeroModels(bundle: ArrayBuffer): HeroModelBuffers {
  if (bundle.byteLength < HEADER_BYTES || bundle.byteLength > MAX_HERO_BUNDLE_BYTES) throw new Error("Invalid hero bundle size");
  const view = new DataView(bundle);
  if (view.getUint32(0, true) !== BUNDLE_MAGIC) throw new Error("Unsupported hero bundle");
  const buffers: ArrayBuffer[] = [];
  let offset = HEADER_BYTES;
  for (let index = 0; index < HERO_MODEL_KEYS.length; index++) {
    const length = view.getUint32(4 + index * 4, true);
    if (length < 20 || offset + length > bundle.byteLength) throw new Error("Invalid hero bundle model bounds");
    const model = bundle.slice(offset, offset + length);
    validateGlb(model);
    buffers.push(model);
    offset += length;
  }
  if (offset !== bundle.byteLength) throw new Error("Unexpected data in hero bundle");
  return { stroller: buffers[0], bottom: buffers[1], top: buffers[2] };
}

export function wrapEncryptedHero(packet: Uint8Array): Uint8Array {
  if (packet.byteLength < ENCRYPTION_OVERHEAD || packet.byteLength > MAX_HERO_BUNDLE_BYTES + ENCRYPTION_OVERHEAD) {
    throw new Error("Invalid encrypted hero packet size");
  }
  const result = new Uint8Array(4 + packet.byteLength);
  new DataView(result.buffer).setUint32(0, ENVELOPE_MAGIC, true);
  result.set(packet, 4);
  return result;
}

export function unwrapEncryptedHero(envelope: Uint8Array): Uint8Array {
  if (envelope.byteLength < 4 + ENCRYPTION_OVERHEAD || envelope.byteLength > MAX_HERO_BUNDLE_BYTES + ENCRYPTION_OVERHEAD + 4) {
    throw new Error("Invalid encrypted hero envelope size");
  }
  if (new DataView(envelope.buffer, envelope.byteOffset, envelope.byteLength).getUint32(0, true) !== ENVELOPE_MAGIC) {
    throw new Error("Unsupported encrypted hero envelope");
  }
  return envelope.slice(4);
}
