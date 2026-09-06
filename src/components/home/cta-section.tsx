import Link from "next/link";
import { Container } from "@/components/container";
import { companionApp, siteConfig } from "@/content/site";

export function CtaSection() {
  return (
    <section id="development" className="relative scroll-mt-28 overflow-hidden bg-blush py-20 sm:py-24">
      <span className="cta-orb cta-orb-one" />
      <span className="cta-orb cta-orb-two" />
      <Container className="relative text-center">
        <p className="eyebrow eyebrow-strong justify-center">In development</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-balance font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.065em] text-ink">
          Put visibility first.
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-ink">
          Seeing your surroundings and being noticed by others are both part of a
          safer outing. Glowbaby is being developed to bring light around your
          stroller or wagon and help others notice you after dark—with personal
          expression alongside that purpose.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink/75">
          {companionApp.availability} The stroller-light hardware is not yet
          available to buy; mounting, compatibility, and specifications are still
          being evaluated.
        </p>
        {/* TODO: Add a launch-list CTA only when a real signup destination is configured and verified. */}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/products/glowbaby" className="button button-dark">
            Explore the stroller light <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="button button-light"
          >
            Follow the build <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
