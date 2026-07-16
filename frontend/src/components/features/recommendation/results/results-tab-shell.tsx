"use client";

import { Button } from "@/components/ui/button";

import {
  BACKEND_RESULT_TABS,
  LITE_RESULT_TABS,
  type BackendResultTabId,
  type LiteResultTabId,
} from "./results-types";

export function BackendResultTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: BackendResultTabId;
  onTabChange: (tab: BackendResultTabId) => void;
}) {
  return (
    <div className="relative sm:static">
      <div
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-0 sm:flex-wrap sm:overflow-visible sm:snap-none sm:pb-0 [&::-webkit-scrollbar]:hidden"
        data-testid="e2e-results-tab-bar"
      >
        {BACKEND_RESULT_TABS.map((tab) => (
          <Button
            key={tab.id}
            size="default"
            variant={activeTab === tab.id ? "primary" : "outline"}
            className={
              activeTab === tab.id
                ? "h-10 shrink-0 snap-start rounded-full px-5 text-base"
                : "h-10 shrink-0 snap-start rounded-full border-ca-outline-variant/60 bg-transparent px-5 text-base text-ca-on-surface-variant hover:border-ca-primary/40 hover:bg-ca-primary/10 hover:text-ca-on-surface"
            }
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ca-surface via-ca-surface/80 to-transparent sm:hidden"
        aria-hidden
      />
    </div>
  );
}

export function LiteResultTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: LiteResultTabId;
  onTabChange: (tab: LiteResultTabId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {LITE_RESULT_TABS.map((tab) => (
        <Button
          key={tab.id}
          size="default"
          variant={activeTab === tab.id ? "primary" : "outline"}
          className={
            activeTab === tab.id
              ? "h-10 rounded-full px-5 text-base"
              : "h-10 rounded-full border-ca-outline-variant/60 bg-transparent px-5 text-base text-ca-on-surface-variant hover:border-ca-primary/40 hover:bg-ca-primary/10 hover:text-ca-on-surface"
          }
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
