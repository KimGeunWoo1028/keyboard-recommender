"use client";

import { cn } from "@/lib/utils";

import {
  BACKEND_RESULT_TABS,
  LITE_RESULT_TABS,
  type BackendResultTabId,
  type LiteResultTabId,
} from "./results-types";

function tabClass(active: boolean): string {
  return cn(
    "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 px-4 text-sm font-semibold transition-colors sm:px-5",
    active
      ? "border-primary text-primary"
      : "border-transparent text-ca-on-surface-variant hover:text-primary",
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
    <div className="relative border-b border-border sm:static">
      <div
        className="flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth pb-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:snap-none [&::-webkit-scrollbar]:hidden"
        data-testid="e2e-results-tab-bar"
        role="tablist"
        aria-label="결과 보기"
      >
        {BACKEND_RESULT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={tabClass(activeTab === tab.id)}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
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
    <div className="border-b border-border" role="tablist" aria-label="결과 보기">
      <div className="flex flex-wrap gap-1">
        {LITE_RESULT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={tabClass(activeTab === tab.id)}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
