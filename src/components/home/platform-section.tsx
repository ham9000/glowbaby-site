import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { StarOutline } from "@/components/star-outline";
import type { Product } from "@/content/site";

export function PlatformSection({ product }: { product: Product }) {
  return (
    <section id="platform" className="scroll-mt-28 bg-ink py-20 text-cream sm:py-24">
      <Container>
        <div className="[&_.eyebrow]:text-cyan [&_h2]:text-cream [&_p]:text-cream/70">
          <SectionHeading
            eyebrow="The stroller-light system"
            title="Four parts. One bright ride."
            description="An under-stroller light, a compact controller, separate power, and a companion app come together around one thing: a more noticeable, more personal stroller or wagon ride."
          />
        </div>
        <div className="mt-12 border-t border-cream/15">
          {product.platformParts.map((part) => (
            <article
              key={part.number}
              className="grid gap-5 border-b border-cream/15 py-8 sm:grid-cols-[5rem_1fr] sm:items-start sm:gap-10"
            >
              <StarOutline className="h-7 w-7 text-cyan" />
              <div className="grid gap-3 lg:grid-cols-[0.55fr_1fr] lg:gap-12">
                <h3 className="font-display text-4xl tracking-[-0.045em] text-cream">
                  {part.title}
                </h3>
                <p className="max-w-xl leading-7 text-cream/70">{part.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
