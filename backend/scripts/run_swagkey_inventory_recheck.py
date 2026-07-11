"""Orchestrate inventory recheck: (optional crawl) → diff → catalog change alert.

Modes:
  fixture — use committed inventory artifacts (CI-safe, no live Swagkey HTTP)
  live    — operator/CI: optional refresh-diff; prefer run_swagkey_live_inventory_pipeline.py
            for crawl → clean → classify → alert
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from keyboard_recommender.catalog.catalog_change_alert import (  # noqa: E402
    build_catalog_change_alert,
    format_catalog_change_alert_text,
)
from keyboard_recommender.catalog.catalog_change_alert_webhook import (  # noqa: E402
    maybe_notify_catalog_alert,
    resolve_catalog_alert_webhook_url,
)
from keyboard_recommender.catalog.swagkey_image_url_recheck import (  # noqa: E402
    image_url_changes_for_alert,
    load_seed_payload,
    run_image_url_recheck,
    write_json as write_recheck_json,
)

_DATA = _BACKEND / "data" / "swagkey_inventory"
_DEFAULT_DIFF = _DATA / "seed_inventory_diff.json"
_DEFAULT_ALERT_JSON = _DATA / "catalog_change_alert.json"
_DEFAULT_ALERT_TXT = _DATA / "catalog_change_alert.txt"
_DEFAULT_SEED = (
    _BACKEND / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"
)
_DEFAULT_IMAGE_CACHE = _DATA / "product_image_html_cache"
_DEFAULT_IMAGE_RECHECK_JSON = _DATA / "image_url_recheck_report.json"


def _run(cmd: list[str]) -> int:
    print("running:", " ".join(cmd))
    return subprocess.run(cmd, cwd=_BACKEND, check=False).returncode


def _refresh_diff() -> int:
    return _run([sys.executable, "scripts/diff_swagkey_seed_inventory.py"])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Swagkey inventory recheck → catalog change alert")
    parser.add_argument(
        "--mode",
        choices=("fixture", "live"),
        default="fixture",
        help="fixture: use committed diffs / local artifacts; live: expect crawl refreshed first",
    )
    parser.add_argument(
        "--refresh-diff",
        action="store_true",
        help="Re-run diff_swagkey_seed_inventory.py before building the alert",
    )
    parser.add_argument(
        "--diff-json",
        type=Path,
        default=_DEFAULT_DIFF,
        help="Path to seed_inventory_diff.json",
    )
    parser.add_argument(
        "--alert-json",
        type=Path,
        default=_DEFAULT_ALERT_JSON,
    )
    parser.add_argument(
        "--alert-txt",
        type=Path,
        default=_DEFAULT_ALERT_TXT,
    )
    parser.add_argument(
        "--fail-on-alert",
        action="store_true",
        help="Exit 2 when blockingAlertTotal > 0 (recommendation-eligible drift only)",
    )
    parser.add_argument(
        "--notify-webhook",
        action="store_true",
        help="POST alert to CATALOG_CHANGE_ALERT_WEBHOOK_URL (or OPERATIONAL_ALERT_WEBHOOK_URL)",
    )
    parser.add_argument(
        "--webhook-url",
        default=None,
        help="Override webhook URL (do not commit secrets; prefer env/CI secrets)",
    )
    parser.add_argument(
        "--notify-when",
        choices=("always", "alerts", "never"),
        default="alerts",
        help="When --notify-webhook: always | only when hasBlockingAlerts | never",
    )
    parser.add_argument(
        "--webhook-format",
        choices=("auto", "json", "slack", "discord"),
        default="auto",
        help="Webhook body shape (auto detects Slack/Discord from URL)",
    )
    parser.add_argument(
        "--webhook-dry-run",
        action="store_true",
        help="Resolve webhook + build body without HTTP POST (safe for CI/local verify)",
    )
    parser.add_argument(
        "--check-image-urls",
        action="store_true",
        help="Compare seed imageUrl to refetched og:image and add imageUrlChanged alerts",
    )
    parser.add_argument(
        "--image-check-mode",
        choices=("fixture", "live"),
        default=None,
        help="fixture: HTML cache only (CI-safe); live: HTTP fetch (default follows --mode)",
    )
    parser.add_argument("--seed", type=Path, default=_DEFAULT_SEED)
    parser.add_argument(
        "--image-cache-dir",
        type=Path,
        default=_DEFAULT_IMAGE_CACHE,
        help="HTML cache for fixture image checks ({idx}.html)",
    )
    parser.add_argument(
        "--image-recheck-json",
        type=Path,
        default=_DEFAULT_IMAGE_RECHECK_JSON,
    )
    parser.add_argument(
        "--image-check-limit",
        type=int,
        default=0,
        help="Optional limit for image recheck smoke runs (0 = all)",
    )
    args = parser.parse_args(argv)

    if args.mode == "live":
        print(
            "live mode: ensure crawl/clean/classify refreshed inventory artifacts, "
            "or use scripts/run_swagkey_live_inventory_pipeline.py.",
        )

    if args.refresh_diff:
        code = _refresh_diff()
        if code != 0:
            return code

    diff_path = args.diff_json
    if not diff_path.is_file():
        print(f"error: diff report missing: {diff_path}", file=sys.stderr)
        print("hint: run scripts/diff_swagkey_seed_inventory.py first, or pass --refresh-diff", file=sys.stderr)
        return 1

    diff_payload = json.loads(diff_path.read_text(encoding="utf-8"))

    image_changes: list[dict[str, object]] = []
    if args.check_image_urls:
        image_mode = args.image_check_mode or args.mode
        seed_path = args.seed.resolve()
        if not seed_path.is_file():
            print(f"error: seed missing for image check: {seed_path}", file=sys.stderr)
            return 1
        cache_dir = args.image_cache_dir.resolve()
        seed_payload = load_seed_payload(seed_path)
        limit = args.image_check_limit if args.image_check_limit > 0 else None
        image_report = run_image_url_recheck(
            seed_payload,
            mode=image_mode,
            cache_dir=cache_dir,
            seed_path=str(seed_path).replace("\\", "/"),
            limit=limit,
        )
        write_recheck_json(args.image_recheck_json.resolve(), image_report.to_dict())
        image_changes = image_url_changes_for_alert(image_report.changes)
        stats = image_report.to_dict()["stats"]
        print(
            f"wrote {args.image_recheck_json} · imageChecked={stats['checked']} "
            f"changed={stats['changed']} skippedNoCache={stats['skippedNoCache']} failures={stats['failures']}",
        )

    alert = build_catalog_change_alert(diff_payload, image_url_changes=image_changes)
    args.alert_json.parent.mkdir(parents=True, exist_ok=True)
    args.alert_json.write_text(json.dumps(alert, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.alert_txt.write_text(format_catalog_change_alert_text(alert), encoding="utf-8")

    counts = alert["counts"]
    print(
        f"wrote {args.alert_json} · blocking={counts.get('blockingAlertTotal', counts['alertTotal'])} "
        f"informational={counts.get('informationalTotal', 0)} "
        f"(new={counts['newInCrawl']} discontinued~={counts['possiblyDiscontinued']} "
        f"rename={counts['nameChanged']} imageUrl={counts.get('imageUrlChanged', 0)})",
    )
    print(f"wrote {args.alert_txt}")

    if args.notify_webhook or args.webhook_dry_run:
        result = maybe_notify_catalog_alert(
            alert,
            webhook_url=args.webhook_url,
            notify_when="never" if args.notify_when == "never" else args.notify_when,
            webhook_format=args.webhook_format,
            dry_run=bool(args.webhook_dry_run),
        )
        if result.get("skipped"):
            print(f"webhook skipped: {result.get('reason')}")
        elif result.get("dryRun"):
            print(f"webhook dry-run ok → {result.get('webhook')} keys={result.get('bodyKeys')}")
        elif result.get("ok"):
            print(f"webhook posted → {result.get('webhook')} status={result.get('status')}")
        else:
            print(f"webhook failed → {result}", file=sys.stderr)
            # Do not fail the recheck solely on webhook transport errors.
        if args.webhook_dry_run and args.notify_webhook:
            resolved = resolve_catalog_alert_webhook_url(args.webhook_url)
            if not resolved and args.notify_when != "never":
                # Dry-run without URL is still OK for local verify of alert build path.
                print("note: no webhook URL configured (dry-run only)")

    if args.fail_on_alert and alert.get("hasBlockingAlerts"):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
