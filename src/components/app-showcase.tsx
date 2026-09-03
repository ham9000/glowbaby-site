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
          <span>Current interface captures</span>
        </div>
      </div>

      <div className="app-screen app-screen-main">
        <Image
          src="/app/glowbaby-main-screen.png"
          alt="Glowbaby app main lighting controls with connection, brightness, and preset modes"
          width={500}
          height={1024}
          sizes="(max-width: 1024px) 45vw, 260px"
        />
      </div>

      <div className="app-screen app-screen-connect">
        <Image
          src="/app/glowbaby-connect-screen.png"
          alt="Glowbaby app Bluetooth device connector screen"
          width={500}
          height={1024}
          sizes="(max-width: 1024px) 42vw, 240px"
        />
      </div>

      <p className="app-showcase-note">
        Connect hardware, adjust brightness, and choose practical or playful
        lighting modes from one app.
      </p>
    </div>
  );
}
