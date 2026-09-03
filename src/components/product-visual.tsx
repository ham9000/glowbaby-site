type ProductVisualProps = {
  compact?: boolean;
};

export function ProductVisual({ compact = false }: ProductVisualProps) {
  return (
    <div
      className={`product-stage ${compact ? "product-stage-compact" : ""}`}
      aria-label="Conceptual Glowbaby product illustration"
      role="img"
    >
      <span className="product-orbit product-orbit-one" />
      <span className="product-orbit product-orbit-two" />
      <span className="product-spark product-spark-one" />
      <span className="product-spark product-spark-two" />
      <span className="product-spark product-spark-three" />
      <div className="product-device">
        <div className="product-halo" />
        <div className="product-face">
          <span className="product-moon" />
          <span className="product-status">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="product-neck" />
        <div className="product-base">
          <span />
        </div>
      </div>
      <p className="product-caption">Concept form · details in development</p>
    </div>
  );
}
