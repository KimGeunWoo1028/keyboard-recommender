import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "src/components/features/recommendation/recommendation-result-view.tsx");
const outDir = path.join(root, "src/components/features/recommendation/results");
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

const overviewBody = slice(1075, 1412)
  .replace(/setActiveBackendTab/g, "onNavigateTab")
  .replace(/void handleApplyRefinement/g, "void onApplyRefinement");

const overview = `"use client";

import Link from "next/link";

import { catalogHref } from "@/lib/catalog-links";
import type { DiscoveryPayload } from "@/lib/api/discovery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";
import {
  BUILD_DOMAIN_KEYS,
  BUILD_DOMAIN_LABELS,
  buildComponentDisplayText,
  buildPartSourceUrl,
  splitBuildComponentText,
} from "./results-build-utils";
import { SwagkeyProductLink } from "./swagkey-product-link";
import type { BackendResultTabId } from "./results-types";

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  sourceUrl?: string;
};

export type ResultsOverviewTabProps = {
  discovery: DiscoveryPayload | null;
  onNavigateTab: (tab: BackendResultTabId) => void;
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
  applyingRefine: boolean;
  refineError?: string | null;
  onApplyRefinement: (stepId: string, answerId: string, label: string) => void;
};

export function ResultsOverviewTab({
  discovery,
  onNavigateTab,
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
  applyingRefine,
  refineError,
  onApplyRefinement,
}: ResultsOverviewTabProps) {
  return (
    <>
${overviewBody}
    </>
  );
}
`;

fs.writeFileSync(path.join(outDir, "results-overview-tab.tsx"), overview);

const saveCompareBody = slice(1418, 1757)
  .replace(/setActiveBackendTab/g, "onNavigateTab")
  .replace(/void handleSaveBuild\(\)/g, "void onSaveBuild()")
  .replace(/void handleSaveComparison\(\)/g, "void onSaveComparison()")
  .replace(/setSaveCollection/g, "onSaveCollectionChange")
  .replace(/setSaveNote/g, "onSaveNoteChange")
  .replace(/setShowDeferredLoginPrompt\(\(v\) => !v\)/g, "onToggleDeferredLoginPrompt()")
  .replace(/setCompareLeft\(Number\(e\.target\.value\)\)/g, "onCompareLeftChange(Number(e.target.value))")
  .replace(/setCompareRight\(Number\(e\.target\.value\)\)/g, "onCompareRightChange(Number(e.target.value))")
  .replace(
    /onClick=\{\(\) => \{\s*setCompareLeft\(0\);\s*setCompareRight\(Math\.min\(1, apiPicks\.length - 1\)\);\s*\}\}/g,
    "onClick={() => onResetCompare()}",
  )
  .replace(
    /onClick=\{\(\) => \{\s*setCompareLeft\(compareRight\);\s*setCompareRight\(compareLeft\);\s*\}\}/g,
    "onClick={() => onSwapCompare()}",
  );

const saveCompare = `"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendedBuild } from "@/types/recommendation";

import { HelpHint } from "./help-hint";
import { MOBILE_EXPLANATION_PREVIEW } from "./results-constants";
import {
  domainDisplayLabel,
  formatScore,
  pickDisplayName,
  pickRowSourceUrl,
} from "./results-build-utils";
import { SwagkeyProductLink } from "./swagkey-product-link";
import { truncateForMobile } from "./results-text-utils";
import type { BackendResultTabId } from "./results-types";

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  sourceUrl?: string;
  score: number;
  confidence?: number;
  summary?: string;
  whyTraits?: string[];
  tradeOffs?: string[];
};

export type ResultsSaveCompareTabProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
  isAuthenticated: boolean;
  saveCollection: string;
  saveNote: string;
  saveState: "idle" | "saving" | "saved" | "error";
  saveMessage: string;
  savedItems: SavedRecommendationItem[];
  showDeferredLoginPrompt: boolean;
  compareLeft: number;
  compareRight: number;
  onSaveCollectionChange: (v: string) => void;
  onSaveNoteChange: (v: string) => void;
  onSaveBuild: () => void;
  onToggleDeferredLoginPrompt: () => void;
  onCompareLeftChange: (v: number) => void;
  onCompareRightChange: (v: number) => void;
  onSwapCompare: () => void;
  onResetCompare: () => void;
  onSaveComparison: () => void;
  onNavigateTab: (tab: BackendResultTabId) => void;
};

import type { SurveySubmission } from "@/types/survey";

export function ResultsSaveCompareTab(props: ResultsSaveCompareTabProps) {
  const {
    build,
    apiPicks,
    enrichedSourceUrls,
    isAuthenticated,
    saveCollection,
    saveNote,
    saveState,
    saveMessage,
    savedItems,
    showDeferredLoginPrompt,
    compareLeft,
    compareRight,
    onSaveCollectionChange,
    onSaveNoteChange,
    onSaveBuild,
    onToggleDeferredLoginPrompt,
    onCompareLeftChange,
    onCompareRightChange,
    onSwapCompare,
    onResetCompare,
    onSaveComparison,
    onNavigateTab,
  } = props;

  return (
    <>
${saveCompareBody}
    </>
  );
}
`;

// Fix duplicate import - rewrite saveCompare cleanly
const saveCompareFixed = saveCompare.replace(
  `};

import type { SurveySubmission } from "@/types/survey";

export function ResultsSaveCompareTab(props: ResultsSaveCompareTabProps) {`,
  `};

export function ResultsSaveCompareTab(props: ResultsSaveCompareTabProps) {`,
).replace(
  `export type ResultsSaveCompareTabProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;`,
  `import type { SurveySubmission } from "@/types/survey";

export type ResultsSaveCompareTabProps = {
  build: RecommendedBuild;`,
);

fs.writeFileSync(path.join(outDir, "results-save-compare-tab.tsx"), saveCompareFixed);

const activityBody = slice(1762, 1887)
  .replace(/setShowAllViewed/g, "onToggleShowAllViewed")
  .replace(/setShowAllCompared/g, "onToggleShowAllCompared")
  .replace(/setShowAllSaved/g, "onToggleShowAllSaved");

const activity = `"use client";

import type { RecommendationActivityItem } from "@/lib/api/saved-recommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { HelpHint } from "./help-hint";
import {
  RECENT_ACTIVITY_COLLAPSED_LIMIT,
  RECENT_ACTIVITY_EXPANDED_LIMIT,
} from "./results-constants";

export type ResultsActivityTabProps = {
  recentViewed: RecommendationActivityItem[];
  recentCompared: RecommendationActivityItem[];
  recentSaved: RecommendationActivityItem[];
  showAllViewed: boolean;
  showAllCompared: boolean;
  showAllSaved: boolean;
  onToggleShowAllViewed: (fn: (v: boolean) => boolean) => void;
  onToggleShowAllCompared: (fn: (v: boolean) => boolean) => void;
  onToggleShowAllSaved: (fn: (v: boolean) => boolean) => void;
};

export function ResultsActivityTab({
  recentViewed,
  recentCompared,
  recentSaved,
  showAllViewed,
  showAllCompared,
  showAllSaved,
  onToggleShowAllViewed,
  onToggleShowAllCompared,
  onToggleShowAllSaved,
}: ResultsActivityTabProps) {
  return (
${activityBody}
  );
}
`;

fs.writeFileSync(path.join(outDir, "results-activity-tab.tsx"), activity);

const evidenceBody = slice(1892, 2212);

const evidence = `"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";
import { MetricGuideCard } from "./metric-guide-card";
import {
  domainDisplayLabel,
  formatScore,
  pickDisplayName,
  pickRowSourceUrl,
} from "./results-build-utils";
import { SwagkeyProductLink } from "./swagkey-product-link";
import {
  alternativeTagline,
  beginnerFriendlyExplanation,
  beginnerFriendlyTradeoffLine,
  beginnerFriendlyWhyLine,
  traitAxisDisplayLabel,
} from "./results-text-utils";

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];
type TraitBadge = { key: string; label: string; score: number };

export type ResultsEvidenceTabProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
  traitBadges: TraitBadge[];
  traitEntries: [string, number][];
  legacyEntries: [string, number][];
  overallConfidencePct: number | null;
  effectivePenalty: number | null;
};

export function ResultsEvidenceTab({
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
  traitBadges,
  traitEntries,
  legacyEntries,
  overallConfidencePct,
  effectivePenalty,
}: ResultsEvidenceTabProps) {
  return (
    <>
${evidenceBody}
    </>
  );
}
`;

fs.writeFileSync(path.join(outDir, "results-evidence-tab.tsx"), evidence);

console.log("Extracted: overview, save-compare, activity, evidence");
