# Interactive stroller hero

Branch: `codex/interactive-stroller-hero`.

The actual stroller and Glowbaby CAD assembly now work in the local Three.js preview. The site uses three rendered posters of that assembly, with accessible mode buttons. Public WebGL remains disabled (`heroSceneConfig.assetsReady = false`) because the purchased stroller's license does not establish permission to distribute a retrievable GLB. This is a partial delivery of the original interactive-hero brief, not completed public WebGL acceptance.

## License conclusion

The supplied invoice identifies model 6931082, **Modern Baby Stroller Realistic Foldable Pram 3D Model**, seller **blackorgrey**, license **Royalty Free, No AI**. The invoice is not copied into the repository.

[CGTrader's terms](https://www.cgtrader.com/pages/terms-and-conditions), sections 21A.2, 21A.3 and 21B.1, allow rendered still/moving images and require commercially reasonable protection against access to geometry embedded in software. No AI carries the same royalty-free terms with an additional machine-learning/training restriction. A publicly served GLB would be directly retrievable; purchase alone does not establish permission for that delivery method. Rendered hero images are used instead. The original implementation brief also explicitly requires checking permission before public GLB delivery.

Ask the seller or CGTrader: "May I use model 6931082 in a commercial Glowbaby website WebGL hero? Visitors' browsers would download an optimized GLB that could be extracted. There would be no separate download button or resale. Please confirm permission for this delivery method or offer the appropriate custom license."

No stroller geometry, textures, invoice, receipt, or account information is tracked or served by the production site. The local preview binds only to 127.0.0.1.

## Assets and measured geometry

| Asset | Original bytes | Optimized bytes | Triangles | Primitives before / after |
| --- | ---: | ---: | ---: | ---: |
| Stroller | 20,178,104 | 1,769,296 | 199,831 | 2 / 2 |
| Glowbaby bottom | 1,871,264 | 415,200 | 50,305 | 803 / 1 |
| Glowbaby top | 44,444 | 8,324 | 1,040 | 29 / 1 |

Stroller source is `.local-assets/stroller-source.glb`; optimized copy is `.local-assets/stroller-optimized.glb`. The single node `polySurface1715` is translated by approximately (0.095024, -0.686888, 2.295369) m. Local bounds are X +/-0.203985 m, Y -0.004982 to 0.957095 m, Z -0.371235 to 0.362484 m. Runtime centers world X/Z bounds, grounds wheels and scales to 0.962 m height. Three embedded textures shrink from 4096 squared to 1024 squared WebP. The separately supplied texture archive is not loaded redundantly.

Body originals remain at `C:/Users/ha390/source/prototype_small_circle_body-bottom.glb` and `prototype_small_circle_body-top.glb`; private source copies and optimized preview copies are in `.local-assets/`. Authorized optimized body assets are in `public/models/hero/bottom.glb` and `top.glb`.

Measured bottom: 182.782 x 25 x 146.117 mm, node `whole_body_Cut001`, 49,600 position vertices. Measured top: 174.206 x 5 x 125.495 mm, node `Circle_Top_Body`, 1,062 position vertices. Bottom Y bounds are 0..25 mm; top 0..5 mm. Explicit top offset **25 mm** aligns its underside with the bottom's top. One shared X/Z base-center translation preserves source-relative alignment. Body triangle topology and small edge details are preserved. Joining compatible primitives cuts body draw calls from 832 to 2, without deleting faces.

## Scene configuration and implementation

`hero-section.tsx` keeps headline, copy and CTAs server rendered. `interactive-hero-media.tsx` owns posters, semantic mode buttons, selected states, live descriptions and capability gating. `stroller-hero-scene.ts` owns lazy Three.js loading, assembly, lights, shadows, interaction, resize and resource cleanup. Three.js is the sole added runtime dependency. Development tools: glTF Transform core/extensions/functions, Meshoptimizer, Sharp and Three types.

All artistic values live in `hero-scene-config.ts`:

- Assembly position: (0, 0.095, 0.065) m, zero rotation, unit scale. The purchased basket requires this artistic placement; it is not a certified physical mounting location.
- Two low-profile dark bands on the top suggest prototype straps, not final hardware.
- Channel centerline radii X **94 mm**, Z **75 mm**, Y **12 mm**. Outer profile **15.08 x 12.7 mm**, profile scale one. These radii place the light outside the actual base; earlier smaller radii hid it inside the CAD wall.
- Closed 192-segment custom sweep, flat foot and domed roof; full 360-degree continuity independent of base cutouts. Each of the two layers has 7,296 triangles. Profile represents the external envelope, not the manufacturing cavity.
- Milky transparent physical outer material over an inner angular-UV shader. Steady lavender, animated multicolor flow, steady amber. A 2.4-second activation pulse settles into the chosen mode. No per-LED components or draw calls.
- One nearby point light and a soft ground-spill shader; no full-screen bloom pass. Studio hemisphere/directional light, one 1024 squared shadow map, fog blending the floor into the lavender background.
- Camera (1.45, 0.59, 1.4) m, target (0, 0.43, 0), FOV 35 degrees. Damped inspection: +/-10 degrees yaw, +/-4 degrees pitch; no orbit or zoom; touch keeps vertical scrolling.
- Gating: width at least 900px, no reduced motion or explicit data saving/2G, at least 4 GB device memory when reported, WebGL2 available. Ineligible clients do not import 3D code or request GLBs. IntersectionObserver/document visibility pause rendering; DPR capped at 1.5. Failures retain the poster.

Local scene geometry totals about **266k triangles**, above the brief's preferred 150k budget. The low draw count is useful but is not a substitute for final integrated-GPU profiling. Further stroller simplification and visual comparison remain appropriate before public live rendering.

## Reproduction

```sh
node scripts/prepare-hero-assets.mjs .local-assets/stroller-source.glb .local-assets/stroller-optimized.glb --local-only
node scripts/prepare-hero-assets.mjs .local-assets/bottom-source.glb .local-assets/bottom.glb --local-only
node scripts/prepare-hero-assets.mjs .local-assets/top-source.glb .local-assets/top.glb --local-only
npm run hero:preview
```

Open `http://127.0.0.1:3010`. The viewer uses the same scene module as the website. It serves only three named local model files, scene modules and Three.js dependencies. It never serves the invoice. `?capture=1&mode=flow` (or `glow`, `visibility`) hides controls and freezes after 3.2 seconds. `&detail=1` isolates the assembly for inspection. After changing the preview server script itself, restart it; scene modules are read fresh on page reload.

Capture each full canvas at 1200x1068 actual screenshot pixels after `body[data-ready=true]`, save as `.local-assets/stroller-MODE.png`, then run `npm run hero:posters`. This encodes actual scene renders to `public/hero/stroller-render-MODE.webp` (about 56-58 KB each). These now replace the earlier SVG concept posters. Matching studio composition and mode-specific lighting are preserved across the three renders.

## Validation and outstanding work

- Typecheck, ESLint, production build and channel geometry checks pass (see commit/session for latest runs).
- Geometry tests verify closed seam positions/normals, finite values, correct envelope and valid triangle indices.
- Local browser successfully loaded all actual models; no captured console errors. Close-up reviewed top/base alignment, full diffuser loop and retained base details. Three mode renders were captured from the scene.
- Site fallback verified at desktop and mobile sizes; controls retain semantic pressed state and keyboard operation.
- Still pending: public live-WebGL rights, integrated-GPU performance profiling, all extreme inspection angles, model/context failure injection, reduced-motion/data-saver and visibility lifecycle checks with live assets enabled. The production site intentionally remains poster-based until permission is resolved.
- Product-owner review: approximate under-basket mounting, suggested straps, material finish, brightness and channel envelope. These are prototype visualization choices, not final product specifications.
