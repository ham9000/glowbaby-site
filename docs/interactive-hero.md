# Interactive stroller hero

Branch: `codex/interactive-stroller-hero`.

The hero focuses on the actual Glowbaby CAD assembly beneath the stroller, seen from a low three-quarter angle over a concrete sidewalk at dusk. Three matching rendered posters and accessible mode buttons appear immediately, ordered **Visibility**, **Gradient**, **Holiday**. The compact **3D** switch sits beside them, not over the rendering. When protected delivery is configured, capable desktops enhance automatically; capable narrow devices opt in with the switch. Hold and drag to inspect, then release for a gentle return. The same scene works in the private local preview.

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
3. WebCrypto decrypts the response in memory. The client validates all three self-contained GLBs before importing the heavier Three.js scene module. No keys or models are persisted in browser storage.

Responses are private/no-store, same-origin-only, and nosniff. HTTPS is required except on local loopback. Different per-grant cookie paths let concurrent tabs load independently. Clearing a cookie is not distributed single-use enforcement: captured credentials can be replayed within their lifetime. Origin/intent checks prevent ordinary cross-site browser use, not requests forged by an automated client. Anonymous visitors are intended viewers, not authenticated model owners.

At rest, the `GBE1` envelope contains a 12-byte IV, authenticated ciphertext, and 16-byte tag. Its plaintext `GBH1` bundle contains three length-delimited embedded GLBs; external texture/buffer URLs and malformed framing are rejected. Delivery uses a distinct per-grant key rather than exposing the at-rest master key. CSP permits `blob:` image fetches and narrowly allows WebAssembly compilation (`wasm-unsafe-eval`) for Meshopt; JavaScript `unsafe-eval` remains development-only.

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
- Milky transparent physical outer material (opacity 0.12) over an inner angular-UV shader. Visibility is steady amber; Gradient retains the animated multicolor blend (internal ID `flow`); Holiday has eight repeating red/white pairs with straight color divisions. Gradient and Holiday rotate at the shared `colorRotationSpeed`. Holiday emission preserves saturated red; its ground glow follows the rotating red/white pattern with broader transitions and a blended center. A 2.4-second activation pulse settles into the chosen mode. `emission` and `holiday` tuning directly reach the shaders and sampled lights. No per-LED components or draw calls.
- Dusk background `environment.background = #171827`. Neutral sky/key/rim lighting keeps the stroller readable without colored light appearing inside the basket. The key and rim lights cast no overhead silhouette shadows.
- Broad overlapping downward cones approximate one continuous diffuser instead of three outward-pointing beams. Each perimeter sample aims straight down with an 88-degree half-angle, a 2-degree margin below the horizon, and zero distance-decay exponent; this intentionally models an even area-light appearance rather than point-source photometry. Total intensity 0.9, range 1.6 m, penumbra 0.15. Their 512 squared shadow maps are reused while geometry is static; shadows originate beneath the stroller, never from the overhead fill.
- A separate 1.8 x 1.55 m floor-only spill supplies the continuous all-around footprint (opacity 0.7, brightness 0.95). Its broad radial profile has a filled center and a gentle outer fade, removing the former isolated hotspots. Color flow is a smooth color gradient, not separate pools of brightness. Concrete detail remains visible. Faint wheel-contact patches (opacity 0.14) are derived from actual near-ground geometry, not a projected stroller outline.
- Concrete sidewalk: one two-triangle plane with procedural grain, mottling, roughness variation and shallow 6 mm joints between 1.15 x 1.35 m slabs. No extra texture downloads or dense pavement geometry.
- Camera (0.48, 0.235, 0.56) m, target (0, 0.12, 0.065), FOV 38 degrees. The actual device is the focal point; lower frame, basket and wheels provide stroller context. Device dimensions are not enlarged. Held-drag camera-only inspection is limited to +/-7.5 degrees yaw and +/-2 degrees pitch, so the stroller remains grounded. Hover alone does not move it. Release eases back over roughly a second; re-grabbing preserves the current angle. Touch keeps vertical scrolling.
- Gating: server delivery configured, no reduced motion or explicit data saving/2G, at least 4 GB device memory when reported, secure WebCrypto and WebGL2 available. Width at least 900px enhances automatically after the poster loads; narrower eligible clients require explicit opt-in. Opt-in overrides only width, never the other gates. Ineligible clients do not import 3D code or request protected payloads. IntersectionObserver/document visibility pause rendering; DPR capped at 1.5. Failures retain the poster.

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

Open `http://127.0.0.1:3010`. The viewer uses the same scene module as the website. It serves only three named local model files, scene modules and Three.js dependencies. It never serves the invoice. `?capture=1&mode=flow` (or `holiday`, `visibility`) hides controls and calls `renderStill()` at a fixed simulation time of 3.2 seconds with neutral inspection. Capture no longer depends on frame rate or a wall-clock timeout. `&detail=1` isolates the assembly for inspection. After changing the preview server script itself, restart it; scene modules are read fresh on page reload. `HERO_PREVIEW_PORT` can select another local port.

`npm run hero:posters` captures and encodes every mode from the shared `lightModes` configuration; it never just re-encodes old PNGs. It starts an isolated loopback preview on an available port and an installed headless Edge/Chromium browser with a temporary private profile. Node.js 22.18+ is required; Edge and Chrome are detected on Windows, or set `HERO_BROWSER_PATH` to an installed Chromium executable. No browser or dependency is downloaded.

All three fresh 1200x1072 renders must succeed before any poster is replaced. Model, texture, renderer and context failures invalidate capture readiness, including a failure occurring during the screenshot. Raw PNGs are saved to `.local-assets/stroller-MODE.png`; optimized WebPs go to `public/hero/stroller-render-MODE.webp`. The command closes its own browser/server and removes its temporary profile. Rerun it whenever geometry, camera, materials or lighting change. Static image imports fingerprint the actual new bytes.

## Validation and outstanding work

- `npm run validate` runs TypeScript, ESLint and the production build.
- `npm run hero:check` covers closed seam positions/normals, actual oval rotation at multiple angles/scales, shader tuning, optimizer budgets/default CAD topology/materials/UVs/source privacy, capture readiness, and protected bundle/delivery invariants.
- `npm run hero:posters` loads and GPU-renders all actual models in each mode, refusing shader or initialization errors. The current three posters come from this command, not older captures.
- Fixed-time PNG comparison shows the sampled basket region is pixel-identical across all three modes while the illuminated sidewalk changes substantially. Colored illumination no longer reaches the upper basket/interior.
- Broad physical-device/GPU profiling remains advisable. The visualization does not establish physical-device photometry, and technical delivery measures do not replace the applicable asset license.
- Product-owner review: approximate under-basket mounting, suggested straps, material finish, brightness and channel envelope. These are prototype visualization choices, not final product specifications.

## Real-stroller photo refinement

The supplied undercarriage photograph shows a horizontal diffuser below the basket's lower frame, with different colors illuminating the wheels, frame and ground simultaneously. The visible portion supports that orientation but does not establish the full attachment method or precise dimensions on the purchased stroller. Mounting and strap details remain provisional.

The final close-up uses that undercarriage relationship while restricting all colored light to downward/outward cones and the sidewalk. The prominent overhead shadow is removed; faint contact grounding and device-origin shadows remain. Concrete detail stays visible in the broader, brighter-looking glow. The reference informs qualitative color separation and appearance, not measured luminous output, weather resistance or final mounting hardware.
