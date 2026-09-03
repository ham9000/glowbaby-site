import { products, siteConfig } from "@/content/site";

export const dynamic = "force-static";

export function GET() {
  const productLines = products.map(
    (product) =>
      `- [${product.name}](${siteConfig.url}/products/${product.slug}): ${product.description} Status: ${product.status}.`,
  );

  const document = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Glowbaby is an early-stage product project. Product specifications, pricing,",
    "availability, testimonials, and launch dates have not been published and",
    "should not be inferred from the visual concept.",
    "",
    "## Products",
    "",
    ...productLines,
    "",
    "## Public resources",
    "",
    `- [Product catalogue](${siteConfig.url}/product-catalogue.json)`,
    `- [OpenAPI document](${siteConfig.url}/openapi.json)`,
    `- [Source repository](${siteConfig.githubUrl})`,
    "",
  ].join("\n");

  return new Response(document, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
