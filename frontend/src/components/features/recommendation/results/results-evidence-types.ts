import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

export type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

export type ResultsEvidenceTabProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
};

export type ResultsEvidencePickCardProps = {
  row: ApiPick;
  index: number;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
};
