"""Repository layer for evaluation ORM models (no HTTP / FastAPI)."""

from __future__ import annotations

import uuid
from collections.abc import Mapping
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalConfidenceSample,
    EvalDiagnostics,
    EvalEvent,
    EvalMetrics,
    EvalRecommendationRun,
    EvalSnapshot,
)


def _dec(x: float | Decimal) -> Decimal:
    return x if isinstance(x, Decimal) else Decimal(str(round(float(x), 8)))


def _metric_map(m: EvaluationMetrics | Mapping[str, float]) -> dict[str, float]:
    if isinstance(m, EvaluationMetrics):
        return m.as_dict()
    keys = tuple(EvaluationMetrics.__dataclass_fields__.keys())
    src = dict(m)
    return {k: float(src.get(k, 0.0)) for k in keys}


class EvaluationRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def create_run(
        self,
        *,
        scenario_id: str | None = None,
        request_id: str | None = None,
        source: str | None = None,
        notes: str | None = None,
        config_fingerprint: str | None = None,
        run_id: uuid.UUID | None = None,
    ) -> EvalRecommendationRun:
        run = EvalRecommendationRun(
            id=run_id or uuid.uuid4(),
            scenario_id=scenario_id,
            request_id=request_id,
            source=source,
            notes=notes,
            config_fingerprint=config_fingerprint,
        )
        self._s.add(run)
        self._s.flush()
        return run

    def persist_full_evaluation(
        self,
        *,
        snapshot: Mapping[str, Any],
        metrics: EvaluationMetrics | Mapping[str, float],
        diagnostics: Mapping[str, Any],
        scenario_id: str | None = None,
        request_id: str | None = None,
        source: str | None = None,
        notes: str | None = None,
        config_fingerprint: str | None = None,
        run_id: uuid.UUID | None = None,
    ) -> uuid.UUID:
        """
        Insert run + snapshot + metrics + diagnostics + confidence sample + event row.

        Does not commit the session.
        """
        run = self.create_run(
            scenario_id=scenario_id,
            request_id=request_id,
            source=source,
            notes=notes,
            config_fingerprint=config_fingerprint,
            run_id=run_id,
        )
        rid = run.id
        schema_version = str(snapshot.get("schemaVersion") or "evaluation.snapshot.v1")

        self._s.add(EvalSnapshot(run_id=rid, schema_version=schema_version, body=dict(snapshot)))
        md = _metric_map(metrics)
        self._s.add(
            EvalMetrics(
                run_id=rid,
                trait_alignment=_dec(md["trait_alignment"]),
                diversity_intervention=_dec(md["diversity_intervention"]),
                build_coherence=_dec(md["build_coherence"]),
                compatibility_stability=_dec(md["compatibility_stability"]),
                reranking_distortion_index=_dec(md["reranking_distortion_index"]),
                winner_trait_diversity=_dec(md["winner_trait_diversity"]),
                body=md,
            ),
        )
        self._s.add(EvalDiagnostics(run_id=rid, body=dict(diagnostics)))

        cf = snapshot.get("recommendationConfidence") if isinstance(snapshot.get("recommendationConfidence"), dict) else None
        components: dict[str, Any] = {}
        overall_d: Decimal | None = None
        label: str | None = None
        if cf:
            try:
                overall_d = _dec(float(cf.get("overall", 0.0)))
            except (TypeError, ValueError):
                overall_d = None
            label = str(cf["label"]) if cf.get("label") is not None else None
            for k in ("similarityComponent", "compatibilityComponent", "diversityDistortionComponent", "fallbackTier"):
                if k in cf:
                    components[k] = cf[k]

        recorded_at = datetime.now(timezone.utc)
        self._s.add(
            EvalConfidenceSample(
                run_id=rid,
                recorded_at=recorded_at,
                overall=overall_d,
                label=label,
                components=components,
            ),
        )
        self.append_event(
            "recommendation_evaluated",
            payload={"schemaVersion": schema_version, "metricsKeys": list(md.keys())},
            run_id=rid,
        )
        self._s.flush()
        return rid

    def append_event(
        self,
        event_type: str,
        payload: Mapping[str, Any],
        *,
        run_id: uuid.UUID | None = None,
        benchmark_run_id: uuid.UUID | None = None,
        correlation_id: str | None = None,
        created_at: datetime | None = None,
    ) -> EvalEvent:
        ev = EvalEvent(
            created_at=created_at or datetime.now(timezone.utc),
            event_type=event_type,
            run_id=run_id,
            benchmark_run_id=benchmark_run_id,
            correlation_id=correlation_id,
            payload=dict(payload),
        )
        self._s.add(ev)
        self._s.flush()
        return ev

    def persist_benchmark_run(
        self,
        *,
        report: Mapping[str, Any],
        baseline_run_id: uuid.UUID | None = None,
        treatment_run_id: uuid.UUID | None = None,
        scenario_id: str | None = None,
        baseline_label: str | None = None,
        treatment_label: str | None = None,
        benchmark_id: uuid.UUID | None = None,
    ) -> uuid.UUID:
        bench = EvalBenchmarkRun(
            id=benchmark_id or uuid.uuid4(),
            scenario_id=scenario_id,
            baseline_run_id=baseline_run_id,
            treatment_run_id=treatment_run_id,
            baseline_label=baseline_label,
            treatment_label=treatment_label,
            report=dict(report),
        )
        self._s.add(bench)
        self._s.flush()
        bid = bench.id
        self.append_event(
            "benchmark_recorded",
            payload={"schemaVersion": report.get("schemaVersion"), "benchmarkRunId": str(bid)},
            benchmark_run_id=bid,
        )
        return bid

    def get_run(self, run_id: uuid.UUID) -> EvalRecommendationRun | None:
        return self._s.get(EvalRecommendationRun, run_id)

    def get_run_eager(self, run_id: uuid.UUID) -> EvalRecommendationRun | None:
        stmt = (
            select(EvalRecommendationRun)
            .where(EvalRecommendationRun.id == run_id)
            .options(
                selectinload(EvalRecommendationRun.snapshot),
                selectinload(EvalRecommendationRun.metrics),
                selectinload(EvalRecommendationRun.diagnostics),
                selectinload(EvalRecommendationRun.confidence),
            )
        )
        return self._s.execute(stmt).scalar_one_or_none()
