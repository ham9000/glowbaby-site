# Interactive stroller hero — implementation status

Branch: `codex/interactive-stroller-hero`.

The fallback and mode controls are integrated. **The requested finished 3D hero is not yet complete.** `heroSceneConfig.assetsReady` deliberately remains false. Enabling it requires the two actual Glowbaby body models, stroller web-delivery permission, a visually verified assembly, and matching scene-rendered posters. Do not interpret the concept illustration as a rendering of the supplied stroller.

## Available assets and missing inputs

- Supplied `StrollerGLB.zip` contains `GLB/Model.glb`; no license text, seller information, or attribution was included. Public interactive delivery permission is unverified. No supplied stroller geometry is in public or tracked by Git.
- Source copy: `.local-assets/stroller-source.glb` (20,178,104 bytes).
- Local optimization experiment: `.local-assets/stroller-optimized.glb` (1,769,296 bytes). Both files are ignored and remain local.
- `StrollerTexture.zip` contains base-color, metallic, normal and roughness PNGs plus Thumbs.db. The GLB already embeds three packed textures, so external textures are not loaded again.
- `prototype_small_circle_body-bottom.glb` and `prototype_small_circle_body-top.glb` were not found among the attachments or searched Downloads, Documents, and Dev folders. Actual bounds and assembly alignment cannot yet be verified.
- The video and dimensional profile remain at their supplied paths. Video stills used for inspection are ignored in `.local-assets/`.

## Source inspection and optimization

The stroller has one node (`polySurface1715`), one mesh with two primitives/materials, 117,030 position vertices, and 199,831 triangles. Local geometry bounds are X ±0.203985 m, Y -0.004982 to 0.957095 m, Z -0.371235 to 0.362484 m. Node translation is approximately (0.095024, -0.686888, 2.295369) m. Runtime normalization centers world bounds in X/Z, places the wheels at ground level, and scales to 0.962 m high.

Optimization deduplicates, welds, prunes, quantizes/Meshopt-compresses, and converts the three embedded 4096² textures to 1024² WebP. It preserves topology and the two materials; no draw-call or triangle reduction is claimed. The stroller remains above the brief's preferred 150k triangle budget. Visual comparison, further simplification if appropriate, and integrated-GPU profiling are pending.

```sh
node scripts/prepare-hero-assets.mjs .local-assets/stroller-source.glb .local-assets/stroller-optimized.glb --local-only
# Only once rights are verified, run for each source:
node scripts/prepare-hero-assets.mjs INPUT.glb public/models/hero/stroller.glb --web-delivery-permitted
```

Delivery filenames are `stroller.glb`, `bottom.glb`, and `top.glb` in `public/models/hero/`. Do not place original archives or unoptimized models in public. Keep license evidence without purchase receipts or account details in this documentation directory once available.

## Implementation

- `hero-section.tsx` preserves the server-rendered headline, copy, links and CTA.
- `interactive-hero-media.tsx` renders immediate next/image posters, semantic buttons, selected states, live descriptions, and capability-based dynamic import. Runtime, import, asset-load, and context-loss failures retain the poster.
- `stroller-hero-scene.ts` owns Three.js loading, studio lights, assembly, restrained pointer/drag inspection, resize handling, animation and resource disposal. Three.js is the only added runtime dependency; React Three Fiber and postprocessing frameworks are unnecessary here.
- `glowbaby-channel.ts` builds an independent, closed 192-segment sweep with a flat-footed domed profile. An inner shader-driven emissive surface sits under a milky transparent physical material. Angular UVs animate the complete circumference without per-LED draw calls. A 2.4-second traveling activation settles into the selected mode. Warm amber and lavender are steady; color flow animates smoothly. A point light and soft ground-spill shader provide glow without a full-screen bloom pass.
- `hero-scene-config.ts` groups all artistic transforms. Starting assembly position is (0, 0.17, 0.025) m, rotation zero, scale one; top Y offset is 0.025 m. X/Z use a shared base-center reference. These are **unverified starting values**, not established fit measurements.
- Channel centerline radii: X 85 mm, Z 67 mm; vertical offset 8 mm; outer profile 15.08 × 12.7 mm, scale one. It approximates the external envelope, not the internal manufacturing cavity. Source edge gaps will remain untouched when body GLBs arrive.
- Camera: (1.15, 0.67, 1.65) m, target (0, 0.43, 0), FOV 35°. Damped inspection limits ±10° yaw, ±4° pitch. No zoom or free orbit; touch permits vertical page scrolling.
- Canvas gating: width ≥900px, no reduced motion, no explicit data saver/2G, ≥4GB device memory when reported, usable WebGL2. No heavy imports occur when initial eligibility fails. IntersectionObserver and document visibility pause rendering. DPR ≤1.5, one 1024² shadow map.

## Posters

`node scripts/hero-poster.mjs` rasterizes the site's original authored SVG illustration with React and Sharp. It produces three 1280×1040 concept WebPs in `public/hero/`: flow 25,400 bytes; glow 24,842 bytes; visibility 25,868 bytes. This is temporary fallback artwork, **not matching captures of the purchased model**. Replace all three with completed-scene captures after final model integration; then enable assetsReady.

## Verification and remaining work

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run hero:check`: passed for both inner/outer loops; verifies seam closure, seam normals, profile envelope, finite values and valid triangle indices. Each layer has 7,296 triangles.
- `npm run build`: passed (all 14 static pages). The first sandbox attempt failed to fetch the existing Google font; the network-enabled build passed.
- Desktop browser at 1440×1000: hero content, fallback and mode controls rendered; Visibility selected state and amber poster checked; no captured console errors.
- Mobile browser at 390×844: stacked responsive layout and keyboard activation of Glow checked.
- Full interactive rendering, live mode shader appearance, mounting, failure injection, reduced-motion/data-saver behavior with assets enabled, scene poster capture, and frame-rate/draw-call measurements are still unverified. No claim of completed WebGL acceptance testing is made.

Next inputs needed: actual body GLBs and the stroller source/license. Then inspect CAD, integrate authorized delivery assets, tune mounting/materials against video, verify every inspection angle, render matching mode posters, enable progressive enhancement, and execute all requested fallback/performance scenarios.
