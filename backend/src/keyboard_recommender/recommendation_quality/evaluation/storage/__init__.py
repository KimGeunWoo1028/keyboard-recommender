"""Phase-3 database-backed evaluation storage (PostgreSQL + Alembic)."""

from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalConfidenceSample,
    EvalDiagnostics,
    EvalEvent,
    EvalMetrics,
    EvalRecommendationRun,
    EvalSnapshot,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.ingestion import (
    ingest_benchmark_report,
    ingest_evaluated_recommendation,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.persistence import (
    EvaluationPersistenceService,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.queries import (
    confidence_history_rows,
    diagnostics_for_run,
    list_benchmark_runs,
    metric_history_rows,
    operational_trend_bundle,
    recommendation_drift_summary,
    runs_for_scenario,
    snapshot_for_run,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.repository import (
    EvaluationRepository,
)

__all__ = [
    "EvalBenchmarkRun",
    "EvalConfidenceSample",
    "EvalDiagnostics",
    "EvalEvent",
    "EvalMetrics",
    "EvalRecommendationRun",
    "EvalSnapshot",
    "EvaluationPersistenceService",
    "EvaluationRepository",
    "confidence_history_rows",
    "diagnostics_for_run",
    "ingest_benchmark_report",
    "ingest_evaluated_recommendation",
    "list_benchmark_runs",
    "metric_history_rows",
    "operational_trend_bundle",
    "recommendation_drift_summary",
    "runs_for_scenario",
    "snapshot_for_run",
]
