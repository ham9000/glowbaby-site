"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroSceneConfig, lightModes, type LightMode } from "./hero-scene-config";
import type { HeroSceneHandle } from "./stroller-hero-scene";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function InteractiveHeroMedia() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<HeroSceneHandle | null>(null);
  const modeRef = useRef<LightMode>("flow");
  const [mode, setMode] = useState<LightMode>("flow");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element || !heroSceneConfig.assetsReady) return;
    const width = matchMedia(`(min-width: ${heroSceneConfig.minWidth}px)`);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & { connection?: Connection; deviceMemory?: number };
    let generation = 0;
    let visible = false;
    let loading = false;
    let failed = false;
    let disposed = false;
    const eligible = () => width.matches && !motion.matches && !device.connection?.saveData &&
      !["slow-2g", "2g"].includes(device.connection?.effectiveType ?? "") &&
      (device.deviceMemory === undefined || device.deviceMemory >= 4);
    const stop = () => {
      generation++;
      loading = false;
      scene.current?.dispose();
      scene.current = null;
      setReady(false);
    };
    const update = async () => {
      if (disposed) return;
      if (!eligible()) { stop(); return; }
      const active = visible && !document.hidden;
      if (scene.current) { scene.current.setActive(active); return; }
      if (!active || loading || failed) return;
      loading = true;
      const attempt = ++generation;
      try {
        // Probe before fetching any 3D code or geometry.
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
        if (!gl) throw new Error("WebGL unavailable");
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        const { createHeroScene } = await import("./stroller-hero-scene");
        if (disposed || attempt !== generation) return;
        const handle = await createHeroScene(element, modeRef.current, () => {
          failed = true;
          stop();
        });
        if (disposed || attempt !== generation || !eligible()) { handle.dispose(); return; }
        scene.current = handle;
        handle.setMode(modeRef.current);
        handle.setActive(visible && !document.hidden);
        setReady(true);
      } catch {
        if (!disposed && attempt === generation) { failed = true; stop(); }
      } finally {
        if (attempt === generation) loading = false;
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; void update(); });
    observer.observe(element);
    width.addEventListener("change", update);
    motion.addEventListener("change", update);
    device.connection?.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      generation++;
      observer.disconnect();
      width.removeEventListener("change", update);
      motion.removeEventListener("change", update);
      device.connection?.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  return (
    <figure className="interactive-hero" aria-label="Explore the Glowbaby stroller light concept">
      <div className="interactive-hero-stage">
        <Image src={`/hero/stroller-${mode}.webp`} alt="Stroller concept fitted with a Glowbaby undercarriage light, illuminating the ground below." fill priority sizes="(min-width: 1024px) 48vw, 100vw" className="object-contain" />
        <div ref={host} className={`interactive-hero-canvas ${ready ? "is-ready" : ""}`} aria-hidden="true" />
        <span className="interactive-hero-badge">{ready ? "Drag gently to explore" : "Made for a little more color"}</span>
      </div>
      <div className="hero-mode-controls" role="group" aria-label="Preview a light mode">
        {lightModes.map((item) => (
          <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => {
            modeRef.current = item.id;
            setMode(item.id);
            scene.current?.setMode(item.id);
          }}><span className={`hero-mode-dot hero-mode-dot-${item.id}`} aria-hidden="true" />{item.label}</button>
        ))}
      </div>
      <figcaption className="hero-media-caption">
        <span aria-live="polite">{lightModes.find((item) => item.id === mode)?.description}</span>
        <span>App-controlled light · Prototype concept</span>
      </figcaption>
    </figure>
  );
}
