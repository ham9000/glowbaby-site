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
  howItWorks: ProductPrinciple[];
  details: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  useCases: {
    title: string;
    description: string;
    status: "Planned" | "Exploring";
  }[];
};

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteConfig = {
  name: "Glowbaby",
  title: "Glowbaby Stroller Light — App-Controlled Stroller Lighting",
  description:
    "Glowbaby is an app-controlled under-stroller light for strollers and wagons, casting colorful light outward, around, and down toward the ground.",
  url: configuredUrl || "https://glowbaby-site.vercel.app",
  githubUrl: "https://github.com/ham9000/glowbaby-site",
  navigation: [
    { label: "Product", href: "/products/glowbaby" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "The app", href: "/#app" },
    { label: "FAQ", href: "/products/glowbaby#faq" },
  ],
} as const;

export const companionApp = {
  name: "Glowbaby LED Manager",
  appStoreUrl: "https://apps.apple.com/us/app/glowbabyled/id6744045805",
  availability: "Available on iOS. Android is currently in beta.",
} as const;

export const products: Product[] = [
  {
    slug: "glowbaby",
    name: "Glowbaby Stroller Light",
    eyebrow: "App-controlled stroller light",
    headline: "Made to be seen. Built to be theirs.",
    description:
      "Glowbaby is an app-controlled light designed to sit beneath a stroller or wagon, casting light outward, around, and down toward the ground. Colorful modes and animations make every ride feel personal.",
    status: "In development",
    statusDetail:
      "The under-stroller light, controller, and bottom-mounting approach are still being developed. The hardware is not yet available to buy.",
    principles: [
      {
        number: "01",
        title: "More noticeable after dark",
        description:
          "Add a distinctive glow beneath and around your stroller or wagon during evening walks, busy events, and after-dark family adventures.",
      },
      {
        number: "02",
        title: "Make it unmistakably theirs",
        description:
          "Choose colors, animations, brightness, and playful modes that let every ride reflect a child’s personality.",
      },
      {
        number: "03",
        title: "Designed to grow with the ride",
        description:
          "One controller-and-app experience is being designed to support additional compatible stroller and wagon lighting as Glowbaby grows.",
      },
    ],
    platformParts: [
      {
        number: "01",
        title: "Under-stroller LED light",
        description:
          "A bottom-mounted light designed to shine outward, around the stroller or wagon, and down toward the ground.",
      },
      {
        number: "02",
        title: "Compact controller",
        description:
          "Connects the lighting hardware to the Glowbaby mobile experience over Bluetooth.",
      },
      {
        number: "03",
        title: "External USB-C power",
        description:
          "Keeps power separate from the stroller, with an external USB-C source. Power-source requirements and what is included are still being evaluated.",
      },
      {
        number: "04",
        title: "Companion app",
        description:
          "A single place to control brightness, colors, animations, and lighting modes for the ride.",
      },
    ],
    howItWorks: [
      {
        number: "01",
        title: "Attach the light",
        description:
          "Position the light beneath the stroller or wagon so it shines outward, around, and down toward the ground. Exact mounting and compatibility are still in development.",
      },
      {
        number: "02",
        title: "Connect the controller",
        description:
          "The compact Bluetooth controller links the lighting system to external USB-C power and the Glowbaby app.",
      },
      {
        number: "03",
        title: "Make it yours",
        description:
          "Adjust brightness, choose colors, and switch between practical and playful modes from the app.",
      },
    ],
    details: [
      {
        title: "A glow beneath the stroller",
        description:
          "The LED light sits at the bottom of the stroller or wagon and casts light outward, around, and down toward the ground. Supported models, attachment points, and mounting hardware are not finalized.",
      },
      {
        title: "A small controller, a personal glow",
        description:
          "A compact Bluetooth controller connects the light to the companion app, where families can choose brightness, colors, animations, and modes.",
      },
      {
        title: "Power stays separate",
        description:
          "The system is designed around external USB-C power. Power-source requirements, runtime, and included accessories are still being evaluated.",
      },
      {
        title: "Visibility without overpromising",
        description:
          "Glowbaby adds a distinctive light presence. It does not guarantee visibility, prevent accidents, or replace required lights or reflectors.",
      },
    ],
    faqs: [
      {
        question: "What is Glowbaby?",
        answer:
          "Glowbaby Stroller Light is an app-controlled light being developed to sit beneath a stroller or wagon. It casts light outward, around, and down toward the ground, with colorful modes and animations that make the ride personal.",
      },
      {
        question: "How is it controlled?",
        answer:
          "The Glowbaby companion app connects over Bluetooth and brings brightness, colors, animations, and lighting modes together. The stroller-light hardware and its final feature set are still being refined.",
      },
      {
        question: "Is the app available?",
        answer:
          `${companionApp.availability} Find ${companionApp.name} on the App Store. The stroller-light hardware is still in development.`,
      },
      {
        question: "How is it powered?",
        answer:
          "Glowbaby is designed to use an external USB-C power source connected through its compact controller. Power-source requirements, runtime, and what will be included are not yet finalized.",
      },
      {
        question: "Can I buy it now?",
        answer:
          "The stroller-light hardware is not yet available to buy, and pricing and a launch date have not been announced. You can follow the public build on GitHub as the first stroller-light experience takes shape.",
      },
      {
        question: "Will it fit my stroller or wagon?",
        answer:
          "The light is intended to mount beneath a stroller or wagon. Bottom-mounting hardware, attachment points, and compatibility are still being evaluated; no universal fit or supported-model list is promised at this stage.",
      },
      {
        question: "Does it replace required lights or reflectors?",
        answer:
          "No. Glowbaby is not safety equipment and does not replace any required stroller, bicycle, pedestrian, or roadway lights or reflectors. Continue to follow the requirements that apply to your ride and location.",
      },
      {
        question: "Are additional linked lights planned?",
        answer:
          "Additional compatible stroller and wagon lights are being explored, with the aim of sharing colors, brightness, and animations through one setup. This is a future direction, not a feature or accessory available to buy today.",
      },
    ],
    useCases: [
      {
        title: "Linked Glowbabys",
        status: "Exploring",
        description:
          "Additional compatible stroller and wagon lights that could share colors, brightness, and animations through one setup.",
      },
      {
        title: "Stroller and wagon mounting options",
        status: "Exploring",
        description:
          "Bottom-mounting approaches that could support the under-stroller light on more compatible strollers and wagons.",
      },
      {
        title: "Future ride accessories",
        status: "Exploring",
        description:
          "Related stroller and wagon additions that build on the same lighting, power, and app experience.",
      },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
