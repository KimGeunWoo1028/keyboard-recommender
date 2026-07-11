"""Local step-by-step verification for roadmap ⑮ (no secrets in shell)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]


def _run(cmd: list[str], *, env: dict[str, str] | None = None) -> None:
    print(">", " ".join(cmd))
    merged = {**os.environ, **(env or {})}
    # Avoid leaking prior user secrets into the production-config check.
    for key in (
        "APP_ENV",
        "APP_ENVIRONMENT",
        "AUTH_COOKIE_SECURE",
        "PUBLIC_FRONTEND_BASE_URL",
        "CORS_ORIGINS",
        "DATABASE_URL",
    ):
        if env is not None and key not in env:
            merged.pop(key, None)
    result = subprocess.run(cmd, cwd=_BACKEND, env=merged, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> int:
    _run(
        [
            sys.executable,
            "-m",
            "pytest",
            "tests/test_catalog_change_alert.py",
            "tests/test_catalog_change_alert_webhook.py",
            "tests/test_swagkey_image_url_recheck.py",
            "-q",
            "--tb=short",
        ]
    )
    # Fixture recheck must stay green without a live crawl or webhook secret.
    _run(
        [
            sys.executable,
            "scripts/run_swagkey_inventory_recheck.py",
            "--mode",
            "fixture",
            "--check-image-urls",
            "--image-check-mode",
            "fixture",
        ]
    )
    _run(
        [
            sys.executable,
            "scripts/run_swagkey_inventory_recheck.py",
            "--mode",
            "fixture",
            "--check-image-urls",
            "--webhook-dry-run",
            "--webhook-url",
            "https://example.invalid/hooks/catalog-dry-run",
            "--notify-when",
            "always",
        ]
    )
    # Live mode without crawl must not break fixture artifacts (skip network + no diff rewrite).
    _run(
        [
            sys.executable,
            "scripts/run_swagkey_live_inventory_pipeline.py",
            "--skip-crawl-urls",
            "--skip-clean-classify",
            "--skip-merge-urls",
            "--no-refresh-diff",
            "--check-image-urls",
            "--image-check-mode",
            "fixture",
            "--webhook-dry-run",
            "--webhook-url",
            "https://example.invalid/hooks/catalog-dry-run",
            "--notify-when",
            "always",
        ]
    )
    _run([sys.executable, "scripts/verify_feedback_learning_mvp.py", "--dry-run-local"])

    # Dummy HTTPS production shape — values are clearly fake hostnames/credentials for offline validation only.
    https_env = {
        "APP_ENV": "production",
        "AUTH_COOKIE_SECURE": "true",
        "PUBLIC_FRONTEND_BASE_URL": "https://app.example.com",
        "CORS_ORIGINS": "https://app.example.com",
        "DATABASE_URL": "postgresql+psycopg://app_user:not-a-real-secret@db.internal:5432/keyboard",
        "EMAIL_PROVIDER": "resend",
        "RESEND_API_KEY": "re_test_placeholder",
        "RESEND_FROM_EMAIL": "noreply@example.com",
    }
    _run(
        [sys.executable, "scripts/check_production_https_config.py", "--require-production"],
        env=https_env,
    )
    print("⑮ verification OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
