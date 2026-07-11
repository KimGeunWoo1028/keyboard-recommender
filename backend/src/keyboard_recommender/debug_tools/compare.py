"""File-oriented snapshot comparison (benchmark report, no engine)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from keyboard_recommender.debug_tools.io import extract_snapshot_dict, load_json_document
from keyboard_recommender.recommendation_quality.evaluation.benchmarking import synthetic_metrics_from_snapshots
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationConfig


def compare_snapshot_files(
    baseline_path: str | Path,
    treatment_path: str | Path,
    *,
    eval_cfg: EvaluationConfig | None = None,
    baseline_label: str = "baseline",
    treatment_label: str = "treatment",
) -> dict[str, Any]:
    """Load two JSON files and return a labeled benchmark report (``synthetic_metrics_from_snapshots``)."""
    a = extract_snapshot_dict(load_json_document(baseline_path))
    b = extract_snapshot_dict(load_json_document(treatment_path))
    report = dict(synthetic_metrics_from_snapshots(a, b, eval_cfg=eval_cfg))
    report["baselineLabel"] = baseline_label
    report["treatmentLabel"] = treatment_label
    return {
        "schemaVersion": "debug.compare_files.v1",
        "baselineLabel": baseline_label,
        "treatmentLabel": treatment_label,
        "benchmarkReport": report,
    }
