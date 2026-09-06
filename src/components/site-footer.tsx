import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Container } from "@/components/container";
import { siteConfig } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-ink py-10 text-cream">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-[-0.03em]">
          <BrandMark className="h-9 w-9 text-cream" />
          Glowbaby
        </Link>
        <p className="max-w-md text-sm leading-6 text-cream/55">
          App-controlled under-stroller lighting for strollers and wagons. Made to be seen.
          Built to be theirs. In development.
        </p>
        <div className="flex gap-5 text-sm font-semibold text-cream/70">
          <Link href="/products/glowbaby" className="hover:text-cream">
            Product
          </Link>
          <Link href="/products/glowbaby#faq" className="hover:text-cream">
            FAQ
          </Link>
          <Link
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-cream"
          >
            GitHub ↗
          </Link>
        </div>
      </Container>
    </footer>
  );
}
