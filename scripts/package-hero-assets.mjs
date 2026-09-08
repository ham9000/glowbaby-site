import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";
import { execFileSync } from "node:child_process";
import { gunzipSync, gzipSync } from "node:zlib";
import { HERO_MODEL_KEYS, MAX_HERO_BUNDLE_BYTES, packHeroModels, unpackHeroModels, wrapEncryptedHero, unwrapEncryptedHero } from "../src/lib/hero-asset-format.ts";
import { decodeHeroKey, encryptHeroPayload, decryptHeroPayload } from "../src/lib/hero-asset-crypto.ts";

const options = process.argv.slice(2);
if (options.some((option) => option !== "--init-key") || options.length > 1) {
  throw new Error("Usage: npm run hero:package [-- --init-key]. Originals remain private; output is an encrypted application bundle.");
}
const models = {};
for (const name of HERO_MODEL_KEYS) {
  const filename = name === "stroller" ? "stroller-optimized.glb" : `${name}.glb`;
  models[name] = Uint8Array.from(await fs.readFile(path.join(".local-assets", filename))).buffer;
}
const bundle = packHeroModels(models);
const envFile = path.resolve(".env.local");
let contents = "";
try { contents = await fs.readFile(envFile, "utf8"); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const localEnvironment = parseEnv(contents);
let configuredKey = process.env.HERO_ASSET_KEY ?? localEnvironment.HERO_ASSET_KEY;
if (configuredKey === undefined) {
  if (!options.includes("--init-key")) throw new Error("Set server-only HERO_ASSET_KEY or run npm run hero:package -- --init-key to create an ignored local key.");
  // Refuse to create a secret unless Git already excludes its exact destination.
  execFileSync("git", ["check-ignore", "--quiet", "--", ".env.local"], { stdio: "pipe" });
  configuredKey = randomBytes(32).toString("hex");
  const separator = contents.length && !contents.endsWith("\n") ? "\n" : "";
  await fs.appendFile(envFile, `${separator}HERO_ASSET_KEY=${configuredKey}\n`, { mode: 0o600 });
  console.log("Created a server-only HERO_ASSET_KEY in ignored .env.local. Keep it private and configure it on your deployment host.");
}
const key = decodeHeroKey(configuredKey);
try {
  const compressed = gzipSync(new Uint8Array(bundle), { level: 9 });
  const envelope = wrapEncryptedHero(encryptHeroPayload(compressed, key));
  const verified = gunzipSync(decryptHeroPayload(unwrapEncryptedHero(envelope), key), {
    maxOutputLength: MAX_HERO_BUNDLE_BYTES,
  });
  const unpacked = unpackHeroModels(Uint8Array.from(verified).buffer);
  for (const name of HERO_MODEL_KEYS) {
    if (!Buffer.from(unpacked[name]).equals(Buffer.from(models[name]))) throw new Error(`Encrypted ${name} did not round-trip unchanged`);
  }
  const destination = path.join("assets", "hero", "scene.gbe");
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    await fs.writeFile(temporary, envelope, { flag: "wx" });
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  console.log(`Packaged ${HERO_MODEL_KEYS.length} models into ${destination}: ${envelope.byteLength} compressed encrypted bytes, no public GLB or embedded master key.`);
} finally {
  key.fill(0);
}
