import { companionApp, siteConfig } from "@/content/site";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      openapi: "3.1.1",
      info: {
        title: `${siteConfig.title} — Public Discovery API`,
        version: "1.0.0",
        description:
          `${siteConfig.description} Read-only public content for stroller-light hardware in development, not currently available to buy. Companion app: ${companionApp.availability} Future stroller and wagon lighting or accessories are exploratory, not compatibility guarantees. Unpublished hardware specifications, pricing, availability, certifications, launch dates, and customer data are not included. There are no signup or contact endpoints.`,
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
                      $ref: "#/components/schemas/ProductCatalogue",
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
      components: {
        schemas: {
          ProductCatalogue: {
            type: "object",
            required: ["name", "description", "companionApp", "products", "limitations"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              companionApp: { $ref: "#/components/schemas/CompanionApp" },
              products: {
                type: "array",
                description:
                  "Public product records, not a list of items available for sale.",
                items: { $ref: "#/components/schemas/Product" },
              },
              limitations: { $ref: "#/components/schemas/Limitations" },
            },
          },
          CompanionApp: {
            type: "object",
            description: "Published companion-app availability, separate from hardware availability.",
            required: ["name", "appStoreUrl", "availability"],
            properties: {
              name: { type: "string" },
              appStoreUrl: { type: "string", format: "uri" },
              availability: { type: "string" },
            },
          },
          Product: {
            type: "object",
            required: [
              "name",
              "slug",
              "url",
              "description",
              "status",
              "statusDetail",
              "platformParts",
              "useCases",
              "principles",
            ],
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
              url: { type: "string", format: "uri" },
              description: { type: "string" },
              status: {
                type: "string",
                description: "Published development status, not sales availability.",
              },
              statusDetail: { type: "string" },
              platformParts: {
                type: "array",
                description: "The intended lighting, controller, power, and app system.",
                items: { $ref: "#/components/schemas/ContentItem" },
              },
              useCases: {
                type: "array",
                description:
                  "Future stroller and wagon ideas, not available products or compatibility guarantees.",
                items: { $ref: "#/components/schemas/FutureDirection" },
              },
              principles: {
                type: "array",
                description: "Product design goals, not tested performance claims.",
                items: { $ref: "#/components/schemas/ContentItem" },
              },
            },
          },
          ContentItem: {
            type: "object",
            required: ["title", "description"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
          },
          FutureDirection: {
            type: "object",
            required: ["title", "description", "status"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              status: {
                type: "string",
                enum: ["Planned", "Exploring"],
                description: "Exploration status, not sales availability.",
              },
            },
          },
          Limitations: {
            type: "object",
            description:
              "Hardware publication and claim boundaries, not companion-app availability. All flags are currently false; no missing hardware specifications or availability should be inferred.",
            required: [
              "specificationsPublished",
              "pricingPublished",
              "availabilityPublished",
              "certificationsPublished",
              "launchDatePublished",
              "compatibilityGuaranteed",
              "replacesRequiredLightsOrReflectors",
            ],
            properties: {
              specificationsPublished: { type: "boolean" },
              pricingPublished: { type: "boolean" },
              availabilityPublished: {
                type: "boolean",
                description: "Hardware purchase availability only; companion-app availability is listed separately.",
              },
              certificationsPublished: { type: "boolean" },
              launchDatePublished: { type: "boolean" },
              compatibilityGuaranteed: { type: "boolean" },
              replacesRequiredLightsOrReflectors: { type: "boolean" },
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
