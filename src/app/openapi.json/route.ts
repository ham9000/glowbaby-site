import { siteConfig } from "@/content/site";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      openapi: "3.1.1",
      info: {
        title: "Glowbaby public product discovery API",
        version: "1.0.0",
        description:
          "Read-only public information about the Glowbaby modular lighting platform, compatible product concepts, and system components. Unpublished specifications, pricing, availability, certifications, and customer data are not included.",
      },
      servers: [{ url: siteConfig.url }],
      security: [],
      paths: {
        "/product-catalogue.json": {
          get: {
            operationId: "getProductCatalogue",
            summary: "Get the public Glowbaby product catalogue",
            responses: {
              "200": {
                description: "Public product catalogue",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["name", "description", "products", "limitations"],
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        products: {
                          type: "array",
                          items: {
                            type: "object",
                            required: ["name", "slug", "url", "description", "status"],
                            properties: {
                              name: { type: "string" },
                              slug: { type: "string" },
                              url: { type: "string", format: "uri" },
                              description: { type: "string" },
                              status: { type: "string" },
                            },
                          },
                        },
                        limitations: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/llms.txt": {
          get: {
            operationId: "getLanguageModelSummary",
            summary: "Get the plain-language site summary",
            responses: {
              "200": {
                description: "Markdown site summary",
                content: {
                  "text/markdown": {
                    schema: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
