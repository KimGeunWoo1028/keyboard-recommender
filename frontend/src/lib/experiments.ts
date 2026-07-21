import { getOrCreateClientSessionId } from "@/lib/client-session-id";

export type ExperimentId =
  | "onboarding_wording_v1"
  | "recommendation_layout_v1"
  | "explanation_phrasing_v1";

export type ExperimentAssignment = Record<ExperimentId, string>;

const STORAGE_KEY = "kr_experiment_assignments_v1";

type ExperimentConfig = {
  id: ExperimentId;
  variants: readonly { id: string; weight: number }[];
};

const EXPERIMENTS: readonly ExperimentConfig[] = [
  {
    id: "onboarding_wording_v1",
    variants: [
      { id: "control", weight: 50 },
      { id: "friendly", weight: 50 },
    ],
  },
  {
    id: "recommendation_layout_v1",
    variants: [
      { id: "control", weight: 50 },
      { id: "mobile_swipe_first", weight: 50 },
    ],
  },
  {
    id: "explanation_phrasing_v1",
    variants: [
      { id: "control", weight: 50 },
      { id: "compact", weight: 50 },
    ],
  },
];

function stableHash32(input: string): number {
  // FNV-1a 32-bit (good enough for deterministic bucketing).
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function chooseWeightedVariant(seed: string, variants: ExperimentConfig["variants"]): string {
  const total = variants.reduce((acc, v) => acc + v.weight, 0);
  const bucket = stableHash32(seed) % Math.max(1, total);
  let cursor = 0;
  for (const v of variants) {
    cursor += v.weight;
    if (bucket < cursor) return v.id;
  }
  return variants[0]?.id ?? "control";
}

export function getOrCreateExperimentAssignments(): ExperimentAssignment {
  if (typeof window === "undefined") {
    // Server render: return a deterministic default (no storage).
    return {
      onboarding_wording_v1: "control",
      recommendation_layout_v1: "control",
      explanation_phrasing_v1: "control",
    };
  }

  const existingRaw = window.localStorage.getItem(STORAGE_KEY);
  if (existingRaw) {
    try {
      const parsed = JSON.parse(existingRaw) as Partial<ExperimentAssignment>;
      const hydrated: ExperimentAssignment = {
        onboarding_wording_v1: String(parsed.onboarding_wording_v1 ?? "control"),
        recommendation_layout_v1: String(parsed.recommendation_layout_v1 ?? "control"),
        explanation_phrasing_v1: String(parsed.explanation_phrasing_v1 ?? "control"),
      };
      return hydrated;
    } catch {
      // fall through
    }
  }

  const sessionId = getOrCreateClientSessionId();
  const out: Partial<ExperimentAssignment> = {};
  for (const exp of EXPERIMENTS) {
    out[exp.id] = chooseWeightedVariant(`${sessionId}:${exp.id}`, exp.variants);
  }
  const finalOut = out as ExperimentAssignment;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOut));
  return finalOut;
}

export function getExperimentVariant(id: ExperimentId): string {
  const assignments = getOrCreateExperimentAssignments();
  return assignments[id] ?? "control";
}
