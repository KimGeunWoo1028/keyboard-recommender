#!/usr/bin/env python3
"""Extract normalized switch specs from Swagkey product pages."""

from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.swagkey_spec_scraper import (
    fetch_html,
    load_targets,
    parse_switch_spec_from_html,
)


def _html_cache_path(cache_dir: Path, sid: str) -> Path:
    return cache_dir / f"{sid}.html"


def _read_cached(path: Path) -> str | None:
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8", errors="ignore")


def _safe_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _build_result_row(target_id: str, url: str, meta: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {"id": target_id, "url": url}
    out.update(meta)
    return out


def _default_failures_json_path(out_path: Path) -> Path:
    return out_path.with_name(f"{out_path.stem}.failures.json")


def _default_failures_csv_path(out_path: Path) -> Path:
    return out_path.with_name(f"{out_path.stem}.failures.csv")


def _retry_fetch_html(url: str, *, timeout_s: float, max_retries: int, retry_backoff_ms: int) -> str:
    last_error: Exception | None = None
    attempts = max_retries + 1
    for attempt in range(1, attempts + 1):
        try:
            return fetch_html(url, timeout_s=timeout_s)
        except Exception as exc:  # noqa: BLE001 - CLI retry/reporting should catch all request errors
            last_error = exc
            if attempt >= attempts:
                break
            if retry_backoff_ms > 0:
                time.sleep((retry_backoff_ms * attempt) / 1000.0)
    raise RuntimeError(str(last_error) if last_error else "unknown fetch error")


def _write_failures_json(path: Path, failures: list[dict[str, Any]]) -> None:
    payload = {"failures": failures}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _write_failures_csv(path: Path, failures: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=["id", "url", "stage", "error"])
        writer.writeheader()
        for row in failures:
            writer.writerow(
                {
                    "id": str(row.get("id") or ""),
                    "url": str(row.get("url") or ""),
                    "stage": str(row.get("stage") or ""),
                    "error": str(row.get("error") or ""),
                }
            )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--targets", required=True, help="JSON path with switches [{id,url,name?}]")
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument("--cache-dir", default="", help="Optional HTML cache directory")
    parser.add_argument("--sleep-ms", type=int, default=400, help="Delay between requests")
    parser.add_argument("--timeout-s", type=float, default=20.0, help="Request timeout seconds")
    parser.add_argument("--max-retries", type=int, default=2, help="Retries per URL when fetch fails")
    parser.add_argument("--retry-backoff-ms", type=int, default=500, help="Backoff base milliseconds between retries")
    parser.add_argument("--failures-json-out", default="", help="Optional failures report JSON path")
    parser.add_argument("--failures-csv-out", default="", help="Optional failures report CSV path")
    parser.add_argument("--use-cache-only", action="store_true", help="Do not fetch network, parse cached HTML only")
    args = parser.parse_args()

    targets = load_targets(Path(args.targets))
    cache_dir = Path(args.cache_dir).resolve() if args.cache_dir else None

    rows: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for i, target in enumerate(targets):
        html_doc: str | None = None
        cache_path = _html_cache_path(cache_dir, target.id) if cache_dir else None
        if cache_path is not None:
            html_doc = _read_cached(cache_path)

        if html_doc is None and not args.use_cache_only:
            try:
                html_doc = _retry_fetch_html(
                    target.url,
                    timeout_s=args.timeout_s,
                    max_retries=max(0, args.max_retries),
                    retry_backoff_ms=max(0, args.retry_backoff_ms),
                )
                if cache_path is not None:
                    _safe_write(cache_path, html_doc)
            except Exception as exc:  # noqa: BLE001 - CLI should continue for per-target failures
                failures.append({"id": target.id, "url": target.url, "stage": "fetch", "error": str(exc)})
                html_doc = None

        if html_doc is None:
            if args.use_cache_only:
                failures.append(
                    {
                        "id": target.id,
                        "url": target.url,
                        "stage": "cache",
                        "error": "cache miss while --use-cache-only is set",
                    }
                )
            continue

        try:
            meta = parse_switch_spec_from_html(html_doc, fallback_name=target.name)
            if not meta:
                failures.append(
                    {
                        "id": target.id,
                        "url": target.url,
                        "stage": "parse",
                        "error": "no extractable spec fields found",
                    }
                )
            rows.append(_build_result_row(target.id, target.url, meta))
        except Exception as exc:  # noqa: BLE001 - CLI should continue for per-target failures
            failures.append({"id": target.id, "url": target.url, "stage": "parse", "error": str(exc)})

        if i < len(targets) - 1 and args.sleep_ms > 0:
            time.sleep(args.sleep_ms / 1000.0)

    out_payload = {"switches": rows}
    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    failures_json_path = (
        Path(args.failures_json_out).resolve() if args.failures_json_out else _default_failures_json_path(out_path)
    )
    failures_csv_path = (
        Path(args.failures_csv_out).resolve() if args.failures_csv_out else _default_failures_csv_path(out_path)
    )
    _write_failures_json(failures_json_path, failures)
    _write_failures_csv(failures_csv_path, failures)

    print(f"wrote: {out_path} ({len(rows)} rows)")
    print(f"wrote: {failures_json_path} ({len(failures)} failures)")
    print(f"wrote: {failures_csv_path} ({len(failures)} failures)")


if __name__ == "__main__":
    main()

