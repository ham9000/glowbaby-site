import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Container } from "@/components/container";
import { siteConfig } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <Container className="flex h-24 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-[1.05rem] font-bold tracking-[-0.03em] text-ink"
          aria-label="Glowbaby home"
        >
          <BrandMark className="h-9 w-9 text-ink" />
          Glowbaby
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {siteConfig.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-ink/70 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="button button-dark"
          >
            Follow the build
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-ink/15 bg-white/65 backdrop-blur">
            <span className="sr-only">Open navigation</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span className="h-px w-full bg-ink transition-transform group-open:translate-y-[3.5px] group-open:rotate-45" />
              <span className="h-px w-full bg-ink transition-transform group-open:-translate-y-[3.5px] group-open:-rotate-45" />
            </span>
          </summary>
          <div className="absolute right-0 mt-3 w-64 rounded-[1.5rem] border border-ink/10 bg-cream p-3 shadow-2xl shadow-ink/10">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-ink/75 hover:bg-white/70 hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="button button-dark mt-2 justify-center"
              >
                Follow the build
              </Link>
            </nav>
          </div>
        </details>
      </Container>
    </header>
  );
}
