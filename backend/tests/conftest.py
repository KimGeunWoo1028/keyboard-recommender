"""Shared pytest fixtures.

Import paths: use ``keyboard_recommender...`` (no ``src`` prefix). Resolution comes from
``backend/pyproject.toml`` when pytest's rootdir is ``backend/``, from the repo root
``pytest.ini`` when the rootdir is the monorepo root, or from an editable ``pip install -e``.
"""

from __future__ import annotations

import os

# Local ``backend/.env`` often enables evaluation persistence while Postgres is not running.
# That path is best-effort and should not fail tests, but ``logger.exception`` still prints
# long tracebacks after ``pytest`` finishes. Force off for the test process; tests that need
# persistence construct ``Settings(enable_evaluation_persistence=True)`` and use dependency
# overrides on the app.
os.environ["ENABLE_EVALUATION_PERSISTENCE"] = "false"

try:
    from keyboard_recommender.config.settings import get_settings

    get_settings.cache_clear()
except Exception:
    pass
