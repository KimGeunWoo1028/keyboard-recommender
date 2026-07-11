/** Mock / API response shape for the results UI. */

export interface RecommendedBuild {
  id: string;
  title: string;
  tagline: string;
  switches: string;
  plate: string;
  foam: string;
  /** Score-based engine pick (layout family) */
  layout: string;
  /** Score-based engine pick (case / kit family); absent on pre-rev6 cached results */
  case?: string;
  /** Score-based engine pick (keycap family); absent on pre-rev7 cached results */
  keycap?: string;
  highlights: string[];
  /** Optional debug: engine scores for transparency */
  engineScores?: {
    switchId: string;
    plateId: string;
    foamId: string;
    layoutId: string;
    caseId: string;
    keycapId?: string;
    switchScore: number;
    plateScore: number;
    foamScore: number;
    layoutScore: number;
    caseScore: number;
    keycapScore?: number;
  };
  /** Swagkey product detail URLs keyed by domain (switch, plate, foam, layout, case, keycap). */
  sourceUrls?: Partial<Record<"switch" | "plate" | "foam" | "layout" | "case" | "keycap", string>>;
}
