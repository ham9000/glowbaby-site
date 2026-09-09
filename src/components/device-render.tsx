import Image from "next/image";
import deviceRender from "../../public/hero/glowbaby-device.webp";

export function DeviceRender({ sizes }: { sizes: string }) {
  return (
    <figure>
      <Image
        src={deviceRender}
        alt="Three-quarter view of the Glowbaby prototype, showing its dark disc-shaped housing and wraparound light diffuser."
        sizes={sizes}
        className="h-auto w-full rounded-[2rem]"
      />
      <figcaption className="mt-4 text-center text-xs leading-6 opacity-70">
        Prototype render &middot; Design in development.
      </figcaption>
    </figure>
  );
}
