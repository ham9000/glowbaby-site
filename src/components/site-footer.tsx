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
          A modular, app-controlled lighting platform for more visible, more
          expressive family gear. In development.
        </p>
        <div className="flex gap-5 text-sm font-semibold text-cream/70">
          <Link href="/products" className="hover:text-cream">
            Products
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
