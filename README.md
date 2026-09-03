# Glowbaby

A reusable, product-first website for the Glowbaby concept. It is built with
Next.js, React, TypeScript, Tailwind CSS, and Vercel Analytics.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
npm run validate
```

## Add another product

Product content is centralized in `src/content/site.ts`. Add a new record to the
`products` array and it will automatically appear in:

- `/products`
- `/products/[slug]`
- `/product-catalogue.json`
- `/llms.txt`
- `/sitemap.xml`

Create a specialized product-detail component only when a future product needs
content beyond the shared product model.

## AI and discovery surfaces

- `/llms.txt` gives language models a concise, explicit summary.
- `/product-catalogue.json` provides a sanitized machine-readable catalogue.
- `/openapi.json` documents the public discovery endpoints.
- Product and organization JSON-LD are embedded in the relevant pages.

These routes expose only published marketing content. They do not add an agent,
chatbot, database, MCP server, or customer-data workflow.

## Deployment

Deploy the repository on Vercel and set:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

The fallback URL is `https://glowbaby-site.vercel.app`. Update the environment
variable if Vercel assigns a different project URL or a custom domain is added.

## What was reused from the Panama site

The architecture carries forward the strongest general patterns:

- static server rendering and a small client footprint;
- content passed into reusable presentational sections;
- product data behind a local content boundary;
- Vercel Analytics and Speed Insights;
- metadata, sitemap, robots, JSON-LD, and generated social imagery;
- security headers and public AI-discovery documents.

Travel-specific systems were intentionally not copied: Supabase administration,
localization, cron jobs, inquiries, staff roles, concierge AI, WebMCP, and remote
MCP. They solve real needs in the Panama site but would be premature complexity
for an early-stage product page.
