import Link from "next/link";
import { Container } from "@/components/container";
import { siteConfig } from "@/content/site";

export function CtaSection() {
  return (
    <section id="development" className="relative scroll-mt-28 overflow-hidden bg-blush py-20 sm:py-24">
      <span className="cta-orb cta-orb-one" />
      <span className="cta-orb cta-orb-two" />
      <Container className="relative text-center">
        <p className="eyebrow eyebrow-strong justify-center">In development</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-balance font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.065em] text-ink">
          See where Glowbaby goes next.
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-ink">
          Glowbaby is being developed around one focused idea: make stroller
          lighting more visible, more expressive, and easier for families to make
          their own. Follow the build as the hardware, app, and first stroller-light
          experience take shape.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink/75">
          The current app interface is previewed above. Bottom mounting, compatibility,
          and final specifications are still being evaluated. Not yet available to buy.
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
