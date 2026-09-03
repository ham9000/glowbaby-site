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
};

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteConfig = {
  name: "Glowbaby",
  description:
    "Glowbaby is an early-stage baby-care product shaped around calmer nights, clearer information, and less friction for tired parents.",
  url: configuredUrl || "https://glowbaby-site.vercel.app",
  githubUrl: "https://github.com/ham9000/glowbaby-site",
  navigation: [
    { label: "Product", href: "/products/glowbaby" },
    { label: "Approach", href: "/#approach" },
    { label: "Roadmap", href: "/#roadmap" },
    { label: "All products", href: "/products" },
  ],
} as const;

export const products: Product[] = [
  {
    slug: "glowbaby",
    name: "Glowbaby",
    eyebrow: "Thoughtful care, after dark",
    headline: "A softer start to every night.",
    description:
      "Glowbaby is being designed to make nighttime care feel calmer and more understandable. The product is still in development, and the details will evolve as the idea is tested with real families.",
    status: "In development",
    statusDetail: "Following an explore, refine, and launch process.",
    principles: [
      {
        number: "01",
        title: "Calm by default",
        description:
          "Every interaction should reduce noise, avoid unnecessary urgency, and support the pace of a real nighttime routine.",
      },
      {
        number: "02",
        title: "Clear at a glance",
        description:
          "The important information should be understandable quickly, without digging through menus or waking the room with a bright screen.",
      },
      {
        number: "03",
        title: "Made for real routines",
        description:
          "The product direction starts with tired hands, interrupted sleep, shared care, and the small details that matter at 2 a.m.",
      },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
