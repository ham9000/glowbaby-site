import Link from "next/link";
import { ProductVisual } from "@/components/product-visual";
import type { Product } from "@/content/site";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group grid overflow-hidden rounded-[2rem] border border-ink/10 bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-between p-7 sm:p-10">
        <div>
          <p className="eyebrow">{product.status}</p>
          <h2 className="mt-4 font-display text-5xl leading-none tracking-[-0.055em] text-ink">
            {product.name}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink/70">
            {product.description}
          </p>
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-ink"
        >
          Explore product
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
      <div className="min-h-[360px] bg-sage/55 p-4">
        <ProductVisual compact />
      </div>
    </article>
  );
}
