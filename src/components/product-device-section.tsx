import { Container } from "@/components/container";
import { DeviceRender } from "@/components/device-render";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/content/site";

export function ProductDeviceSection({ product }: { product: Product }) {
  return (
    <section id="meet-the-light" className="bg-white py-20 sm:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <DeviceRender sizes="(min-width: 1240px) 590px, (min-width: 1024px) 50vw, calc(100vw - 2.5rem)" />
        <div>
          <SectionHeading
            eyebrow="A closer look"
            title="Meet the light."
            description="A compact, rechargeable disc designed to sit beneath your stroller or wagon, with wraparound light directed outward and down."
          />
          <ul className="mt-8 divide-y divide-ink/10">
            {product.platformParts.map((part) => (
              <li key={part.number} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-lg font-bold text-ink">{part.title}</h3>
                <p className="mt-2 leading-7 text-ink/70">{part.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
