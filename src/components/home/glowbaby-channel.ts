import * as THREE from "three";
import { heroSceneConfig } from "./hero-scene-config";

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
    const angle = (i === c.segments ? 0 : i / c.segments * Math.PI * 2) + c.rotation;
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
  return geometry;
}

export function createLightMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, mode: { value: 1 }, activation: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv;
      uniform float time; uniform float mode; uniform float activation;
      void main() {
        vec3 color = vec3(0.63, 0.35, 1.0);
        if (mode > 0.5 && mode < 1.5) {
          color = 0.55 + 0.45 * cos(6.2831853 * (vUv.x - time * 0.055 + vec3(0.0, 0.33, 0.67)));
        }
        if (mode > 1.5) color = vec3(1.0, 0.52, 0.12);
        float distanceToPulse = abs(fract(vUv.x - activation + 0.5) - 0.5);
        float pulse = exp(-distanceToPulse * distanceToPulse * 220.0);
        float level = mix(0.06 + pulse * 0.9, 1.0, smoothstep(0.85, 1.0, activation));
        gl_FragColor = vec4(color * (0.25 + level * 1.35), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
