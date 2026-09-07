export type LightMode = "visibility" | "flow" | "holiday";

export const lightModes: { id: LightMode; label: string; description: string }[] = [
  { id: "visibility", label: "Visibility", description: "A steady warm amber light." },
  { id: "flow", label: "Gradient", description: "A playful blend of colors around the whole light." },
  { id: "holiday", label: "Holiday", description: "Rotating red and white bands around the light." },
];

// Meter units. Keep source models untouched; tune the assembly here.
export const heroSceneConfig = {
  // Local preview only. The production controller supplies protected, embedded GLBs.
  models: {
    stroller: "/models/hero/stroller.glb",
    bottom: "/models/hero/bottom.glb",
    top: "/models/hero/top.glb",
  },
  minWidth: 900,
  maxDpr: 1.5,
  strollerHeight: 0.962,
  assembly: {
    position: [0, 0.1402, 0.065] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1,
    topOffset: 0.025,
  },
  channel: {
    radiusX: 0.094,
    radiusZ: 0.075,
    y: 0.012,
    width: 0.01508,
    height: 0.0127,
    profileScale: 1,
    rotation: 0,
    segments: 192,
  },
  stage: {
    fogNear: 2.3,
    fogFar: 7,
    exposure: 1,
    floor: { color: "#575964", roughness: 0.94, size: 200, y: -0.006 },
  },
  sidewalk: {
    slabSize: [1.15, 1.35] as [number, number],
    offset: [0.42, 1.1] as [number, number],
    seamWidth: 0.006,
    seamSoftness: 0.003,
    seamDarkness: 0.32,
    seamDepth: 0.0015,
    slabVariation: 0.055,
    mottleScale: 7,
    mottleStrength: 0.16,
    grainScale: 350,
    grainStrength: 0.09,
    grainDepth: 0.00035,
    roughnessVariation: 0.065,
  },
  materials: {
    base: { color: "#eee9e3", roughness: 0.48 },
    top: { color: "#24232b", roughness: 0.62 },
  },
  attachment: {
    size: [0.018, 0.003, 0.112] as [number, number, number],
    offsetsX: [-0.046, 0.046],
    y: 0.0315,
  },
  diffuser: { color: "#fffaf1", opacity: 0.12, roughness: 0.4 },
  emission: {
    base: 0.18,
    brightness: 2.1,
    idleLevel: 0.04,
    pulseIntensity: 0.85,
    pulseSharpness: 220,
    settleStart: 0.85,
    activationSeconds: 2.4,
  },
  colorRotationSpeed: 0.055,
  holiday: {
    stripes: 8,
    softness: 0.12,
    spillSoftness: 0.8,
    red: [1, 0.008, 0.02] as [number, number, number],
    white: [1, 1, 1] as [number, number, number],
  },
  environment: {
    background: "#171827",
    sky: "#ffffff",
    ground: "#55535a",
    intensity: 1.35,
    key: {
      color: "#fff8f2", intensity: 2.1,
      position: [2, 3, 2] as [number, number, number],
    },
    rim: {
      color: "#eef0ff", intensity: 0.7,
      position: [-2, 1.7, -1.4] as [number, number, number],
    },
  },
  // Faint local grounding at the actual wheel contacts, not a projected silhouette.
  contactShadow: {
    color: "#090911",
    opacity: 0.14,
    sampleHeight: 0.012,
    mergeDistance: 0.035,
    spread: 0.035,
    maxSize: 0.18,
    elevation: 0.001,
    falloff: 2.8,
    edgeStart: 0.55,
  },
  // Broad overlapping downward light approximates a continuous diffuser, not separate beams.
  lightIntensity: 0.9,
  underglow: {
    samples: 3,
    distance: 1.6,
    decay: 0,
    sourceOffsetY: -0.002,
    sourceOutset: 0.002,
    targetOffset: 0,
    coneAngle: Math.PI / 2 - Math.PI / 90,
    minimumDownwardAngle: Math.PI / 90,
    penumbra: 0.15,
    shadowSize: 512,
    shadowNear: 0.01,
    shadowBias: -0.00015,
    shadowNormalBias: 0.002,
  },
  // Floor-only soft bounce supplements the physically occluded direct light.
  spillOpacity: 0.7,
  spill: {
    size: [1.8, 1.55] as [number, number],
    elevation: 0.003,
    brightness: 0.95,
    falloff: 1,
    edgeStart: 0.3,
    edgeEnd: 0.5,
    centerColor: [0.66, 0.52, 0.82] as [number, number, number],
    centerBlendRadius: 0.15,
    centerStrength: 1,
    centerRadius: 0.16,
  },
  // Low three-quarter detail framing; product dimensions and mounting stay unchanged.
  camera: { position: [0.48, 0.235, 0.56] as [number, number, number], target: [0, 0.12, 0.065] as [number, number, number], fov: 38 },
  interaction: { yaw: Math.PI / 24, pitch: Math.PI / 90, damping: 5, returnDamping: 3, dragSensitivity: 2 },
};
