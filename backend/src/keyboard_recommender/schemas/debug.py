"""Request bodies for internal debug HTTP API (not public product surface)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from keyboard_recommender.schemas.recommendation import SurveyAnswersRequest


class DebugSnapshotAnalyzeRequest(BaseModel):
    """Frozen ``evaluation.snapshot.v1`` JSON."""

    model_config = ConfigDict(extra="forbid")

    snapshot: dict[str, Any]


class DebugBenchmarkCompareRequest(BaseModel):
    """Two snapshots for paired benchmark-style comparison (no engine re-run)."""

    model_config = ConfigDict(extra="forbid")

    baseline_snapshot: dict[str, Any]
    treatment_snapshot: dict[str, Any]
    baseline_label: str = Field(default="baseline", max_length=120)
    treatment_label: str = Field(default="treatment", max_length=120)


class DebugCompareSurveysRequest(BaseModel):
    """Run the engine twice (baseline vs treatment survey + optional NL)."""

    model_config = ConfigDict(extra="forbid")

    baseline: SurveyAnswersRequest
    treatment: SurveyAnswersRequest
