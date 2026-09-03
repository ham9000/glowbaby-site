import Link from "next/link";
import { Container } from "@/components/container";
import { siteConfig } from "@/content/site";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-coral py-24 sm:py-32">
      <span className="cta-orb cta-orb-one" />
      <span className="cta-orb cta-orb-two" />
      <Container className="relative text-center">
        <p className="eyebrow eyebrow-strong justify-center">Follow along</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-balance font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.065em] text-ink">
          Light up what comes next.
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-ink">
          Glowbaby is being developed as an expandable family lighting platform.
          Follow the public build as the hardware, app, and first accessories take shape.
        </p>
        <Link
          href={siteConfig.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="button button-dark mt-9"
        >
          Open the GitHub repository
          <span aria-hidden="true">↗</span>
        </Link>
      </Container>
    </section>
  );
}
