import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/content/site";

export function PrinciplesSection({ product }: { product: Product }) {
  return (
    <section id="approach" className="bg-white py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="The approach"
          title="Less noise. More knowing."
          description="These are design directions, not finished feature claims. They keep the product focused while Glowbaby moves from idea to something families can meaningfully test."
        />
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {product.principles.map((principle, index) => (
            <article
              key={principle.number}
              className={`principle-card ${index === 1 ? "principle-card-accent" : ""}`}
            >
              <span className="text-sm font-bold text-ink/65">{principle.number}</span>
              <div className="mt-20">
                <h3 className="font-display text-4xl leading-none tracking-[-0.045em] text-ink">
                  {principle.title}
                </h3>
                <p className="mt-5 text-base leading-7 text-ink/70">
                  {principle.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
