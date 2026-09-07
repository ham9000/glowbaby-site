export type LightMode = "glow" | "flow" | "visibility";

export const lightModes: { id: LightMode; label: string; description: string }[] = [
  { id: "glow", label: "Glow", description: "A soft, steady lavender glow." },
  { id: "flow", label: "Color flow", description: "A playful blend of colors around the whole light." },
  { id: "visibility", label: "Visibility", description: "A steady warm amber light." },
];

// Meter units. Keep source models untouched; tune the assembly here.
export const heroSceneConfig = {
  // Enable only after the body files, licensed delivery model, and matching posters exist.
  assetsReady: false,
  models: {
    stroller: "/models/hero/stroller.glb",
    bottom: "/models/hero/bottom.glb",
    top: "/models/hero/top.glb",
  },
  minWidth: 900,
  maxDpr: 1.5,
  strollerHeight: 0.962,
  assembly: {
    position: [0, 0.17, 0.025] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1,
    topOffset: 0.025,
  },
  channel: {
    radiusX: 0.085,
    radiusZ: 0.067,
    y: 0.008,
    width: 0.01508,
    height: 0.0127,
    profileScale: 1,
    rotation: 0,
    segments: 192,
  },
  lightIntensity: 0.65,
  // Comparable glow treatment: a soft additive ground spill, without a full-screen bloom pass.
  spillOpacity: 0.24,
  camera: { position: [1.15, 0.67, 1.65] as [number, number, number], target: [0, 0.43, 0] as [number, number, number], fov: 35 },
  interaction: { yaw: Math.PI / 18, pitch: Math.PI / 45, damping: 5 },
};
