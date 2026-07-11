"""Live Swagkey inventory pipeline: crawl URLs → clean → classify → recheck → webhook.

Full product-name inventory still depends on swagkey_products.csv (external Selenium
crawl may refresh that file). This script automates the in-repo steps and optional
HTTP URL crawl, then builds catalog_change_alert and can notify on failure/alerts.

Secrets: set CATALOG_CHANGE_ALERT_WEBHOOK_URL (or OPERATIONAL_ALERT_WEBHOOK_URL).
Never commit webhook URLs.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from keyboard_recommender.catalog.catalog_change_alert_webhook import (  # noqa: E402
    build_pipeline_failure_webhook_body,
    post_webhook_json,
    resolve_catalog_alert_webhook_url,
)

_DATA = _BACKEND / "data" / "swagkey_inventory"
_DEFAULT_CSV = _DATA / "swagkey_products.csv"


def _run(step: str, cmd: list[str]) -> int:
    print(f"[{step}] running:", " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=_BACKEND, check=False).returncode


def _notify_failure(
    *,
    step: str,
    exit_code: int,
    webhook_url: str | None,
    webhook_format: str,
    dry_run: bool,
    detail: str = "",
) -> None:
    url = resolve_catalog_alert_webhook_url(webhook_url)
    if not url:
        print(f"failure notify skipped (no webhook): step={step} exit={exit_code}")
        return
    body = build_pipeline_failure_webhook_body(
        step=step,
        exit_code=exit_code,
        mode="live",
        detail=detail,
        webhook_format=webhook_format,  # type: ignore[arg-type]
        webhook_url=url,
    )
    result = post_webhook_json(url, body, dry_run=dry_run)
    print(f"failure notify → {result}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Live Swagkey inventory pipeline → catalog alert")
    parser.add_argument(
        "--products-csv",
        type=Path,
        default=None,
        help="Inventory CSV for clean step (default: data/swagkey_inventory/swagkey_products.csv or SWAGKEY_PRODUCTS_CSV)",
    )
    parser.add_argument(
        "--skip-crawl-urls",
        action="store_true",
        help="Skip HTTP product-URL crawl (use existing crawl JSON)",
    )
    parser.add_argument(
        "--skip-clean-classify",
        action="store_true",
        help="Skip clean+classify (use existing recommender_candidates.json)",
    )
    parser.add_argument(
        "--skip-merge-urls",
        action="store_true",
        help="Skip merge of crawl URLs into inventory v2",
    )
    parser.add_argument(
        "--refresh-diff",
        action="store_true",
        default=None,
        help="Force re-run seed↔candidates diff (default: refresh when clean/classify ran)",
    )
    parser.add_argument(
        "--no-refresh-diff",
        action="store_true",
        help="Keep existing seed_inventory_diff.json (do not regenerate)",
    )
    parser.add_argument(
        "--fail-on-alert",
        action="store_true",
        help="Pass through to recheck (exit 2 when alerts present)",
    )
    parser.add_argument(
        "--notify-webhook",
        action="store_true",
        help="Notify catalog alerts (and pipeline failures) via webhook env/URL",
    )
    parser.add_argument("--webhook-url", default=None)
    parser.add_argument(
        "--notify-when",
        choices=("always", "alerts", "never"),
        default="alerts",
    )
    parser.add_argument(
        "--webhook-format",
        choices=("auto", "json", "slack", "discord"),
        default="auto",
    )
    parser.add_argument(
        "--webhook-dry-run",
        action="store_true",
        help="Build/resolve webhook without HTTP POST",
    )
    parser.add_argument(
        "--check-image-urls",
        action="store_true",
        help="Pass --check-image-urls to inventory recheck (imageUrlChanged alerts)",
    )
    parser.add_argument(
        "--image-check-mode",
        choices=("fixture", "live"),
        default="live",
        help="Image recheck mode when --check-image-urls is set (default: live)",
    )
    args = parser.parse_args(argv)

    notify = bool(args.notify_webhook or args.webhook_dry_run)
    dry = bool(args.webhook_dry_run)

    if not args.skip_crawl_urls:
        code = _run("crawl_urls", [sys.executable, "scripts/crawl_swagkey_product_urls.py"])
        if code != 0:
            if notify:
                _notify_failure(
                    step="crawl_urls",
                    exit_code=code,
                    webhook_url=args.webhook_url,
                    webhook_format=args.webhook_format,
                    dry_run=dry,
                )
            return code

    csv_path = args.products_csv
    if csv_path is None:
        env_csv = (os.environ.get("SWAGKEY_PRODUCTS_CSV") or "").strip()
        csv_path = Path(env_csv) if env_csv else _DEFAULT_CSV

    if not args.skip_clean_classify:
        if not csv_path.is_file():
            msg = f"products CSV missing: {csv_path}"
            print(f"error: {msg}", file=sys.stderr)
            print(
                "hint: place refreshed swagkey_products.csv (external crawl) or pass --products-csv / SWAGKEY_PRODUCTS_CSV",
                file=sys.stderr,
            )
            if notify:
                _notify_failure(
                    step="products_csv",
                    exit_code=1,
                    webhook_url=args.webhook_url,
                    webhook_format=args.webhook_format,
                    dry_run=dry,
                    detail=msg,
                )
            return 1
        code = _run(
            "clean",
            [sys.executable, "scripts/clean_swagkey_inventory.py", "--csv", str(csv_path)],
        )
        if code != 0:
            if notify:
                _notify_failure(
                    step="clean",
                    exit_code=code,
                    webhook_url=args.webhook_url,
                    webhook_format=args.webhook_format,
                    dry_run=dry,
                )
            return code
        code = _run("classify", [sys.executable, "scripts/classify_swagkey_inventory.py"])
        if code != 0:
            if notify:
                _notify_failure(
                    step="classify",
                    exit_code=code,
                    webhook_url=args.webhook_url,
                    webhook_format=args.webhook_format,
                    dry_run=dry,
                )
            return code

    if not args.skip_merge_urls and not args.skip_crawl_urls:
        # merge is best-effort for URL enrichment; failure should not block alert
        merge_code = _run("merge_urls", [sys.executable, "scripts/merge_swagkey_inventory_urls.py"])
        if merge_code != 0:
            print(f"warning: merge_urls exited {merge_code} (continuing to recheck)", file=sys.stderr)

    do_refresh = (not args.skip_clean_classify) if args.refresh_diff is None else bool(args.refresh_diff)
    if args.no_refresh_diff:
        do_refresh = False

    recheck_cmd = [
        sys.executable,
        "scripts/run_swagkey_inventory_recheck.py",
        "--mode",
        "live",
        "--notify-when",
        args.notify_when,
        "--webhook-format",
        args.webhook_format,
    ]
    if do_refresh:
        recheck_cmd.append("--refresh-diff")
    if args.fail_on_alert:
        recheck_cmd.append("--fail-on-alert")
    if args.notify_webhook:
        recheck_cmd.append("--notify-webhook")
    if args.webhook_dry_run:
        recheck_cmd.append("--webhook-dry-run")
    if args.webhook_url:
        recheck_cmd.extend(["--webhook-url", args.webhook_url])
    if args.check_image_urls:
        recheck_cmd.append("--check-image-urls")
        recheck_cmd.extend(["--image-check-mode", args.image_check_mode])

    code = _run("recheck", recheck_cmd)
    if code not in (0, 2) and notify:
        _notify_failure(
            step="recheck",
            exit_code=code,
            webhook_url=args.webhook_url,
            webhook_format=args.webhook_format,
            dry_run=dry,
        )
    return code


if __name__ == "__main__":
    raise SystemExit(main())
