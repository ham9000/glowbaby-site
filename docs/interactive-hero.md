# Interactive stroller hero

Branch: `codex/interactive-stroller-hero`.

The homepage keeps **Visibility works both ways** as a static, wide view of the stroller and warm amber light on the ground. A smaller device-only render replaces the former system-parts list. Neither section mounts the 3D viewer or requests protected model delivery.

The product page introduces the device in **Meet the light**, directly after the illustrated hero, then places the interactive scene below the setup steps in **See it beneath the stroller**. Two matching rendered fallbacks and accessible mode buttons appear immediately, ordered **Visibility**, **Gradient**. When protected delivery is configured, supported devices enhance automatically with no 3D switch; unsupported or failed clients keep the 2D render. Mouse and touch users drag in either direction inside the scene; page scrolling starts outside it. Releasing the scene returns it gently to its original view. The viewer is capped at 46rem, and the controls panel ends with the visible backdrop so the stroller breakout remains visually separate. The same scene works in the private local preview.

The reusable `device-render.tsx` displays the actual prototype in a static three-quarter view and labels it **Prototype render · Design in development**. Product features come from the shared `platformParts` data: wraparound light, an internal rechargeable LiPo battery, and Bluetooth app control. These are not runtime, fit, or measured light-output specifications.

## Night park art direction

The full-stroller hero camera is slightly farther back and farther to the side, keeping the wheels within the organic crop and revealing more of the under-basket device. Stroller base colors are desaturated in the material shader while preserving the original textures, stitching, geometry and mounting dimensions. Cooler ambient light and a restrained warm key keep the upholstery readable after dark.

`public/hero/night-park-environment.webp` is an AI-generated scenery-only panorama used as the softly blurred background and reflection environment. No stroller or product geometry was sent to image generation. The rendered concrete foreground fades into the panorama at a distance. The environment loads only with the 3D scene; the initial hero remains a single small static WebP. A failed environment load retains the existing poster fallback.

The colored floor spill now has a subdued, desaturated center, broader coverage and feathered edges. Lower direct-light intensity and softer cones reduce concentrated color hotspots. These are visual treatments, not measured light output. Regenerate all five posters after changing the shared scene so the interactive and static versions stay consistent.

The next local lighting pass expands the spill to 2.7 × 2.45 meters, raises its brightness and shortens the outer fade and subdued center. A directional warm park light now casts filtered self-shadows and a ground shadow, with a weaker cool fill so the stroller has shaded recesses and localized highlights. The shared shadow maps still update only when required, rather than on each animation frame.

The foreground concrete uses larger 2.1 × 2.35 meter slabs, finer joints, a cooler gray base, and procedural aggregate and pores shared by the surface and colored spill. This approximates the panorama's pavement without baking its lighting into the foreground. The park-light shadow is reduced to 55% intensity with a wider filter, retaining wheel contact grounding.

## License and asset protection

The supplied invoice identifies model 6931082, **Modern Baby Stroller Realistic Foldable Pram 3D Model**, seller **blackorgrey**, license **Royalty Free, No AI**. The invoice is not copied into the repository.

[CGTrader's terms](https://www.cgtrader.com/pages/terms-and-conditions), sections 21A.2, 21A.3 and 21B.1, permit incorporated commercial uses, including software examples, while requiring commercially reasonable protection against standalone asset retrieval. No AI carries an additional machine-learning/training restriction. Purchase does not authorize unrestricted redistribution of the source model.

The interactive implementation combines the stroller and Glowbaby parts into an encrypted application bundle, keeps the master key server-only, and requires short-lived same-origin delivery grants. It exposes neither a public stroller GLB nor a model download control. These measures deter direct downloads and hotlinking; they are not legal certification or extraction-proof DRM. A determined viewer can recover geometry that their browser must render. The applicable purchase agreement and licensor's interpretation remain authoritative.

Unencrypted purchased geometry, textures, source archives, and purchase/account documents remain private and untracked. Only the encrypted application artifact is included for deployment, outside `public`. The local plaintext preview binds only to 127.0.0.1.

## Protected delivery setup

Use Node.js **22.18+** (or Node 24) for the native-TypeScript development scripts. With the three optimized models already in `.local-assets`, run:

```powershell
npm run hero:package -- --init-key
npm run dev
```

The first command creates a random 32-byte `HERO_ASSET_KEY` in Git-ignored `.env.local` if no key is configured, then writes `assets\hero\scene.gbe`. It does not print the key, modify the original models, or put a stroller GLB in `public`. Subsequent `npm run hero:package` runs reuse the configured key and verify a lossless encrypt/decrypt round trip before replacing the artifact. Do not commit `.env.local` or put the key in a `NEXT_PUBLIC_` variable.

Configure the **same server-only `HERO_ASSET_KEY`** on the deployment host at build and runtime; it is exactly 64 hexadecimal characters. The encrypted artifact is included in both API routes' Next.js output traces. No key means the normal poster-only experience. A configured but invalid key, missing artifact, or authentication failure is a configuration error, not a successful live setup. To rotate the master key, repackage and deploy the new artifact together with the new key.

The delivery sequence is:

1. `POST /api/hero/session` requires a matching `Origin` and `x-glowbaby-viewer: 1`. It issues a 90-second signed HttpOnly, SameSite=Strict cookie scoped to a unique asset path, and returns that path plus a per-grant decryption key.
2. `POST /api/hero/asset/[id]` requires the same origin/intent, matching `x-glowbaby-grant`, and valid scoped cookie. It returns an AES-256-GCM envelope and clears that path's cookie. GET is not an asset delivery method.
3. WebCrypto decrypts the response in memory. After access validation, the Three.js scene module loads in parallel with protected model delivery; the client then validates all three self-contained GLBs before scene creation. No keys or models are persisted in browser storage.

Responses are private/no-store, same-origin-only, and nosniff. HTTPS is required except on local loopback. Different per-grant cookie paths let concurrent tabs load independently. Clearing a cookie is not distributed single-use enforcement: captured credentials can be replayed within their lifetime. Origin/intent checks prevent ordinary cross-site browser use, not requests forged by an automated client. Anonymous visitors are intended viewers, not authenticated model owners.

At rest, the `GBE1` envelope contains a 12-byte IV, authenticated ciphertext, and 16-byte tag. The encrypted payload is a gzip-compressed `GBH1` bundle containing three length-delimited embedded GLBs; compression happens before encryption to reduce private transfer size, and browser decompression is bounded to the same 5 MiB budget. External texture/buffer URLs and malformed framing are rejected. Delivery uses a distinct per-grant key rather than exposing the at-rest master key. CSP permits `blob:` image fetches and narrowly allows WebAssembly compilation (`wasm-unsafe-eval`) for Meshopt; JavaScript `unsafe-eval` remains development-only.

## Assets and measured geometry

| Asset | Original bytes | Delivered bytes | Triangles | Primitives before / after |
| --- | ---: | ---: | ---: | ---: |
| Stroller | 20,178,104 | 589,560 | 74,999 | 2 / 2 |
| Glowbaby bottom | 1,871,264 | 806,280 | 49,957 | 803 / 1 |
| Glowbaby top | 44,444 | 7,300 | 1,040 | 29 / 1 |

Stroller source is `.local-assets/stroller-source.glb`; optimized copy is `.local-assets/stroller-optimized.glb`. The single node `polySurface1715` is translated by approximately (0.095024, -0.686888, 2.295369) m. Local bounds are X +/-0.203985 m, Y -0.004982 to 0.957095 m, Z -0.371235 to 0.362484 m. Runtime centers world X/Z bounds, grounds wheels and scales to 0.962 m height. Three embedded textures shrink from 4096 squared to 512 squared WebP, matching the hero's displayed scale. The separately supplied texture archive is not loaded redundantly.

The explicit 75,000-triangle stroller target reduces its original 199,831 triangles with attribute-aware Meshopt simplification. Material boundaries, UV seams, borders and bounding extrema are retained. The measured relative appearance error is 0.000930, below the configured 0.001 limit; the output bounds match the previous optimized stroller. Insufficient tolerance fails before overwriting the output. Omitting the target preserves triangle counts, as required for both actual Glowbaby CAD parts.

Body originals remain at `C:/Users/ha390/source/prototype_small_circle_body-bottom.glb` and `prototype_small_circle_body-top.glb`; private source copies and optimized preview copies are in `.local-assets/`. Authorized optimized body assets are in `public/models/hero/bottom.glb` and `top.glb`.

The approved bottom revision is generated by `scripts\clean-bottom-preview.mjs`. It fills the three +Z side ports and removes the middle projecting ledge, preserving the separate upper strap loops, retaining rails, opposite-side aperture, and interior geometry. The source-hash-locked repair closes seven wall boundaries with 22 triangles and preserves all 49,935 unrelated triangles and vertex attributes. The lossless GLB is 806,280 bytes; identical approved device files are used by the local preview, public device copies, and protected 3D package. The hero and both mode posters are rendered from this revision. Removing the ledge changes the bottom's bounding-box Z center from +0.858393 to -0.434149 mm; the lid and channel follow the body's shared centering adjustment.

Measured source bottom: 182.782 x 25 x 146.117 mm, node `whole_body_Cut001`, 49,600 position vertices. Measured source top: 174.206 x 5 x 125.495 mm, node `Circle_Top_Body`, 1,062 position vertices. Bottom Y bounds are 0..25 mm; top 0..5 mm. `glowbaby-model.ts` flips the lid about its own X-axis so the authored flat underside faces up, retaining the shared X/Z base-center alignment. The lid's 2 mm locating ribs insert below the **25 mm** seating plane; the broad plate rests on the rim rather than hovering above it. The lid geometry and source files remain unchanged.

## Scene configuration and implementation

`hero-section.tsx` keeps the headline, copy, CTAs, and illustrated hero server rendered. `principles-section.tsx` uses the wide Visibility-mode still; `platform-section.tsx` reuses the device-only still in a compact light-and-app introduction. `product-device-section.tsx` provides the larger device close-up and shared feature copy. `product-stroller-section.tsx` owns placement of the gated interactive viewer on the product page. `interactive-hero-media.tsx` owns fallback posters, semantic mode buttons, selected states, live descriptions and capability gating. `stroller-hero-scene.ts` owns lazy Three.js loading, assembly, lights, shadows, interaction, resize and resource cleanup. Three.js is the sole added runtime dependency. Development tools: glTF Transform core/extensions/functions, Meshoptimizer, Sharp and Three types.

All artistic values live in `hero-scene-config.ts`:

- Assembly position: (0, 0.1417, 0.065) m, zero rotation, unit scale. Vertical samples of the actual optimized basket put its underside at approximately 172.7-176.7 mm across the attachment bands' footprints. Raising the approved assembly by 1.5 mm brings the strap tops to 172.7 mm, meeting the basket after the flat-side-up lid correction without changing device proportions. This visual mounting relationship is not a final hardware specification.
- Two low-profile dark bands on the top suggest prototype straps, not final hardware. They rest on the upward-facing flat lid. The printed bottom is black; the diffuser keeps its separate milky-white material.
- The channel continues the housing's **87.2 mm circular end radius** all the way around, retaining the fitted top/bottom extent while expanding the sides into a true circle. It does not copy the body's flat faces. The centerline is offset by half the tube depth plus **0.15 mm** nominal end-wall clearance. The original **15.08 x 12.7 mm** tube profile remains sideways: **12.7 mm radial depth and 15.08 mm vertical height**, flat back inward and rounded face outward. Its vertical center stays at **9.784 mm**, with the lower edge at **2.244 mm**, below the mounting tabs. Its source-centered X/Z position follows the same translation as the body. The emitter is inset 1 mm within the diffuser.
- Closed 192-segment custom sweep; the semicircular face points along the outward normal of the fitted outline, not up. Each layer has 7,296 triangles and full 360-degree continuity independent of ports and tabs. Profile represents the external envelope, not the manufacturing cavity. `channel.rotation` rotates the whole outline about Y, rather than just shifting angular sampling.
- Milky transparent physical outer material (opacity 0.12) over an inner angular-UV shader. Visibility is steady amber; Gradient retains the animated multicolor blend (internal ID `flow`) and rotates at `colorRotationSpeed`. A 2.4-second activation pulse settles into the chosen mode. Emission tuning directly reaches the shaders and sampled lights. No per-LED components or draw calls.
- Gradient keeps the specified six-color palette. `gradientStops` controls its spacing: yellow-to-green spans 13% of a revolution, followed by an 18% green hold. Smoothstep interpolation of the encoded sRGB values avoids the abrupt yellow-to-green boundary before converting back to linear light. The channel shader and sampled lights share the stop positions and interpolation.
- Dusk background `environment.background = #171827`. Neutral sky/key/rim lighting keeps the stroller readable without colored light appearing inside the basket. The key and rim lights cast no overhead silhouette shadows.
- Broad overlapping downward cones approximate one continuous diffuser instead of three outward-pointing beams. Each perimeter sample aims straight down with an 88-degree half-angle, a 2-degree margin below the horizon, and zero distance-decay exponent; this intentionally models an even area-light appearance rather than point-source photometry. Total intensity 0.9, range 1.6 m, penumbra 0.15. Their 512 squared shadow maps are reused while geometry is static; shadows originate beneath the stroller, never from the overhead fill.
- A separate 1.8 x 1.55 m floor-only spill supplies the continuous all-around footprint (opacity 0.7, brightness 0.95). Its broad radial profile has a filled center and a gentle outer fade, removing the former isolated hotspots. Color flow is a smooth color gradient, not separate pools of brightness. Concrete detail remains visible. Faint wheel-contact patches (opacity 0.14) are derived from actual near-ground geometry, not a projected stroller outline.
- Concrete sidewalk: one two-triangle plane with procedural grain, mottling, roughness variation and shallow 6 mm joints between 1.15 x 1.35 m slabs. No extra texture downloads or dense pavement geometry.
- Camera (0.48, 0.235, 0.56) m, target (0, 0.12, 0.065), FOV 38 degrees. The actual device is the focal point; lower frame, basket and wheels provide stroller context. Device dimensions are not enlarged. Camera-only dragging is limited to +/-7.5 degrees yaw and +/-2 degrees pitch, so the stroller remains grounded. Hover alone does not move it. Release eases back over roughly a second; re-grabbing preserves the current angle. Mouse dragging inspects both axes. Touch dragging inspects yaw horizontally, while `touch-action: pan-y pinch-zoom` preserves vertical page scrolling and native pinch zoom.
- Gating: server delivery configured, no reduced motion or explicit data saving/2G, at least 4 GB device memory when reported, secure WebCrypto, gzip decompression, and WebGL2 available. Supported mouse and touch devices begin enhancement when the viewer is visible. After the small access check succeeds, encrypted model delivery runs in parallel with the Three.js scene import. Ineligible clients do not import 3D code or request protected payloads. IntersectionObserver/document visibility pause rendering; DPR capped at 1.5. Unsupported devices and failures retain the selectable 2D posters.

The approved three models plus both channel layers total **140,588 triangles**, before the small floor, strap and contact meshes: approximately **141k** for the scene, below the preferred 150k geometry budget and down from about 266k. The GLBs total **1,403,140 bytes**, including lossless Meshopt encoding for the repaired bottom and 512 px stroller textures. Gzip-before-encryption reduces the protected delivery artifact to **766,243 bytes**. The existing server-only key is unchanged. Shadow rendering still has a runtime cost; the geometry budget is not an FPS guarantee.

A dedicated loading manager catches texture failures even when Three.js resolves a model with a missing texture. Model, texture, shader and context failures retain the website poster. Partial initialization and normal disposal release owned meshes/materials/textures, shadows, renderer, observers and input listeners.

## Reproduction

For future model-only reviews, use the local preview without running `hero:posters` or `hero:package`. After approval, promote the device copies and regenerate both the protected delivery artifact and website posters together.

The visual viewport disables text selection, native image dragging, and long-press menus/tap highlights. These restrictions do not extend to the mode controls, captions, or surrounding page text. Mouse users drag in either direction. On touch screens, horizontal gestures inspect the scene while vertical gestures scroll the page directly through the viewer.

```powershell
node scripts\prepare-hero-assets.mjs .local-assets\stroller-source.glb .local-assets\stroller-optimized.glb --local-only --target-triangles 75000 --simplify-error 0.001 --texture-size 512
node scripts\clean-bottom-preview.mjs
node scripts\prepare-hero-assets.mjs .local-assets\top-source.glb .local-assets\top.glb --local-only
npm run hero:preview
```

After approving the local model, publish only the owned device GLBs; the purchased stroller stays private:

```powershell
Copy-Item .local-assets\bottom.glb public\models\hero\bottom.glb
Copy-Item .local-assets\top.glb public\models\hero\top.glb
npm run hero:package
npm run hero:posters
```

`node scripts\clean-bottom-preview.mjs --check` verifies the persisted local repair without rewriting it. `node scripts\check-hero-channel.mjs --local-model` checks channel geometry, palette behavior, and lid seating against the local review GLBs; without that flag it uses the public delivery models.

Interactive local previews allow a full 360-degree horizontal inspection range and wide vertical tilt, holding the camera angle after release. These overrides are local to the preview page and disabled in `capture` mode; the website's movement limits and poster behavior are unchanged.

Open `http://127.0.0.1:3010`. The viewer uses the same scene module as the website. It serves only three named local model files, scene modules and Three.js dependencies. It never serves the invoice. `?capture=1&mode=flow` (or `visibility`) hides controls and calls `renderStill()` at a fixed simulation time of 3.2 seconds with neutral inspection. `&hero=1` switches to the full-stroller camera used for the main-page static artwork; `&detail=1` isolates the device and hides the synthetic stroller straps so the actual flat lid is unobscured. Capture no longer depends on frame rate or a wall-clock timeout. After changing the preview server script itself, restart it; scene modules are read fresh on page reload. `HERO_PREVIEW_PORT` can select another local port.

`npm run hero:posters` captures and encodes every mode from the shared `lightModes` configuration plus the full-stroller static hero render and both presentation stills; it never just re-encodes old PNGs. It starts an isolated loopback preview on an available port and an installed headless Edge/Chromium browser with a temporary private profile. Node.js 22.18+ is required; Edge and Chrome are detected on Windows, or set `HERO_BROWSER_PATH` to an installed Chromium executable. No browser or dependency is downloaded.

Use `npm run hero:posters -- --presentation` to regenerate only `public/hero/stroller-visibility-wide.webp` (1600x800) and `public/hero/glowbaby-device.webp` (1200x900), leaving the existing mode posters and legacy static hero unchanged. Both use Visibility mode. The local `&wide=1` preset frames the whole stroller and nearby ground; `&studio=1` removes the stroller and synthetic straps, uses a neutral background and floor, and lights the actual housing and diffuser for inspection. Studio overrides are local to that capture; the live scene keeps its existing park environment, lighting, geometry and interaction defaults.

All selected renders must succeed before any image is replaced. The two mode fallbacks and legacy static hero remain 1200x1072. Model, texture, renderer and context failures invalidate capture readiness, including a failure occurring during the screenshot. PNGs are saved to `.local-assets/` under the same basename as their optimized WebPs in `public/hero/`. The command closes its own browser/server and removes its temporary profile. Rerun it whenever geometry, camera, materials or lighting change. Static image imports fingerprint the actual new bytes.

## Validation and outstanding work

- `npm run validate` runs TypeScript, ESLint and the production build.
- `npm run hero:check` covers closed seam positions/normals, actual oval rotation at multiple angles/scales, shader tuning, optimizer budgets/default CAD topology/materials/UVs/source privacy, capture readiness, and protected bundle/delivery invariants.
- `npm run hero:posters` loads and GPU-renders all actual models in each mode plus the full-stroller hero and presentation views, refusing shader or initialization errors.
- Short-range colored pavement bounce now reaches the lower frame, wheels and basket underside. Its color and activation follow the selected diffuser mode; its limited range keeps it below the seat.
- Broad physical-device/GPU profiling remains advisable. The visualization does not establish physical-device photometry, and technical delivery measures do not replace the applicable asset license.
- Product-owner review: approximate under-basket mounting, suggested straps, material finish, brightness and channel envelope. These are prototype visualization choices, not final product specifications.

## Real-stroller photo refinement

The supplied undercarriage photograph shows a horizontal diffuser below the basket's lower frame, with different colors illuminating the wheels, frame and ground simultaneously. The visible portion supports that orientation but does not establish the full attachment method or precise dimensions on the purchased stroller. Mounting and strap details remain provisional.

The close-up uses that undercarriage relationship with downward/outward direct light and subtle short-range pavement bounce onto the underside. The central floor fade has a smaller radius and retains more color. A muted park-light shadow, contact grounding and device-origin shadows remain. Concrete detail stays visible in the broader glow. The reference informs qualitative color separation and appearance, not measured luminous output, weather resistance or final mounting hardware.
