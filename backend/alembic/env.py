"""Alembic migration environment — uses the same `DATABASE_URL` as the app."""

from __future__ import annotations

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# src/ on path for `keyboard_recommender`
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from keyboard_recommender.config.settings import get_settings  # noqa: E402
from keyboard_recommender.infrastructure.persistence.base import Base  # noqa: E402
import keyboard_recommender.infrastructure.persistence.models  # noqa: F401, E402
import keyboard_recommender.recommendation_quality.evaluation.storage.event_models  # noqa: F401, E402

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = get_settings().database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_settings().database_url
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
