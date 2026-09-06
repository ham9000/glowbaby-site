import { StrollerGraphic } from "@/components/stroller-graphic";

type ProductVisualProps = {
  compact?: boolean;
};

export function ProductVisual({ compact = false }: ProductVisualProps) {
  return (
    <figure
      className={`product-stage ${compact ? "product-stage-compact" : ""}`}
    >
      <div className="stroller-scene">
        <span className="product-lightwash product-lightwash-one" aria-hidden="true" />
        <span className="product-lightwash product-lightwash-two" aria-hidden="true" />
        <StrollerGraphic className="stroller-graphic" />
      </div>
      <figcaption className="product-caption">
        Bottom-mounted light + controller concept
        <span>In development · final design may change</span>
      </figcaption>
    </figure>
  );
}
