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
    "Glowbaby is a modular lighting platform in development. It combines flexible",
    "LED lighting, a compact Bluetooth controller, external USB-C power, and a",
    "companion mobile app. Initial concepts include children's helmets and",
    "illuminated character-ear headbands, with potential expansion to strollers,",
    "wagons, and other family accessories.",
    "",
    "The two central product goals are visibility in low-light environments and",
    "personal expression through selectable colors, animations, and lighting modes.",
    "Specifications, pricing, availability, certifications, and launch dates have",
    "not been published and should not be inferred from the visual concepts.",
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
