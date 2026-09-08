import Image from "next/image";
import heroRender from "../../../public/hero/stroller-hero-static.webp";

export function StaticHeroVisual() {
  return (
    <figure className="static-hero-visual">
      <div className="static-hero-art">
        <Image
          src={heroRender}
          alt="Glowbaby mounted beneath a stroller, casting a colorful light across the ground."
          fill
          preload
          sizes="(min-width: 1024px) 48vw, calc(100vw - 2rem)"
          className="static-hero-image"
        />
      </div>
      <figcaption className="product-caption">
        Bottom-mounted light concept
        <span>Rendered from the developing 3D design · final design may change</span>
      </figcaption>
    </figure>
  );
}
