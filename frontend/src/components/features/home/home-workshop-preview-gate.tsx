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
 * Workshop preview is desktop-only (`lg:block`). Defer its JS (saved bookmarks + trait bars)
 * until the viewport is large enough so mobile home does not download that chunk.
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
