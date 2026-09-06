import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { StarOutline } from "@/components/star-outline";
import type { Product } from "@/content/site";

export function ProductFaq({ product }: { product: Product }) {
  return (
    <section id="faq" className="scroll-mt-28 bg-white py-20 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.65fr_1fr] lg:gap-16">
        <SectionHeading
          eyebrow="A few useful answers"
          title="Before the first bright ride."
          description="What Glowbaby is being built to do, and what is still taking shape."
        />
        <div className="border-t border-ink/15">
          {product.faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-ink/15">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-bold leading-6 text-ink">
                {faq.question}
                <span className="flex shrink-0 items-center gap-2 text-violet">
                  <StarOutline className="h-5 w-5" />
                  <span aria-hidden="true" className="group-open:hidden">+</span>
                  <span aria-hidden="true" className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-4 leading-7 text-ink/70">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
