// Encode actual scene captures; never silently replace them with illustration placeholders.
// Run preview-hero.mjs, capture each /?capture=1&mode=MODE at 1200x1068 after
// body[data-ready=true], and save to .local-assets/stroller-MODE.png.
import fs from "node:fs/promises";
import sharp from "sharp";

await fs.mkdir("public/hero", { recursive: true });
for (const mode of ["flow", "glow", "visibility"]) {
  const source = `.local-assets/stroller-${mode}.png`;
  const meta = await sharp(source).metadata();
  if (meta.width !== 1200 || meta.height !== 1068) throw new Error(`Capture ${source} at 1200x1068 before encoding.`);
  await sharp(source).webp({ quality: 88 }).toFile(`public/hero/stroller-render-${mode}.webp`);
}
console.log("Encoded three rendered hero posters from the actual local assembly.");
