"""Load JSON scenarios and normalize snapshot shapes for tooling."""

from __future__ import annotations

import json
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any, TextIO


def load_json_document(path: str | Path | None, *, stdin: TextIO | None = None) -> Any:
    """
    Load JSON from a file path, or from stdin when path is ``None`` or ``"-"``.
    """
    src = stdin if stdin is not None else sys.stdin
    if path is None or str(path) == "-":
        return json.load(src)
    p = Path(path)
    return json.loads(p.read_text(encoding="utf-8"))


def parse_survey_document(obj: Mapping[str, Any]) -> tuple[dict[str, str], str | None]:
    """
    Accepts either:

    * ``{"answers": {...}, "naturalLanguage": "..."}`` (recommended), or
    * a flat survey dict (string values only).
    """
    if "answers" in obj and isinstance(obj["answers"], dict):
        answers = {str(k): str(v) for k, v in obj["answers"].items()}
        raw_nl = obj.get("naturalLanguage", obj.get("natural_language"))
        nl = str(raw_nl).strip() if raw_nl is not None else None
        return answers, (nl or None)
    flat = {str(k): str(v) for k, v in obj.items() if isinstance(v, str)}
    if not flat:
        msg = "survey document must be non-empty (use {answers: {...}} or flat string map)"
        raise ValueError(msg)
    return flat, None


def extract_snapshot_dict(obj: Mapping[str, Any]) -> dict[str, Any]:
    """
    Normalize disk JSON to an evaluation snapshot dict.

    Supports:

    * ``debug.replay_bundle.v1`` → ``snapshot`` field
    * ``evaluation.snapshot.v1`` (root is the snapshot)
    * legacy: object containing only ``"snapshot"`` key
    """
    if not isinstance(obj, dict):
        msg = "expected JSON object at root"
        raise TypeError(msg)
    sv = obj.get("schemaVersion")
    if sv == "debug.replay_bundle.v1":
        snap = obj.get("snapshot")
        if not isinstance(snap, dict):
            msg = "replay bundle missing snapshot"
            raise ValueError(msg)
        return dict(snap)
    if sv == "evaluation.snapshot.v1":
        return dict(obj)
    snap = obj.get("snapshot")
    if isinstance(snap, dict) and "rankedLists" in snap:
        return dict(snap)
    if "rankedLists" in obj and "selected" in obj:
        return dict(obj)
    msg = (
        "unrecognized JSON for snapshot compare/inspect "
        "(expect evaluation.snapshot.v1, debug.replay_bundle.v1, or snapshot-shaped dict)"
    )
    raise ValueError(msg)
