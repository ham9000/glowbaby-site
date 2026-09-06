import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { StarOutline } from "@/components/star-outline";
import type { Product } from "@/content/site";

export function HowItWorks({ product }: { product: Product }) {
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-cream py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="A little light. A ride of their own."
          description="The setup we’re building pairs a bottom-mounted stroller light with simple app controls. It shines outward, around the ride, and down toward the ground. Fit and mounting details are still being refined."
        />
        <ol className="mt-10 grid list-none gap-8 lg:grid-cols-3">
          {product.howItWorks.map((step) => (
            <li key={step.number} className="border-t border-ink/15 pt-6">
              <StarOutline className="h-7 w-7 text-violet" />
              <h3 className="mt-6 font-display text-3xl tracking-[-0.04em] text-ink">
                {step.title}
              </h3>
              <p className="mt-4 leading-7 text-ink/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
