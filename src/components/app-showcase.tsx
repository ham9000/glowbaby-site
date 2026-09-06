import Image from "next/image";

export function AppShowcase() {
  return (
    <div className="app-showcase">
      <div className="app-showcase-brand">
        <Image
          src="/app/glowbaby-app-icon.png"
          alt=""
          width={48}
          height={48}
          className="rounded-xl"
        />
        <div>
          <p>Glowbaby companion app</p>
          <span>Interface preview · no device connected</span>
        </div>
      </div>

      <div className="app-screen app-screen-main">
        <Image
          src="/app/glowbaby-main-screen.png"
          alt="Glowbaby app interface showing connection, brightness, and lighting-mode controls with no device connected"
          width={500}
          height={1024}
          sizes="(max-width: 640px) 60vw, 260px"
        />
      </div>

      <p className="app-showcase-note">
        App interface preview. Screens and controls may change as the app evolves.
      </p>
    </div>
  );
}
