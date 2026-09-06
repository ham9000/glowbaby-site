# Glowbaby Stroller Light

**Made to be seen. Built to be theirs.**

Glowbaby is an app-controlled light that sits on the bottom of a stroller or
wagon, casting light outward, around, and down. The site leads with safety-minded
visibility after dark: helping families see the space around their ride and
helping others notice them. Colors and animations are secondary to that purpose.
The hardware is in development, not currently available
to buy. The intended system brings together an under-stroller LED light, a compact
Bluetooth controller, external USB-C power, and a companion app. Glowbaby is not
safety equipment or a replacement for required lights and reflectors.

The companion app is available on iOS as
[Glowbaby LED Manager](https://apps.apple.com/us/app/glowbabyled/id6744045805);
Android is currently in beta. This is separate from the stroller-light hardware,
which is still in development. App Store screenshots may lag behind the latest
interface; the site keeps its existing local app capture labeled as a preview.

The site uses Next.js, React, TypeScript, Tailwind CSS, Vercel Analytics, and
Speed Insights, retaining the purple, near-black, white, and full-spectrum visual
identity. Stroller illustrations are labeled development representations, not
product photographs. The real app interface capture lives in `public\app`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If another project uses port 3000, run
`npm run dev -- --hostname 127.0.0.1 --port 3001` and open
[http://127.0.0.1:3001](http://127.0.0.1:3001) instead.

## Validate

```bash
npm run validate
```

This runs the existing typecheck, ESLint, and production build. They can also be
run individually with `npm run typecheck`, `npm run lint`, and `npm run build`.

## Routes and shared content

- `/` tells the stroller-light story and introduces the app and system.
- `/products/glowbaby` provides product details, how it works, status, and FAQ.
- `/products` uses a framework-native redirect to `/products/glowbaby` while
  there is one public product; the redirect is excluded from the sitemap.
- `/llms.txt` summarizes the same public product content for language models.
- `/product-catalogue.json` exposes published product descriptions, status,
  system parts, use cases, principles, companion-app availability and App Store
  URL, and explicit hardware information limitations.
- `/openapi.json` documents the two read-only discovery endpoints and their
  response fields.
- `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and `/opengraph-image`
  support search, browser metadata, and social sharing.

Content is centralized in `src\content\site.ts`. Metadata and discovery routes
reuse that source; pages also include truthful JSON-LD without invented offers,
ratings, prices, or hardware availability. The shared `companionApp` record
provides the real iOS download link and Android beta status. There is no signup
backend, customer database, or form endpoint.

The shared `visibilityGuidance` copy keeps responsible-use advice and claim
boundaries consistent across the homepage, product details/FAQ, and `/llms.txt`.
Describe improved visibility as a design goal, not proven safety performance,
accident prevention, certified protection, or a guarantee of being seen.

### Concept scenes and testimonial demo

The homepage includes original, static illustrations of evening walks, park paths,
and family events. These are labeled concepts, not product photos or evidence of
tested performance.

The testimonial carousel uses explicitly labeled fictional example quotes from
`exampleTestimonials`, not real customer reviews. It advances every eight seconds
only while visible, pauses on hover or keyboard focus, and stops when a visitor
chooses a slide or presses Pause. Reduced-motion preferences disable automatic
rotation. These examples are not included in review/rating structured data or the
product catalogue. Replace them with permissioned, genuine feedback before
presenting the section as customer testimonials.

### Adding a future real product

Only add a record to `products` when a real, publicly described product warrants
its own page. Records feed `/products/[slug]`, the JSON catalogue, `/llms.txt`,
and the sitemap. They do **not** automatically create a catalogue page: replace
the current `/products` redirect with a useful listing and update navigation and
the sitemap when there is genuinely more than one product to show. Exploration
of future stroller/wagon lights or accessories is not an available product list.

## Factual follow-ups

- Confirm underside mounting, compatible stroller/wagon models, dimensions, power
  requirements, and included items before publishing specifications.
- Establish pricing, launch timing, availability, and any tested or certified
  claims; none are currently published. Do not infer runtime, weather ratings,
  universal fit, or finalized linked-light behavior.
- Add real stroller-light photos or video when approved for public use.
- Configure a real contact or launch-list destination before adding a signup
  action. Until then, the product page is the primary CTA and GitHub is the
  secondary way to follow development.

## Deployment

Deploy on Vercel and set:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

The fallback is `https://glowbaby-site.vercel.app`. Set the production URL before
deployment so canonical links, discovery URLs, and the sitemap share the correct
origin.
