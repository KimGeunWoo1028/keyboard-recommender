"""HTTP contract: recommendation succeeds even when evaluation persistence fails."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from keyboard_recommender.api.deps import get_db_for_evaluation, get_settings_dep
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings

_VALID_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}


def _mock_db_session() -> Generator[MagicMock, None, None]:
    yield MagicMock()


def test_post_compute_succeeds_when_persistence_raises() -> None:
    """Swallowed persistence errors must not change HTTP status or response body validity."""
    s = Settings(
        database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
        enable_evaluation_persistence=True,
        evaluation_persistence_force_failure=True,
    )
    app = create_app(settings=s)
    app.dependency_overrides[get_settings_dep] = lambda: s
    app.dependency_overrides[get_db_for_evaluation] = _mock_db_session
    client = TestClient(app)
    try:
        res = client.post("/api/v1/recommendations/compute", json=_VALID_SURVEY)
    finally:
        app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    for k, v in _VALID_SURVEY.items():
        assert data["answers"][k] == v
    assert len(data.get("recommendations") or []) >= 1
