"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  BACKEND_RESULT_TABS,
  LITE_RESULT_TABS,
  type BackendResultTabId,
  type LiteResultTabId,
} from "./results-types";

function tabClass(active: boolean): string {
  return cn(
    "h-10 shrink-0 snap-start rounded-lg px-4 text-sm font-medium sm:px-5",
    active
      ? "border-ca-on-surface/35 bg-ca-surface-container/70 text-ca-on-surface"
      : "border-ca-outline-variant/50 bg-transparent text-ca-on-surface-variant hover:border-ca-on-surface/30 hover:bg-ca-surface-container/50 hover:text-ca-on-surface",
  );
}

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
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:snap-none sm:pb-0 [&::-webkit-scrollbar]:hidden"
        data-testid="e2e-results-tab-bar"
        role="tablist"
        aria-label="결과 보기"
      >
        {BACKEND_RESULT_TABS.map((tab) => (
          <Button
            key={tab.id}
            size="default"
            variant="outline"
            className={tabClass(activeTab === tab.id)}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
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
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="결과 보기">
      {LITE_RESULT_TABS.map((tab) => (
        <Button
          key={tab.id}
          size="default"
          variant="outline"
          className={tabClass(activeTab === tab.id)}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
