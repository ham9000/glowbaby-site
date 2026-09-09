import Link from "next/link";
import { Container } from "@/components/container";
import { StaticHeroVisual } from "./static-hero-visual";
import { siteConfig, type Product } from "@/content/site";

export function HeroSection({ product }: { product: Product }) {
  return (
    <section className="illustrated-hero relative overflow-hidden bg-cream pb-14 sm:pb-20">
      <div className="illustrated-hero-scene">
        <StaticHeroVisual />
      <Container className="illustrated-hero-content relative">
        <div className="illustrated-hero-copy relative z-10">
          <p className="eyebrow leading-relaxed !text-white/75">{product.eyebrow}</p>
          <h1 className="mt-5 font-display text-[clamp(2.9rem,5.5vw,5.5rem)] text-white">
            <span className="block">Made to be <span className="text-[#ff85ad]">seen.</span></span>
            <span className="block">Built to be <span className="text-[#c6acff]">theirs.</span></span>
          </h1>
          <p className="mt-8 max-w-xl text-pretty text-base leading-7 text-white/80">
            {product.description}
          </p>
          <p className="mt-4 text-sm font-semibold text-white/75">
            {product.status} · Not yet available to buy
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="#how-it-works" className="button hero-primary">
              See how it works
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="button hero-secondary"
            >
              Follow the build <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </Container>
      </div>
      <Container className="relative mt-6">
        <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-ink/10 bg-ink/10 sm:grid-cols-3">
          {[
            ["Help others notice you", "A visible presence after dark"],
            ["See around your ride", "Light directed outward and downward"],
            ["Simple app control", "Set brightness and modes before you go"],
          ].map(([title, detail]) => (
            <div key={title} className="bg-cream/90 px-6 py-5 backdrop-blur">
              <p className="text-sm font-bold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink/70">{detail}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
