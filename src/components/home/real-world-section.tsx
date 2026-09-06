import { Container } from "@/components/container";
import { RealWorldScene } from "@/components/real-world-scene";
import { SectionHeading } from "@/components/section-heading";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { exampleTestimonials, realWorldScenarios } from "@/content/site";

export function RealWorldSection() {
  return (
    <section id="in-the-wild" className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Out in the world"
          title="Picture your next evening out."
          description="Illustrated possibilities for Glowbaby, not product photography. The hardware and its final performance are still in development."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {realWorldScenarios.map((scenario) => (
            <figure
              key={scenario.scene}
              className="overflow-hidden rounded-[2rem] border border-ink/10 bg-cream"
            >
              <div className="relative overflow-hidden">
                <RealWorldScene scene={scenario.scene} className="block h-auto w-full" />
                <span className="absolute left-4 top-4 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-cream">
                  Concept illustration
                </span>
              </div>
              <figcaption className="p-6 sm:p-7">
                <h3 className="font-display text-2xl text-ink">{scenario.title}</h3>
                <p className="mt-4 text-sm leading-6 text-ink/70">{scenario.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-12 sm:mt-16">
          <TestimonialCarousel quotes={exampleTestimonials} />
        </div>
      </Container>
    </section>
  );
}
