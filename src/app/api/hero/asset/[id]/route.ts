import { NextResponse, type NextRequest } from "next/server";
import { deriveHeroDeliveryKey, encryptHeroPayload, isHeroGrantId, verifyHeroGrant } from "@/lib/hero-asset-crypto";
import { HERO_GRANT_HEADER, wrapEncryptedHero } from "@/lib/hero-asset-format";
import {
  getHeroMasterKey,
  HERO_GRANT_COOKIE,
  HERO_PRIVATE_HEADERS,
  heroAccessDenied,
  heroGrantCookieOptions,
  heroRequestOrigin,
  heroUnavailable,
  isSameOriginHeroRequest,
  loadProtectedHeroScene,
  rejectHeroMethod,
} from "@/lib/hero-assets-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginHeroRequest(request)) return heroAccessDenied();
  const { id } = await context.params;
  if (!isHeroGrantId(id) || request.headers.get(HERO_GRANT_HEADER) !== id) return heroAccessDenied();
  const cookie = request.cookies.get(HERO_GRANT_COOKIE)?.value;
  if (!cookie) return heroAccessDenied();
  let master: Buffer | null = null;
  try {
    master = getHeroMasterKey();
    if (!master) return heroUnavailable();
    const claims = verifyHeroGrant(cookie, id, heroRequestOrigin(request), master);
    if (!claims) return heroAccessDenied(401);
    const compressed = loadProtectedHeroScene(master);
    const key = deriveHeroDeliveryKey(master, claims);
    let envelope: Uint8Array;
    try {
      envelope = wrapEncryptedHero(encryptHeroPayload(compressed, key));
    } finally {
      key.fill(0);
      compressed.fill(0);
    }
    const response = new NextResponse(Uint8Array.from(envelope).buffer, {
      headers: { ...HERO_PRIVATE_HEADERS, "Content-Type": "application/octet-stream" },
    });
    response.cookies.set(HERO_GRANT_COOKIE, "", {
      ...heroGrantCookieOptions(id, request),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return heroUnavailable(error);
  } finally {
    master?.fill(0);
  }
}

export const GET = rejectHeroMethod;
export const HEAD = rejectHeroMethod;
export const OPTIONS = rejectHeroMethod;
export const PUT = rejectHeroMethod;
export const PATCH = rejectHeroMethod;
export const DELETE = rejectHeroMethod;
