import Link from "next/link";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/content/site";

export function CatalogSection({ product }: { product: Product }) {
  return (
    <section id="use-cases" className="bg-cream py-24 sm:py-32">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Made to move with families"
            title="One platform. Many ways to glow."
            description="Start with wearable gear, then extend the same connected lighting experience to more of the things families bring outside."
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
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {product.useCases.map((useCase, index) => (
            <article
              key={useCase.title}
              className={`use-case-card ${index === 1 ? "use-case-card-violet" : ""} ${index === 2 ? "use-case-card-cyan" : ""}`}
            >
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink/65">
                0{index + 1}
              </span>
              <div className="mt-20">
                <h3 className="font-display text-3xl leading-none tracking-[-0.045em] text-ink">
                  {useCase.title}
                </h3>
                <p className="mt-4 leading-7 text-ink/70">{useCase.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
