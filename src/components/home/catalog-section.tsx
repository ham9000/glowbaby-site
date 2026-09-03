import Link from "next/link";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/content/site";

export function CatalogSection({ product }: { product: Product }) {
  return (
    <section className="bg-cream py-24 sm:py-32">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="The product family"
            title="One idea now. Room to grow."
          />
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-ink"
          >
            View all products <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-14">
          <ProductCard product={product} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-dashed border-ink/20 p-8 sm:p-10">
            <p className="eyebrow">Future-ready</p>
            <h3 className="mt-12 font-display text-4xl tracking-[-0.045em] text-ink">
              The next product has a place to land.
            </h3>
            <p className="mt-4 max-w-md leading-7 text-ink/70">
              The catalogue and product routes are data-driven, so new ideas can
              be added without rebuilding the site structure.
            </p>
          </div>
          <div className="rounded-[2rem] bg-peach p-8 sm:p-10">
            <p className="eyebrow">One clear system</p>
            <h3 className="mt-12 font-display text-4xl tracking-[-0.045em] text-ink">
              A consistent story from first idea to launch.
            </h3>
            <p className="mt-4 max-w-md leading-7 text-ink/70">
              Shared navigation, product cards, metadata, and discovery data keep
              the experience coherent as the catalogue grows.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
