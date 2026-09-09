import { Container } from "@/components/container";
import { InteractiveHeroMedia } from "@/components/home/interactive-hero-media";
import { SectionHeading } from "@/components/section-heading";
import { hasProtectedHeroScene } from "@/lib/hero-assets-server";

export function ProductStrollerSection() {
  return (
    <section id="stroller-view" className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="The light in place"
          title="See it beneath the stroller."
          description="Explore the prototype position and compare Visibility and Gradient modes. Mounting and supported stroller or wagon models are still being evaluated."
        />
        <div className="visibility-viewer mt-10">
          <InteractiveHeroMedia sceneAvailable={hasProtectedHeroScene()} />
        </div>
        <p className="mt-6 text-center text-xs leading-6 text-ink/60">
          Prototype visualization &middot; Not a product photograph or a measurement of light output.
        </p>
      </Container>
    </section>
  );
}
