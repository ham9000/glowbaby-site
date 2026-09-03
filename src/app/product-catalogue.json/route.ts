import { products, siteConfig } from "@/content/site";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      name: siteConfig.name,
      description: siteConfig.description,
      products: products.map((product) => ({
        name: product.name,
        slug: product.slug,
        url: `${siteConfig.url}/products/${product.slug}`,
        description: product.description,
        status: product.status,
        principles: product.principles.map(({ title, description }) => ({
          title,
          description,
        })),
      })),
      limitations: {
        specificationsPublished: false,
        pricingPublished: false,
        availabilityPublished: false,
        launchDatePublished: false,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
