export type ProductPrinciple = {
  number: string;
  title: string;
  description: string;
};

export type Product = {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  description: string;
  status: string;
  statusDetail: string;
  principles: ProductPrinciple[];
  platformParts: ProductPrinciple[];
  useCases: {
    title: string;
    description: string;
  }[];
};

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteConfig = {
  name: "Glowbaby",
  description:
    "Glowbaby is a modular, app-controlled lighting platform that adds visibility, personality, and playful lighting effects to everyday family gear.",
  url: configuredUrl || "https://glowbaby-site.vercel.app",
  githubUrl: "https://github.com/ham9000/glowbaby-site",
  navigation: [
    { label: "Product", href: "/products/glowbaby" },
    { label: "Approach", href: "/#approach" },
    { label: "Platform", href: "/#platform" },
    { label: "Use cases", href: "/#use-cases" },
  ],
} as const;

export const products: Product[] = [
  {
    slug: "glowbaby",
    name: "Glowbaby",
    eyebrow: "Modular light. One connected system.",
    headline: "Made to be seen. Built to be theirs.",
    description:
      "Glowbaby combines flexible LED lighting, a compact Bluetooth controller, external USB-C power, and a companion mobile app to bring visibility and personality to everyday family gear.",
    status: "In development",
    statusDetail: "Hardware, app, and accessory concepts are being developed together.",
    principles: [
      {
        number: "01",
        title: "Stand out after dark",
        description:
          "Flexible lighting is being designed to help children and family gear remain more noticeable in low-light environments.",
      },
      {
        number: "02",
        title: "Make it unmistakably theirs",
        description:
          "Colors, animations, and lighting modes turn practical illumination into something playful, personal, and exciting to use.",
      },
      {
        number: "03",
        title: "Grow as one ecosystem",
        description:
          "Shared lighting, control, power, and app technology can support a family of accessories instead of a single novelty product.",
      },
    ],
    platformParts: [
      {
        number: "01",
        title: "Flexible LED lighting",
        description:
          "Adaptable light elements designed to follow the shape of helmets, wearable accessories, and future family gear.",
      },
      {
        number: "02",
        title: "Bluetooth controller",
        description:
          "A compact control module connects the lighting hardware to the Glowbaby mobile experience.",
      },
      {
        number: "03",
        title: "External USB-C power",
        description:
          "A familiar external power approach keeps the lighting system modular and separate from the gear it illuminates.",
      },
      {
        number: "04",
        title: "Companion app",
        description:
          "A single place to choose colors, preview animations, switch modes, and manage compatible Glowbaby products.",
      },
    ],
    useCases: [
      {
        title: "Children’s helmets",
        description:
          "Add a visible, customizable light signature for neighborhood rides and evening adventures.",
      },
      {
        title: "Character-ear headbands",
        description:
          "Turn wearable ears into animated color moments for festivals, theme parks, parades, and Halloween.",
      },
      {
        title: "Strollers and wagons",
        description:
          "Extend the same connected lighting system to the gear families bring along after sunset.",
      },
      {
        title: "Future accessories",
        description:
          "Build on one controller-and-app ecosystem as new compatible forms and products are developed.",
      },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
