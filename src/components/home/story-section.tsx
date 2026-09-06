import Link from "next/link";
import { AppShowcase } from "@/components/app-showcase";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { companionApp } from "@/content/site";

export function StorySection() {
  return (
    <section id="app" className="scroll-mt-28 overflow-hidden bg-sage py-20 sm:py-24">
      <Container className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="The Glowbaby companion app"
            title="The app. Ready on iOS."
            description="Set brightness and practical lighting modes before you head out. The Glowbaby companion app brings your controls together, with colors and playful presets when you want them."
          />
          <p className="mt-5 text-sm font-semibold leading-6 text-ink/70">
            {companionApp.availability}
          </p>
          <Link
            href={companionApp.appStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="button button-dark mt-6"
          >
            Download on the App Store <span aria-hidden="true">↗</span>
          </Link>
          <div className="mt-10 grid gap-8 border-t border-ink/15 pt-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Ready before you go
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Choose your lighting mode before the walk, check your power
                source, and adjust brightness for the setting and people around you.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink/70">
                Practical can be personal
              </p>
              <p className="mt-3 leading-7 text-ink/70">
                Visibility is the reason for the light. Colors and animations
                give it a personal touch for family events and everyday adventures.
              </p>
            </div>
          </div>
        </div>
        <AppShowcase />
      </Container>
    </section>
  );
}
