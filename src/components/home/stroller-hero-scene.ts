import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createChannelGeometry, createLightMaterial, lightPaletteGLSL, sampleLightColor } from "./glowbaby-channel";
import { heroSceneConfig as config, type LightMode } from "./hero-scene-config";
import type { HeroModelBuffers } from "../../lib/hero-asset-format";

export type HeroSceneHandle = {
  setMode(mode: LightMode): void;
  setActive(active: boolean): void;
  renderStill(time?: number): void;
  dispose(): void;
};

const sidewalkPatternGLSL = `
  uniform vec2 sidewalkSlabSize; uniform vec2 sidewalkOffset;
  uniform float sidewalkSeamWidth; uniform float sidewalkSeamSoftness;
  uniform float sidewalkSeamDarkness; uniform float sidewalkSeamDepth;
  uniform float sidewalkSlabVariation; uniform float sidewalkMottleScale;
  uniform float sidewalkMottleStrength; uniform float sidewalkGrainScale;
  uniform float sidewalkGrainStrength; uniform float sidewalkGrainDepth;
  uniform float sidewalkRoughnessVariation;
  float sidewalkHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float sidewalkNoise(vec2 p) {
    vec2 cell = floor(p), f = fract(p);
    vec2 blend = f * f * (3.0 - 2.0 * f);
    return mix(mix(sidewalkHash(cell), sidewalkHash(cell + vec2(1.0, 0.0)), blend.x),
      mix(sidewalkHash(cell + vec2(0.0, 1.0)), sidewalkHash(cell + vec2(1.0, 1.0)), blend.x), blend.y);
  }
  vec3 sidewalkSurface(vec2 world) {
    vec2 grid = (world + sidewalkOffset) / sidewalkSlabSize;
    vec2 edgeDistance = min(fract(grid), 1.0 - fract(grid)) * sidewalkSlabSize;
    float distanceToJoint = min(edgeDistance.x, edgeDistance.y);
    float feather = max(sidewalkSeamSoftness, fwidth(distanceToJoint));
    float seam = 1.0 - smoothstep(sidewalkSeamWidth * 0.5, sidewalkSeamWidth * 0.5 + feather, distanceToJoint);
    vec2 grainUv = world * sidewalkGrainScale;
    vec2 footprint = fwidth(grainUv);
    float grainVisibility = 1.0 - smoothstep(0.5, 1.8, max(footprint.x, footprint.y));
    float grain = (sidewalkNoise(grainUv) - 0.5) * grainVisibility;
    float mottle = sidewalkNoise(world * sidewalkMottleScale) - 0.5;
    float slab = sidewalkHash(floor(grid)) - 0.5;
    float reflectance = (1.0 + slab * sidewalkSlabVariation + mottle * sidewalkMottleStrength
      + grain * sidewalkGrainStrength) * (1.0 - seam * sidewalkSeamDarkness);
    return vec3(reflectance, grain * sidewalkGrainDepth - seam * sidewalkSeamDepth,
      (grain + seam) * sidewalkRoughnessVariation);
  }
`;

function createSidewalkUniforms() {
  const surface = config.sidewalk;
  return {
    sidewalkSlabSize: { value: new THREE.Vector2().fromArray(surface.slabSize) },
    sidewalkOffset: { value: new THREE.Vector2().fromArray(surface.offset) },
    sidewalkSeamWidth: { value: surface.seamWidth },
    sidewalkSeamSoftness: { value: surface.seamSoftness },
    sidewalkSeamDarkness: { value: surface.seamDarkness },
    sidewalkSeamDepth: { value: surface.seamDepth },
    sidewalkSlabVariation: { value: surface.slabVariation },
    sidewalkMottleScale: { value: surface.mottleScale },
    sidewalkMottleStrength: { value: surface.mottleStrength },
    sidewalkGrainScale: { value: surface.grainScale },
    sidewalkGrainStrength: { value: surface.grainStrength },
    sidewalkGrainDepth: { value: surface.grainDepth },
    sidewalkRoughnessVariation: { value: surface.roughnessVariation },
  };
}

function createSidewalkMaterial(uniforms: ReturnType<typeof createSidewalkUniforms>) {
  const material = new THREE.MeshStandardMaterial({ color: config.stage.floor.color, roughness: config.stage.floor.roughness });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vSidewalkWorld;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvSidewalkWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vSidewalkWorld;\n${sidewalkPatternGLSL}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        vec3 sidewalkDetail = sidewalkSurface(vSidewalkWorld.xz);
        diffuseColor.rgb *= sidewalkDetail.x;`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + sidewalkDetail.z, 0.04, 1.0);`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        vec3 surfaceDx = dFdx(-vViewPosition), surfaceDy = dFdy(-vViewPosition);
        vec3 tangentX = cross(surfaceDy, normal), tangentY = cross(normal, surfaceDx);
        float sidewalkDet = dot(surfaceDx, tangentX);
        if (abs(sidewalkDet) > 0.00000001) {
          vec3 gradient = dFdx(sidewalkDetail.y) * tangentX + dFdy(sidewalkDetail.y) * tangentY;
          normal = normalize(abs(sidewalkDet) * normal - sign(sidewalkDet) * gradient);
        }`);
  };
  material.customProgramCacheKey = () => "glowbaby-sidewalk-v1";
  return material;
}

function createResourceTracker() {
  const resources = new Set<{ dispose(): void }>();
  const seen = new WeakSet<object>();
  const closedImages = new WeakSet<ImageBitmap>();
  let disposed = false;
  const release = (resource: { dispose(): void }) => {
    resource.dispose();
    if (resource instanceof THREE.Texture && typeof ImageBitmap !== "undefined" &&
        resource.image instanceof ImageBitmap && !closedImages.has(resource.image)) {
      closedImages.add(resource.image);
      resource.image.close();
    }
  };
  const record = (resource: { dispose(): void }) => {
    if (seen.has(resource)) return;
    seen.add(resource);
    if (disposed) release(resource); else resources.add(resource);
  };
  const track = <T,>(value: T): T => {
    if (Array.isArray(value)) value.forEach(track);
    else if (value instanceof THREE.Object3D) {
      value.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          track(object.geometry);
          track(object.material);
        }
        if (object instanceof THREE.SkinnedMesh) record(object.skeleton);
        if (object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight || object instanceof THREE.PointLight) record(object.shadow);
      });
    } else if (value instanceof THREE.Material) {
      for (const property of Object.values(value)) if (property instanceof THREE.Texture) track(property);
      record(value);
    } else if (value instanceof THREE.BufferGeometry || value instanceof THREE.Texture) record(value);
    return value;
  };
  return {
    track,
    dispose() {
      disposed = true;
      resources.forEach(release);
      resources.clear();
    },
  };
}

function getGroundContactBounds(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true);
  const threshold = new THREE.Box3().setFromObject(root).min.y + config.contactShadow.sampleHeight;
  const cells = new Map<string, { x: number; z: number; bounds: THREE.Box2 }>();
  const position = new THREE.Vector3();
  const point = new THREE.Vector2();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.geometry.hasAttribute("position")) return;
    const count = object.geometry.getAttribute("position").count;
    for (let index = 0; index < count; index++) {
      object.getVertexPosition(index, position).applyMatrix4(object.matrixWorld);
      if (position.y > threshold) continue;
      const x = Math.floor(position.x / config.contactShadow.mergeDistance);
      const z = Math.floor(position.z / config.contactShadow.mergeDistance);
      const key = `${x}:${z}`;
      if (!cells.has(key)) cells.set(key, { x, z, bounds: new THREE.Box2() });
      cells.get(key)!.bounds.expandByPoint(point.set(position.x, position.z));
    }
  });
  const contacts: THREE.Box2[] = [];
  // Merge neighboring samples into wheel-sized islands, never the whole canopy/frame.
  while (cells.size) {
    const [key, seed] = cells.entries().next().value!;
    cells.delete(key);
    const pending = [seed];
    const bounds = new THREE.Box2();
    while (pending.length) {
      const cell = pending.pop()!;
      bounds.union(cell.bounds);
      for (let x = cell.x - 1; x <= cell.x + 1; x++) {
        for (let z = cell.z - 1; z <= cell.z + 1; z++) {
          const key = `${x}:${z}`;
          const neighbor = cells.get(key);
          if (neighbor) { cells.delete(key); pending.push(neighbor); }
        }
      }
    }
    contacts.push(bounds);
  }
  return contacts;
}

export async function createHeroScene(host: HTMLElement, initialMode: LightMode, onFailure: () => void, modelData?: HeroModelBuffers, signal?: AbortSignal, viewport: HTMLElement = host): Promise<HeroSceneHandle> {
  const resources = createResourceTracker();
  const scene = new THREE.Scene();
  let renderer: THREE.WebGLRenderer | undefined;
  let observer: ResizeObserver | undefined;
  let removeListeners = () => {};
  let frame = 0, active = false, disposed = false, initialized = false, contextLost = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    active = false;
    signal?.removeEventListener("abort", dispose);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    removeListeners();
    resources.track(scene);
    resources.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
  };
  const fail = () => { dispose(); onFailure(); };

  try {
    signal?.throwIfAborted();
    signal?.addEventListener("abort", dispose, { once: true });
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power", failIfMajorPerformanceCaveat: true });
    const view = renderer;
    const canvas = view.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      if (initialized) fail();
    };
    removeListeners = () => canvas.removeEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextlost", lost);
    view.setPixelRatio(Math.min(devicePixelRatio, config.maxDpr));
    view.outputColorSpace = THREE.SRGBColorSpace;
    view.toneMapping = THREE.ACESFilmicToneMapping;
    view.toneMappingExposure = config.stage.exposure;
    view.shadowMap.enabled = true;
    view.shadowMap.type = THREE.PCFSoftShadowMap;
    // Only the camera and light colors animate; reuse the static occlusion maps.
    view.shadowMap.autoUpdate = false;
    view.shadowMap.needsUpdate = true;
    view.debug.onShaderError = () => { throw new Error("Hero shader initialization failed"); };
    const sceneBackground = new THREE.Color(config.environment.background);
    scene.background = sceneBackground;
    scene.fog = new THREE.Fog(config.environment.background, config.stage.fogNear, config.stage.fogFar);
    const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.05, 12);
    const cameraTarget = new THREE.Vector3().fromArray(config.camera.target);
    camera.position.fromArray(config.camera.position);
    camera.lookAt(cameraTarget);
    const baseOrbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(cameraTarget));
    const orbit = baseOrbit.clone();
    const inspection = new THREE.Group();
    scene.add(inspection);

    // GLTFLoader catches image failures and resolves with null maps, so GLB
    // promise success alone cannot decide whether it is safe to hide the poster.
    const assetErrors = new Set<string>();
    const manager = new THREE.LoadingManager();
    manager.onError = (url) => { assetErrors.add(url); };
    const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
    loader.register((parser) => {
      const getDependency = parser.getDependency.bind(parser);
      parser.getDependency = (type, index) => getDependency(type, index).then((value: unknown) => {
        if (type === "texture" && value == null) assetErrors.add(`texture:${index}`);
        return resources.track(value);
      });
      const loadGeometries = parser.loadGeometries.bind(parser);
      parser.loadGeometries = (primitives) => loadGeometries(primitives).then(resources.track);
      return { name: "HeroResourceTracking" };
    });
    // Track dependencies too: a failed parser can still finish other resources
    // after cleanup; the tracker immediately releases those late arrivals.
    const models = await Promise.allSettled(modelData
      ? [modelData.stroller, modelData.bottom, modelData.top].map((buffer) => loader.parseAsync(buffer, ""))
      : Object.values(config.models).map((url) => loader.loadAsync(url)));
    models.forEach((result) => { if (result.status === "fulfilled") resources.track(result.value.scenes); });
    signal?.throwIfAborted();
    if (assetErrors.size || models.some((result) => result.status === "rejected")) throw new Error("Hero assets or textures could not load");
    if (contextLost || view.getContext().isContextLost()) throw new Error("Hero WebGL context was lost");
    const [stroller, bottom, top] = models.map((result) => {
      if (result.status !== "fulfilled") throw new Error("Missing model");
      return result.value.scene;
    });
    const strollerBounds = new THREE.Box3().setFromObject(stroller);
    const size = strollerBounds.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error("Invalid stroller dimensions");
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
    inspection.add(assembly);
    // Use one shared X/Z reference to preserve the CAD parts' authored relationship.
    const baseCenter = new THREE.Box3().setFromObject(bottom).getCenter(new THREE.Vector3());
    bottom.position.x -= baseCenter.x;
    bottom.position.z -= baseCenter.z;
    top.position.x -= baseCenter.x;
    top.position.z -= baseCenter.z;
    top.position.y += config.assembly.topOffset;
    const baseMaterial = resources.track(new THREE.MeshStandardMaterial(config.materials.base));
    const topMaterial = resources.track(new THREE.MeshStandardMaterial(config.materials.top));
    for (const [model, replacement] of [[bottom, baseMaterial], [top, topMaterial]] as const) {
      model.traverse((object) => { if (object instanceof THREE.Mesh) object.material = replacement; });
    }
    assembly.add(bottom, top);
    // Restrained prototype attachment bands, not a final hardware specification.
    const bandGeometry = resources.track(new THREE.BoxGeometry(...config.attachment.size));
    for (const x of config.attachment.offsetsX) {
      const band = new THREE.Mesh(bandGeometry, topMaterial);
      band.position.set(x, config.attachment.y, 0);
      assembly.add(band);
    }
    const lightMaterial = resources.track(createLightMaterial());
    const inner = new THREE.Mesh(resources.track(createChannelGeometry(true)), lightMaterial);
    const diffuserMaterial = resources.track(new THREE.MeshPhysicalMaterial({
      ...config.diffuser, transparent: true, metalness: 0, depthWrite: false,
    }));
    const diffuser = new THREE.Mesh(resources.track(createChannelGeometry()), diffuserMaterial);
    assembly.add(inner, diffuser);
    inspection.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    inner.castShadow = false;
    diffuser.castShadow = false;

    scene.add(new THREE.HemisphereLight(config.environment.sky, config.environment.ground, config.environment.intensity));
    const keyConfig = config.environment.key;
    const key = resources.track(new THREE.DirectionalLight(keyConfig.color, keyConfig.intensity));
    key.position.fromArray(keyConfig.position);
    // Environment lights reveal the stroller, but must not imply an overhead shadow source.
    key.castShadow = false;
    scene.add(key);
    const rim = resources.track(new THREE.DirectionalLight(config.environment.rim.color, config.environment.rim.intensity));
    rim.position.fromArray(config.environment.rim.position);
    scene.add(rim);
    const sidewalkUniforms = createSidewalkUniforms();
    const floor = new THREE.Mesh(
      resources.track(new THREE.PlaneGeometry(config.stage.floor.size, config.stage.floor.size)),
      resources.track(createSidewalkMaterial(sidewalkUniforms)),
    );
    floor.name = "ConcreteSidewalk";
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = config.stage.floor.y;
    floor.receiveShadow = true;
    scene.add(floor);
    const contactMaterial = resources.track(new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(config.contactShadow.color) },
        opacity: { value: config.contactShadow.opacity },
        falloff: { value: config.contactShadow.falloff },
        edgeStart: { value: config.contactShadow.edgeStart },
      },
      transparent: true, depthWrite: false, toneMapped: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: `varying vec2 vUv; uniform vec3 color; uniform float opacity;
        uniform float falloff; uniform float edgeStart;
        void main(){
          vec2 p = (vUv - 0.5) * 2.0;
          float alpha = opacity * exp(-dot(p, p) * falloff) * (1.0 - smoothstep(edgeStart, 1.0, length(p)));
          gl_FragColor = vec4(color, alpha);
          #include <colorspace_fragment>
        }`,
    }));
    for (const bounds of getGroundContactBounds(strollerGroup)) {
      const center = bounds.getCenter(new THREE.Vector2());
      const size = bounds.getSize(new THREE.Vector2()).addScalar(config.contactShadow.spread * 2);
      const contact = new THREE.Mesh(resources.track(new THREE.PlaneGeometry(
        Math.min(size.x, config.contactShadow.maxSize), Math.min(size.y, config.contactShadow.maxSize),
      )), contactMaterial);
      contact.name = "GroundContactShadow";
      contact.rotation.x = -Math.PI / 2;
      contact.position.set(center.x, config.stage.floor.y + config.contactShadow.elevation, center.y);
      scene.add(contact);
    }
    const spillMaterial = resources.track(new THREE.ShaderMaterial({
      uniforms: {
        ...sidewalkUniforms,
        time: lightMaterial.uniforms.time, mode: lightMaterial.uniforms.mode, strength: { value: 0 },
        brightness: { value: config.spill.brightness }, falloff: { value: config.spill.falloff },
        edge: { value: new THREE.Vector2(config.spill.edgeStart, config.spill.edgeEnd) },
        centerBlendRadius: { value: config.spill.centerBlendRadius },
        centerStrength: { value: config.spill.centerStrength }, centerRadius: { value: config.spill.centerRadius },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; varying vec3 vSidewalkWorld;
        void main(){ vUv=uv; vSidewalkWorld=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; varying vec3 vSidewalkWorld; uniform float time; uniform float mode; uniform float strength;
        uniform float brightness; uniform float falloff; uniform vec2 edge;
        uniform float centerBlendRadius; uniform float centerStrength; uniform float centerRadius;
        ${lightPaletteGLSL}
        ${sidewalkPatternGLSL}
        void main(){
          vec2 p = vUv - 0.5;
          float radius = length(p);
          float angle = atan(-p.y, p.x) / 6.2831853;
          vec3 color = spillLightColor(angle, time, mode);
          float a = exp(-dot(p, p) * falloff) * (1.0 - smoothstep(edge.x, edge.y, radius));
          a *= mix(centerStrength, 1.0, smoothstep(0.0, centerRadius, radius));
          if (mode < 0.5) color = mix(holidayColor(0.5), color, smoothstep(0.0, centerBlendRadius, radius));
          gl_FragColor = vec4(color * brightness * sidewalkSurface(vSidewalkWorld.xz).x, a * strength);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    const spill = new THREE.Mesh(resources.track(new THREE.PlaneGeometry(...config.spill.size)), spillMaterial);
    spill.rotation.set(-Math.PI / 2, 0, config.assembly.rotation[1] + config.channel.rotation);
    spill.position.set(config.assembly.position[0], config.stage.floor.y + config.spill.elevation, config.assembly.position[2]);
    scene.add(spill);

    assembly.updateWorldMatrix(true, false);
    const glowSamples = Array.from({ length: config.underglow.samples }, (_, index) => {
      const angle = index / config.underglow.samples;
      const radians = angle * Math.PI * 2;
      const outward = new THREE.Vector3(Math.cos(radians) / config.channel.radiusX, 0, Math.sin(radians) / config.channel.radiusZ)
        .normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP, config.channel.rotation);
      const origin = new THREE.Vector3(
        Math.cos(radians) * config.channel.radiusX,
        config.channel.y + config.underglow.sourceOffsetY,
        Math.sin(radians) * config.channel.radiusZ,
      ).applyAxisAngle(THREE.Object3D.DEFAULT_UP, config.channel.rotation)
        .addScaledVector(outward, config.channel.width * config.channel.profileScale / 2 + config.underglow.sourceOutset);
      const target = origin.clone().addScaledVector(outward, config.underglow.targetOffset);
      assembly.localToWorld(origin);
      assembly.localToWorld(target);
      target.y = config.stage.floor.y;
      const drop = origin.y - target.y;
      const reach = Math.hypot(target.x - origin.x, target.z - origin.z);
      // Clamp the WHOLE cone below the world horizon, even after assembly tuning.
      // Shadow maps then stop the downward rays at the first opaque surface.
      const maximumAngle = Math.atan2(drop, reach) - config.underglow.minimumDownwardAngle;
      if (drop <= 0 || maximumAngle <= 0) throw new Error("Underglow sources must remain above the floor and aim downward");
      const light = resources.track(new THREE.SpotLight(
        "#ffffff", 0, config.underglow.distance, Math.min(config.underglow.coneAngle, maximumAngle),
        config.underglow.penumbra, config.underglow.decay,
      ));
      light.position.copy(origin);
      light.target.position.copy(target);
      light.castShadow = true;
      light.shadow.mapSize.setScalar(config.underglow.shadowSize);
      light.shadow.camera.near = config.underglow.shadowNear;
      light.shadow.bias = config.underglow.shadowBias;
      light.shadow.normalBias = config.underglow.shadowNormalBias;
      scene.add(light, light.target);
      return { angle, light };
    });
    const overflowLayer = 1;
    inspection.traverse((object) => object.layers.enable(overflowLayer));
    scene.traverse((object) => {
      if (object instanceof THREE.Light) object.layers.enable(overflowLayer);
    });
    camera.layers.enable(overflowLayer);

    let mode = initialMode, elapsed = 3.2, activationElapsed = config.emission.activationSeconds, previous = 0;
    let renderWidth = 1, renderHeight = 1;
    let viewportX = 0, viewportY = 0, viewportWidth = 1, viewportHeight = 1;
    let targetX = 0, targetY = 0, pitch = 0, yaw = 0;
    let pointerId: number | null = null;
    let dragging = false;
    let startX = 0, startY = 0, startTargetX = 0, startTargetY = 0;
    // Touch keeps vertical page scrolling; horizontal drags inspect the scene.
    canvas.style.touchAction = "pan-y pinch-zoom";
    const draw = () => {
      const cameraMask = camera.layers.mask;
      view.setScissorTest(false);
      view.setClearColor(sceneBackground, 0);
      view.clear(true, true, true);
      view.setScissor(viewportX, viewportY, viewportWidth, viewportHeight);
      view.setScissorTest(true);
      scene.background = sceneBackground;
      view.render(scene, camera);

      scene.background = null;
      camera.layers.set(overflowLayer);
      const viewportRight = viewportX + viewportWidth;
      if (viewportRight < renderWidth) {
        view.setScissor(viewportRight, 0, renderWidth - viewportRight, renderHeight);
        view.render(scene, camera);
      }
      if (viewportY > 0) {
        view.setScissor(0, 0, Math.min(viewportRight, renderWidth), viewportY);
        view.render(scene, camera);
      }
      camera.layers.mask = cameraMask;
      scene.background = sceneBackground;
      view.setScissorTest(false);
    };
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(rect.width, 1), height = Math.max(rect.height, 1);
      const viewportRect = viewport.getBoundingClientRect();
      const left = THREE.MathUtils.clamp(viewportRect.left - rect.left, 0, width);
      const top = THREE.MathUtils.clamp(viewportRect.top - rect.top, 0, height);
      const right = THREE.MathUtils.clamp(viewportRect.right - rect.left, left, width);
      const bottom = THREE.MathUtils.clamp(viewportRect.bottom - rect.top, top, height);
      renderWidth = width;
      renderHeight = height;
      viewportX = left;
      viewportY = height - bottom;
      viewportWidth = Math.max(right - left, 1);
      viewportHeight = Math.max(bottom - top, 1);
      view.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const move = (event: PointerEvent) => {
      if (!active || !event.isPrimary || event.pointerId !== pointerId) return;
      if (event.pointerType !== "touch" && (event.buttons & 1) === 0) { reset(); return; }
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width, 1), height = Math.max(rect.height, 1);
      targetY = THREE.MathUtils.clamp(startTargetY + (event.clientX - startX) / width * config.interaction.dragSensitivity, -1, 1);
      if (event.pointerType !== "touch") {
        targetX = THREE.MathUtils.clamp(startTargetX + (event.clientY - startY) / height * config.interaction.dragSensitivity, -1, 1);
      }
    };
    const beginDrag = () => {
      if (pointerId === null || disposed || !active) return;
      // A new press takes over the current camera angle, including during return.
      targetX = startTargetX = pitch / config.interaction.pitch;
      targetY = startTargetY = yaw / config.interaction.yaw;
      dragging = true;
      try { canvas.setPointerCapture(pointerId); } catch { reset(); }
    };
    const down = (event: PointerEvent) => {
      if (!active || !event.isPrimary || event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      beginDrag();
    };
    const reset = () => {
      const captured = pointerId;
      pointerId = null;
      dragging = false;
      targetX = 0;
      targetY = 0;
      if (captured !== null && canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured);
    };
    const release = (event: PointerEvent) => { if (event.pointerId === pointerId) reset(); };
    const leave = () => { if (!dragging) reset(); };
    removeListeners = () => {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointercancel", release);
      canvas.removeEventListener("lostpointercapture", release);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", lost);
      reset();
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    canvas.addEventListener("pointerleave", leave);
    const setMode = (next: LightMode) => {
      if (disposed) return;
      mode = next;
      lightMaterial.uniforms.mode.value = { holiday: 0, flow: 1, visibility: 2 }[next];
      for (const { angle, light } of glowSamples) sampleLightColor(light.color, angle, elapsed, mode);
    };
    const updateLighting = (activation: number) => {
      lightMaterial.uniforms.time.value = elapsed;
      lightMaterial.uniforms.activation.value = activation;
      spillMaterial.uniforms.strength.value = config.spillOpacity * activation;
      for (const { angle, light } of glowSamples) {
        light.intensity = config.lightIntensity / glowSamples.length * activation;
        sampleLightColor(light.color, angle, elapsed, mode);
      }
    };
    const render = (now: number) => {
      if (!active || disposed) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      elapsed += dt;
      activationElapsed = Math.min(activationElapsed + dt, config.emission.activationSeconds);
      updateLighting(activationElapsed / config.emission.activationSeconds);
      const damping = dragging ? config.interaction.damping : config.interaction.returnDamping;
      yaw = THREE.MathUtils.damp(yaw, targetY * config.interaction.yaw, damping, dt);
      pitch = THREE.MathUtils.damp(pitch, targetX * config.interaction.pitch, damping, dt);
      // Move only the camera: wheels, floor shadows, and light directions stay grounded.
      orbit.theta = baseOrbit.theta - yaw;
      orbit.phi = baseOrbit.phi + pitch;
      orbit.makeSafe();
      camera.position.setFromSpherical(orbit).add(cameraTarget);
      camera.lookAt(cameraTarget);
      try { draw(); } catch { fail(); return; }
      if (!disposed) frame = requestAnimationFrame(render);
    };
    observer = new ResizeObserver(resize);
    observer.observe(host);
    if (viewport !== host) observer.observe(viewport);
    resize();
    setMode(initialMode);
    updateLighting(1);
    // No canvas is attached until textures, setup, and the first frame all succeed.
    draw();
    if (contextLost || view.getContext().isContextLost()) throw new Error("Hero WebGL context was lost");
    host.appendChild(canvas);
    initialized = true;
    return {
      setMode,
      setActive(next) {
        if (disposed || active === next) return;
        active = next;
        previous = 0;
        if (next) frame = requestAnimationFrame(render); else { cancelAnimationFrame(frame); reset(); }
      },
      renderStill(time = 3.2) {
        if (disposed) return;
        if (!Number.isFinite(time) || time < 0) throw new RangeError("Still time must be a finite, nonnegative number");
        active = false;
        cancelAnimationFrame(frame);
        previous = 0;
        reset();
        yaw = 0;
        pitch = 0;
        camera.position.fromArray(config.camera.position);
        camera.lookAt(cameraTarget);
        elapsed = time;
        // Keep sweep progress separate: even a still at t=0 stays fully on if resumed.
        activationElapsed = config.emission.activationSeconds;
        updateLighting(1);
        view.shadowMap.needsUpdate = true;
        try { draw(); } catch (error) { fail(); throw error; }
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
