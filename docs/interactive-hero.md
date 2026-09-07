# Interactive stroller hero

Branch: `codex/interactive-stroller-hero`.

The hero now focuses on the actual Glowbaby CAD assembly beneath the stroller, seen from a low three-quarter angle over a concrete sidewalk at dusk. The site uses three matching rendered posters with accessible mode buttons. The same scene works in the local Three.js preview. Public WebGL remains disabled (`heroSceneConfig.assetsReady = false`) because the purchased stroller's license does not establish permission to distribute a retrievable GLB. Public interactive delivery remains license-blocked.

## License conclusion

The supplied invoice identifies model 6931082, **Modern Baby Stroller Realistic Foldable Pram 3D Model**, seller **blackorgrey**, license **Royalty Free, No AI**. The invoice is not copied into the repository.

[CGTrader's terms](https://www.cgtrader.com/pages/terms-and-conditions), sections 21A.2, 21A.3 and 21B.1, allow rendered still/moving images and require commercially reasonable protection against access to geometry embedded in software. No AI carries the same royalty-free terms with an additional machine-learning/training restriction. A publicly served GLB would be directly retrievable; purchase alone does not establish permission for that delivery method. Rendered hero images are used instead. The original implementation brief also explicitly requires checking permission before public GLB delivery.

Ask the seller or CGTrader: "May I use model 6931082 in a commercial Glowbaby website WebGL hero? Visitors' browsers would download an optimized GLB that could be extracted. There would be no separate download button or resale. Please confirm permission for this delivery method or offer the appropriate custom license."

No stroller geometry, textures, invoice, receipt, or account information is tracked or served by the production site. The local preview binds only to 127.0.0.1.

## Assets and measured geometry

| Asset | Original bytes | Optimized bytes | Triangles | Primitives before / after |
| --- | ---: | ---: | ---: | ---: |
| Stroller | 20,178,104 | 870,980 | 74,999 | 2 / 2 |
| Glowbaby bottom | 1,871,264 | 415,200 | 50,305 | 803 / 1 |
| Glowbaby top | 44,444 | 8,324 | 1,040 | 29 / 1 |

Stroller source is `.local-assets/stroller-source.glb`; optimized copy is `.local-assets/stroller-optimized.glb`. The single node `polySurface1715` is translated by approximately (0.095024, -0.686888, 2.295369) m. Local bounds are X +/-0.203985 m, Y -0.004982 to 0.957095 m, Z -0.371235 to 0.362484 m. Runtime centers world X/Z bounds, grounds wheels and scales to 0.962 m height. Three embedded textures shrink from 4096 squared to 1024 squared WebP. The separately supplied texture archive is not loaded redundantly.

The explicit 75,000-triangle stroller target reduces its original 199,831 triangles with attribute-aware Meshopt simplification. Material boundaries, UV seams, borders and bounding extrema are retained. The measured relative appearance error is 0.000930, below the configured 0.001 limit; the output bounds match the previous optimized stroller. Insufficient tolerance fails before overwriting the output. Omitting the target preserves triangle counts, as required for both actual Glowbaby CAD parts.

Body originals remain at `C:/Users/ha390/source/prototype_small_circle_body-bottom.glb` and `prototype_small_circle_body-top.glb`; private source copies and optimized preview copies are in `.local-assets/`. Authorized optimized body assets are in `public/models/hero/bottom.glb` and `top.glb`.

Measured bottom: 182.782 x 25 x 146.117 mm, node `whole_body_Cut001`, 49,600 position vertices. Measured top: 174.206 x 5 x 125.495 mm, node `Circle_Top_Body`, 1,062 position vertices. Bottom Y bounds are 0..25 mm; top 0..5 mm. Explicit top offset **25 mm** aligns its underside with the bottom's top. One shared X/Z base-center translation preserves source-relative alignment. Body triangle topology and small edge details are preserved. Joining compatible primitives cuts body draw calls from 832 to 2, without deleting faces.

## Scene configuration and implementation

`hero-section.tsx` keeps headline, copy and CTAs server rendered. On narrow layouts its semantic order is headline, product image/controls, then supporting copy/CTAs; desktop places the image beside the copy without duplicating content or rearranging keyboard focus with CSS ordering. `interactive-hero-media.tsx` owns posters, semantic mode buttons, selected states, live descriptions and capability gating. `stroller-hero-scene.ts` owns lazy Three.js loading, assembly, lights, shadows, interaction, resize and resource cleanup. Three.js is the sole added runtime dependency. Development tools: glTF Transform core/extensions/functions, Meshoptimizer, Sharp and Three types.

All artistic values live in `hero-scene-config.ts`:

- Assembly position: (0, 0.1402, 0.065) m, zero rotation, unit scale. Vertical samples of the actual optimized basket put its underside at approximately 173.6-177.0 mm across the mounting footprint. The assembly is raised 45.2 mm from the earlier floating position; the existing strap tops reach 173.2 mm and meet the basket near the front of the footprint. CAD dimensions remain unchanged. This visual mounting relationship is not a final hardware specification.
- Two low-profile dark bands on the top suggest prototype straps, not final hardware.
- Channel centerline radii X **94 mm**, Z **75 mm**, Y **12 mm**. Outer profile **15.08 x 12.7 mm**, profile scale one. These radii place the light outside the actual base; earlier smaller radii hid it inside the CAD wall.
- Closed 192-segment custom sweep, flat foot and domed roof; full 360-degree continuity independent of base cutouts. Each layer has 7,296 triangles. Profile represents the external envelope, not the manufacturing cavity. `channel.rotation` rotates the actual oval about Y, rather than just shifting angular sampling.
- Milky transparent physical outer material (opacity 0.12) over an inner angular-UV shader. Steady lavender, animated multicolor flow, steady amber. A 2.4-second activation pulse settles into the chosen mode. The `emission` values directly drive shader uniforms. No per-LED components or draw calls.
- Dusk background `environment.background = #171827`. Neutral sky/key/rim lighting keeps the stroller readable without colored light appearing inside the basket. The key and rim lights cast no overhead silhouette shadows.
- Broad overlapping downward cones approximate one continuous diffuser instead of three outward-pointing beams. Each perimeter sample aims straight down with an 88-degree half-angle, a 2-degree margin below the horizon, and zero distance-decay exponent; this intentionally models an even area-light appearance rather than point-source photometry. Total intensity 0.9, range 1.6 m, penumbra 0.15. Their 512 squared shadow maps are reused while geometry is static; shadows originate beneath the stroller, never from the overhead fill.
- A separate 1.8 x 1.55 m floor-only spill supplies the continuous all-around footprint (opacity 0.7, brightness 0.95). Its broad radial profile has a filled center and a gentle outer fade, removing the former isolated hotspots. Color flow is a smooth color gradient, not separate pools of brightness. Concrete detail remains visible. Faint wheel-contact patches (opacity 0.14) are derived from actual near-ground geometry, not a projected stroller outline.
- Concrete sidewalk: one two-triangle plane with procedural grain, mottling, roughness variation and shallow 6 mm joints between 1.15 x 1.35 m slabs. No extra texture downloads or dense pavement geometry.
- Camera (0.48, 0.235, 0.56) m, target (0, 0.12, 0.065), FOV 38 degrees. The actual device is the focal point; lower frame, basket and wheels provide stroller context. Device dimensions are not enlarged. Damped camera-only inspection is limited to +/-7.5 degrees yaw and +/-2 degrees pitch, so the stroller remains grounded. Dragging preserves the existing hover angle; touch keeps vertical scrolling.
- Gating: width at least 900px, no reduced motion or explicit data saving/2G, at least 4 GB device memory when reported, WebGL2 available. Ineligible clients do not import 3D code or request GLBs. IntersectionObserver/document visibility pause rendering; DPR capped at 1.5. Failures retain the poster.

The three models plus both channel layers total **140,936 triangles**, before the small floor, strap and contact meshes: approximately **141k** for the scene, below the preferred 150k geometry budget and down from about 266k. Combined optimized model files are **1,294,504 bytes**. Shadow rendering still has a runtime cost; the geometry budget is not an FPS guarantee.

A dedicated loading manager catches texture failures even when Three.js resolves a model with a missing texture. Model, texture, shader and context failures retain the website poster. Partial initialization and normal disposal release owned meshes/materials/textures, shadows, renderer, observers and input listeners.

## Reproduction

```powershell
node scripts\prepare-hero-assets.mjs .local-assets\stroller-source.glb .local-assets\stroller-optimized.glb --local-only --target-triangles 75000 --simplify-error 0.001
node scripts\prepare-hero-assets.mjs .local-assets\bottom-source.glb .local-assets\bottom.glb --local-only
node scripts\prepare-hero-assets.mjs .local-assets\top-source.glb .local-assets\top.glb --local-only
npm run hero:preview
npm run hero:posters
```

Open `http://127.0.0.1:3010`. The viewer uses the same scene module as the website. It serves only three named local model files, scene modules and Three.js dependencies. It never serves the invoice. `?capture=1&mode=flow` (or `glow`, `visibility`) hides controls and calls `renderStill()` at a fixed simulation time of 3.2 seconds with neutral inspection. Capture no longer depends on frame rate or a wall-clock timeout. `&detail=1` isolates the assembly for inspection. After changing the preview server script itself, restart it; scene modules are read fresh on page reload. `HERO_PREVIEW_PORT` can select another local port.

`npm run hero:posters` now captures and encodes all three modes directly from the current scene; it never just re-encodes old PNGs. It starts an isolated loopback preview on an available port and an installed headless Edge/Chromium browser with a temporary private profile. Node.js 22+ is required; Edge and Chrome are detected on Windows, or set `HERO_BROWSER_PATH` to an installed Chromium executable. No browser or dependency is downloaded.

All three fresh 1200x1072 renders must succeed before any poster is replaced. Model, texture, renderer and context failures invalidate capture readiness, including a failure occurring during the screenshot. Raw PNGs are saved to `.local-assets/stroller-MODE.png`; optimized WebPs go to `public/hero/stroller-render-MODE.webp` (flow 55,190 bytes, glow 52,488 bytes, amber 53,166 bytes for this scene). The command closes its own browser/server and removes its temporary profile. Rerun it whenever geometry, camera, materials or lighting change. Static image imports fingerprint the actual new bytes.

## Validation and outstanding work

- `npm run validate` runs TypeScript, ESLint and the production build.
- `npm run hero:check` covers closed seam positions/normals, actual oval rotation at multiple angles/scales, shader tuning, optimizer budgets/default CAD topology/materials/UVs/source privacy, and successful/failed capture readiness.
- `npm run hero:posters` loads and GPU-renders all actual models in each mode, refusing shader or initialization errors. The current three posters come from this command, not older captures.
- Fixed-time PNG comparison shows the sampled basket region is pixel-identical across all three modes while the illuminated sidewalk changes substantially. Colored illumination no longer reaches the upper basket/interior.
- Still pending: public live-WebGL rights, broad device/GPU profiling and public width/data-saver/visibility lifecycle exercise with authorized live assets. Local preview success does not remove the licensing gate or establish physical-device photometry.
- Product-owner review: approximate under-basket mounting, suggested straps, material finish, brightness and channel envelope. These are prototype visualization choices, not final product specifications.

## Real-stroller photo refinement

The supplied undercarriage photograph shows a horizontal diffuser below the basket's lower frame, with different colors illuminating the wheels, frame and ground simultaneously. The visible portion supports that orientation but does not establish the full attachment method or precise dimensions on the purchased stroller. Mounting and strap details remain provisional.

The final close-up uses that undercarriage relationship while restricting all colored light to downward/outward cones and the sidewalk. The prominent overhead shadow is removed; faint contact grounding and device-origin shadows remain. Concrete detail stays visible in the broader, brighter-looking glow. The reference informs qualitative color separation and appearance, not measured luminous output, weather resistance or final mounting hardware.
