import "server-only";

import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { NextResponse } from "next/server";
import { decodeHeroKey, decryptHeroPayload, isHeroGrantId } from "@/lib/hero-asset-crypto";
import {
  HERO_VIEWER_HEADER,
  MAX_HERO_BUNDLE_BYTES,
  unpackHeroModels,
  unwrapEncryptedHero,
} from "@/lib/hero-asset-format";

export const HERO_GRANT_COOKIE = "glowbaby-hero";
export const HERO_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

class HeroAssetConfigurationError extends Error {}

export function getHeroMasterKey(): Buffer | null {
  const value = process.env.HERO_ASSET_KEY;
  if (value === undefined || value === "") return null;
  try {
    return decodeHeroKey(value);
  } catch {
    throw new HeroAssetConfigurationError(
      "HERO_ASSET_KEY must be a server-only 64-character hexadecimal key matching assets/hero/scene.gbe.",
    );
  }
}

export function loadProtectedHeroScene(master: Uint8Array): Uint8Array {
  let descriptor: number | undefined;
  let envelope: Buffer;
  try {
    descriptor = openSync(join(process.cwd(), "assets", "hero", "scene.gbe"), "r");
    const info = fstatSync(descriptor);
    if (!info.isFile() || info.size < 32 || info.size > MAX_HERO_BUNDLE_BYTES + 32) {
      throw new Error("Invalid encrypted asset bounds");
    }
    envelope = Buffer.alloc(info.size);
    let offset = 0;
    while (offset < envelope.byteLength) {
      const count = readSync(descriptor, envelope, offset, envelope.byteLength - offset, null);
      if (count === 0) throw new Error("Truncated encrypted asset");
      offset += count;
    }
    if (readSync(descriptor, Buffer.alloc(1), 0, 1, null) !== 0) throw new Error("Encrypted asset changed");
  } catch {
    throw new HeroAssetConfigurationError(
      "Protected hero asset is missing, unreadable, or outside its size limit. Package and deploy assets/hero/scene.gbe.",
    );
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
  try {
    const compressed = decryptHeroPayload(unwrapEncryptedHero(envelope), master);
    const plain = gunzipSync(compressed, { maxOutputLength: MAX_HERO_BUNDLE_BYTES });
    unpackHeroModels(Uint8Array.from(plain).buffer);
    plain.fill(0);
    return compressed;
  } catch {
    throw new HeroAssetConfigurationError(
      "Protected hero asset is corrupt or does not match HERO_ASSET_KEY. Repackage assets/hero/scene.gbe with the deployment key.",
    );
  }
}

export function hasProtectedHeroScene(): boolean {
  const master = getHeroMasterKey();
  if (!master) return false;
  try {
    loadProtectedHeroScene(master);
    return true;
  } finally {
    master.fill(0);
  }
}

export function heroRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid hero request protocol");
  const host = request.headers.get("host") ?? url.host;
  if (!host || host.length > 300 || /[\s\\/@?#,]/.test(host)) throw new Error("Invalid hero request host");
  if (url.protocol === "http:" && !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?$/i.test(host)) {
    throw new Error("Protected hero delivery requires HTTPS except on local loopback");
  }
  // NextRequest normalizes 127.0.0.1 and ::1 to localhost; Host preserves the browser's actual origin.
  return new URL(`${url.protocol}//${host}`).origin;
}

export function isSameOriginHeroRequest(request: Request): boolean {
  if (request.headers.get(HERO_VIEWER_HEADER) !== "1") return false;
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || (site !== null && site !== "same-origin")) return false;
  try {
    return origin === heroRequestOrigin(request);
  } catch {
    return false;
  }
}

export function heroAssetUrl(id: string): string {
  if (!isHeroGrantId(id)) throw new Error("Invalid hero grant identifier");
  return `/api/hero/asset/${id}`;
}

export function heroGrantCookieOptions(id: string, request: Request) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: new URL(request.url).protocol === "https:",
    path: heroAssetUrl(id),
  };
}

export function heroAccessDenied(status: 401 | 403 = 403) {
  return NextResponse.json({ error: "Hero scene access denied." }, { status, headers: HERO_PRIVATE_HEADERS });
}

export function heroUnavailable(error?: unknown) {
  if (error !== undefined) {
    console.error("[protected-hero]", error instanceof HeroAssetConfigurationError
      ? error.message
      : "Unexpected delivery failure. Check the server runtime and protected hero configuration.");
  }
  return NextResponse.json({ error: "Hero scene is unavailable." }, { status: 503, headers: HERO_PRIVATE_HEADERS });
}

export function rejectHeroMethod() {
  return new NextResponse(null, { status: 405, headers: { ...HERO_PRIVATE_HEADERS, Allow: "POST" } });
}
