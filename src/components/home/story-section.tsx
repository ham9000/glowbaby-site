import { Container } from "@/components/container";
import { LightingDemo } from "@/components/lighting-demo";
import { SectionHeading } from "@/components/section-heading";

export function StorySection() {
  return (
    <section className="overflow-hidden bg-sage py-24 sm:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="One connected ecosystem"
            title="Hardware and app, designed as one."
            description="The flexible lighting, Bluetooth controller, USB-C power source, and companion app are being developed as parts of the same experience. Attach the light, connect the controller, then choose how the gear should glow."
          />
          <div className="mt-10 grid gap-8 border-t border-ink/15 pt-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Visibility when it matters
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Add a distinct light signature to gear used on neighborhood rides,
                evening walks, and busy events.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Personality on demand
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Shift colors and motion for festivals, parades, theme parks,
                Halloween, or simply because today calls for purple.
              </p>
            </div>
          </div>
        </div>
        <LightingDemo />
      </Container>
    </section>
  );
}
