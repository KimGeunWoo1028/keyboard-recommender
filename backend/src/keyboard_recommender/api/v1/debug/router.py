"""Internal inspection API — developer tooling only (see ``require_internal_debug_api``)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Body, Query, status
from sqlalchemy import select

from keyboard_recommender.api.deps import DbSession, InternalDebugDep
from keyboard_recommender.debug_tools.replay import run_replay_bundle
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import EvalEvent
from keyboard_recommender.recommendation_quality.evaluation.benchmarking import (
    fallback_recovery_effectiveness,
    reranking_impact_analysis,
    synthetic_metrics_from_snapshots,
)
from keyboard_recommender.recommendation_quality.evaluation.diagnostics import build_diagnostics_report
from keyboard_recommender.recommendation_quality.evaluation.drift.drift_summary import build_operational_drift_bundle
from keyboard_recommender.recommendation_quality.evaluation.scoring import compute_metrics_from_snapshot
from keyboard_recommender.schemas.debug import (
    DebugBenchmarkCompareRequest,
    DebugCompareSurveysRequest,
    DebugSnapshotAnalyzeRequest,
)
from keyboard_recommender.schemas.recommendation import SurveyAnswersRequest
from keyboard_recommender.schemas.analytics import KpiSnapshot, KpiSeriesPoint

router = APIRouter(
    prefix="/debug",
    tags=["internal-debug"],
    include_in_schema=False,
)


def _survey_to_replay_inputs(body: SurveyAnswersRequest) -> tuple[dict[str, str], str | None]:
    data = body.model_dump(mode="json", exclude_none=True)
    nl = data.pop("natural_language", None)
    answers = {k: str(v) for k, v in data.items()}
    nl_s = str(nl).strip() if nl is not None else None
    return answers, nl_s or None


@router.get(
    "",
    summary="Debug API index",
    status_code=status.HTTP_200_OK,
)
def debug_index(_: InternalDebugDep) -> dict[str, Any]:
    return {
        "service": "keyboard-recommender-internal-debug",
        "routes": [
            "POST /api/v1/debug/recommendations/inspect",
            "POST /api/v1/debug/recommendations/compare-surveys",
            "POST /api/v1/debug/snapshots/analyze",
            "POST /api/v1/debug/benchmarks/compare-snapshots",
            "GET /api/v1/debug/drift/summary",
        ],
    }


@router.post(
    "/recommendations/inspect",
    summary="Replay survey → full replay bundle (snapshot, metrics, trace)",
    status_code=status.HTTP_200_OK,
)
def post_debug_inspect_recommendation(
    _: InternalDebugDep,
    body: Annotated[SurveyAnswersRequest, Body()],
) -> dict[str, Any]:
    answers, nl = _survey_to_replay_inputs(body)
    return run_replay_bundle(answers, natural_language=nl, strip_volatile=True)


@router.post(
    "/recommendations/compare-surveys",
    summary="Two survey runs → benchmark-style comparison",
    status_code=status.HTTP_200_OK,
)
def post_debug_compare_surveys(
    _: InternalDebugDep,
    body: Annotated[DebugCompareSurveysRequest, Body()],
) -> dict[str, Any]:
    a_ans, a_nl = _survey_to_replay_inputs(body.baseline)
    b_ans, b_nl = _survey_to_replay_inputs(body.treatment)
    bundle_a = run_replay_bundle(a_ans, natural_language=a_nl, strip_volatile=True)
    bundle_b = run_replay_bundle(b_ans, natural_language=b_nl, strip_volatile=True)
    report = dict(
        synthetic_metrics_from_snapshots(
            bundle_a["snapshot"],
            bundle_b["snapshot"],
        ),
    )
    report["baselineLabel"] = "baseline"
    report["treatmentLabel"] = "treatment"

    def _slim(b: dict[str, Any]) -> dict[str, Any]:
        return {
            "snapshot": b["snapshot"],
            "metrics": b["metrics"],
            "diagnostics": b["diagnostics"],
            "pipelineTrace": b["pipelineTrace"],
            "apiPayload": b["apiPayload"],
        }

    return {
        "schemaVersion": "debug.compare_surveys.v1",
        "baseline": _slim(bundle_a),
        "treatment": _slim(bundle_b),
        "benchmarkReport": report,
    }


@router.post(
    "/snapshots/analyze",
    summary="Metrics + diagnostics from a frozen snapshot JSON (no engine)",
    status_code=status.HTTP_200_OK,
)
def post_debug_analyze_snapshot(
    _: InternalDebugDep,
    body: Annotated[DebugSnapshotAnalyzeRequest, Body()],
) -> dict[str, Any]:
    snap = body.snapshot
    metrics = compute_metrics_from_snapshot(snap)
    diag = build_diagnostics_report(snap, metrics)
    return {
        "schemaVersion": "debug.snapshot_analyze.v1",
        "metrics": metrics.as_dict(),
        "diagnostics": diag,
        "rerankingImpact": reranking_impact_analysis(snap),
        "fallbackEffectiveness": fallback_recovery_effectiveness(snap),
        "snapshot": snap,
    }


@router.get(
    "/drift/summary",
    summary="Operational drift bundle (metrics trends + family counts + benchmarks)",
    status_code=status.HTTP_200_OK,
)
def get_debug_drift_summary(
    _: InternalDebugDep,
    db: DbSession,
    scenario_id: str | None = Query(
        default=None,
        description="Filter runs; omit or empty for all scenarios (aggregate).",
    ),
    window: int = Query(default=48, ge=8, le=256),
) -> dict[str, Any]:
    return build_operational_drift_bundle(db, scenario_id=scenario_id, window=window)


@router.get(
    "/analytics/kpis",
    summary="Lightweight KPI snapshot from eval_events (internal)",
    status_code=status.HTTP_200_OK,
    response_model=KpiSnapshot,
)
def get_debug_kpis(
    _: InternalDebugDep,
    db: DbSession,
    window_hours: int = Query(default=24, ge=1, le=168),
) -> KpiSnapshot:
    """
    Lightweight product analytics:
    - completion rate
    - time to first result (avg)
    - save conversion
    - comparison usage
    - retry frequency

    Uses ``eval_events`` only. This is intentionally simple and safe for internal dashboards.
    """
    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=int(window_hours))

    stmt = select(EvalEvent).where(EvalEvent.created_at >= start).order_by(EvalEvent.created_at.desc()).limit(8000)
    rows = db.execute(stmt).scalars().all()

    counts: dict[str, int] = {}
    ttf_ms: list[float] = []
    for row in rows:
        et = str(row.event_type or "")
        counts[et] = counts.get(et, 0) + 1
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        if et == "kpi.time_to_first_result":
            v = meta.get("duration_ms")
            if isinstance(v, (int, float)) and v >= 0:
                ttf_ms.append(float(v))

    def _count(name: str) -> int:
        return int(counts.get(name, 0))

    viewed = _count("onboarding.viewed")
    completed = _count("onboarding.completed")
    saves = _count("interaction.bookmark")
    retries = _count("interaction.retry")
    tab_clicks = _count("interaction.results_tab_click")
    # Compare is not a Phase C success KPI (UI removed); still counted in ``counts`` only.
    _ = _count("interaction.comparison")

    evidence_tabs = 0
    for row in rows:
        if str(row.event_type or "") != "interaction.results_tab_click":
            continue
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        if str(meta.get("tab") or "").lower() == "evidence":
            evidence_tabs += 1

    completion_rate = (completed / viewed) if viewed > 0 else 0.0
    save_rate = (saves / completed) if completed > 0 else 0.0
    retry_rate = (retries / viewed) if viewed > 0 else 0.0
    evidence_share = (evidence_tabs / tab_clicks) if tab_clicks > 0 else None

    top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:10]
    top_points = [KpiSeriesPoint(label=k, value=float(v)) for k, v in top]

    avg_ttf = (sum(ttf_ms) / len(ttf_ms)) if ttf_ms else None

    return KpiSnapshot(
        window_hours=int(window_hours),
        generated_at=now,
        counts=counts,
        recommendation_completion_rate=float(completion_rate),
        save_conversion_rate=float(save_rate),
        comparison_usage_rate=0.0,
        retry_frequency_rate=float(retry_rate),
        evidence_tab_share=float(evidence_share) if evidence_share is not None else None,
        avg_time_to_first_result_ms=float(avg_ttf) if avg_ttf is not None else None,
        top_events=top_points,
    )


@router.post(
    "/benchmarks/compare-snapshots",
    summary="Compare two snapshots (metrics + narrative)",
    status_code=status.HTTP_200_OK,
)
def post_debug_compare_snapshots(
    _: InternalDebugDep,
    body: Annotated[DebugBenchmarkCompareRequest, Body()],
) -> dict[str, Any]:
    report = dict(
        synthetic_metrics_from_snapshots(
            body.baseline_snapshot,
            body.treatment_snapshot,
        ),
    )
    report["baselineLabel"] = body.baseline_label
    report["treatmentLabel"] = body.treatment_label
    return {
        "schemaVersion": "debug.compare_snapshots.v1",
        "benchmarkReport": report,
    }
