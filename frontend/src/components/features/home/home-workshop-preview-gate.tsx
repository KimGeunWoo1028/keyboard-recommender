"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { HomeWorkshopGuestPreview } from "@/components/features/home/home-workshop-guest-preview";

const HomeWorkshopPreview = dynamic(
  () =>
    import("@/components/features/home/home-workshop-preview").then((m) => ({
      default: m.HomeWorkshopPreview,
    })),
  {
    ssr: false,
    loading: () => <HomeWorkshopGuestPreview />,
  },
);

/**
 * Below-fold preview gate. Guest panel is SSR-safe on all viewports.
 * Personalized panel JS (bookmarks) still deferred until desktop width so mobile
 * LCP stays light — mobile sees the experience summary only (Home IA).
 */
export function HomeWorkshopPreviewGate() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!desktop) {
    return <HomeWorkshopGuestPreview />;
  }

  return <HomeWorkshopPreview />;
}
