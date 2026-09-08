import {
  HERO_GRANT_HEADER,
  HERO_VIEWER_HEADER,
  MAX_HERO_BUNDLE_BYTES,
  unpackHeroModels,
  unwrapEncryptedHero,
  type HeroAccessGrant,
  type HeroModelBuffers,
} from "./hero-asset-format";

class ExpiredHeroGrant extends Error {}

async function readBounded(response: Response, maximum: number, signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximum)) {
    await response.body?.cancel();
    throw new Error("Invalid hero response size");
  }
  if (!response.body) throw new Error("Empty hero response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) throw new Error("Hero response exceeds its delivery budget");
      chunks.push(value);
    }
    signal.throwIfAborted();
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function validateGrant(value: unknown): HeroAccessGrant {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid hero access grant");
  const grant = value as Record<string, unknown>;
  if (typeof grant.grant !== "string" || !/^[a-f0-9]{32}$/.test(grant.grant) ||
      grant.assetUrl !== `/api/hero/asset/${grant.grant}` ||
      typeof grant.key !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(grant.key) ||
      typeof grant.expiresAt !== "number" || !Number.isSafeInteger(grant.expiresAt)) {
    throw new Error("Invalid hero access grant");
  }
  if (grant.expiresAt <= Date.now()) throw new ExpiredHeroGrant("Hero access expired");
  return { assetUrl: grant.assetUrl, grant: grant.grant, key: grant.key, expiresAt: grant.expiresAt };
}

export async function loadHeroModels(signal: AbortSignal, onDeliveryReady?: () => void): Promise<HeroModelBuffers> {
  signal.throwIfAborted();
  if (!globalThis.isSecureContext || !globalThis.crypto?.subtle) throw new Error("Secure 3D delivery is unavailable");
  const subtle = globalThis.crypto.subtle;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const session = await fetch("/api/hero/session", {
        method: "POST", headers: { [HERO_VIEWER_HEADER]: "1" },
        credentials: "same-origin", cache: "no-store", redirect: "error", signal,
      });
      if (!session.ok || session.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
        await session.body?.cancel();
        throw new Error("Hero access is unavailable");
      }
      const grant = validateGrant(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await readBounded(session, 2048, signal))));
      const rawKey = Uint8Array.from(atob(grant.key), (character) => character.charCodeAt(0));
      if (rawKey.byteLength !== 32 || btoa(String.fromCharCode(...rawKey)) !== grant.key) throw new Error("Invalid hero delivery key");
      let key: CryptoKey;
      try {
        key = await subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
      } finally {
        rawKey.fill(0);
      }
      signal.throwIfAborted();
      if (grant.expiresAt <= Date.now()) throw new ExpiredHeroGrant("Hero access expired");
      onDeliveryReady?.();
      const response = await fetch(grant.assetUrl, {
        method: "POST", headers: { [HERO_VIEWER_HEADER]: "1", [HERO_GRANT_HEADER]: grant.grant },
        credentials: "same-origin", cache: "no-store", redirect: "error", signal,
      });
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 401) throw new ExpiredHeroGrant("Hero access expired");
        throw new Error("Hero model delivery failed");
      }
      if (response.headers.get("content-type")?.split(";")[0].trim() !== "application/octet-stream") {
        await response.body?.cancel();
        throw new Error("Invalid hero model response");
      }
      const envelope = await readBounded(response, MAX_HERO_BUNDLE_BYTES + 32, signal);
      const packet = new Uint8Array(unwrapEncryptedHero(envelope));
      const plaintext = await subtle.decrypt({ name: "AES-GCM", iv: packet.slice(0, 12), tagLength: 128 }, key, packet.slice(12));
      signal.throwIfAborted();
      return unpackHeroModels(plaintext);
    } catch (error) {
      signal.throwIfAborted();
      if (!(error instanceof ExpiredHeroGrant) || attempt !== 0) throw error;
    }
  }
  throw new Error("Hero access expired");
}
