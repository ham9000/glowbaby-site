import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/content/site";

export function PlatformSection({ product }: { product: Product }) {
  return (
    <section id="platform" className="bg-ink py-24 text-cream sm:py-32">
      <Container>
        <div className="[&_.eyebrow]:text-cyan [&_h2]:text-cream [&_p]:text-cream/70">
          <SectionHeading
            eyebrow="The Glowbaby platform"
            title="Four parts. One bright idea."
            description="A modular architecture makes Glowbaby useful beyond a single form factor. The same core system can move across compatible products as the platform grows."
          />
        </div>
        <div className="mt-16 border-t border-cream/15">
          {product.platformParts.map((part) => (
            <article
              key={part.number}
              className="grid gap-5 border-b border-cream/15 py-8 sm:grid-cols-[5rem_1fr] sm:items-start sm:gap-10"
            >
              <span className="text-sm font-bold text-cream/55">{part.number}</span>
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
