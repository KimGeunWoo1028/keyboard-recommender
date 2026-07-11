"""Lightweight background offloading and batched evaluation event persistence."""

from __future__ import annotations

import logging
import threading
import time
from collections import deque
from collections.abc import Mapping, Sequence
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from keyboard_recommender.application.evaluation_persistence_hook import (
    persist_recommendation_evaluation_in_new_session_best_effort,
)
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.persistence.session import SessionLocal
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_collector.ingest import (
    collect_and_persist_unified_events_best_effort,
)
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult

logger = logging.getLogger(__name__)

_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="reco-bg")


def submit_evaluation_persistence_job(
    *,
    settings: Settings,
    engine: TraitEngineResult,
    user_trait_scores: Mapping[str, float],
    survey_answers: Mapping[str, str],
    request_id: str | None,
    scenario_id: str | None,
    session_id: str | None,
    api_completed_at_iso: str | None,
    nl_preference_analysis: Mapping[str, Any] | None = None,
) -> None:
    def _run() -> None:
        persist_recommendation_evaluation_in_new_session_best_effort(
            settings=settings,
            engine=engine,
            user_trait_scores=user_trait_scores,
            survey_answers=survey_answers,
            request_id=request_id,
            scenario_id=scenario_id,
            session_id=session_id,
            api_completed_at_iso=api_completed_at_iso,
            nl_preference_analysis=nl_preference_analysis,
        )

    _EXECUTOR.submit(_run)


class UnifiedEventBatchPipeline:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._queue: deque[dict[str, Any]] = deque()
        self._flush_scheduled = False
        self._last_flush_ts = 0.0

    def enqueue(self, settings: Settings, raw_events: Sequence[Mapping[str, Any]]) -> int:
        now = time.monotonic()
        with self._lock:
            for row in raw_events:
                self._queue.append(dict(row))
            should_flush = (
                len(self._queue) >= settings.evaluation_batch_size
                or (now - self._last_flush_ts) >= settings.evaluation_batch_flush_interval_seconds
            )
            if should_flush and not self._flush_scheduled:
                self._flush_scheduled = True
                _EXECUTOR.submit(self._flush_worker, settings)
        return len(raw_events)

    def _drain_batch(self, size: int) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        with self._lock:
            while self._queue and len(out) < size:
                out.append(self._queue.popleft())
        return out

    def _flush_worker(self, settings: Settings) -> None:
        try:
            while True:
                batch = self._drain_batch(settings.evaluation_batch_size)
                if not batch:
                    break
                session = SessionLocal()
                try:
                    collect_and_persist_unified_events_best_effort(session, settings, batch)
                    session.commit()
                except Exception:
                    session.rollback()
                    logger.exception("unified_event_batch_flush_failed")
                finally:
                    session.close()
        finally:
            with self._lock:
                self._flush_scheduled = False
                self._last_flush_ts = time.monotonic()


_EVENT_PIPELINE = UnifiedEventBatchPipeline()


def enqueue_unified_events_for_batch_persistence(settings: Settings, raw_events: Sequence[Mapping[str, Any]]) -> int:
    return _EVENT_PIPELINE.enqueue(settings, raw_events)

