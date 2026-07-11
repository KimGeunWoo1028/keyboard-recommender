import type {
  FoamConfiguration,
  KeyboardLayout,
  PlateMaterial,
  RecommendationCatalog,
  ScoredComponent,
  SwitchType,
} from "@/recommendation-engine/models";
import { SAMPLE_RECOMMENDATION_CATALOG } from "@/recommendation-engine/dataset.sample";
import { rankComponents } from "@/recommendation-engine/scoring";
import type { EngineTraitVector } from "@/recommendation-engine/traits";

export interface EngineRecommendation {
  userVector: EngineTraitVector;
  topSwitch: ScoredComponent<SwitchType>;
  topPlate: ScoredComponent<PlateMaterial>;
  topFoam: ScoredComponent<FoamConfiguration>;
  topLayout: ScoredComponent<KeyboardLayout>;
  /** Full ranked lists (extensible for UI or A/B) */
  ranked: {
    switches: ScoredComponent<SwitchType>[];
    plates: ScoredComponent<PlateMaterial>[];
    foams: ScoredComponent<FoamConfiguration>[];
    layouts: ScoredComponent<KeyboardLayout>[];
  };
}

/**
 * Run score-based recommendation across all component families.
 * Pass a custom catalog for tests or future server-loaded data.
 */
export function recommendKeyboardStack(
  userVector: EngineTraitVector,
  catalog: RecommendationCatalog = SAMPLE_RECOMMENDATION_CATALOG,
  options?: { topKLists?: number },
): EngineRecommendation {
  const k = options?.topKLists ?? catalog.switchTypes.length;

  const switches = rankComponents(userVector, catalog.switchTypes, { topK: k });
  const plates = rankComponents(userVector, catalog.plateMaterials, { topK: k });
  const foams = rankComponents(userVector, catalog.foamConfigurations, { topK: k });
  const layouts = rankComponents(userVector, catalog.keyboardLayouts, { topK: k });

  function pickOne<T extends ScoredComponent>(arr: T[]): T {
    const first = arr[0];
    if (!first) throw new Error("recommendKeyboardStack: empty ranked list");
    return first;
  }

  return {
    userVector,
    topSwitch: pickOne(switches),
    topPlate: pickOne(plates),
    topFoam: pickOne(foams),
    topLayout: pickOne(layouts),
    ranked: { switches, plates, foams, layouts },
  };
}
