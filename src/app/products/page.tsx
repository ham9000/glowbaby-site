import type { Metadata } from "next";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { products } from "@/content/site";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore current and future Glowbaby products.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-cream pb-24 pt-40 sm:pb-32 sm:pt-48">
        <Container>
          <p className="eyebrow">Product catalogue</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-[clamp(4rem,9vw,8rem)] leading-[0.88] tracking-[-0.07em] text-ink">
            Products with a reason to exist.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-ink/70">
            Glowbaby is the first concept. This catalogue is structured to grow
            as new products move from exploration to something ready to share.
          </p>
          <div className="mt-16 grid gap-6">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
