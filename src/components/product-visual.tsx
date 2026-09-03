type ProductVisualProps = {
  compact?: boolean;
};

export function ProductVisual({ compact = false }: ProductVisualProps) {
  const leds = Array.from({ length: 13 });

  return (
    <div
      className={`product-stage ${compact ? "product-stage-compact" : ""}`}
      aria-label="Concept illustration of a Glowbaby-lit helmet, controller, and mobile app"
      role="img"
    >
      <span className="product-lightwash product-lightwash-one" />
      <span className="product-lightwash product-lightwash-two" />
      <div className="gear-scene">
        <div className="helmet">
          <span className="helmet-vent helmet-vent-one" />
          <span className="helmet-vent helmet-vent-two" />
          <span className="helmet-vent helmet-vent-three" />
          <span className="helmet-panel" />
          <span className="helmet-visor" />
          <span className="helmet-led-track">
            {leds.map((_, index) => (
              <i key={index} />
            ))}
          </span>
        </div>
        <div className="product-controller">
          <span className="controller-status" />
          <span className="controller-mark">G</span>
          <span className="controller-port" />
        </div>
        <div className="product-phone">
          <span className="phone-speaker" />
          <div className="phone-screen">
            <span className="phone-kicker">GLOWBABY</span>
            <span className="phone-preview">
              <i />
            </span>
            <span className="phone-mode">Color flow</span>
            <span className="phone-colors">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </div>
      <p className="product-caption">Lighting system concept · hardware and app in development</p>
    </div>
  );
}
