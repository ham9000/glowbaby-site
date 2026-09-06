import Link from "next/link";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { StarOutline } from "@/components/star-outline";
import type { Product } from "@/content/site";

export function CatalogSection({ product }: { product: Product }) {
  return (
    <section id="use-cases" className="scroll-mt-28 bg-cream py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Looking ahead"
            title="Start with one light. Grow with the ride."
            description="The stroller light comes first. Future compatible lights and accessories could build on the same controller-and-app experience for strollers and wagons. These are directions we’re exploring, not products available today."
          />
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-ink"
          >
            Meet the stroller light <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {product.useCases.map((useCase) => (
            <article
              key={useCase.title}
              className="rounded-[1.75rem] border border-ink/10 bg-white/65 p-6 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <StarOutline className="h-6 w-6 text-violet" />
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/70">
                  {useCase.status}
                </p>
              </div>
              <div className="mt-6">
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
