"""Staging / local verification for ENABLE_FEEDBACK_LEARNING_MVP (roadmap ⑮).

Modes:
  --dry-run-local  Use in-memory SQLite + Settings flag (CI-safe)
  --base-url URL   Hit a running staging/API (operator staging checklist)
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

_STABLE_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}


def _http_json(method: str, url: str, body: dict | None = None, cookie: str = "") -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    req = Request(url, method=method, headers=headers, data=data)
    try:
        with urlopen(req, timeout=20) as resp:  # noqa: S310 — operator-provided staging URL
            raw = resp.read().decode("utf-8")
            payload = json.loads(raw) if raw else {}
            return int(resp.status), payload if isinstance(payload, dict) else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8") if exc.fp else ""
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"detail": raw}
        return int(exc.code), payload if isinstance(payload, dict) else {}
    except (URLError, TimeoutError, ValueError) as exc:
        print(f"FAIL: request error {exc}", file=sys.stderr)
        return 1, {}


def verify_remote(base_url: str, cookie: str = "") -> int:
    base = base_url.rstrip("/")
    code, health = _http_json("GET", f"{base}/health")
    if code != 200:
        print(f"FAIL: /health status={code} body={health}", file=sys.stderr)
        return 1
    print("OK: /health")

    code, payload = _http_json(
        "POST",
        f"{base}/api/v1/recommendations/compute",
        body=_STABLE_SURVEY,
        cookie=cookie,
    )
    if code != 200:
        print(f"FAIL: compute status={code}", file=sys.stderr)
        return 1
    fb = payload.get("feedbackLearning")
    print(f"OK: compute → feedbackLearning present={fb is not None}")
    if isinstance(fb, dict):
        print(f"  applied={fb.get('applied')} reason={fb.get('reason')}")
    else:
        print(
            "NOTE: feedbackLearning missing — ENABLE_FEEDBACK_LEARNING_MVP may be false, "
            "or DB session unavailable. Confirm staging env, restart, then re-run.",
        )
    return 0


def verify_local_dry_run() -> int:
    from sqlalchemy import create_engine, event
    from sqlalchemy.orm import sessionmaker

    from keyboard_recommender.config.settings import Settings
    from keyboard_recommender.infrastructure.persistence.base import Base
    from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
        EvalBenchmarkRun,
        EvalConfidenceSample,
        EvalDiagnostics,
        EvalEvent,
        EvalMetrics,
        EvalRecommendationRun,
        EvalSnapshot,
    )
    from keyboard_recommender.recommendation_quality.feedback_learning.pipeline import load_learning_adjustments
    from keyboard_recommender.trait_engine.catalog_sample import SWITCHES

    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)

    @event.listens_for(engine, "connect")
    def _fk(dbapi_connection, connection_record):  # type: ignore[no-untyped-def]
        cur = dbapi_connection.cursor()
        cur.execute("pragma foreign_keys=ON")
        cur.close()

    tables = [
        EvalRecommendationRun.__table__,
        EvalSnapshot.__table__,
        EvalMetrics.__table__,
        EvalDiagnostics.__table__,
        EvalConfidenceSample.__table__,
        EvalBenchmarkRun.__table__,
        EvalEvent.__table__,
    ]
    Base.metadata.create_all(engine, tables=tables)
    SessionLocal = sessionmaker(bind=engine, future=True)
    session = SessionLocal()

    off = Settings(enable_feedback_learning_mvp=False)
    empty = load_learning_adjustments(session, off, scenario_id="verify")
    if empty.part_score_multipliers:
        print("FAIL: flag off should not apply learning multipliers", file=sys.stderr)
        return 1
    print("OK: flag off → no multipliers")

    on = Settings(enable_feedback_learning_mvp=True)
    empty_on = load_learning_adjustments(session, on, scenario_id="verify")
    if empty_on.part_score_multipliers:
        print("FAIL: empty interaction window should not produce multipliers", file=sys.stderr)
        return 1
    print("OK: flag on + empty window → no multipliers")

    sid = SWITCHES[0].id
    session.add(
        EvalEvent(
            id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            event_type="interaction.click",
            payload={
                "event_type": "interaction.click",
                "scenario_id": "verify",
                "request_id": "r-verify",
                "metadata": {"itemId": sid, "switchFamily": "linear"},
            },
        ),
    )
    session.commit()
    loaded = load_learning_adjustments(session, on, scenario_id="verify")
    mult = loaded.part_score_multipliers.get(sid, 1.0)
    if mult <= 1.0:
        print(f"FAIL: expected click boost for {sid}, got {mult}", file=sys.stderr)
        return 1
    print(f"OK: click seeded → multiplier[{sid}]={mult:.3f} lines={len(loaded.explanation_lines)}")
    session.close()
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify feedback learning MVP staging readiness")
    parser.add_argument("--dry-run-local", action="store_true", help="CI-safe in-memory verification")
    parser.add_argument("--base-url", default="", help="Running API base URL (e.g. https://api.staging.example)")
    parser.add_argument("--cookie", default="", help="Optional Cookie header for authenticated staging")
    args = parser.parse_args(argv)

    if args.dry_run_local:
        return verify_local_dry_run()
    if args.base_url.strip():
        return verify_remote(args.base_url.strip(), cookie=args.cookie.strip())
    parser.error("provide --dry-run-local or --base-url")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
