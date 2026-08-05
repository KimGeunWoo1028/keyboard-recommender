"use client";

import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const HomeHeroKeyboardCanvas = dynamic(
  () =>
    import("@/components/features/home/home-hero-keyboard-canvas").then(
      (module) => module.HomeHeroKeyboardCanvas,
    ),
  { ssr: false },
);

type CanvasErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type CanvasErrorBoundaryState = {
  hasError: boolean;
};

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Defer Three.js past first paint / Lighthouse TBT window; still load if the main thread stays busy. */
const IDLE_LOAD_TIMEOUT_MS = 2_500;

function scheduleWhenIdle(callback: () => void, timeoutMs: number): () => void {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => callback(), { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, Math.min(timeoutMs, 1_500));
  return () => window.clearTimeout(id);
}

export function HomeHeroKeyboard() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoadCanvas, setShouldLoadCanvas] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const handleReady = useCallback(() => {
    setHasFailed(false);
    setIsReady(true);
  }, []);
  const handleFailed = useCallback(() => {
    setIsReady(false);
    setHasFailed(true);
  }, []);
  const beginCanvasLoad = useCallback(() => {
    setShouldLoadCanvas(true);
  }, []);

  // First paint stays on the static cutout. Mount Three only after idle, interaction, or timeout.
  useEffect(() => {
    if (shouldLoadCanvas || hasFailed) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setHasFailed(true);
      return;
    }

    const root = rootRef.current;
    let cancelled = false;
    let cancelIdle: (() => void) | undefined;

    const start = () => {
      if (cancelled) return;
      cancelled = true;
      cancelIdle?.();
      beginCanvasLoad();
    };

    const armIdle = () => {
      if (cancelled) return;
      cancelIdle = scheduleWhenIdle(start, IDLE_LOAD_TIMEOUT_MS);
    };

    // Wait for window load so hydration/LCP work finishes before Three starts.
    if (document.readyState === "complete") {
      armIdle();
    } else {
      window.addEventListener("load", armIdle, { once: true });
    }

    if (root) {
      root.addEventListener("pointerenter", start, { once: true, passive: true });
      root.addEventListener("pointerdown", start, { once: true, passive: true });
      root.addEventListener("focusin", start, { once: true });
    }

    return () => {
      cancelled = true;
      cancelIdle?.();
      window.removeEventListener("load", armIdle);
      if (root) {
        root.removeEventListener("pointerenter", start);
        root.removeEventListener("pointerdown", start);
        root.removeEventListener("focusin", start);
      }
    };
  }, [beginCanvasLoad, hasFailed, shouldLoadCanvas]);

  useEffect(() => {
    if (!shouldLoadCanvas || isReady || hasFailed) return;
    const timeout = window.setTimeout(handleFailed, 15_000);
    return () => window.clearTimeout(timeout);
  }, [handleFailed, hasFailed, isReady, shouldLoadCanvas]);

  const show3d = isReady && !hasFailed;

  return (
    <div
      ref={rootRef}
      className={`group relative aspect-[5/4] w-full touch-pan-y ${
        show3d ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      role="img"
      aria-label={
        show3d
          ? "마우스로 돌려볼 수 있는 반투명 보라색 기계식 키보드 3D 모델"
          : "반투명 보라색 기계식 키보드"
      }
    >
      {/* Static cutout until WebGL is ready (or forever if reduced-motion / WebGL fails). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- transparent local fallback asset */}
      <img
        src="/brand/hero-keyboard-cutout.png"
        alt=""
        className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          show3d ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
        decoding="async"
      />

      {shouldLoadCanvas && !hasFailed ? (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            show3d ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <CanvasErrorBoundary onError={handleFailed}>
            <HomeHeroKeyboardCanvas onReady={handleReady} onContextLost={handleFailed} />
          </CanvasErrorBoundary>
        </div>
      ) : null}

      <span
        className={`pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-ca-on-surface-variant shadow-sm backdrop-blur-sm transition-opacity dark:bg-ca-surface/80 ${
          show3d ? "opacity-100" : "opacity-0"
        }`}
      >
        드래그해서 돌려보세요
      </span>
    </div>
  );
}
