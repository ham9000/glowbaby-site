import assert from "node:assert/strict";
import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync, rmSync, truncateSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";
import {
  createHeroGrant, decodeHeroKey, decryptHeroPayload, deriveHeroDeliveryKey,
  encryptHeroPayload, HERO_GRANT_TTL_MS, isHeroGrantId, verifyHeroGrant,
} from "../src/lib/hero-asset-crypto.ts";
import {
  HERO_GRANT_HEADER, HERO_MODEL_KEYS, HERO_VIEWER_HEADER, MAX_HERO_BUNDLE_BYTES,
  packHeroModels, unpackHeroModels, unwrapEncryptedHero, wrapEncryptedHero,
} from "../src/lib/hero-asset-format.ts";

const sourceRoot = new URL("../src/", import.meta.url);
// Only the test process bypasses Next's server-only marker; production keeps it.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, context);
    }
    return nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context);
  },
});

const { NextRequest } = await import("next/server.js");
const server = await import("../src/lib/hero-assets-server.ts");
const sessionRoute = await import("../src/app/api/hero/session/route.ts");
const assetRoute = await import("../src/app/api/hero/asset/[id]/route.ts");
const master = randomBytes(32);
const otherMaster = randomBytes(32);
const origin = "https://glowbaby.example";
const now = 1_800_000_000_000;

assert.ok(timingSafeEqual(decodeHeroKey(master.toString("hex")), master), "Decode a valid key");
assert.ok(timingSafeEqual(decodeHeroKey(master.toString("hex").toUpperCase()), master), "Accept uppercase hexadecimal");
for (const invalid of ["", "a".repeat(63), "g".repeat(64), `${"a".repeat(64)}\n`, " a".repeat(32), null]) {
  assert.throws(() => decodeHeroKey(invalid), /64 hexadecimal/);
}
const plaintext = new TextEncoder().encode("Synthetic glTF fixture, not a purchased model");
const packet = encryptHeroPayload(plaintext, master);
assert.deepEqual(decryptHeroPayload(packet, master), plaintext);
assert.notDeepEqual(encryptHeroPayload(plaintext, master), packet, "Every encryption uses a fresh IV");
assert.equal(decryptHeroPayload(encryptHeroPayload(new Uint8Array(), master), master).length, 0);
assert.throws(() => decryptHeroPayload(packet, otherMaster), /authentication/);
for (const index of [0, 12, packet.length - 1]) {
  const tampered = packet.slice();
  tampered[index] ^= 1;
  assert.throws(() => decryptHeroPayload(tampered, master), /authentication/);
}
const paddedPacket = new Uint8Array(packet.length + 8);
paddedPacket.set(packet, 4);
assert.deepEqual(decryptHeroPayload(paddedPacket.subarray(4, -4), master), plaintext);
for (const length of [0, 1, 31, 33]) {
  assert.throws(() => encryptHeroPayload(plaintext, new Uint8Array(length)), /32 bytes/);
  assert.throws(() => decryptHeroPayload(packet, new Uint8Array(length)), /32 bytes/);
}
assert.throws(() => encryptHeroPayload(new Uint8Array(MAX_HERO_BUNDLE_BYTES + 1), master), /size/);
for (const length of [0, 27, MAX_HERO_BUNDLE_BYTES + 29]) {
  assert.throws(() => decryptHeroPayload(new Uint8Array(length), master), /size/);
}

const first = createHeroGrant(master, origin, now);
const second = createHeroGrant(master, origin, now);
assert.ok(isHeroGrantId(first.claims.id));
assert.notEqual(first.claims.id, second.claims.id);
assert.equal(first.claims.expiresAt, now + HERO_GRANT_TTL_MS);
assert.deepEqual(verifyHeroGrant(first.token, first.claims.id, origin, master, now), first.claims);
assert.ok(verifyHeroGrant(first.token, first.claims.id, origin, master, now + HERO_GRANT_TTL_MS - 1));
assert.equal(verifyHeroGrant(first.token, first.claims.id, origin, master, now + HERO_GRANT_TTL_MS), null);
assert.equal(verifyHeroGrant(first.token, first.claims.id, origin, master, now - 1), null);
assert.equal(verifyHeroGrant(first.token, second.claims.id, origin, master, now), null);
assert.equal(verifyHeroGrant(first.token, first.claims.id, "https://another.example", master, now), null);
assert.equal(verifyHeroGrant(first.token, first.claims.id, origin, otherMaster, now), null);
assert.ok(timingSafeEqual(first.key, deriveHeroDeliveryKey(master, first.claims)), "Session key derivation is reproducible");
assert.ok(!timingSafeEqual(first.key, master), "Never distribute the at-rest key");
assert.ok(!timingSafeEqual(first.key, second.key), "Concurrent grants have different encryption keys");
const signingKey = Buffer.from(hkdfSync("sha256", master, "glowbaby.hero.v1", "grant-signature", 32));
assert.ok(!timingSafeEqual(first.key, signingKey), "Signing and delivery key derivations are domain-separated");
for (const invalid of ["", "../asset", "a".repeat(31), "a".repeat(33), "A".repeat(32), `${"a".repeat(32)}\n`]) {
  assert.equal(isHeroGrantId(invalid), false);
}
for (const invalid of ["", "a".repeat(1025), `${first.token}\n`, first.token.replace("v1.", "v2."), first.token.slice(0, -1), `${first.token}=`, null]) {
  assert.equal(verifyHeroGrant(invalid, first.claims.id, origin, master, now), null);
}
const tokenParts = first.token.split(".");
tokenParts[1] = `${tokenParts[1][0] === "a" ? "b" : "a"}${tokenParts[1].slice(1)}`;
assert.equal(verifyHeroGrant(tokenParts.join("."), first.claims.id, origin, master, now), null);
const alteredSignature = first.token.slice(0, -2) + (first.token.at(-2) === "a" ? "b" : "a") + first.token.at(-1);
assert.equal(verifyHeroGrant(alteredSignature, first.claims.id, origin, master, now), null);

function signFixture(claims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", signingKey).update(`v1.${payload}`).digest("base64url");
  return `v1.${payload}.${signature}`;
}
for (const claims of [
  { ...first.claims, version: 2 },
  { ...first.claims, expiresAt: first.claims.expiresAt + 1 },
  { ...first.claims, issuedAt: String(first.claims.issuedAt) },
  { ...first.claims, expiresAt: null },
  { ...first.claims, extra: true },
  { ...first.claims, origin: `${origin}/` },
  { ...first.claims, id: `${first.claims.id}\n` },
  [first.claims],
  null,
]) {
  assert.equal(verifyHeroGrant(signFixture(claims), first.claims.id, origin, master, now), null);
}

function request(path = "/api/hero/session", overrides = {}, host = origin) {
  const headers = new Headers({
    origin: host,
    host: new URL(host).host,
    [HERO_VIEWER_HEADER]: "1",
    "sec-fetch-site": "same-origin",
  });
  for (const [name, value] of Object.entries(overrides)) {
    if (value === null) headers.delete(name);
    else headers.set(name, value);
  }
  return new NextRequest(`${host}${path}`, { method: "POST", headers });
}

assert.equal(server.isSameOriginHeroRequest(request()), true);
assert.equal(server.isSameOriginHeroRequest(request(undefined, { "sec-fetch-site": null })), true, "Older browsers can use Origin and custom header");
for (const headers of [
  { origin: null }, { origin: "null" }, { origin: "https://foreign.example" },
  { origin: `${origin}/` }, { origin: `${origin}:443` }, { origin: `${origin}, https://foreign.example` },
  { origin: "http://glowbaby.example" },
  { [HERO_VIEWER_HEADER]: null }, { [HERO_VIEWER_HEADER]: "0" }, { [HERO_VIEWER_HEADER]: "1, 1" },
  { "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "same-site" }, { "sec-fetch-site": "none" },
  { "sec-fetch-site": "" },
  { host: "glowbaby.example@foreign.example" }, { host: "glowbaby.example/ignored" },
  { host: "foreign.example", "x-forwarded-host": "glowbaby.example" },
]) {
  assert.equal(server.isSameOriginHeroRequest(request(undefined, headers)), false);
  assert.equal((await sessionRoute.POST(request(undefined, headers))).status, 403);
}
for (const host of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
  assert.equal(server.isSameOriginHeroRequest(request(undefined, {}, host)), true);
  assert.equal(server.heroGrantCookieOptions(first.claims.id, request(undefined, {}, host)).secure, false);
}
for (const host of [
  "http://glowbaby.example", "http://localhost.example", "http://localhost.",
  "http://192.168.1.5", "http://127.0.0.2", "http://[::ffff:127.0.0.1]",
]) {
  const insecure = request(undefined, {}, host);
  assert.equal(server.isSameOriginHeroRequest(insecure), false, "Public delivery requires HTTPS");
  assert.equal((await sessionRoute.POST(insecure)).status, 403);
  const insecureAsset = request(server.heroAssetUrl(first.claims.id), {
    [HERO_GRANT_HEADER]: first.claims.id,
    cookie: `${server.HERO_GRANT_COOKIE}=${first.token}`,
  }, host);
  assert.equal((await assetRoute.POST(insecureAsset, { params: Promise.resolve({ id: first.claims.id }) })).status, 403);
}
for (const headers of [
  { host: null }, { "x-forwarded-proto": "https" }, { "x-forwarded-host": "localhost" },
]) {
  assert.equal(server.isSameOriginHeroRequest(request(undefined, headers, "http://glowbaby.example")), false);
}
for (const host of ["127.1:3000", "2130706433:3000", "0x7f000001:3000"]) {
  assert.equal(server.isSameOriginHeroRequest(request(undefined, { host }, "http://127.0.0.1:3000")), false, "Only exact loopback authorities qualify");
}
assert.equal(server.heroGrantCookieOptions(first.claims.id, request()).secure, true);

function checkPrivate(response) {
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  for (const [name] of response.headers) assert.ok(!name.startsWith("access-control-"), "No CORS opt-in");
}
for (const route of [sessionRoute, assetRoute]) {
  for (const method of ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"]) {
    const response = await route[method]();
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.equal(await response.text(), "");
    checkPrivate(response);
  }
}

function model(index) {
  const json = new TextEncoder().encode(JSON.stringify({ asset: { version: "2.0" }, extras: { fixture: index } }));
  const length = Math.ceil(json.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + length);
  const view = new DataView(buffer);
  for (const [offset, value] of [[0, 0x46546c67], [4, 2], [8, buffer.byteLength], [12, length], [16, 0x4e4f534a]]) {
    view.setUint32(offset, value, true);
  }
  new Uint8Array(buffer, 20).fill(32);
  new Uint8Array(buffer, 20, json.length).set(json);
  return buffer;
}

const models = Object.fromEntries(HERO_MODEL_KEYS.map((key, index) => [key, model(index)]));
const bundle = new Uint8Array(packHeroModels(models));
const compressedBundle = gzipSync(bundle, { level: 9 });
const atRest = wrapEncryptedHero(encryptHeroPayload(compressedBundle, master));
const originalCwd = process.cwd();
const previousKey = process.env.HERO_ASSET_KEY;
const fixtureRoot = join(fileURLToPath(new URL("../", import.meta.url)), `.hero-delivery-check-${randomBytes(8).toString("hex")}`);
const fixtureAsset = join(fixtureRoot, "assets", "hero", "scene.gbe");
const logs = [];
const previousConsoleError = console.error;
try {
  mkdirSync(join(fixtureRoot, "assets", "hero"), { recursive: true });
  process.chdir(fixtureRoot);
  delete process.env.HERO_ASSET_KEY;
  assert.equal(server.hasProtectedHeroScene(), false);
  const unavailable = await sessionRoute.POST(request());
  assert.equal(unavailable.status, 503);
  checkPrivate(unavailable);
  assert.deepEqual(await unavailable.json(), { error: "Hero scene is unavailable." });
  console.error = (...args) => logs.push(args.join(" "));
  process.env.HERO_ASSET_KEY = "invalid-fixture-key";
  assert.throws(() => server.hasProtectedHeroScene(), /server-only 64-character/);
  assert.equal((await sessionRoute.POST(request())).status, 503);
  process.env.HERO_ASSET_KEY = master.toString("hex");
  assert.throws(() => server.hasProtectedHeroScene(), /Package and deploy/);
  assert.equal((await sessionRoute.POST(request())).status, 503);
  writeFileSync(fixtureAsset, atRest);
  assert.equal(server.hasProtectedHeroScene(), true);

  const responses = await Promise.all([sessionRoute.POST(request()), sessionRoute.POST(request())]);
  const grants = [];
  const jar = new Map();
  for (const response of responses) {
    assert.equal(response.status, 200);
    checkPrivate(response);
    const grant = await response.json();
    assert.deepEqual(Object.keys(grant).sort(), ["assetUrl", "expiresAt", "grant", "key"]);
    assert.ok(isHeroGrantId(grant.grant));
    assert.equal(grant.assetUrl, `/api/hero/asset/${grant.grant}`);
    assert.equal(new URL(grant.assetUrl, origin).search, "");
    const deliveryKey = Buffer.from(grant.key, "base64");
    assert.equal(deliveryKey.length, 32);
    assert.ok(!timingSafeEqual(deliveryKey, master), "The response never contains the master key");
    assert.ok(grant.expiresAt > Date.now() && grant.expiresAt <= Date.now() + HERO_GRANT_TTL_MS);
    const cookie = response.cookies.get(server.HERO_GRANT_COOKIE);
    assert.ok(cookie);
    assert.equal(cookie.path, grant.assetUrl);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "strict");
    assert.equal(cookie.secure, true);
    assert.equal(cookie.maxAge, 90);
    assert.equal(cookie.domain, undefined);
    assert.ok(Math.abs(cookie.expires.getTime() - grant.expiresAt) < 1000);
    jar.set(cookie.path, cookie);
    grants.push({ ...grant, cookie: cookie.value, deliveryKey });
  }
  assert.equal(jar.size, 2, "Path-scoped cookies coexist across simultaneous tabs");
  assert.notEqual(grants[0].assetUrl, grants[1].assetUrl);
  assert.ok(!timingSafeEqual(grants[0].deliveryKey, grants[1].deliveryKey));

  function assetRequest(grant, overrides = {}) {
    return request(grant.assetUrl, {
      [HERO_GRANT_HEADER]: grant.grant,
      cookie: `${server.HERO_GRANT_COOKIE}=${grant.cookie}`,
      ...overrides,
    });
  }
  function assetContext(grant) {
    return { params: Promise.resolve({ id: grant.grant }) };
  }
  for (const overrides of [
    { cookie: null },
    { [HERO_GRANT_HEADER]: null }, { [HERO_GRANT_HEADER]: grants[1].grant },
    { origin: null }, { origin: "https://foreign.example" }, { [HERO_VIEWER_HEADER]: null },
    { "sec-fetch-site": "cross-site" },
  ]) {
    const denied = await assetRoute.POST(assetRequest(grants[0], overrides), assetContext(grants[0]));
    assert.equal(denied.status, 403);
    checkPrivate(denied);
    assert.deepEqual(await denied.json(), { error: "Hero scene access denied." });
  }
  for (const cookie of ["invalid", grants[1].cookie]) {
    const denied = await assetRoute.POST(assetRequest(grants[0], {
      cookie: `${server.HERO_GRANT_COOKIE}=${cookie}`,
    }), assetContext(grants[0]));
    assert.equal(denied.status, 401, "Rejected grants must permit the client's single renewal");
    checkPrivate(denied);
  }
  assert.equal((await assetRoute.POST(assetRequest(grants[0]), { params: Promise.resolve({ id: "../private" }) })).status, 403);
  const expired = createHeroGrant(master, origin, Date.now() - HERO_GRANT_TTL_MS);
  const expiredGrant = { grant: expired.claims.id, assetUrl: server.heroAssetUrl(expired.claims.id), cookie: expired.token };
  assert.equal((await assetRoute.POST(assetRequest(expiredGrant), assetContext(expiredGrant))).status, 401);

  for (const grant of grants) {
    const response = await assetRoute.POST(assetRequest(grant), assetContext(grant));
    assert.equal(response.status, 200);
    checkPrivate(response);
    assert.equal(response.headers.get("content-type"), "application/octet-stream");
    const delivered = new Uint8Array(await response.arrayBuffer());
    assert.equal(Buffer.from(delivered.subarray(0, 4)).toString(), "GBE1");
    assert.notEqual(Buffer.from(delivered.subarray(0, 4)).toString(), "glTF");
    assert.notEqual(Buffer.from(delivered.subarray(0, 4)).toString(), "GBH1");
    assert.equal(Buffer.from(delivered).includes(Buffer.from(bundle)), false, "The response does not contain the raw bundle");
    assert.notDeepEqual(delivered, atRest, "Never forward the at-rest ciphertext unchanged");
    const opened = decryptHeroPayload(unwrapEncryptedHero(delivered), grant.deliveryKey);
    assert.deepEqual(Buffer.from(opened), compressedBundle);
    const inflated = gunzipSync(opened, { maxOutputLength: MAX_HERO_BUNDLE_BYTES });
    assert.deepEqual(inflated, Buffer.from(bundle));
    assert.deepEqual(unpackHeroModels(Uint8Array.from(inflated).buffer), models);
    assert.throws(() => decryptHeroPayload(unwrapEncryptedHero(delivered), master), /authentication/);
    assert.throws(() => decryptHeroPayload(unwrapEncryptedHero(atRest), grant.deliveryKey), /authentication/);
    const cleared = response.cookies.get(server.HERO_GRANT_COOKIE);
    assert.equal(cleared.path, grant.assetUrl);
    assert.equal(cleared.maxAge, 0);
    assert.equal(cleared.value, "");
    assert.equal(cleared.httpOnly, true);
    assert.equal(cleared.sameSite, "strict");
    assert.equal(cleared.secure, true);
    jar.delete(cleared.path);
    assert.equal(jar.size, grant === grants[0] ? 1 : 0, "Clearing one cookie does not overwrite another grant");
  }
  // Cookie expiry is browser cleanup, not an extraction-proof or single-use guarantee.
  assert.equal((await assetRoute.POST(assetRequest(grants[0]), assetContext(grants[0]))).status, 200);
  for (const host of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
    const localResponse = await sessionRoute.POST(request(undefined, {}, host));
    assert.equal(localResponse.status, 200);
    const localCookie = localResponse.cookies.get(server.HERO_GRANT_COOKIE);
    assert.equal(localCookie.secure, false);
    const localGrant = await localResponse.json();
    const localAsset = await assetRoute.POST(request(localGrant.assetUrl, {
      [HERO_GRANT_HEADER]: localGrant.grant,
      cookie: `${server.HERO_GRANT_COOKIE}=${localCookie.value}`,
    }, host), assetContext(localGrant));
    assert.equal(localAsset.status, 200);
    assert.equal(localAsset.cookies.get(server.HERO_GRANT_COOKIE).secure, false);
    assert.deepEqual(gunzipSync(
      decryptHeroPayload(unwrapEncryptedHero(new Uint8Array(await localAsset.arrayBuffer())), Buffer.from(localGrant.key, "base64")),
      { maxOutputLength: MAX_HERO_BUNDLE_BYTES },
    ), Buffer.from(bundle));
  }

  process.env.HERO_ASSET_KEY = otherMaster.toString("hex");
  assert.throws(() => server.hasProtectedHeroScene(), /does not match/);
  process.env.HERO_ASSET_KEY = master.toString("hex");
  const corrupt = atRest.slice();
  corrupt[corrupt.length - 1] ^= 1;
  for (const bytes of [
    corrupt,
    new Uint8Array(models.stroller),
    wrapEncryptedHero(encryptHeroPayload(new Uint8Array(32), master)),
    wrapEncryptedHero(encryptHeroPayload(gzipSync(new Uint8Array(MAX_HERO_BUNDLE_BYTES + 1), { level: 9 }), master)),
  ]) {
    writeFileSync(fixtureAsset, bytes);
    assert.throws(() => server.hasProtectedHeroScene(), /corrupt|size limit/);
    const failed = await assetRoute.POST(assetRequest(grants[0]), assetContext(grants[0]));
    assert.equal(failed.status, 503);
    checkPrivate(failed);
    assert.deepEqual(await failed.json(), { error: "Hero scene is unavailable." });
  }
  truncateSync(fixtureAsset, MAX_HERO_BUNDLE_BYTES + 33);
  assert.throws(() => server.hasProtectedHeroScene(), /size limit/);
  server.heroUnavailable(new Error(`Do not log this: ${grants[0].cookie}`));
  assert.ok(logs.some((line) => line.includes("Package and deploy")));
  for (const line of logs) {
    for (const secret of [master.toString("hex"), otherMaster.toString("hex"), "invalid-fixture-key", ...grants.flatMap((grant) => [grant.cookie, grant.key])]) {
      assert.equal(line.includes(secret), false, "Operational logs must not expose key or cookie values");
    }
  }
} finally {
  console.error = previousConsoleError;
  process.chdir(originalCwd);
  if (previousKey === undefined) delete process.env.HERO_ASSET_KEY;
  else process.env.HERO_ASSET_KEY = previousKey;
  hooks.deregister();
  rmSync(fixtureRoot, { recursive: true, force: true });
  master.fill(0);
  otherMaster.fill(0);
  signingKey.fill(0);
}

console.log("Hero delivery: authenticated encryption, strict signed grants, expiry/origin/id binding, HTTPS with exact loopback exceptions, scoped concurrent cookies, protected routes and safe configuration failures passed.");
