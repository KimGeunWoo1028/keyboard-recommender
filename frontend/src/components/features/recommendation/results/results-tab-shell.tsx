"use client";

import { BarChart3, Info, Layers } from "lucide-react";

import { cn } from "@/lib/utils";

import { RESULT_TABS, type ResultTabId } from "./results-types";

const TAB_ICONS: Record<ResultTabId, typeof Layers> = {
  overview: Layers,
  evidence: Info,
  compare: BarChart3,
};

function tabClass(active: boolean): string {
  return cn(
    "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 px-4 text-sm font-semibold transition-colors sm:px-5",
    active
      ? "border-primary text-primary dark:border-[rgb(165_180_252)] dark:text-[rgb(165_180_252)]"
      : "border-transparent text-ca-on-surface-variant hover:text-primary dark:hover:text-[rgb(165_180_252)]",
  );
}

export function ResultTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: ResultTabId;
  onTabChange: (tab: ResultTabId) => void;
}) {
  return (
    <div className="relative border-b border-border sm:static">
      <div
        className="flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth pb-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:snap-none [&::-webkit-scrollbar]:hidden"
        data-testid="e2e-results-tab-bar"
        role="tablist"
        aria-label="결과 보기"
      >
        {RESULT_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={tabClass(activeTab === tab.id)}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated Use ResultTabBar */
export const BackendResultTabBar = ResultTabBar;
/** @deprecated Use ResultTabBar */
export const LiteResultTabBar = ResultTabBar;
