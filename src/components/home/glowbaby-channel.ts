import * as THREE from "three";
import { gradientStops, heroSceneConfig, type LightMode } from "./hero-scene-config";

const holiday = heroSceneConfig.holiday;
// Blend encoded palette values before converting back to the renderer's linear working space.
const gradient = gradientStops.map(({ color, position }) => ({
  color: new THREE.Color().setStyle(color, THREE.LinearSRGBColorSpace), position,
}));
const gradientSegments = gradient.map((stop, index) => {
  const next = gradient[index + 1] ?? { color: gradient[0].color, position: 1 };
  return { from: stop.color, to: next.color, start: stop.position, end: next.position };
});
const glslColor = (color: THREE.Color) => `vec3(${color.toArray().map(value => value.toFixed(6)).join(", ")})`;
const gradientBranches = gradientSegments.map(({ from, to, start, end }, index) =>
  `${index < gradientSegments.length - 1 ? `if (position < ${end.toFixed(6)}) ` : ""}return gradientBlend(${glslColor(from)}, ${glslColor(to)}, (position - ${start.toFixed(6)}) / ${(end - start).toFixed(6)});`,
).join("\n    ");
// Shared angular palette keeps the diffuser and its surrounding light in phase.
export const lightPaletteGLSL = `
  vec3 gradientBlend(vec3 from, vec3 to, float fraction) {
    vec3 encoded = mix(from, to, smoothstep(0.0, 1.0, fraction));
    return mix(encoded / 12.92, pow((encoded + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), encoded));
  }
  vec3 holidayColor(float stripe) {
    return mix(vec3(${holiday.red.map(value => value.toFixed(6)).join(", ")}), vec3(${holiday.white.map(value => value.toFixed(6)).join(", ")}), stripe);
  }
  vec3 holidayBands(float phase, float softness) {
    return holidayColor(smoothstep(-softness, softness, sin(6.2831853 * phase * ${holiday.stripes.toFixed(1)})));
  }
  vec3 gradientColor(float phase) {
    float position = fract(phase);
    ${gradientBranches}
  }
  vec3 lightColor(float angle, float time, float mode) {
    if (mode > 1.5) return vec3(1.0, 0.52, 0.12);
    float phase = angle - time * ${heroSceneConfig.colorRotationSpeed.toFixed(6)};
    if (mode < 0.5) return holidayBands(phase, ${holiday.softness.toFixed(6)});
    return gradientColor(phase);
  }
  vec3 spillLightColor(float angle, float time, float mode) {
    if (mode < 0.5) return holidayBands(angle - time * ${heroSceneConfig.colorRotationSpeed.toFixed(6)}, ${holiday.spillSoftness.toFixed(6)});
    return lightColor(angle, time, mode);
  }
`;

export function sampleLightColor(target: THREE.Color, angle: number, time: number, mode: LightMode) {
  if (mode === "visibility") return target.setRGB(1, 0.52, 0.12);
  const phase = angle - time * heroSceneConfig.colorRotationSpeed;
  if (mode === "holiday") {
    const stripe = THREE.MathUtils.smoothstep(Math.sin(Math.PI * 2 * phase * holiday.stripes), -holiday.softness, holiday.softness);
    return target.setRGB(
      THREE.MathUtils.lerp(holiday.red[0], holiday.white[0], stripe),
      THREE.MathUtils.lerp(holiday.red[1], holiday.white[1], stripe),
      THREE.MathUtils.lerp(holiday.red[2], holiday.white[2], stripe),
    );
  }
  const position = THREE.MathUtils.euclideanModulo(phase, 1);
  const segment = gradientSegments.find(({ end }) => position < end)!;
  const blend = THREE.MathUtils.smoothstep(position, segment.start, segment.end);
  return target.copy(segment.from).lerp(segment.to, blend).convertSRGBToLinear();
}

export function sampleChannelPath(angle: number) {
  const c = heroSceneConfig.channel;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const radius = c.bodyRadius + c.width * c.profileScale / 2 + c.clearance;
  return {
    position: new THREE.Vector3(radius * cos, c.y, radius * sin),
    normal: new THREE.Vector3(cos, 0, sin),
  };
}

/** A circular tube with its flat back inward and its rounded face outward. */
export function createChannelGeometry(inner = false) {
  const c = heroSceneConfig.channel;
  const factor = c.profileScale;
  const inset = inner ? c.wallThickness * factor : 0;
  const half = c.width * factor / 2 - inset;
  const halfHeight = c.height * factor / 2 - inset;
  const centerY = c.y + c.height * factor / 2;
  const domeCenter = half - halfHeight;
  const profile: [number, number][] = [[-half, halfHeight], [-half, -halfHeight], [domeCenter, -halfHeight]];
  for (let i = 1; i <= 16; i++) {
    const angle = i / 16 * Math.PI - Math.PI / 2;
    profile.push([domeCenter + Math.cos(angle) * halfHeight, Math.sin(angle) * halfHeight]);
  }
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const stride = profile.length + 1;
  for (let i = 0; i <= c.segments; i++) {
    const angle = i === c.segments ? 0 : i / c.segments * Math.PI * 2;
    const { position, normal } = sampleChannelPath(angle);
    for (let j = 0; j <= profile.length; j++) {
      const [offset, y] = profile[j % profile.length];
      positions.push(position.x + normal.x * offset, centerY + y, position.z + normal.z * offset);
      uvs.push(i / c.segments, j / profile.length);
      if (i < c.segments && j < profile.length) {
        const a = i * stride + j, b = a + stride;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Average seam normals so the closed loop has no lighting discontinuity.
  const normals = geometry.getAttribute("normal");
  const normal = new THREE.Vector3();
  for (let j = 0; j < stride; j++) {
    const last = c.segments * stride + j;
    normal.set(normals.getX(j) + normals.getX(last), normals.getY(j) + normals.getY(last), normals.getZ(j) + normals.getZ(last)).normalize();
    normals.setXYZ(j, normal.x, normal.y, normal.z);
    normals.setXYZ(last, normal.x, normal.y, normal.z);
  }
  return geometry.rotateY(c.rotation);
}

export function createLightMaterial() {
  const emission = heroSceneConfig.emission;
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }, mode: { value: 1 }, activation: { value: 0 },
      emissionBase: { value: emission.base }, brightness: { value: emission.brightness },
      idleLevel: { value: emission.idleLevel }, pulseIntensity: { value: emission.pulseIntensity },
      pulseSharpness: { value: emission.pulseSharpness }, settleStart: { value: emission.settleStart },
    },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv;
      uniform float time; uniform float mode; uniform float activation;
      uniform float emissionBase; uniform float brightness; uniform float idleLevel;
      uniform float pulseIntensity; uniform float pulseSharpness; uniform float settleStart;
      ${lightPaletteGLSL}
      void main() {
        vec3 color = lightColor(vUv.x, time, mode);
        float distanceToPulse = abs(fract(vUv.x - activation + 0.5) - 0.5);
        float pulse = exp(-distanceToPulse * distanceToPulse * pulseSharpness);
        float level = mix(idleLevel + pulse * pulseIntensity, 1.0, smoothstep(settleStart, 1.0, activation));
        gl_FragColor = vec4(color * (emissionBase + level * brightness), 1.0);
        // Keep candy-cane red saturated rather than tone-mapping it toward orange.
        if (mode > 0.5) {
          #include <tonemapping_fragment>
        }
        #include <colorspace_fragment>
      }`,
  });
}
