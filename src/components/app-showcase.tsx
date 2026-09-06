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
          <span>Current interface · no device connected</span>
        </div>
      </div>

      <div className="app-screen app-screen-main">
        <Image
          src="/app/glowbaby-main-screen.png"
          alt="Current Glowbaby app showing connection, brightness, and lighting-mode controls with no device connected"
          width={500}
          height={1024}
          sizes="(max-width: 640px) 60vw, 260px"
        />
      </div>

      <p className="app-showcase-note">
        A real app interface in development. Connection, brightness, and
        lighting presets together in one place.
      </p>
    </div>
  );
}
