"""Offline check that production HTTPS cookie/env constraints are satisfied."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate production HTTPS-related env settings")
    parser.add_argument(
        "--require-production",
        action="store_true",
        help="Fail unless APP_ENV resolves to production",
    )
    args = parser.parse_args(argv)

    from keyboard_recommender.config.env_validation import validate_environment_configuration
    from keyboard_recommender.config.settings import Settings

    # Allow operators to set a temporary APP_ENV for the check without a .env file.
    settings = Settings()
    if args.require_production and settings.app_environment != "production":
        print(
            f"error: expected APP_ENV=production (got {settings.app_environment})",
            file=sys.stderr,
        )
        return 1

    try:
        validate_environment_configuration(settings)
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1

    if settings.app_environment == "production" and not settings.auth_cookie_secure:
        print("FAIL: APP_ENV=production requires AUTH_COOKIE_SECURE=true", file=sys.stderr)
        return 1

    print(
        "OK: environment configuration valid "
        f"(APP_ENV={settings.app_environment}, AUTH_COOKIE_SECURE={settings.auth_cookie_secure}, "
        f"CORS_ORIGINS={len(settings.cors_origin_list)})",
    )
    # Document which env drove the check when operators export vars for CI.
    raw = os.environ.get("APP_ENV") or os.environ.get("APP_ENVIRONMENT")
    if raw:
        print(f"  env override seen: APP_ENV={raw}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
