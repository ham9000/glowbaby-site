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
  title: "Glowbaby Stroller Light — Visibility After Dark",
  description:
    "Glowbaby is an under-stroller light designed to help you see around your ride and help others notice you at night, with app-controlled brightness and modes.",
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

export const visibilityGuidance = {
  habits:
    "Keep required lights and reflectors in place, choose well-lit routes where possible, stay alert at crossings and driveways, and check your light and power source before heading out.",
  limitations:
    "Glowbaby is an additional visibility aid, not safety equipment. It cannot guarantee that others will see you, prevent accidents, or replace required lights and reflectors.",
} as const;

export const realWorldScenarios = [
  {
    scene: "evening-walk",
    title: "One more lap around the block.",
    description:
      "A neighborhood-walk concept: light on the pavement beside your stroller and a more noticeable presence for people nearby.",
  },
  {
    scene: "park-path",
    title: "When the path gets a little dim.",
    description:
      "A shared-path concept, showing the intended glow around the stroller for the ground near you and the people sharing the route.",
  },
  {
    scene: "family-event",
    title: "When the celebration runs late.",
    description:
      "An evening-event concept: practical light around the stroller, with a little color for the gathering and the walk back.",
  },
] as const;

export type ExampleTestimonial = {
  id: string;
  perspective: string;
  quote: string;
};

export const exampleTestimonials = [
  {
    id: "evening-walks",
    perspective: "The evening-walk perspective",
    quote:
      "I want to see the ground beside the stroller and make our evening walks easier for other people to notice. A little light around the ride is an idea I can get behind.",
  },
  {
    id: "family-events",
    perspective: "The family-event perspective",
    quote:
      "At an evening event, an extra glow around the stroller would be a welcome addition to the lights and reflectors we already use. The playful colors are a nice bonus.",
  },
  {
    id: "before-we-go",
    perspective: "The before-we-go perspective",
    quote:
      "I like the idea of setting a practical glow before we leave, then choosing a playful color when we reach the celebration. Visibility first, with room to make it ours.",
  },
] as const satisfies readonly [ExampleTestimonial, ...ExampleTestimonial[]];

export const products: Product[] = [
  {
    slug: "glowbaby",
    name: "Glowbaby Stroller Light",
    eyebrow: "App-controlled stroller light",
    headline: "Made to be seen. Built to be theirs.",
    description:
      "Glowbaby is being designed to help you see the space around your stroller or wagon—and help others see you at night. App-controlled light shines beneath and around your ride, with safety-minded visibility at the center.",
    status: "In development",
    statusDetail:
      "The under-stroller light, controller, and bottom-mounting approach are still being developed. The hardware is not yet available to buy.",
    principles: [
      {
        number: "01",
        title: "Help others notice you",
        description:
          "Designed to help your stroller or wagon stand out to people nearby on evening walks, shared paths, and after-dark family outings.",
      },
      {
        number: "02",
        title: "See the space around you",
        description:
          "Downward and outward light is designed to help you see the ground and space immediately around your stroller or wagon during evening walks.",
      },
      {
        number: "03",
        title: "Safety comes first",
        description:
          "Brightness and practical lighting modes come first. Colors and playful presets add personality, alongside the need to stay alert and use required lights.",
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
        title: "Set your light",
        description:
          "Choose brightness and a practical mode before you set off. Adjust for the setting and be considerate of other people; playful colors are there when you want them.",
      },
    ],
    details: [
      {
        title: "Visibility in both directions",
        description:
          "The goal is to help you see the area around your stroller or wagon and help others notice you in low light. The disc casts light outward and down. Mounting and supported models are still being evaluated.",
      },
      {
        title: "Practical control before you go",
        description:
          "A compact Bluetooth controller connects the light to the companion app. Set brightness and lighting modes before your walk, with colors and playful presets available for personal expression.",
      },
      {
        title: "Power stays separate",
        description:
          "The system is designed around external USB-C power. Power-source requirements, runtime, and included accessories are still being evaluated.",
      },
      {
        title: "One part of a safer outing",
        description: visibilityGuidance.limitations,
      },
    ],
    faqs: [
      {
        question: "What is Glowbaby?",
        answer:
          "Glowbaby Stroller Light is being developed to help you see around your stroller or wagon and help others notice you after dark. Its bottom-mounted disc casts light outward and down, with app-controlled brightness, colors, and modes.",
      },
      {
        question: "How does Glowbaby support safer outings?",
        answer:
          `Its purpose is visibility in both directions: helping you see the area around your ride and helping others notice you at night. ${visibilityGuidance.limitations} ${visibilityGuidance.habits}`,
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
