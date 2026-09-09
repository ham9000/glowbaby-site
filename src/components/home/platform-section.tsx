import Link from "next/link";
import { Container } from "@/components/container";
import { DeviceRender } from "@/components/device-render";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/content/site";

export function PlatformSection({ product }: { product: Product }) {
  return (
    <section id="platform" className="scroll-mt-28 bg-ink py-20 text-cream sm:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="[&_.eyebrow]:text-cyan [&_h2]:text-cream [&_p]:text-cream/70">
            <SectionHeading
              eyebrow="Meet Glowbaby"
              title="One rechargeable light. Your app."
              description="Wraparound light and an internal rechargeable LiPo battery in one device. Set brightness and lighting modes through the companion app before you go."
            />
          </div>
          <Link href={`/products/${product.slug}#meet-the-light`} className="button button-light mt-8">
            Take a closer look <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <DeviceRender sizes="(min-width: 1240px) 550px, (min-width: 1024px) 45vw, calc(100vw - 2.5rem)" />
      </Container>
    </section>
  );
}
