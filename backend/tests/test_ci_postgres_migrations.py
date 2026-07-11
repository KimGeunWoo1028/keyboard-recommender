"""PostgreSQL migration smoke (skipped when DB unreachable — CI always provides Postgres)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text

pytestmark = pytest.mark.postgres

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _database_url() -> str:
    return os.environ.get("DATABASE_URL", "").strip()


def _postgres_reachable(url: str) -> bool:
    if not url.startswith("postgresql"):
        return False
    try:
        eng = create_engine(url, pool_pre_ping=True)
        with eng.connect() as c:
            c.execute(text("SELECT 1"))
        return True
    except OSError:
        return False
    except Exception:
        return False


@pytest.fixture(scope="module")
def postgres_url() -> str:
    url = _database_url()
    if not url:
        pytest.skip("DATABASE_URL not set")
    if not _postgres_reachable(url):
        pytest.skip("PostgreSQL not reachable (start Docker or set DATABASE_URL)")
    return url


def test_postgres_alembic_head_applied(postgres_url: str) -> None:
    eng = create_engine(postgres_url)
    with eng.connect() as conn:
        ver = conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
    assert ver, "alembic_version must be non-empty"
    assert len(str(ver)) >= 3, f"unexpected alembic head: {ver!r}"


def test_eval_tables_present_via_schema_script(postgres_url: str) -> None:
    """Runs the same check as ``scripts/check_migration_schema.py`` (exit code 0)."""
    env = os.environ.copy()
    env["DATABASE_URL"] = postgres_url
    proc = subprocess.run(
        [sys.executable, "scripts/check_migration_schema.py"],
        cwd=str(BACKEND_ROOT),
        env=env,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, proc.stderr + proc.stdout
