"use client";

import { useState, type CSSProperties } from "react";

const colors = [
  { name: "Electric violet", value: "#8b5cf6" },
  { name: "Aqua blue", value: "#22d3ee" },
  { name: "Glow coral", value: "#fb7185" },
  { name: "Lime flash", value: "#a3e635" },
] as const;

const modes = ["Steady", "Pulse", "Color flow"] as const;

export function LightingDemo() {
  const [color, setColor] = useState<(typeof colors)[number]>(colors[0]);
  const [mode, setMode] = useState<(typeof modes)[number]>("Color flow");
  const style = { "--demo-color": color.value } as CSSProperties;

  return (
    <div className="lighting-demo" style={style} data-mode={mode.toLowerCase().replace(" ", "-")}>
      <div className="demo-preview">
        <span className="demo-label">Live concept preview</span>
        <div className="demo-helmet">
          <span className="demo-helmet-shell" />
          <span className="demo-led-line">
            {Array.from({ length: 11 }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
        </div>
        <span className="demo-bluetooth">Bluetooth connected</span>
      </div>
      <div className="demo-controls">
        <div>
          <p className="demo-control-label">Choose a color</p>
          <div className="demo-color-row">
            {colors.map((option) => (
              <button
                key={option.name}
                type="button"
                className={color.name === option.name ? "is-selected" : ""}
                style={{ backgroundColor: option.value }}
                aria-pressed={color.name === option.name}
                onClick={() => setColor(option)}
              >
                <span className="sr-only">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="demo-control-label">Lighting mode</p>
          <div className="demo-mode-row">
            {modes.map((option) => (
              <button
                key={option}
                type="button"
                className={mode === option ? "is-selected" : ""}
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <p className="demo-disclaimer">
          Companion app interface shown as a product concept.
        </p>
      </div>
    </div>
  );
}
