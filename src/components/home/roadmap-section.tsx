import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";

const stages = [
  {
    number: "01",
    title: "Explore",
    detail:
      "Understand the moments that make nighttime care feel confusing, disruptive, or harder than it needs to be.",
    state: "Now",
  },
  {
    number: "02",
    title: "Refine",
    detail:
      "Turn the strongest ideas into focused prototypes and learn from real use before making broad promises.",
    state: "Next",
  },
  {
    number: "03",
    title: "Launch",
    detail:
      "Share a product only when its purpose, experience, and support model are ready to stand behind.",
    state: "Later",
  },
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="bg-ink py-24 text-cream sm:py-32">
      <Container>
        <div className="[&_.eyebrow]:text-peach [&_h2]:text-cream [&_p]:text-cream/55">
          <SectionHeading
            eyebrow="The roadmap"
            title="Build slowly enough to get it right."
            description="Glowbaby is at the beginning. This site separates what is being explored now from what still needs to be proven."
          />
        </div>
        <div className="mt-16 border-t border-cream/15">
          {stages.map((stage) => (
            <article
              key={stage.number}
              className="grid gap-5 border-b border-cream/15 py-8 sm:grid-cols-[5rem_1fr_auto] sm:items-start sm:gap-10"
            >
              <span className="text-sm font-bold text-cream/55">{stage.number}</span>
              <div className="grid gap-3 lg:grid-cols-[0.55fr_1fr] lg:gap-12">
                <h3 className="font-display text-4xl tracking-[-0.045em] text-cream">
                  {stage.title}
                </h3>
                <p className="max-w-xl leading-7 text-cream/55">{stage.detail}</p>
              </div>
              <span className="w-fit rounded-full border border-cream/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-peach">
                {stage.state}
              </span>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
