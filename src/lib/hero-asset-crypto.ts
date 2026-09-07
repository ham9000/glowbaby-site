import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;
const GRANT_ID_PATTERN = /^[a-f0-9]{32}$/;
const DERIVATION_SALT = "glowbaby.hero.v1";

export const HERO_GRANT_TTL_MS = 90_000;

export type HeroGrantClaims = {
  version: 1;
  id: string;
  issuedAt: number;
  expiresAt: number;
  origin: string;
};

function assertKey(key: Uint8Array) {
  if (!(key instanceof Uint8Array) || key.byteLength !== KEY_BYTES) {
    throw new Error("Hero encryption keys must contain exactly 32 bytes");
  }
}

export function decodeHeroKey(hex64: string): Buffer {
  if (typeof hex64 !== "string" || hex64.length !== 64 || !/^[a-f0-9]{64}$/i.test(hex64)) {
    throw new Error("HERO_ASSET_KEY must contain exactly 64 hexadecimal characters");
  }
  return Buffer.from(hex64, "hex");
}

export function encryptHeroPayload(plain: Uint8Array, key: Uint8Array): Uint8Array {
  assertKey(key);
  if (!(plain instanceof Uint8Array) || plain.byteLength > MAX_PAYLOAD_BYTES) {
    throw new Error("Invalid hero plaintext size");
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return new Uint8Array(Buffer.concat([iv, ciphertext, cipher.getAuthTag()]));
}

export function decryptHeroPayload(packet: Uint8Array, key: Uint8Array): Uint8Array {
  assertKey(key);
  if (!(packet instanceof Uint8Array) || packet.byteLength < IV_BYTES + TAG_BYTES ||
      packet.byteLength > MAX_PAYLOAD_BYTES + IV_BYTES + TAG_BYTES) {
    throw new Error("Invalid encrypted hero packet size");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, packet.subarray(0, IV_BYTES), { authTagLength: TAG_BYTES });
  decipher.setAuthTag(packet.subarray(packet.byteLength - TAG_BYTES));
  try {
    return new Uint8Array(Buffer.concat([
      decipher.update(packet.subarray(IV_BYTES, packet.byteLength - TAG_BYTES)),
      decipher.final(),
    ]));
  } catch {
    throw new Error("Hero payload authentication failed");
  }
}

export function isHeroGrantId(value: unknown): value is string {
  return typeof value === "string" && value.length === 32 && GRANT_ID_PATTERN.test(value);
}

function isOrigin(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 300) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin === value;
  } catch {
    return false;
  }
}

function isClaims(value: unknown): value is HeroGrantClaims {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const claims = value as Record<string, unknown>;
  return Object.keys(claims).length === 5 &&
    claims.version === 1 && isHeroGrantId(claims.id) && isOrigin(claims.origin) &&
    typeof claims.issuedAt === "number" && Number.isSafeInteger(claims.issuedAt) && claims.issuedAt >= 0 &&
    typeof claims.expiresAt === "number" && Number.isSafeInteger(claims.expiresAt) &&
    claims.expiresAt - claims.issuedAt === HERO_GRANT_TTL_MS;
}

function serializeClaims(claims: HeroGrantClaims): string {
  return JSON.stringify({
    version: claims.version,
    id: claims.id,
    issuedAt: claims.issuedAt,
    expiresAt: claims.expiresAt,
    origin: claims.origin,
  });
}

function signingKey(master: Uint8Array): Buffer {
  assertKey(master);
  return Buffer.from(hkdfSync("sha256", master, DERIVATION_SALT, "grant-signature", KEY_BYTES));
}

export function deriveHeroDeliveryKey(master: Uint8Array, claims: HeroGrantClaims): Buffer {
  assertKey(master);
  if (!isClaims(claims)) throw new Error("Invalid hero grant claims");
  return Buffer.from(hkdfSync(
    "sha256", master, DERIVATION_SALT, `delivery-encryption:${serializeClaims(claims)}`, KEY_BYTES,
  ));
}

export function createHeroGrant(master: Uint8Array, origin: string, now = Date.now()) {
  const claims: HeroGrantClaims = {
    version: 1,
    id: randomBytes(16).toString("hex"),
    issuedAt: now,
    expiresAt: now + HERO_GRANT_TTL_MS,
    origin,
  };
  if (!isClaims(claims)) throw new Error("Invalid hero grant claims");
  const payload = Buffer.from(serializeClaims(claims)).toString("base64url");
  const signature = createHmac("sha256", signingKey(master)).update(`v1.${payload}`).digest("base64url");
  return { claims, token: `v1.${payload}.${signature}`, key: deriveHeroDeliveryKey(master, claims) };
}

export function verifyHeroGrant(
  token: unknown,
  id: string,
  origin: string,
  master: Uint8Array,
  now = Date.now(),
): HeroGrantClaims | null {
  assertKey(master);
  if (!isHeroGrantId(id) || !isOrigin(origin) || !Number.isSafeInteger(now) || now < 0 ||
      typeof token !== "string" || token.length > 1024) return null;
  const parts = /^v1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!parts || parts[0] !== token) return null;
  const [, payload, signature] = parts;
  const signatureBytes = Buffer.from(signature, "base64url");
  if (signatureBytes.length !== KEY_BYTES || signatureBytes.toString("base64url") !== signature) return null;
  const expected = createHmac("sha256", signingKey(master)).update(`v1.${payload}`).digest();
  if (!timingSafeEqual(signatureBytes, expected)) return null;
  try {
    const bytes = Buffer.from(payload, "base64url");
    if (bytes.toString("base64url") !== payload) return null;
    const claims: unknown = JSON.parse(bytes.toString("utf8"));
    if (!isClaims(claims) || serializeClaims(claims) !== bytes.toString("utf8") ||
        claims.id !== id || claims.origin !== origin || claims.issuedAt > now || claims.expiresAt <= now) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
