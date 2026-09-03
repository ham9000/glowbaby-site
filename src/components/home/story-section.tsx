import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";

export function StorySection() {
  return (
    <section className="overflow-hidden bg-sage py-24 sm:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <div className="night-window">
          <div className="night-sky">
            <span className="night-moon" />
            <span className="night-star night-star-one" />
            <span className="night-star night-star-two" />
            <span className="night-star night-star-three" />
          </div>
          <div className="night-table">
            <span className="night-glow" />
            <span className="night-device" />
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="Why Glowbaby"
            title="Nighttime changes what good design means."
            description="At night, brighter is not always better. More alerts are not always more helpful. Glowbaby starts with a simple question: what would this interaction feel like for someone who is tired, holding a baby, and trying not to wake the room?"
          />
          <div className="mt-10 grid gap-8 border-t border-ink/15 pt-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Start with context
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Design for the room, the hour, and the person—not just the device.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Earn complexity
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Add only what makes the routine meaningfully easier to understand.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
