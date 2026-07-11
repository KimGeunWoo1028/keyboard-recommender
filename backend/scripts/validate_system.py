#!/usr/bin/env python3
"""
One-shot local/CI validation: Alembic head → schema smoke → pytest.

Usage (from ``backend/``)::

    pip install -e ".[dev]"
    export DATABASE_URL=postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender
    python scripts/validate_system.py

Exit non-zero on any failure.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]


def _run(cmd: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> int:
    print("+", " ".join(cmd), flush=True)
    return subprocess.call(cmd, cwd=str(cwd), env=env)


def main() -> int:
    cwd = _BACKEND
    if not os.environ.get("DATABASE_URL", "").strip():
        print("validate_system: set DATABASE_URL (PostgreSQL) before running.", file=sys.stderr)
        return 2

    # Deterministic test defaults for this script (persistence side effects off)
    child_env = os.environ.copy()
    child_env.setdefault("ENABLE_EVALUATION_PERSISTENCE", "false")

    if _run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=cwd) != 0:
        return 1
    if _run([sys.executable, "scripts/check_migration_schema.py"], cwd=cwd) != 0:
        return 1
    if _run([sys.executable, "-m", "pytest", "-q"], cwd=cwd, env=child_env) != 0:
        return 1
    print("validate_system: OK", flush=True)
    return 0


if __name__ == "__main__":
    # subprocess does not use env override in _run for alembic - alembic needs DATABASE_URL from parent
    # For pytest we want ENABLE false - patch _run to pass env for pytest only
    raise SystemExit(main())
