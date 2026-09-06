import Link from "next/link";
import { Container } from "@/components/container";
import { ProductVisual } from "@/components/product-visual";
import { siteConfig, type Product } from "@/content/site";

export function HeroSection({ product }: { product: Product }) {
  return (
    <section className="hero-grid relative overflow-hidden bg-cream pb-14 pt-32 sm:pb-20 sm:pt-40">
      <div className="hero-blob hero-blob-one" />
      <div className="hero-blob hero-blob-two" />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <div className="relative z-10 max-w-2xl py-6 lg:py-14">
          <p className="eyebrow leading-relaxed">{product.eyebrow}</p>
          <h1 className="mt-5 font-display text-[clamp(3.5rem,7vw,6.5rem)] text-ink">
            <span className="block whitespace-nowrap">Made to be</span>
            <span className="block whitespace-nowrap text-coral">seen.</span>
            <span className="block whitespace-nowrap pl-[0.32em]">Built to be</span>
            <span className="block whitespace-nowrap pl-[0.68em] text-violet">theirs.</span>
          </h1>
          <p className="mt-8 max-w-xl text-pretty text-lg leading-8 text-ink/70">
            {product.description}
          </p>
          <p className="mt-4 text-sm font-semibold text-ink/70">
            {product.status} · Not yet available to buy
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="#how-it-works" className="button button-dark">
              See how it works
              <span aria-hidden="true">→</span>
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
        </div>
        <div className="relative aspect-[1.05] w-full">
          <ProductVisual />
        </div>
      </Container>
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
