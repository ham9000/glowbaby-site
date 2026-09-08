import { NextResponse, type NextRequest } from "next/server";
import { createHeroGrant, HERO_GRANT_TTL_MS } from "@/lib/hero-asset-crypto";
import type { HeroAccessGrant } from "@/lib/hero-asset-format";
import {
  getHeroMasterKey,
  HERO_GRANT_COOKIE,
  HERO_PRIVATE_HEADERS,
  heroAccessDenied,
  heroAssetUrl,
  heroGrantCookieOptions,
  heroRequestOrigin,
  heroUnavailable,
  isSameOriginHeroRequest,
  loadProtectedHeroScene,
  rejectHeroMethod,
} from "@/lib/hero-assets-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginHeroRequest(request)) return heroAccessDenied();
  let master: Buffer | null = null;
  try {
    master = getHeroMasterKey();
    if (!master) return heroUnavailable();
    loadProtectedHeroScene(master).fill(0);
    const { claims, token, key } = createHeroGrant(master, heroRequestOrigin(request));
    const grant: HeroAccessGrant = {
      assetUrl: heroAssetUrl(claims.id),
      grant: claims.id,
      key: key.toString("base64"),
      expiresAt: claims.expiresAt,
    };
    key.fill(0);
    const response = NextResponse.json(grant, { headers: HERO_PRIVATE_HEADERS });
    response.cookies.set(HERO_GRANT_COOKIE, token, {
      ...heroGrantCookieOptions(claims.id, request),
      maxAge: HERO_GRANT_TTL_MS / 1000,
      expires: new Date(claims.expiresAt),
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
