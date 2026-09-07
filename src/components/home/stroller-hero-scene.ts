import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createChannelGeometry, createLightMaterial } from "./glowbaby-channel";
import { heroSceneConfig as config, type LightMode } from "./hero-scene-config";

export type HeroSceneHandle = { setMode(mode: LightMode): void; setActive(active: boolean): void; dispose(): void };

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach((texture) => { texture.dispose(); if (texture.image instanceof ImageBitmap) texture.image.close(); });
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

export async function createHeroScene(host: HTMLElement, initialMode: LightMode, onFailure: () => void): Promise<HeroSceneHandle> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, config.maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#eeeafd");
  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.05, 12);
  camera.position.fromArray(config.camera.position);
  camera.lookAt(...config.camera.target);
  const inspection = new THREE.Group();
  scene.add(inspection);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // allSettled lets us release every successful model even if one request fails.
  const models = await Promise.allSettled(Object.values(config.models).map((url) => loader.loadAsync(url)));
  if (models.some((result) => result.status === "rejected")) {
    models.forEach((result) => { if (result.status === "fulfilled") disposeObject(result.value.scene); });
    renderer.dispose();
    throw new Error("Hero assets could not load");
  }
  const [stroller, bottom, top] = models.map((result) => {
    if (result.status !== "fulfilled") throw new Error("Missing model");
    return result.value.scene;
  });
  const strollerBounds = new THREE.Box3().setFromObject(stroller);
  const size = strollerBounds.getSize(new THREE.Vector3());
  const center = strollerBounds.getCenter(new THREE.Vector3());
  const scale = config.strollerHeight / size.y;
  const strollerGroup = new THREE.Group();
  stroller.position.sub(new THREE.Vector3(center.x, strollerBounds.min.y, center.z));
  strollerGroup.add(stroller);
  strollerGroup.scale.setScalar(scale);
  inspection.add(strollerGroup);

  const assembly = new THREE.Group();
  assembly.name = "GlowbabyAssembly";
  assembly.position.fromArray(config.assembly.position);
  assembly.rotation.set(...config.assembly.rotation);
  assembly.scale.setScalar(config.assembly.scale);
  // Use one shared X/Z reference to preserve the CAD parts' authored relationship.
  const baseBounds = new THREE.Box3().setFromObject(bottom);
  const baseCenter = baseBounds.getCenter(new THREE.Vector3());
  bottom.position.x -= baseCenter.x;
  bottom.position.z -= baseCenter.z;
  top.position.x -= baseCenter.x;
  top.position.z -= baseCenter.z;
  top.position.y += config.assembly.topOffset;
  const baseMaterial = new THREE.MeshStandardMaterial({ color: "#eee9e3", roughness: 0.48 });
  const topMaterial = new THREE.MeshStandardMaterial({ color: "#24232b", roughness: 0.62 });
  for (const [model, replacement] of [[bottom, baseMaterial], [top, topMaterial]] as const) {
    const oldMaterials = new Set<THREE.Material>();
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => oldMaterials.add(material));
        object.material = replacement;
      }
    });
    oldMaterials.forEach((material) => {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    });
  }
  assembly.add(bottom, top);
  const lightMaterial = createLightMaterial();
  const inner = new THREE.Mesh(createChannelGeometry(true), lightMaterial);
  const diffuser = new THREE.Mesh(createChannelGeometry(), new THREE.MeshPhysicalMaterial({
    color: "#fffaf1", transparent: true, opacity: 0.28, roughness: 0.4, metalness: 0, depthWrite: false,
  }));
  assembly.add(inner, diffuser);
  inspection.add(assembly);
  inspection.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  inner.castShadow = false;
  diffuser.castShadow = false;
  scene.add(new THREE.HemisphereLight("#ffffff", "#b5a2ce", 2.4));
  const key = new THREE.DirectionalLight("#fff4e7", 3);
  key.position.set(2, 3, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 0.1, far: 7 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: "#eeeafd", roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.006;
  floor.receiveShadow = true;
  scene.add(floor);
  const spillMaterial = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color("#9966ff") }, strength: { value: config.spillOpacity } },
    transparent: true, depthWrite: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "varying vec2 vUv; uniform vec3 color; uniform float strength; void main(){ float a=exp(-dot(vUv-0.5,vUv-0.5)*18.0); gl_FragColor=vec4(color,a*strength); }",
  });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.8), spillMaterial);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(config.assembly.position[0], -0.003, config.assembly.position[2]);
  scene.add(spill);
  const glow = new THREE.PointLight("#b18aff", config.lightIntensity, 0.85, 2);
  glow.position.copy(assembly.position).add(new THREE.Vector3(0, -0.035, 0));
  inspection.add(glow);

  let mode = initialMode, elapsed = 0, previous = 0, frame = 0, active = false, disposed = false;
  let targetX = 0, targetY = 0, dragging = false, pointerStart = 0;
  const canvas = renderer.domElement;
  canvas.style.touchAction = "pan-y";
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(Math.max(width, 1), Math.max(height, 1));
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };
  const move = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    targetY = THREE.MathUtils.clamp(dragging ? (event.clientX - pointerStart) / rect.width * 2 : (event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    targetX = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  };
  const down = (event: PointerEvent) => { dragging = true; pointerStart = event.clientX; canvas.setPointerCapture(event.pointerId); };
  const release = () => { dragging = false; targetX = 0; targetY = 0; };
  const lost = (event: Event) => { event.preventDefault(); onFailure(); };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
  canvas.addEventListener("webglcontextlost", lost);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const setMode = (next: LightMode) => {
    mode = next;
    lightMaterial.uniforms.mode.value = { glow: 0, flow: 1, visibility: 2 }[next];
    glow.color.set(next === "visibility" ? "#ffb84a" : "#b18aff");
    spillMaterial.uniforms.color.value.copy(glow.color);
  };
  const render = (now: number) => {
    if (!active || disposed) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    elapsed += dt;
    lightMaterial.uniforms.time.value = elapsed;
    lightMaterial.uniforms.activation.value = Math.min(elapsed / 2.4, 1);
    inspection.rotation.y = THREE.MathUtils.damp(inspection.rotation.y, targetY * config.interaction.yaw, config.interaction.damping, dt);
    inspection.rotation.x = THREE.MathUtils.damp(inspection.rotation.x, targetX * config.interaction.pitch, config.interaction.damping, dt);
    glow.intensity = config.lightIntensity * Math.min(elapsed / 2.4, 1);
    if (mode === "flow") { glow.color.setHSL((elapsed * 0.055 + 0.72) % 1, 0.8, 0.66); spillMaterial.uniforms.color.value.copy(glow.color); }
    try { renderer.render(scene, camera); } catch { onFailure(); return; }
    frame = requestAnimationFrame(render);
  };
  setMode(initialMode);
  // Attach only after a successful complete first frame; the poster remains below it.
  try { renderer.render(scene, camera); } catch (error) { disposeObject(scene); renderer.dispose(); observer.disconnect(); throw error; }
  host.appendChild(canvas);
  return {
    setMode,
    setActive(next) {
      if (disposed || active === next) return;
      active = next;
      previous = 0;
      if (next) frame = requestAnimationFrame(render); else cancelAnimationFrame(frame);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointercancel", release);
      canvas.removeEventListener("pointerleave", release);
      canvas.removeEventListener("webglcontextlost", lost);
      disposeObject(scene);
      key.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
