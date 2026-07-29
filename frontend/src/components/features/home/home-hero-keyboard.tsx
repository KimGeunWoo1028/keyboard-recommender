"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

const HomeHeroKeyboardCanvas = dynamic(
  () =>
    import("@/components/features/home/home-hero-keyboard-canvas").then(
      (module) => module.HomeHeroKeyboardCanvas,
    ),
  { ssr: false },
);

export function HomeHeroKeyboard() {
  const [isReady, setIsReady] = useState(false);
  const handleReady = useCallback(() => setIsReady(true), []);

  return (
    <div
      className="group relative aspect-[4/3] w-full cursor-grab touch-pan-y active:cursor-grabbing"
      role="img"
      aria-label="마우스로 돌려볼 수 있는 반투명 보라색 기계식 키보드 3D 모델"
    >
      <Image
        src="/brand/hero-keyboard-cutout.png"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 58vw"
        className={`pointer-events-none object-contain object-center transition-opacity duration-500 ${
          isReady ? "opacity-0" : "opacity-100"
        }`}
      />

      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <HomeHeroKeyboardCanvas onReady={handleReady} />
      </div>

      <span className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-ca-on-surface-variant opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:bg-ca-surface/80">
        드래그해서 돌려보세요
      </span>
    </div>
  );
}
