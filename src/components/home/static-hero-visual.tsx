import Image from "next/image";
import heroIllustration from "../../../public/hero/neighborhood-hero.webp";

export function StaticHeroVisual() {
  return (
    <div className="illustrated-hero-backdrop">
      <Image
        src={heroIllustration}
        alt="An illustrated evening neighborhood walk, with rainbow light glowing around a caregiver and stroller."
        fill
        preload
        sizes="100vw"
        className="illustrated-hero-image"
      />
    </div>
  );
}
