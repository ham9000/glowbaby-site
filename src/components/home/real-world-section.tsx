import Image from "next/image";
import neighborhoodConcept from "../../../public/concepts/neighborhood-rainbow.webp";
import parkVisibility from "../../../public/concepts/park-visibility.webp";
import intersectionVisibility from "../../../public/concepts/intersection-visibility.webp";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { exampleTestimonials, realWorldScenarios } from "@/content/site";

const conceptImages = {
  "evening-walk": { src: neighborhoodConcept, position: "50% 50%", alt: "An elevated neighborhood illustration with a caregiver pushing a stroller surrounded by rainbow light along the sidewalk." },
  "park-path": { src: parkVisibility, position: "50% 50%", alt: "An isometric park at night with a winding path, pond and benches, and a caregiver pushing a stroller surrounded by warm amber visibility light." },
  "family-event": { src: intersectionVisibility, position: "50% 50%", alt: "A closer isometric view of a neighborhood intersection at night, with a car approaching on the cross street and a caregiver starting to push an amber-lit stroller off the curb to cross the street." },
};

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
              className="real-world-card overflow-hidden rounded-[2rem] border border-ink/10 bg-cream"
            >
              <div className="relative overflow-hidden">
                  <Image
                    src={conceptImages[scenario.scene].src}
                    alt={conceptImages[scenario.scene].alt}
                    sizes="(min-width: 1024px) 33vw, calc(100vw - 2rem)"
                    className="block aspect-[3/2] w-full object-cover object-center"
                    style={{ objectPosition: conceptImages[scenario.scene].position }}
                  />
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
