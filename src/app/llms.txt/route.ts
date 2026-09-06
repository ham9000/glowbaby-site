import { companionApp, products, siteConfig } from "@/content/site";

export const dynamic = "force-static";

export function GET() {
  const productLines = products.flatMap(
    (product) => [
      `### [${product.name}](${siteConfig.url}/products/${product.slug})`,
      "",
      product.description,
      "",
      `Status: ${product.status}. ${product.statusDetail}`,
      "",
      "#### How the system fits together",
      "",
      ...product.platformParts.map(({ title, description }) => `- ${title}: ${description}`),
      "",
      "#### Practical and playful",
      "",
      ...product.principles.map(({ title, description }) => `- ${title}: ${description}`),
      "",
      "#### Future stroller and wagon ideas — not currently available",
      "",
      ...product.useCases.map(({ title, description }) => `- ${title}: ${description}`),
      "",
    ],
  );

  const document = [
    `# ${siteConfig.title}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Glowbaby Stroller Light is in development, not currently available to buy.",
    "Future stroller and wagon lighting or accessories are possibilities being",
    "explored, not additional available products or compatibility guarantees.",
    "",
    "Hardware specifications, pricing, availability, certifications, and launch dates have",
    "not been published and should not be inferred from the visual concepts.",
    "Mounting and compatibility are still being evaluated. Glowbaby does not",
    "replace required lights or reflectors and is not safety equipment.",
    "",
    "## Companion app",
    "",
    companionApp.availability,
    `- [${companionApp.name} on the App Store](${companionApp.appStoreUrl})`,
    "The app's availability does not imply that the stroller-light hardware is for sale.",
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
