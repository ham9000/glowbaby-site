import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { StarOutline } from "@/components/star-outline";
import type { Product } from "@/content/site";

export function PrinciplesSection({ product }: { product: Product }) {
  return (
    <section id="approach" className="scroll-mt-28 bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Visibility meets expression"
          title="Practical light with a playful side."
          description="Glowbaby is being built for parents who want their stroller or wagon to be more noticeable after dark—and for kids who want the ride to feel colorful, animated, and completely their own."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {product.principles.map((principle, index) => (
            <article
              key={principle.number}
              className={`principle-card ${index === 1 ? "principle-card-accent" : ""}`}
            >
              <StarOutline className="h-7 w-7 text-violet" />
              <div className="mt-10">
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
