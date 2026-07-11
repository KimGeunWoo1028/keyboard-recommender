#!/usr/bin/env python3
"""
Verify PostgreSQL after `alembic upgrade head`.

* ``alembic_version`` row exists
* evaluation tables from migration 003 exist

Run from ``backend/`` with ``DATABASE_URL`` set (CI or local Docker).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# backend/ on path when run as ``python scripts/check_migration_schema.py`` from backend
_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND / "src") not in sys.path:
    sys.path.insert(0, str(_BACKEND / "src"))

from sqlalchemy import create_engine, text  # noqa: E402

_EXPECTED_EVAL_TABLES = (
    "eval_benchmark_runs",
    "eval_confidence_samples",
    "eval_diagnostics",
    "eval_events",
    "eval_metrics",
    "eval_recommendation_runs",
    "eval_snapshots",
)


def main() -> int:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url or not url.startswith("postgresql"):
        print("check_migration_schema: DATABASE_URL must be a PostgreSQL URL", file=sys.stderr)
        return 2

    try:
        eng = create_engine(url, pool_pre_ping=True)
        with eng.connect() as conn:
            ver = conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
            if not ver:
                print("check_migration_schema: empty alembic_version", file=sys.stderr)
                return 1
            print(f"check_migration_schema: alembic_version={ver}")

            rows = conn.execute(
                text(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = 'public' AND tablename LIKE 'eval_%'",
                ),
            ).fetchall()
            found = {r[0] for r in rows}
            missing = sorted(set(_EXPECTED_EVAL_TABLES) - found)
            if missing:
                print(f"check_migration_schema: missing tables: {missing}", file=sys.stderr)
                return 1
            print(f"check_migration_schema: eval tables OK ({len(found)})")
    except OSError as e:
        print(f"check_migration_schema: connection failed: {e}", file=sys.stderr)
        return 3
    except Exception as e:
        print(f"check_migration_schema: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
