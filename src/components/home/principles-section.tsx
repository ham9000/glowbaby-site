import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { StarOutline } from "@/components/star-outline";
import { visibilityGuidance, type Product } from "@/content/site";

export function PrinciplesSection({ product }: { product: Product }) {
  return (
    <section id="approach" className="scroll-mt-28 bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Safety-minded by design"
          title="Visibility works both ways."
          description="Seeing the space around your ride and being noticed by others both matter after dark. Glowbaby is being designed for both: light underfoot and a more visible presence for people nearby."
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
        <aside className="mt-8 rounded-[2rem] border border-violet/15 bg-sage/50 p-7 sm:p-9" aria-labelledby="visibility-guidance">
          <h3 id="visibility-guidance" className="font-display text-2xl text-ink">
            Light helps. Good habits matter.
          </h3>
          <p className="mt-4 leading-7 text-ink/75">{visibilityGuidance.habits}</p>
          <p className="mt-3 text-sm leading-6 text-ink/70">{visibilityGuidance.limitations}</p>
        </aside>
      </Container>
    </section>
  );
}
