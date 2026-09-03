import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { ProductVisual } from "@/components/product-visual";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StarOutline } from "@/components/star-outline";
import { StructuredData } from "@/components/structured-data";
import { getProduct, products, siteConfig } from "@/content/site";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = getProduct((await params).slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} — ${product.headline}`,
      description: product.description,
      url: `/products/${product.slug}`,
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
          category: "Modular app-controlled lighting system",
        }}
      />
      <SiteHeader />
      <main>
        <section className="bg-cream pb-20 pt-36 sm:pb-28 sm:pt-44">
          <Container className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">{product.eyebrow}</p>
              <h1 className="mt-5 font-display text-[clamp(4.5rem,10vw,8rem)] leading-[0.86] tracking-[-0.07em] text-ink">
                {product.name}
              </h1>
              <p className="mt-5 font-display text-3xl leading-tight tracking-[-0.04em] text-coral sm:text-5xl">
                {product.headline}
              </p>
              <p className="mt-7 max-w-xl text-lg leading-8 text-ink/70">
                {product.description}
              </p>
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                  <span className="text-sm font-bold text-ink">{product.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  {product.statusDetail}
                </p>
              </div>
            </div>
            <div className="relative min-h-[500px] sm:min-h-[640px]">
              <ProductVisual />
            </div>
          </Container>
        </section>

        <section className="bg-white py-24 sm:py-32">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.65fr_1fr]">
              <div>
                <p className="eyebrow">Platform principles</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.055em] text-ink sm:text-7xl">
                  Visible. Personal. Expandable.
                </h2>
              </div>
              <div className="border-t border-ink/15">
                {product.principles.map((principle) => (
                  <article
                    key={principle.number}
                    className="grid gap-4 border-b border-ink/15 py-8 sm:grid-cols-[4rem_1fr]"
                  >
                    <StarOutline className="h-7 w-7 text-violet" />
                    <div>
                      <h3 className="font-display text-3xl tracking-[-0.04em] text-ink">
                        {principle.title}
                      </h3>
                      <p className="mt-3 max-w-xl leading-7 text-ink/70">
                        {principle.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-ink py-24 text-cream sm:py-32">
          <Container>
            <p className="eyebrow !text-cyan">Inside the system</p>
            <h2 className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.055em] text-cream sm:text-7xl">
              Everything works better together.
            </h2>
            <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-cream/15 bg-cream/15 sm:grid-cols-2">
              {product.platformParts.map((part) => (
                <article key={part.number} className="bg-ink p-7 sm:p-9">
                  <StarOutline className="h-7 w-7 text-cyan" />
                  <h3 className="mt-12 font-display text-3xl tracking-[-0.04em] text-cream">
                    {part.title}
                  </h3>
                  <p className="mt-4 leading-7 text-cream/70">{part.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-sage py-24 sm:py-32">
          <Container className="text-center">
            <p className="eyebrow justify-center">Built beyond one product</p>
            <h2 className="mx-auto mt-5 max-w-4xl text-balance font-display text-[clamp(3.5rem,8vw,7rem)] leading-[0.9] tracking-[-0.065em] text-ink">
              From helmets and character ears to the whole family ride.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-ink/70">
              Glowbaby is being designed as a shared lighting platform for
              wearables, accessories, strollers, wagons, and future compatible gear.
            </p>
            <Link
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="button button-dark mt-9"
            >
              Follow the build <span aria-hidden="true">↗</span>
            </Link>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
