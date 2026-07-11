"""Replay / trace / compare developer tooling."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from keyboard_recommender.debug_tools.compare import compare_snapshot_files
from keyboard_recommender.debug_tools.io import extract_snapshot_dict, load_json_document, parse_survey_document
from keyboard_recommender.debug_tools.replay import run_replay_bundle
from keyboard_recommender.debug_tools.trace import build_pipeline_trace
from keyboard_recommender.recommendation_quality.evaluation.scoring import evaluate_recommendation
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_computation
from tests.support.regression import STABLE_SURVEY, canonical_json_dumps


def _canon(obj: object) -> str:
    return canonical_json_dumps(obj)


def test_parse_survey_document_wrap_and_flat() -> None:
    w = {"answers": dict(STABLE_SURVEY), "naturalLanguage": "  "}
    a, nl = parse_survey_document(w)
    assert a == dict(STABLE_SURVEY)
    assert nl is None
    a2, nl2 = parse_survey_document(dict(STABLE_SURVEY))
    assert a2 == dict(STABLE_SURVEY)
    assert nl2 is None


def test_replay_bundle_deterministic_snapshot() -> None:
    b1 = run_replay_bundle(STABLE_SURVEY, natural_language=None)
    b2 = run_replay_bundle(STABLE_SURVEY, natural_language=None)
    assert b1["schemaVersion"] == "debug.replay_bundle.v1"
    assert _canon(b1["snapshot"]) == _canon(b2["snapshot"])
    assert _canon(b1["metrics"]) == _canon(b2["metrics"])
    assert "completedAtIso" not in b1["apiPayload"]


def test_pipeline_trace_shape() -> None:
    bundle = run_replay_bundle(STABLE_SURVEY)
    trace = bundle["pipelineTrace"]
    assert trace["schemaVersion"] == "debug.pipeline_trace.v1"
    ids = [s["id"] for s in trace["stages"]]
    assert ids == [
        "inputs",
        "natural_language",
        "trait_similarity",
        "compatibility_penalties",
        "diversity_reranking",
        "fallback_recovery",
        "final_selection",
    ]
    assert trace.get("flatSummaryLines")


def test_build_pipeline_trace_matches_manual_eval() -> None:
    payload, engine, uts, ans = build_recommendation_computation(dict(STABLE_SURVEY))
    snap, metrics, diag = evaluate_recommendation(engine, uts, survey_answers=ans)
    trace = build_pipeline_trace(payload=payload, snapshot=snap, diagnostics=diag)
    assert trace["stages"][0]["id"] == "inputs"


def test_extract_snapshot_from_replay_bundle_roundtrip(tmp_path: Path) -> None:
    bundle = run_replay_bundle(STABLE_SURVEY)
    p = tmp_path / "b.json"
    p.write_text(json.dumps(bundle), encoding="utf-8")
    loaded = load_json_document(p)
    snap = extract_snapshot_dict(loaded)
    assert snap == bundle["snapshot"]


def test_compare_identical_snapshots_zero_penalty_delta(tmp_path: Path) -> None:
    bundle = run_replay_bundle(STABLE_SURVEY)
    a = tmp_path / "a.json"
    b = tmp_path / "b.json"
    a.write_text(json.dumps(bundle["snapshot"]), encoding="utf-8")
    b.write_text(json.dumps(bundle["snapshot"]), encoding="utf-8")
    out = compare_snapshot_files(a, b)
    rep = out["benchmarkReport"]
    assert rep["compatibilityImpact"]["absoluteDelta"] == 0.0


def test_example_fixture_loads() -> None:
    root = Path(__file__).resolve().parents[1]
    ex = root / "fixtures" / "replay" / "example_survey.json"
    if not ex.exists():
        pytest.skip("fixture missing")
    doc = load_json_document(ex)
    answers, nl = parse_survey_document(doc)
    bundle = run_replay_bundle(answers, natural_language=nl)
    assert bundle["inputs"]["answers"]
