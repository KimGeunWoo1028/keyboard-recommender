"use client";

import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useState } from "react";
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

export function HomeHeroKeyboard() {
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

  useEffect(() => {
    if (isReady || hasFailed) return;
    const timeout = window.setTimeout(handleFailed, 15_000);
    return () => window.clearTimeout(timeout);
  }, [handleFailed, hasFailed, isReady]);

  return (
    <div
      className={`group relative aspect-[5/4] w-full touch-pan-y ${
        isReady ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      role="img"
      aria-label={
        isReady
          ? "마우스로 돌려볼 수 있는 반투명 보라색 기계식 키보드 3D 모델"
          : "반투명 보라색 기계식 키보드"
      }
    >
      {/* Loading placeholder — neutral so it does not read as a different product */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
          isReady || hasFailed ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        <div className="h-[42%] w-[76%] animate-pulse rounded-2xl bg-primary/10 blur-xl dark:bg-primary/15" />
      </div>

      {/* A local static fallback keeps the hero intact if WebGL is unavailable or loses context. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- transparent local fallback asset */}
      <img
        src="/brand/hero-keyboard-cutout.png"
        alt=""
        className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          hasFailed ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
        decoding="async"
      />

      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isReady && !hasFailed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <CanvasErrorBoundary onError={handleFailed}>
          <HomeHeroKeyboardCanvas onReady={handleReady} onContextLost={handleFailed} />
        </CanvasErrorBoundary>
      </div>

      <span
        className={`pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-ca-on-surface-variant shadow-sm backdrop-blur-sm transition-opacity dark:bg-ca-surface/80 ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
      >
        드래그해서 돌려보세요
      </span>
    </div>
  );
}
