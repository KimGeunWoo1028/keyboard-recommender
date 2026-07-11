"""REST models for `POST /terminology/interpret`."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TerminologyInterpretRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    text: str = Field(min_length=1, max_length=4000, description="Free-form keyboard preference text.")


class TermMatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    term_id: str = Field(alias="termId")
    surface: str
    intrinsic_confidence: float = Field(alias="intrinsicConfidence")
    effective_confidence: float = Field(alias="effectiveConfidence")


class TraitConflictResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    axis: str
    term_a: str = Field(alias="termA")
    term_b: str = Field(alias="termB")
    signed_impulse_a: float = Field(alias="signedImpulseA")
    signed_impulse_b: float = Field(alias="signedImpulseB")


class TerminologyInterpretResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    normalized_text: str = Field(alias="normalizedText")
    trait_vector: dict[str, float] = Field(alias="traitVector")
    matches: list[TermMatchResponse] = Field(default_factory=list)
    conflicts: list[TraitConflictResponse] = Field(default_factory=list)
    unknown_tokens: list[str] = Field(default_factory=list, alias="unknownTokens")
    warnings: list[str] = Field(default_factory=list)
    parsing_confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        alias="parsingConfidence",
        description="Heuristic confidence from match count vs unknown-token ratio.",
    )
