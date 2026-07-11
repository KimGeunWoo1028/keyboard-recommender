from __future__ import annotations

from dataclasses import dataclass

from keyboard_recommender.api.v1 import recommendations as recommendations_route
from keyboard_recommender.application import recommendation_service
from keyboard_recommender.application.cache_layer import TtlCache
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.schemas.recommendation import SurveyAnswersRequest
from keyboard_recommender.schemas.unified_events import UnifiedEventsIngestBody


def test_ttl_cache_roundtrip() -> None:
    cache = TtlCache(max_size=2, ttl_seconds=30)
    cache.set("k", {"v": 1})
    got = cache.get("k")
    assert got == {"v": 1}
    assert got is not None and got is not cache.get("k")


@dataclass
class _FakeFlags:
    def model_dump(self, mode: str = "json") -> dict[str, object]:
        return {"enableReranking": True, "enableFallback": True}


@dataclass
class _FakeOperationalRuntime:
    flags: _FakeFlags
    notes: tuple[str, ...] = ()


@dataclass
class _FakeResponse:
    payload: dict[str, object]
    completed_at_iso: str = "2026-05-05T00:00:00Z"

    def model_dump(self, *, by_alias: bool = True, mode: str = "json") -> dict[str, object]:
        return dict(self.payload)


def test_compute_recommendation_uses_cache(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    calls = {"build": 0}

    def _fake_build(*args, **kwargs):  # type: ignore[no-untyped-def]
        calls["build"] += 1
        payload = {"completedAtIso": "2026-05-05T00:00:00Z", "build": {"engineScores": {}}}
        return payload, object(), {"muted": 1.0}, {"sound_profile": "muted"}

    monkeypatch.setattr(recommendation_service, "build_recommendation_computation", _fake_build)
    monkeypatch.setattr(
        recommendation_service,
        "resolve_operational_runtime",
        lambda **kwargs: _FakeOperationalRuntime(flags=_FakeFlags()),
    )
    monkeypatch.setattr(
        recommendation_service.RecommendationResponse,
        "model_validate",
        staticmethod(lambda payload: _FakeResponse(payload)),
    )

    body = SurveyAnswersRequest(
        sound_profile="muted",
        typing_pressure="light",
        switch_feel="linear",
        bottom_out="soft",
        volume="quiet",
    )
    cfg = Settings(enable_recommendation_cache=True, enable_evaluation_persistence=False)
    recommendation_service.compute_recommendation(body, settings=cfg, db_session=None, scenario_id="scn-1")
    recommendation_service.compute_recommendation(body, settings=cfg, db_session=None, scenario_id="scn-1")
    assert calls["build"] == 1


def test_unified_events_ingest_uses_batch_pipeline(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setattr(
        recommendations_route,
        "enqueue_unified_events_for_batch_persistence",
        lambda settings, events: len(events),
    )
    body = UnifiedEventsIngestBody(events=[{"event_type": "interaction.click", "request_id": "r1"}])
    cfg = Settings(enable_evaluation_persistence=True, enable_batch_evaluation_pipeline=True)
    out = recommendations_route.post_unified_recommendation_events(body, settings=cfg, db_session=object())
    assert out.stored == 1
    assert out.skipped is False
    assert out.reason == "queued_for_batch_persistence"
