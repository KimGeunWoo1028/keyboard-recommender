import type { ApiPick } from "./results-evidence-types";
import {
  formatEvidencePartWhyLine,
  formatEvidenceTradeoff,
  formatEvidenceWhyLine,
  pickDomainAlignmentAxis,
  parseEvidenceAlignments,
} from "./results-text-utils";

/** Axes appearing on at least this share of picks are treated as shared (not part-specific). */
const SHARED_AXIS_RATIO = 0.7;

export type SharedEvidenceReasons = {
  /** True when at least one shared alignment or tradeoff was extracted. */
  hasSharedReasons: boolean;
  alignmentBullets: string[];
  tradeoffLine: string | null;
  sharedAxisLabels: ReadonlySet<string>;
};

export function deriveSharedEvidenceReasons(apiPicks: ApiPick[]): SharedEvidenceReasons {
  const pickCount = apiPicks.length;
  if (pickCount === 0) {
    return {
      hasSharedReasons: false,
      alignmentBullets: [],
      tradeoffLine: null,
      sharedAxisLabels: new Set(),
    };
  }

  const minAxisCount = Math.max(2, Math.ceil(pickCount * SHARED_AXIS_RATIO));
  const axisCounts = new Map<string, number>();

  for (const pick of apiPicks) {
    const alignments = parseEvidenceAlignments(pick.whyTraits);
    const axisLabel = pickDomainAlignmentAxis(alignments, pick.domain);
    if (!axisLabel) continue;
    axisCounts.set(axisLabel, (axisCounts.get(axisLabel) ?? 0) + 1);
  }

  const sharedAxisLabels = new Set<string>();
  for (const [label, count] of axisCounts) {
    if (count >= minAxisCount) sharedAxisLabels.add(label);
  }

  const alignmentBullets = [...sharedAxisLabels]
    .slice(0, 3)
    .map((label) => `${label} 취향과 일치`);

  const tradeoffCounts = new Map<string, number>();
  for (const pick of apiPicks) {
    const line = formatEvidenceTradeoff(pick.tradeOffs);
    if (!line) continue;
    tradeoffCounts.set(line, (tradeoffCounts.get(line) ?? 0) + 1);
  }

  const minTradeoffCount = Math.max(2, Math.ceil(pickCount * SHARED_AXIS_RATIO));
  let tradeoffLine: string | null = null;
  for (const [line, count] of tradeoffCounts) {
    if (count >= minTradeoffCount) {
      tradeoffLine = line;
      break;
    }
  }

  const hasSharedReasons = alignmentBullets.length > 0 || tradeoffLine !== null;

  return {
    hasSharedReasons,
    alignmentBullets,
    tradeoffLine,
    sharedAxisLabels,
  };
}

/** Part-specific why line when shared alignments are lifted to the top block. */
export function formatEvidenceCardWhyLine(
  row: ApiPick,
  shared: SharedEvidenceReasons,
): { label: string; line: string | null } {
  if (shared.hasSharedReasons) {
    const line = formatEvidencePartWhyLine(row.summary, row.whyTraits, row.itemName, row.domain);
    return { label: "부품별 근거", line: line || null };
  }

  const line = formatEvidenceWhyLine(row.summary, row.whyTraits, row.itemName, row.domain);
  return { label: "왜 추천했나요", line: line || null };
}
