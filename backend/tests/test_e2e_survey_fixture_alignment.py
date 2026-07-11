"""Keep Playwright deterministic survey JSON aligned with backend regression fixtures."""

from __future__ import annotations

import json
from pathlib import Path

from tests.support.regression import STABLE_SURVEY

_REPO = Path(__file__).resolve().parents[2]
_FIXTURE = _REPO / "e2e" / "fixtures" / "deterministic-survey.json"


def test_e2e_deterministic_survey_fixture_matches_stable_survey() -> None:
    raw = json.loads(_FIXTURE.read_text(encoding="utf-8"))
    for k, v in STABLE_SURVEY.items():
        assert raw.get(k) == v
