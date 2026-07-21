"""Recommendations: survey answers → scored build (REST)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Header, status
from sqlalchemy import select

from keyboard_recommender.api.deps import CurrentUserOptionalDep, EvaluationDbSession, SettingsDep
from keyboard_recommender.application.async_optimization import enqueue_unified_events_for_batch_persistence
from keyboard_recommender.application.recommendation_service import compute_recommendation
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import EvalEvent
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_collector.ingest import (
    collect_and_persist_unified_events_best_effort,
)
from keyboard_recommender.schemas.recommendation import RecommendationResponse, SurveyAnswersRequest
from keyboard_recommender.schemas.recommendation import NLVocabularyCandidatesResponse, NLVocabularyCandidateItemResponse
from keyboard_recommender.schemas.saved_recommendations import (
    RemoveRecommendationActivityRequest,
    RemoveRecommendationActivityResponse,
    RemoveSavedRecommendationRequest,
    RemoveSavedRecommendationResponse,
    RecommendationActivityItem,
    RecommendationActivityResponse,
    SaveRecommendationRequest,
    SaveRecommendationResponse,
    SavedRecommendationItem,
    SavedRecommendationsResponse,
    UpdateSavedRecommendationRequest,
    UpdateSavedRecommendationResponse,
)
from keyboard_recommender.schemas.unified_events import UnifiedEventsIngestBody, UnifiedEventsIngestResponse

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

_SURVEY_BODY_EXAMPLE: dict[str, str] = {
    "sound_profile": "thocky",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}


@router.post(
    "/compute",
    response_model=RecommendationResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
    summary="Compute keyboard recommendation from survey answers",
)
def post_compute_recommendation(
    body: Annotated[
        SurveyAnswersRequest,
        Body(
            openapi_examples={
                "valid_survey": {
                    "summary": "Valid survey (use this in Swagger)",
                    "description": "Click **Try it out**, pick this example from the dropdown if needed, then **Execute**.",
                    "value": _SURVEY_BODY_EXAMPLE,
                },
            },
        ),
    ],
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    x_request_id: Annotated[str | None, Header(alias="X-Request-Id")] = None,
    x_scenario_id: Annotated[str | None, Header(alias="X-Evaluation-Scenario-Id")] = None,
    x_session_id: Annotated[str | None, Header(alias="X-Session-Id")] = None,
    x_debug_explanation: Annotated[str | None, Header(alias="X-Debug-Explanation")] = None,
) -> RecommendationResponse:
    debug_explanation_enabled = str(x_debug_explanation or "").strip().lower() in {"1", "true", "yes", "on"}
    req_id = (x_request_id or "").strip() or str(uuid.uuid4())
    scenario = (x_scenario_id or "").strip() or None
    sess = (x_session_id or "").strip() or None
    return compute_recommendation(
        body,
        settings=settings,
        db_session=db_session,
        request_id=req_id,
        scenario_id=scenario,
        session_id=sess,
        include_explanation_debug=debug_explanation_enabled,
    )


@router.post(
    "/events",
    response_model=UnifiedEventsIngestResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest unified recommendation interaction events (evaluation persistence)",
)
def post_unified_recommendation_events(
    body: Annotated[UnifiedEventsIngestBody, Body()],
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
) -> UnifiedEventsIngestResponse:
    """
    Append normalized events to ``eval_events`` when persistence is enabled.

    Safe no-op when persistence is off; never blocks core recommendation compute.
    """
    if not settings.enable_evaluation_persistence or db_session is None:
        return UnifiedEventsIngestResponse(stored=0, skipped=True, reason="evaluation_persistence_disabled")
    events = body.events
    if current_user is not None:
        enriched: list[dict] = []
        for event in events:
            row = dict(event)
            meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
            row["metadata"] = {**meta, "userId": str(current_user.id)}
            enriched.append(row)
        events = enriched

    if settings.enable_batch_evaluation_pipeline:
        queued = enqueue_unified_events_for_batch_persistence(settings, events)
        return UnifiedEventsIngestResponse(stored=queued, skipped=False, reason="queued_for_batch_persistence")
    n = collect_and_persist_unified_events_best_effort(db_session, settings, events)
    db_session.commit()
    return UnifiedEventsIngestResponse(stored=n, skipped=False)


def _bookmark_owner_id(payload: dict, meta: dict) -> str:
    row_user = payload.get("user_id")
    meta_user = meta.get("userId")
    return str(row_user or meta_user or "")


def _saved_item_from_eval_row(row: EvalEvent) -> SavedRecommendationItem | None:
    payload = row.payload if isinstance(row.payload, dict) else {}
    meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
    build_id = str(meta.get("buildId") or "")
    if not build_id:
        return None
    row_session = payload.get("session_id")
    row_scenario = payload.get("scenario_id")
    return SavedRecommendationItem(
        saved_at=row.created_at,
        request_id=str(payload.get("request_id") or row.correlation_id or ""),
        session_id=str(row_session) if row_session is not None else None,
        scenario_id=str(row_scenario) if row_scenario is not None else None,
        build_id=build_id,
        title=str(meta.get("title") or ""),
        summary=str(meta.get("summary") or ""),
        components=meta.get("components") if isinstance(meta.get("components"), dict) else {},
        metadata={k: v for k, v in meta.items() if k not in {"buildId", "title", "summary", "components"}},
    )


@router.post(
    "/saved",
    response_model=SaveRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Save a recommended build bookmark",
)
def post_save_recommendation(
    body: Annotated[SaveRecommendationRequest, Body()],
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
) -> SaveRecommendationResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return SaveRecommendationResponse(saved=False, reason="evaluation_persistence_disabled")
    # Account bookmarks must be owned; unauthenticated callers get saved=false so the
    # client can fall back to local storage instead of a success toast with no mypage row.
    if current_user is None:
        return SaveRecommendationResponse(saved=False, reason="login_required")
    payload = {
        "event_type": "interaction.bookmark",
        "request_id": body.request_id,
        "session_id": body.session_id,
        "scenario_id": body.scenario_id,
        "user_id": str(current_user.id),
        "metadata": {
            "buildId": body.build_id,
            "title": body.title,
            "summary": body.summary,
            "components": dict(body.components),
            **dict(body.metadata),
        },
    }
    db_session.add(
        EvalEvent(
            created_at=datetime.now(timezone.utc),
            event_type="interaction.bookmark",
            correlation_id=body.request_id,
            payload=payload,
        ),
    )
    db_session.commit()
    return SaveRecommendationResponse(saved=True)


@router.get(
    "/saved",
    response_model=SavedRecommendationsResponse,
    status_code=status.HTTP_200_OK,
    summary="List saved recommendation bookmarks",
)
def get_saved_recommendations(
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
    scenario_id: str | None = None,
    session_id: str | None = None,
    limit: int = 30,
) -> SavedRecommendationsResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return SavedRecommendationsResponse(items=[])
    # Do not leak other users' bookmarks to anonymous callers.
    if current_user is None and not (session_id or "").strip():
        return SavedRecommendationsResponse(items=[])
    lim = max(1, min(int(limit), 100))
    # Oversample then filter: user_id lives in JSON payload, so a tight SQL limit
    # before ownership filter can hide the caller's own recent saves.
    scan_limit = min(400, max(lim * 20, 100))
    stmt = (
        select(EvalEvent)
        .where(EvalEvent.event_type == "interaction.bookmark")
        .order_by(EvalEvent.created_at.desc())
        .limit(scan_limit)
    )
    rows = db_session.execute(stmt).scalars().all()
    out: list[SavedRecommendationItem] = []
    owner_id = str(current_user.id) if current_user is not None else ""
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        row_scenario = payload.get("scenario_id")
        row_session = payload.get("session_id")
        if owner_id and _bookmark_owner_id(payload, meta) != owner_id:
            continue
        if not owner_id and session_id and str(row_session or "") != session_id:
            continue
        if scenario_id and str(row_scenario or "") != scenario_id:
            continue
        item = _saved_item_from_eval_row(row)
        if item is None:
            continue
        out.append(item)
        if len(out) >= lim:
            break
    return SavedRecommendationsResponse(items=out)


@router.post(
    "/saved/remove",
    response_model=RemoveSavedRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove one saved recommendation bookmark",
)
def post_remove_saved_recommendation(
    body: Annotated[RemoveSavedRecommendationRequest, Body()],
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
) -> RemoveSavedRecommendationResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return RemoveSavedRecommendationResponse(removed=False, reason="evaluation_persistence_disabled")
    stmt = (
        select(EvalEvent)
        .where(EvalEvent.event_type == "interaction.bookmark")
        .order_by(EvalEvent.created_at.desc())
        .limit(400)
    )
    rows = db_session.execute(stmt).scalars().all()
    target: EvalEvent | None = None
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        row_user = payload.get("user_id")
        meta_user = meta.get("userId")
        if current_user is not None and str(row_user or meta_user or "") != str(current_user.id):
            continue
        if str(payload.get("request_id") or row.correlation_id or "") != body.request_id:
            continue
        if str(meta.get("buildId") or "") != body.build_id:
            continue
        if body.saved_at is not None and row.created_at != body.saved_at:
            continue
        target = row
        break
    if target is None:
        return RemoveSavedRecommendationResponse(removed=False, reason="not_found")
    db_session.delete(target)
    db_session.commit()
    return RemoveSavedRecommendationResponse(removed=True)


@router.post(
    "/saved/update",
    response_model=UpdateSavedRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update one saved recommendation bookmark metadata",
)
def post_update_saved_recommendation(
    body: Annotated[UpdateSavedRecommendationRequest, Body()],
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
) -> UpdateSavedRecommendationResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return UpdateSavedRecommendationResponse(updated=False, reason="evaluation_persistence_disabled")
    stmt = (
        select(EvalEvent)
        .where(EvalEvent.event_type == "interaction.bookmark")
        .order_by(EvalEvent.created_at.desc())
        .limit(400)
    )
    rows = db_session.execute(stmt).scalars().all()
    target: EvalEvent | None = None
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        row_user = payload.get("user_id")
        meta_user = meta.get("userId")
        if current_user is not None and str(row_user or meta_user or "") != str(current_user.id):
            continue
        if str(payload.get("request_id") or row.correlation_id or "") != body.request_id:
            continue
        if str(meta.get("buildId") or "") != body.build_id:
            continue
        if body.saved_at is not None and row.created_at != body.saved_at:
            continue
        target = row
        break
    if target is None:
        return UpdateSavedRecommendationResponse(updated=False, reason="not_found")

    payload = target.payload if isinstance(target.payload, dict) else {}
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
    metadata = {
        **metadata,
        "note": body.note.strip(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    target.payload = {**payload, "metadata": metadata}
    db_session.commit()
    return UpdateSavedRecommendationResponse(updated=True)


@router.get(
    "/activity",
    response_model=RecommendationActivityResponse,
    status_code=status.HTTP_200_OK,
    summary="List recent recommendation exploration activity",
)
def get_recommendation_activity(
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
    scenario_id: str | None = None,
    session_id: str | None = None,
    limit: int = 40,
) -> RecommendationActivityResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return RecommendationActivityResponse(items=[])
    lim = max(1, min(int(limit), 150))
    tracked = (
        "interaction.bookmark",
        "interaction.comparison",
        "interaction.click",
        "interaction.refinement",
    )
    stmt = (
        select(EvalEvent)
        .where(EvalEvent.event_type.in_(tracked))
        .order_by(EvalEvent.created_at.desc())
        .limit(lim)
    )
    rows = db_session.execute(stmt).scalars().all()
    out: list[RecommendationActivityItem] = []
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        row_scenario = payload.get("scenario_id")
        row_session = payload.get("session_id")
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        row_user = payload.get("user_id")
        meta_user = meta.get("userId")
        if current_user is not None and str(row_user or meta_user or "") != str(current_user.id):
            continue
        if scenario_id and str(row_scenario or "") != scenario_id:
            continue
        if session_id and str(row_session or "") != session_id:
            continue
        out.append(
            RecommendationActivityItem(
                occurred_at=row.created_at,
                event_type=str(payload.get("event_type") or row.event_type),
                request_id=str(payload.get("request_id")) if payload.get("request_id") is not None else None,
                session_id=str(row_session) if row_session is not None else None,
                scenario_id=str(row_scenario) if row_scenario is not None else None,
                metadata=meta,
            ),
        )
    return RecommendationActivityResponse(items=out)


@router.get(
    "/nl-vocab-candidates",
    response_model=NLVocabularyCandidatesResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
    summary="Aggregate high-frequency unknown NL tokens for terminology expansion",
)
def get_nl_vocabulary_candidates(
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
    window_days: int = 30,
    min_count: int = 2,
    limit: int = 50,
) -> NLVocabularyCandidatesResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return NLVocabularyCandidatesResponse(
            items=[],
            window_days=max(1, int(window_days)),
            min_count=max(1, int(min_count)),
            generated_at_iso=datetime.now(timezone.utc).isoformat(),
        )

    days = max(1, min(int(window_days), 180))
    floor = datetime.now(timezone.utc) - timedelta(days=days)
    lim = max(1, min(int(limit), 200))
    min_hits = max(1, min(int(min_count), 100))

    stmt = (
        select(EvalEvent)
        .where(EvalEvent.event_type.in_(("interaction.nl_vocab_signal", "recommendation.request")))
        .where(EvalEvent.created_at >= floor)
        .order_by(EvalEvent.created_at.desc())
        .limit(5000)
    )
    rows = db_session.execute(stmt).scalars().all()

    counts: dict[str, int] = {}
    last_seen: dict[str, datetime] = {}
    samples: dict[str, list[str]] = {}

    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        row_user = payload.get("user_id")
        meta_user = meta.get("userId")
        if current_user is not None and str(row_user or meta_user or "") != str(current_user.id):
            continue

        unknown_raw = None
        if row.event_type == "interaction.nl_vocab_signal":
            unknown_raw = meta.get("unknownTokens")
        elif row.event_type == "recommendation.request":
            unknown_raw = meta.get("nlUnknownTokens")
        unknown = unknown_raw if isinstance(unknown_raw, list) else []

        sample_text = meta.get("naturalLanguageText")
        sample_text_str = str(sample_text).strip() if isinstance(sample_text, str) else ""
        for tok in unknown:
            token = str(tok).strip().lower()
            if len(token) < 2:
                continue
            counts[token] = counts.get(token, 0) + 1
            ts = last_seen.get(token)
            if ts is None or row.created_at > ts:
                last_seen[token] = row.created_at
            if sample_text_str:
                bucket = samples.setdefault(token, [])
                if sample_text_str not in bucket and len(bucket) < 3:
                    bucket.append(sample_text_str[:160])

    ranked = sorted(
        ((token, n) for token, n in counts.items() if n >= min_hits),
        key=lambda it: (-it[1], it[0]),
    )[:lim]

    items = [
        NLVocabularyCandidateItemResponse(
            token=token,
            count=n,
            last_seen_iso=(last_seen.get(token) or datetime.now(timezone.utc)).isoformat(),
            sample_texts=samples.get(token, []),
        )
        for token, n in ranked
    ]
    return NLVocabularyCandidatesResponse(
        items=items,
        window_days=days,
        min_count=min_hits,
        generated_at_iso=datetime.now(timezone.utc).isoformat(),
    )


@router.post(
    "/activity/remove",
    response_model=RemoveRecommendationActivityResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove one recommendation activity event",
)
def post_remove_recommendation_activity(
    body: Annotated[RemoveRecommendationActivityRequest, Body()],
    settings: SettingsDep,
    db_session: EvaluationDbSession,
    current_user: CurrentUserOptionalDep = None,
) -> RemoveRecommendationActivityResponse:
    if not settings.enable_evaluation_persistence or db_session is None:
        return RemoveRecommendationActivityResponse(removed=False, reason="evaluation_persistence_disabled")
    stmt = (
        select(EvalEvent)
        .where(EvalEvent.event_type == body.event_type)
        .order_by(EvalEvent.created_at.desc())
        .limit(500)
    )
    rows = db_session.execute(stmt).scalars().all()
    target: EvalEvent | None = None
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        row_user = payload.get("user_id")
        meta_user = meta.get("userId")
        if current_user is not None and str(row_user or meta_user or "") != str(current_user.id):
            continue
        if str(payload.get("request_id") or row.correlation_id or "") != body.request_id:
            continue
        if body.occurred_at is not None and row.created_at != body.occurred_at:
            continue
        target = row
        break
    if target is None:
        return RemoveRecommendationActivityResponse(removed=False, reason="not_found")
    db_session.delete(target)
    db_session.commit()
    return RemoveRecommendationActivityResponse(removed=True)
