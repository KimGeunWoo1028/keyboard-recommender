"""Typed REST models for survey → recommendation.

All list and map fields exposed to clients use explicit defaults so JSON never
omits keys the frontend relies on (empty list / empty object instead of null).
"""

from __future__ import annotations

from typing import Any, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_serializer, model_validator


class SurveyAnswersRequest(BaseModel):
    """Validated survey payload (must match frontend `SurveyAnswers`)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)

    sound_profile: Literal["thocky", "clacky", "muted", "balanced", "bright"]
    typing_pressure: Literal["light", "medium", "heavy"]
    switch_feel: Literal["tactile_clear", "tactile_light", "linear"]
    bottom_out: Literal["soft", "medium", "firm"]
    volume: Literal["quiet", "moderate", "loud"]
    natural_language: str | None = Field(
        default=None,
        max_length=4000,
        description="Optional free-text keyboard preferences; parsed with lightweight rules and blended into traits.",
    )

    @model_validator(mode="before")
    @classmethod
    def _normalize_request_aliases(cls, data: Any) -> Any:
        """Accept ``naturalLanguage``; reject legacy ``mode=quick``; ignore ``mode=full``."""
        if not isinstance(data, dict):
            return data
        out = dict(data)
        if "natural_language" not in out and "naturalLanguage" in out:
            out["natural_language"] = out.pop("naturalLanguage")
        mode = out.pop("mode", None)
        if mode == "quick":
            raise ValueError("mode=quick is not supported; complete the survey and use the standard compute path")
        return out


class NLPreferenceAnalysisResponse(BaseModel):
    """How NL text was interpreted for `POST /recommendations/compute` (no LLM)."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    applied: bool = False
    normalized_text: str = Field("", alias="normalizedText")
    parsing_confidence: float = Field(0.0, ge=0.0, le=1.0, alias="parsingConfidence")
    matched_term_ids: list[str] = Field(default_factory=list, alias="matchedTermIds")
    unknown_tokens: list[str] = Field(default_factory=list, alias="unknownTokens")
    warnings: list[str] = Field(default_factory=list)


class NLVocabularyCandidateItemResponse(BaseModel):
    """One high-frequency unknown NL token candidate for dictionary expansion."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    token: str
    count: int = Field(ge=1)
    last_seen_iso: str = Field(alias="lastSeenIso")
    sample_texts: list[str] = Field(default_factory=list, alias="sampleTexts")


class NLVocabularyCandidatesResponse(BaseModel):
    """Aggregated unknown token suggestions mined from persisted interaction events."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    items: list[NLVocabularyCandidateItemResponse] = Field(default_factory=list)
    window_days: int = Field(alias="windowDays", ge=1)
    min_count: int = Field(alias="minCount", ge=1)
    generated_at_iso: str = Field(alias="generatedAtIso")


class CompatibilityPenaltyLineResponse(BaseModel):
    """One soft compatibility adjustment applied at build-selection time."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    rule_id: str = Field(alias="ruleId")
    raw_penalty: float = Field(alias="rawPenalty")
    effective_penalty: float = Field(alias="effectivePenalty")
    message: str
    severity: str = "soft_penalty"
    state: str = "soft"
    category: str = "general"


class CompatibilityAuditResponse(BaseModel):
    """Build-level compatibility summary (phase 1 — penalties only, no hard rejects)."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    intent_multiplier: float = Field(alias="intentMultiplier", ge=0.0, le=1.0)
    raw_penalty_total: float = Field(alias="rawPenaltyTotal")
    effective_penalty_total: float = Field(alias="effectivePenaltyTotal")
    lines: list[CompatibilityPenaltyLineResponse] = Field(default_factory=list)
    has_hard_incompatibility: bool = Field(default=False, alias="hasHardIncompatibility")
    hard_incompatibility_count: int = Field(default=0, alias="hardIncompatibilityCount", ge=0)
    soft_penalty_count: int = Field(default=0, alias="softPenaltyCount", ge=0)
    warning_count: int = Field(default=0, alias="warningCount", ge=0)
    summary_lines: list[str] = Field(default_factory=list, alias="summaryLines")


class DiversityFamilyAuditResponse(BaseModel):
    """Per-family ranked list after lightweight greedy diversity reranking."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    family: str
    original_order_ids: list[str] = Field(alias="originalOrderIds")
    reranked_order_ids: list[str] = Field(alias="rerankedOrderIds")
    notes: list[str] = Field(default_factory=list)


class DiversityAuditResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    families: list[DiversityFamilyAuditResponse] = Field(default_factory=list)


class FallbackRecoveryAuditResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    recovered: bool
    tier: int = Field(ge=0)
    compatibility_relax_mult: float = Field(alias="compatibilityRelaxMult")
    diversity_strength_mult: float = Field(alias="diversityStrengthMult")
    triggers: list[str] = Field(default_factory=list)
    confidence_before: float = Field(alias="confidenceBefore")
    confidence_after: float = Field(alias="confidenceAfter")
    overall_label: str = Field(alias="overallLabel")
    notes: list[str] = Field(default_factory=list)


class RecommendationConfidenceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    overall: float = Field(ge=0.0, le=1.0)
    similarity_component: float = Field(alias="similarityComponent")
    compatibility_component: float = Field(alias="compatibilityComponent")
    diversity_distortion_component: float = Field(alias="diversityDistortionComponent")
    fallback_tier: int = Field(ge=0, alias="fallbackTier")
    label: str
    hooks: list[str] = Field(default_factory=list)


class PersonalizationMetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    window_events: int = Field(alias="windowEvents")
    weighted_mass: float = Field(alias="weightedMass")
    decay_per_step: float = Field(alias="decayPerStep")
    trait_gate_factor: float = Field(alias="traitGateFactor")
    refinement_events: float = Field(alias="refinementEvents")
    gated_trait_nudges: bool = Field(alias="gatedTraitNudges")
    trait_nudge_l1: float = Field(alias="traitNudgeL1")
    part_multiplier_spread: float = Field(alias="partMultiplierSpread")
    signal_mix: dict[str, float] = Field(default_factory=dict, alias="signalMix")


class FeedbackLearningResponse(BaseModel):
    """Optional lightweight learning notes (rule-based, explainable)."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    applied: bool = False
    scenario_id: str | None = Field(default=None, alias="scenarioId")
    reason: str | None = None
    lines: list[str] = Field(default_factory=list)
    sample_multipliers: dict[str, float] = Field(default_factory=dict, alias="sampleMultipliers")
    personalization_metrics: PersonalizationMetricsResponse | None = Field(default=None, alias="personalizationMetrics")


class EngineScoresResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    switch_id: str = Field(alias="switchId")
    plate_id: str = Field(alias="plateId")
    foam_id: str = Field(alias="foamId")
    layout_id: str = Field(alias="layoutId")
    case_id: str = Field(alias="caseId")
    keycap_id: str = Field(alias="keycapId")
    switch_score: float = Field(alias="switchScore")
    plate_score: float = Field(alias="plateScore")
    foam_score: float = Field(alias="foamScore")
    layout_score: float = Field(alias="layoutScore")
    case_score: float = Field(alias="caseScore")
    keycap_score: float = Field(alias="keycapScore")


class RecommendedBuildResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    id: str
    title: str
    tagline: str
    switches: str
    plate: str
    foam: str
    layout: str
    case: str
    keycap: str
    highlights: list[str] = Field(default_factory=list)
    engine_scores: EngineScoresResponse | None = Field(default=None, alias="engineScores")
    source_urls: dict[str, str] = Field(
        default_factory=dict,
        alias="sourceUrls",
        description="Swagkey product detail URLs keyed by domain (switch, plate, foam, layout, case, keycap).",
    )


class TraitContributionDebugResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    axis: str
    user: float
    item: float
    contribution: float


class ExplanationDebugResponse(BaseModel):
    """Optional explanation trace. Emitted only when server debug mode is enabled."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    sources: list[str] = Field(default_factory=list)
    metadata_fields: list[str] = Field(default_factory=list, alias="metadataFields")
    strongest_traits: list[TraitContributionDebugResponse] = Field(default_factory=list, alias="strongestTraits")
    conflicting_traits: list[TraitContributionDebugResponse] = Field(default_factory=list, alias="conflictingTraits")
    compatibility_penalties: list[str] = Field(default_factory=list, alias="compatibilityPenalties")
    alternative_candidate: dict[str, str] | None = Field(default=None, alias="alternativeCandidate")


class RecommendationPick(BaseModel):
    """One ranked component: domain label, catalog id, score, and layered explanations."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    domain: str
    item_id: str = Field(alias="itemId")
    item_name: str = Field(default="", alias="itemName")
    score: float
    explanation: str
    summary: str = ""
    why_traits: list[str] = Field(default_factory=list, alias="whyTraits")
    trade_offs: list[str] = Field(default_factory=list, alias="tradeOffs")
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    raw_cosine: float | None = Field(default=None, alias="rawCosine")
    source_url: str = Field(default="", alias="sourceUrl")
    image_url: str = Field(default="", alias="imageUrl")
    alternatives: list["AlternativeRecommendation"] = Field(default_factory=list)
    explanation_debug: ExplanationDebugResponse | None = Field(default=None, alias="explanationDebug")

    @model_serializer(mode="wrap")
    def _serialize_without_empty_debug(self, handler):
        data = handler(self)
        if isinstance(data, dict) and data.get("explanationDebug") is None:
            data.pop("explanationDebug", None)
        return data


class AlternativeRecommendation(BaseModel):
    """One nearby fallback candidate for trust-building UI trade-off comparison."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    item_id: str = Field(alias="itemId")
    item_name: str = Field(default="", alias="itemName")
    score: float
    description: str = ""
    summary: str = ""
    trade_off: str = Field(default="", alias="tradeOff")
    source_url: str = Field(default="", alias="sourceUrl")
    image_url: str = Field(default="", alias="imageUrl")


class ConfidenceGuidanceResponse(BaseModel):
    """Small follow-up guidance when confidence is weak."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    is_low_confidence: bool = Field(alias="isLowConfidence")
    short_reason: str = Field(alias="shortReason")
    follow_up_questions: list[str] = Field(default_factory=list, alias="followUpQuestions")
    actions: list["ConfidenceRefinementActionResponse"] = Field(default_factory=list)


class ConfidenceRefinementActionResponse(BaseModel):
    """One-click refinement action for low-confidence recommendations."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    label: str
    step_id: str = Field(alias="stepId")
    answer_id: str = Field(alias="answerId")


# Historical name used in code and OpenAPI; identical to RecommendationPick.
MatchExplanationItem = RecommendationPick


class RecommendationResponse(BaseModel):
    """Stable JSON contract for `POST /recommendations/compute`."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    answers: SurveyAnswersRequest
    run_mode: Literal["full", "quick"] = Field(
        default="full",
        alias="runMode",
        description=(
            "`full` is the standard path. `quick` is reserved for resilient degraded fallback "
            "(not a user-facing quick recommendation); see `degradedReason` when set."
        ),
    )
    degraded_reason: str | None = Field(default=None, alias="degradedReason")
    legacy_traits: dict[str, float] = Field(default_factory=dict, alias="legacyTraits")
    user_vector: dict[str, float] = Field(
        alias="userVector",
        description="Legacy 6-axis projection for older clients; see userTraitScores for v2.",
    )
    user_trait_scores: dict[str, float] = Field(default_factory=dict, alias="userTraitScores")
    trait_axes: list[str] = Field(default_factory=list, alias="traitAxes")
    recommendations: list[RecommendationPick] = Field(
        default_factory=list,
        description="Canonical ranked top picks (one entry per major domain).",
    )
    match_explanations: list[RecommendationPick] = Field(
        default_factory=list,
        alias="matchExplanations",
        description="Same entries as `recommendations`; kept for older clients.",
    )
    build: RecommendedBuildResponse
    completed_at_iso: str = Field(alias="completedAtIso")
    overall_confidence: float = Field(
        ge=0.0,
        le=1.0,
        default=0.0,
        alias="overallConfidence",
        description="Mean of per-pick confidence (weighted cosine mapped to 0–1).",
    )
    nl_preference_analysis: NLPreferenceAnalysisResponse = Field(
        default_factory=NLPreferenceAnalysisResponse,
        alias="nlPreferenceAnalysis",
        description="Lightweight NLP parse of optional naturalLanguage; empty when not sent.",
    )
    compatibility_audit: CompatibilityAuditResponse | None = Field(
        default=None,
        alias="compatibilityAudit",
        description="Phase-1 build compatibility penalties and intent gating; null for older servers.",
    )
    diversity_audit: DiversityAuditResponse | None = Field(
        default=None,
        alias="diversityAudit",
        description="Per-family list reranking for variety; null when disabled or legacy.",
    )
    fallback_audit: FallbackRecoveryAuditResponse | None = Field(
        default=None,
        alias="fallbackAudit",
        description="Incremental recovery when quality gates fire; null when disabled or legacy.",
    )
    recommendation_confidence: RecommendationConfidenceResponse | None = Field(
        default=None,
        alias="recommendationConfidence",
        description="Normalized build confidence after diversity + fallback tier adjustment.",
    )
    feedback_learning: FeedbackLearningResponse | None = Field(
        default=None,
        alias="feedbackLearning",
        description="Rule-based feedback adjustments (small, reversible) applied to this ranking run.",
    )
    confidence_guidance: ConfidenceGuidanceResponse | None = Field(
        default=None,
        alias="confidenceGuidance",
        description="Follow-up prompts to refine recommendations when confidence is low.",
    )

    @model_validator(mode="after")
    def _align_pick_lists(self) -> Self:
        """Keep `recommendations` and `matchExplanations` identical after validation."""
        rec = list(self.recommendations)
        mat = list(self.match_explanations)
        if rec:
            mat = list(rec)
        elif mat:
            rec = list(mat)
        return self.model_copy(update={"recommendations": rec, "match_explanations": mat})
