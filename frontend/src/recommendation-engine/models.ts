import type { EngineTraitVector, TraitMetadata } from "@/recommendation-engine/traits";

/** Shared catalog fields: every part has trait metadata for scoring. */
export interface KeyboardComponentBase {
  id: string;
  name: string;
  /** Consumer-facing blurb */
  description: string;
  /**
   * Intrinsic trait profile (typically 0–10 per axis; sparse OK).
   * Matched against the user preference vector.
   */
  traitMetadata: TraitMetadata;
  /** Optional catalog tuning without changing traits */
  popularityWeight?: number;
}

export interface SwitchType extends KeyboardComponentBase {
  kind: "switch";
  /** e.g. linear | tactile | silent */
  switchCategory: "linear" | "tactile" | "silent_linear" | "silent_tactile";
}

export interface PlateMaterial extends KeyboardComponentBase {
  kind: "plate";
  material: "aluminum" | "fr4" | "pc" | "pom" | "brass";
}

export interface FoamConfiguration extends KeyboardComponentBase {
  kind: "foam";
  /** layering intent */
  stack: "case_only" | "case_and_plate" | "minimal" | "heavy_damp";
}

export interface KeyboardLayout extends KeyboardComponentBase {
  kind: "layout";
  /** rough size class */
  sizeClass: "compact_60" | "65_75" | "tkl" | "full";
}

export interface RecommendationCatalog {
  switchTypes: SwitchType[];
  plateMaterials: PlateMaterial[];
  foamConfigurations: FoamConfiguration[];
  keyboardLayouts: KeyboardLayout[];
}

export type CatalogItem = SwitchType | PlateMaterial | FoamConfiguration | KeyboardLayout;

export interface ScoredComponent<T extends CatalogItem = CatalogItem> {
  item: T;
  score: number;
  /** Dot product of normalized user vector · expanded item vector (for debugging) */
  rawDot: number;
}
