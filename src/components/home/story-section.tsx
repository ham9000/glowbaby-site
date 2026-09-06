import { AppShowcase } from "@/components/app-showcase";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";

export function StorySection() {
  return (
    <section id="app" className="scroll-mt-28 overflow-hidden bg-sage py-20 sm:py-24">
      <Container className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="The Glowbaby companion app"
            title="The real app is already taking shape."
            description="The Glowbaby companion app brings connection, brightness, colors, practical modes, and playful presets together in one place. This is the current app interface—a look at the stroller-light experience as it develops."
          />
          <div className="mt-10 grid gap-8 border-t border-ink/15 pt-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                A glow for evening walks
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Choose a distinctive glow beneath and around your stroller or
                wagon, from neighborhood walks to busy family events.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Personality on demand
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Give the ride its own colors and animations for a family
                adventure—or simply because today calls for purple.
              </p>
            </div>
          </div>
        </div>
        <AppShowcase />
      </Container>
    </section>
  );
}
