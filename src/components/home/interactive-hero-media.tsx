"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroSceneConfig, lightModes, type LightMode } from "./hero-scene-config";
import type { HeroSceneHandle } from "./stroller-hero-scene";
import flowPoster from "../../../public/hero/stroller-render-flow.webp";
import holidayPoster from "../../../public/hero/stroller-render-holiday.webp";
import visibilityPoster from "../../../public/hero/stroller-render-visibility.webp";

// Static imports fingerprint regenerated renders so deployed image caches stay current.
const posters: Record<LightMode, typeof flowPoster> = { flow: flowPoster, holiday: holidayPoster, visibility: visibilityPoster };

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };
type SceneStatus = "image" | "loading" | "ready" | "error";
type HeroControls = { refresh(): Promise<void>; explore(): void; showImage(): void };

export function InteractiveHeroMedia({ sceneAvailable = false }: { sceneAvailable?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<HeroSceneHandle | null>(null);
  const controls = useRef<HeroControls | null>(null);
  const posterLoaded = useRef(false);
  const modeRef = useRef<LightMode>("flow");
  const [mode, setMode] = useState<LightMode>("flow");
  const [status, setStatus] = useState<SceneStatus>("image");
  const [canExplore, setCanExplore] = useState(false);
  const ready = status === "ready";

  useEffect(() => {
    const element = host.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const width = matchMedia(`(min-width: ${heroSceneConfig.minWidth}px)`);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const device = navigator as Navigator & { connection?: Connection; deviceMemory?: number };
    let generation = 0;
    let visible = false;
    let loading = false;
    let failed = false;
    let disposed = false;
    let optedIn = false;
    let imageOnly = false;
    let webglCapable: boolean | null = null;
    let request: AbortController | null = null;
    const capable = () => sceneAvailable && globalThis.isSecureContext && !!globalThis.crypto?.subtle &&
      typeof ResizeObserver !== "undefined" && !motion.matches && !device.connection?.saveData &&
      !["slow-2g", "2g"].includes(device.connection?.effectiveType ?? "") &&
      (device.deviceMemory === undefined || device.deviceMemory >= 4);
    const eligible = () => capable() && ((width.matches && !coarse.matches) || optedIn) && !imageOnly;
    const stop = (next: SceneStatus = "image") => {
      generation++;
      loading = false;
      request?.abort();
      request = null;
      scene.current?.dispose();
      scene.current = null;
      if (!disposed) setStatus(next);
    };
    const update = async () => {
      if (disposed) return;
      if (!capable()) { setCanExplore(false); stop(); return; }
      if (!eligible() && (scene.current || loading)) stop();
      if (!posterLoaded.current) return;
      const active = visible && !document.hidden;
      if (!active) {
        scene.current?.setActive(false);
        if (loading) stop();
        return;
      }
      if (webglCapable === null) {
        try {
          const probe = document.createElement("canvas");
          const gl = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
          webglCapable = !!gl;
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { webglCapable = false; }
      }
      setCanExplore(webglCapable);
      if (!webglCapable || !eligible()) { stop(); return; }
      if (scene.current) { scene.current.setActive(true); return; }
      if (loading || failed) return;
      loading = true;
      setStatus("loading");
      const attempt = ++generation;
      const abort = new AbortController();
      request = abort;
      try {
        // Access, decryption, and embedded-model validation precede the heavy engine.
        const { loadHeroModels } = await import("../../lib/hero-asset-client");
        if (disposed || attempt !== generation) return;
        const models = await loadHeroModels(abort.signal);
        if (disposed || attempt !== generation) return;
        const { createHeroScene } = await import("./stroller-hero-scene");
        if (disposed || attempt !== generation) return;
        const handle = await createHeroScene(element, modeRef.current, () => {
          if (disposed || attempt !== generation) return;
          failed = true;
          stop("error");
        }, models, abort.signal);
        if (disposed || attempt !== generation || !eligible()) { handle.dispose(); return; }
        scene.current = handle;
        handle.setMode(modeRef.current);
        handle.setActive(visible && !document.hidden);
        setStatus("ready");
      } catch {
        if (!disposed && attempt === generation) { failed = true; stop("error"); }
      } finally {
        if (attempt === generation) loading = false;
      }
    };
    controls.current = {
      refresh: update,
      explore() { optedIn = true; imageOnly = false; failed = false; void update(); },
      showImage() { imageOnly = true; optedIn = false; failed = false; stop(); },
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; void update(); });
    observer.observe(element);
    width.addEventListener("change", update);
    motion.addEventListener("change", update);
    coarse.addEventListener("change", update);
    device.connection?.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      controls.current = null;
      observer.disconnect();
      width.removeEventListener("change", update);
      motion.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
      device.connection?.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      stop();
    };
  }, [sceneAvailable]);

  return (
    <figure className="interactive-hero" aria-label="Explore the Glowbaby stroller light concept">
      <div className="interactive-hero-stage" style={{ backgroundColor: heroSceneConfig.environment.background }} onContextMenu={(event) => event.preventDefault()}>
        <Image src={posters[mode]} alt="Close-up of the Glowbaby prototype beneath a stroller basket, casting colored light across a concrete sidewalk at dusk." fill draggable={false} loading="eager" fetchPriority="high" sizes="(min-width: 1240px) 562px, (min-width: 1024px) calc((100vw - 7rem) / 2), (min-width: 640px) calc(100vw - 4rem), calc(100vw - 2.5rem)" className="object-contain" onLoad={() => {
          posterLoaded.current = true;
          void controls.current?.refresh();
        }} />
        <div ref={host} className={`interactive-hero-canvas ${ready ? "is-ready" : ""}`} aria-hidden="true" />
        <span className="interactive-hero-badge">{ready ? "Drag to explore" : "Made for a little more color"}</span>
      </div>
      <div className="hero-mode-controls" role="group" aria-label="Preview a light mode">
        {lightModes.map((item) => (
          <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => {
            modeRef.current = item.id;
            setMode(item.id);
            scene.current?.setMode(item.id);
          }}><span className={`hero-mode-dot hero-mode-dot-${item.id}`} aria-hidden="true" />{item.label}</button>
        ))}
        {canExplore && <button type="button" className="hero-3d-switch" role="switch" aria-label="3D preview" aria-checked={ready || status === "loading"} title={status === "loading" ? "Turn off to cancel loading" : status === "error" ? "Turn on to retry 3D" : "Toggle interactive 3D"} onClick={() => {
          if (status === "ready" || status === "loading") controls.current?.showImage();
          else controls.current?.explore();
        }}><span className="hero-switch-track" aria-hidden="true" />3D</button>}
      </div>
      <figcaption className="hero-media-caption">
        <span aria-live="polite">{lightModes.find((item) => item.id === mode)?.description}</span>
        <span role="status">{status === "loading" ? "Loading 3D · Image remains available" : status === "error" ? "3D couldn’t load. Toggle 3D to try again." : ready ? "Drag to explore · Scroll outside the view" : "App-controlled light · Prototype concept"}</span>
      </figcaption>
    </figure>
  );
}
