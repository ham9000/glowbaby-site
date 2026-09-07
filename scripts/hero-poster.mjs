// Temporary concept posters from the site's existing, authored stroller illustration.
// Replace with completed-scene captures when licensed assets and body files are available.
import fs from "node:fs/promises";
import ts from "typescript";
import sharp from "sharp";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const source = await fs.readFile("src/components/stroller-graphic.tsx", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
// Import relative to this project so the generated module can resolve React.
await fs.mkdir(".local-assets", { recursive: true });
await fs.writeFile(".local-assets/poster-component.mjs", `import React from 'react';\n${code}`);
const { StrollerGraphic } = await import("../.local-assets/poster-component.mjs");
const svg = renderToStaticMarkup(createElement(StrollerGraphic, { width: 1280, height: 1040, showController: false }));
await fs.mkdir("public/hero", { recursive: true });
for (const mode of ["flow", "glow", "visibility"]) {
  const color = mode === "visibility" ? "#ffb84a" : "#b18aff";
  const output = mode === "flow" ? svg : svg.replace(/#(?:67ddff|b18aff|ffc3b2|19bff2|b695ff|f5b4a4|a57aff|c8dcff)/gi, color);
  await sharp(Buffer.from(output)).flatten({ background: "#eeeafd" }).webp({ quality: 86 }).toFile(`public/hero/stroller-${mode}.webp`);
}
console.log("Generated three concept posters; these are not captures of the supplied 3D model.");
