from keyboard_recommender.config.settings import Settings


def test_scaling_profile_low_applies_expected_defaults() -> None:
    cfg = Settings(database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender", scaling_profile="low")
    assert cfg.recommendation_cache_ttl_seconds == 20
    assert cfg.recommendation_cache_max_size == 512
    assert cfg.evaluation_batch_size == 24
    assert cfg.evaluation_batch_flush_interval_seconds == 1


def test_scaling_profile_high_applies_expected_defaults() -> None:
    cfg = Settings(database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender", scaling_profile="high")
    assert cfg.recommendation_cache_ttl_seconds == 90
    assert cfg.recommendation_cache_max_size == 4096
    assert cfg.evaluation_batch_size == 256
    assert cfg.evaluation_batch_flush_interval_seconds == 3

