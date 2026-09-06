import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { HowItWorks } from "@/components/how-it-works";
import { ProductFaq } from "@/components/product-faq";
import { ProductVisual } from "@/components/product-visual";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StarOutline } from "@/components/star-outline";
import { StructuredData } from "@/components/structured-data";
import { companionApp, getProduct, products, siteConfig } from "@/content/site";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const product = getProduct((await params).slug);

  if (!product) {
    return {};
  }

  const title = `${product.name} — Details & Development`;
  const description =
    "Explore Glowbaby Stroller Light, designed to help you see nearby and be noticed at night. Learn about responsible use and hardware development.";
  const images = (await parent).openGraph?.images;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: siteConfig.name,
      url: `/products/${product.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = getProduct((await params).slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          url: `${siteConfig.url}/products/${product.slug}`,
          brand: {
            "@type": "Brand",
            name: siteConfig.name,
          },
          category: "App-controlled under-stroller lighting",
        }}
      />
      <SiteHeader />
      <main>
        <section className="bg-cream pb-16 pt-32 sm:pb-20 sm:pt-40">
          <Container className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow leading-relaxed">{product.eyebrow}</p>
              <h1 className="mt-5 max-w-xl font-display text-[clamp(3.25rem,7vw,6rem)] leading-[0.98] tracking-[-0.055em] text-ink">
                {product.name}
              </h1>
              <p className="mt-5 max-w-xl font-display text-3xl leading-tight tracking-[-0.04em] text-coral">
                {product.headline}
              </p>
              <p className="mt-7 max-w-xl text-lg leading-8 text-ink/70">
                Designed to help you see around your stroller or wagon and help
                others notice you at night. The bottom-mounted disc directs light
                outward and down, with a compact Bluetooth controller, external
                USB-C power, and app controls for setting your light before you go.
              </p>
              <p className="mt-5 text-sm font-bold text-ink">
                {product.status} · Not yet available to buy
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#how-it-works" className="button button-dark">
                  See how it works <span aria-hidden="true">→</span>
                </Link>
                <Link href="#development" className="button button-light">
                  Development status
                </Link>
              </div>
            </div>
            <div className="relative aspect-[1.05] w-full">
              <ProductVisual />
            </div>
          </Container>
        </section>

        <section className="bg-ink py-20 text-cream sm:py-24">
          <Container>
            <div className="[&_.eyebrow]:text-cyan [&_h2]:text-cream [&_p]:text-cream/70">
              <SectionHeading
                eyebrow="Safety-minded visibility"
                title="See nearby. Be noticed."
                description="Evening walks and after-dark outings are the reason for Glowbaby. The goal is light for the space around you and a visible presence for others—not a promise that light alone makes an outing safe."
              />
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-cream/15 bg-cream/15 sm:grid-cols-2">
              {product.details.map((detail) => (
                <article key={detail.title} className="bg-ink p-7 sm:p-9">
                  <StarOutline className="h-7 w-7 text-cyan" />
                  <h3 className="mt-7 font-display text-3xl tracking-[-0.04em] text-cream">
                    {detail.title}
                  </h3>
                  <p className="mt-4 leading-7 text-cream/70">{detail.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <HowItWorks product={product} />

        <section id="development" className="scroll-mt-28 bg-sage py-20 sm:py-24">
          <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <SectionHeading
              eyebrow={product.status}
              title="Taking shape, one ride at a time."
              description={product.statusDetail}
            />
            <div>
              <div className="space-y-7">
                <div>
                  <h3 className="text-lg font-bold text-ink">An app you can download</h3>
                  <p className="mt-2 leading-7 text-ink/70">
                    {companionApp.availability} Find {companionApp.name} on
                    the App Store. The app continues to evolve alongside the
                    stroller-light hardware.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Fit and hardware still being refined</h3>
                  <p className="mt-2 leading-7 text-ink/70">
                    Bottom mounting, supported stroller and wagon models, power requirements,
                    and final specifications are still being evaluated. The illustration
                    shows the intended direction, not a finished product photograph.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">One focused first product</h3>
                  <p className="mt-2 leading-7 text-ink/70">
                    The stroller light comes first. Linked lights and related stroller
                    and wagon accessories are future directions being explored, not
                    additional products available today.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={companionApp.appStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-dark"
                >
                  Download on the App Store <span aria-hidden="true">↗</span>
                </Link>
                <Link
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-light"
                >
                  Follow the build <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <ProductFaq product={product} />
      </main>
      <SiteFooter />
    </>
  );
}
