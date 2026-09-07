import * as THREE from "three";
import { heroSceneConfig, type LightMode } from "./hero-scene-config";

const holiday = heroSceneConfig.holiday;
// Shared angular palette keeps the diffuser and its surrounding light in phase.
export const lightPaletteGLSL = `
  vec3 holidayColor(float stripe) {
    return mix(vec3(${holiday.red.map(value => value.toFixed(6)).join(", ")}), vec3(${holiday.white.map(value => value.toFixed(6)).join(", ")}), stripe);
  }
  vec3 holidayBands(float phase, float softness) {
    return holidayColor(smoothstep(-softness, softness, sin(6.2831853 * phase * ${holiday.stripes.toFixed(1)})));
  }
  vec3 lightColor(float angle, float time, float mode) {
    if (mode > 1.5) return vec3(1.0, 0.52, 0.12);
    float phase = angle - time * ${heroSceneConfig.colorRotationSpeed.toFixed(6)};
    if (mode < 0.5) return holidayBands(phase, ${holiday.softness.toFixed(6)});
    return 0.5 + 0.5 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.67)));
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
  return target.setRGB(
    0.5 + 0.5 * Math.cos(Math.PI * 2 * phase),
    0.5 + 0.5 * Math.cos(Math.PI * 2 * (phase + 0.33)),
    0.5 + 0.5 * Math.cos(Math.PI * 2 * (phase + 0.67)),
  );
}

/** Closed domed channel swept around an ellipse; the seam shares identical positions.
 * Profile follows the supplied 15.08 × 12.7 mm envelope, with a flat foot and domed roof.
 * It intentionally does not inherit the base model's edge cutouts.
 */
export function createChannelGeometry(inner = false) {
  const c = heroSceneConfig.channel;
  const factor = c.profileScale * (inner ? 0.76 : 1);
  const half = c.width * factor / 2;
  const height = c.height * factor;
  const profile: [number, number][] = [[-half, 0], [half, 0], [half, height - half]];
  for (let i = 1; i <= 16; i++) {
    const angle = i / 16 * Math.PI;
    profile.push([Math.cos(angle) * half, height - half + Math.sin(angle) * half]);
  }
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const stride = profile.length + 1;
  for (let i = 0; i <= c.segments; i++) {
    const angle = i === c.segments ? 0 : i / c.segments * Math.PI * 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Unit outward normal of an ellipse, not the radial vector.
    const length = Math.hypot(cos / c.radiusX, sin / c.radiusZ);
    const nx = cos / c.radiusX / length, nz = sin / c.radiusZ / length;
    for (let j = 0; j <= profile.length; j++) {
      const [offset, y] = profile[j % profile.length];
      positions.push(c.radiusX * cos + nx * offset, c.y + y + (inner ? 0.001 : 0), c.radiusZ * sin + nz * offset);
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
