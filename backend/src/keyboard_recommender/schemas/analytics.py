from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class KpiSeriesPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    value: float


class KpiSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    window_hours: int
    generated_at: datetime
    counts: dict[str, int] = Field(default_factory=dict)

    # Ratios (0..1)
    recommendation_completion_rate: float = 0.0
    save_conversion_rate: float = 0.0
    # Legacy field — Compare UI removed; not a Phase C success KPI (see excluded_success_metrics).
    comparison_usage_rate: float = 0.0
    retry_frequency_rate: float = 0.0
    # Phase C: evidence tab share among results_tab_click (None when no tab clicks).
    evidence_tab_share: float | None = None

    # Timings
    avg_time_to_first_result_ms: float | None = None

    top_events: Annotated[list[KpiSeriesPoint], Field(default_factory=list)]
    excluded_success_metrics: list[str] = Field(
        default_factory=lambda: ["interaction.comparison", "interaction.drawer_open"],
    )

