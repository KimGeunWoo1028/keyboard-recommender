"""Run recommendation once and assemble a developer-oriented replay bundle."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from keyboard_recommender.debug_tools.trace import build_pipeline_trace
from keyboard_recommender.recommendation_quality.evaluation.scoring import evaluate_recommendation
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_computation

REPLAY_BUNDLE_SCHEMA_VERSION = "debug.replay_bundle.v1"

_VOLATILE_PAYLOAD_KEYS = frozenset({"completedAtIso"})


def strip_volatile_api_fields(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Remove timestamp noise from exported API payloads."""
    return {k: v for k, v in dict(payload).items() if k not in _VOLATILE_PAYLOAD_KEYS}


def run_replay_bundle(
    answers: Mapping[str, str],
    *,
    natural_language: str | None = None,
    strip_volatile: bool = True,
) -> dict[str, Any]:
    """
    Single engine pass → API-shaped payload, evaluation snapshot, metrics, diagnostics, pipeline trace.

    Deterministic for fixed ``answers`` / ``natural_language`` (excluding stripped timestamps).
    """
    payload, engine, user_trait_scores, ans = build_recommendation_computation(
        dict(answers),
        natural_language=natural_language,
    )
    snap, metrics, diagnostics = evaluate_recommendation(
        engine,
        user_trait_scores,
        survey_answers=ans,
    )
    api_export = strip_volatile_api_fields(payload) if strip_volatile else dict(payload)
    trace = build_pipeline_trace(payload=payload, snapshot=snap, diagnostics=diagnostics)
    return {
        "schemaVersion": REPLAY_BUNDLE_SCHEMA_VERSION,
        "inputs": {
            "answers": dict(ans),
            "naturalLanguage": natural_language,
        },
        "apiPayload": api_export,
        "snapshot": snap,
        "metrics": metrics.as_dict(),
        "diagnostics": diagnostics,
        "pipelineTrace": trace,
    }
