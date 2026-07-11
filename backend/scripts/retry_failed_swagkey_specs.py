#!/usr/bin/env python3
"""Retry extraction only for failed switch IDs from failures CSV."""

from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.swagkey_spec_scraper import (
    fetch_html,
    parse_switch_spec_from_html,
)


def _read_failed_ids(path: Path) -> set[str]:
    out: set[str] = set()
    with path.open("r", encoding="utf-8", newline="") as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            sid = str(row.get("id") or "").strip()
            if sid:
                out.add(sid)
    return out


def _load_targets(path: Path) -> list[dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("switches")
    if not isinstance(rows, list):
        return []
    out: list[dict[str, str]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        sid = str(row.get("id") or "").strip()
        url = str(row.get("url") or "").strip()
        name = str(row.get("name") or "").strip()
        if sid and url:
            out.append({"id": sid, "url": url, "name": name})
    return out


def _retry_fetch_html(url: str, *, timeout_s: float, max_retries: int, retry_backoff_ms: int) -> str:
    last_error: Exception | None = None
    attempts = max_retries + 1
    for attempt in range(1, attempts + 1):
        try:
            return fetch_html(url, timeout_s=timeout_s)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt >= attempts:
                break
            if retry_backoff_ms > 0:
                time.sleep((retry_backoff_ms * attempt) / 1000.0)
    raise RuntimeError(str(last_error) if last_error else "unknown fetch error")


def _merge_specs(existing_rows: list[dict[str, Any]], retry_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    for row in existing_rows:
        sid = str(row.get("id") or "").strip()
        if sid:
            by_id[sid] = dict(row)
    for row in retry_rows:
        sid = str(row.get("id") or "").strip()
        if sid:
            by_id[sid] = dict(row)
    return [by_id[k] for k in sorted(by_id.keys())]


def _write_failures_json(path: Path, failures: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"failures": failures}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


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
    parser.add_argument("--targets", required=True, help="Full targets JSON path")
    parser.add_argument("--failures-csv", required=True, help="Previous failures CSV path")
    parser.add_argument("--out", required=True, help="Output JSON path for merged specs")
    parser.add_argument("--existing-specs", default="", help="Existing specs JSON to merge with retry rows")
    parser.add_argument("--cache-dir", default="", help="Optional HTML cache directory")
    parser.add_argument("--timeout-s", type=float, default=20.0)
    parser.add_argument("--max-retries", type=int, default=3)
    parser.add_argument("--retry-backoff-ms", type=int, default=700)
    parser.add_argument("--sleep-ms", type=int, default=300)
    args = parser.parse_args()

    target_rows = _load_targets(Path(args.targets))
    failed_ids = _read_failed_ids(Path(args.failures_csv))
    retry_targets = [row for row in target_rows if row["id"] in failed_ids]

    cache_dir = Path(args.cache_dir).resolve() if args.cache_dir else None
    retry_rows: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for i, target in enumerate(retry_targets):
        sid = target["id"]
        url = target["url"]
        name = target["name"]
        try:
            html_doc = _retry_fetch_html(
                url,
                timeout_s=max(0.1, args.timeout_s),
                max_retries=max(0, args.max_retries),
                retry_backoff_ms=max(0, args.retry_backoff_ms),
            )
            if cache_dir is not None:
                cache_path = cache_dir / f"{sid}.html"
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_text(html_doc, encoding="utf-8")
            meta = parse_switch_spec_from_html(html_doc, fallback_name=name)
            row: dict[str, Any] = {"id": sid, "url": url}
            row.update(meta)
            retry_rows.append(row)
            if not meta:
                failures.append({"id": sid, "url": url, "stage": "parse", "error": "no extractable spec fields found"})
        except Exception as exc:  # noqa: BLE001
            failures.append({"id": sid, "url": url, "stage": "retry", "error": str(exc)})
        if i < len(retry_targets) - 1 and args.sleep_ms > 0:
            time.sleep(args.sleep_ms / 1000.0)

    existing_rows: list[dict[str, Any]] = []
    if args.existing_specs:
        existing_payload = json.loads(Path(args.existing_specs).read_text(encoding="utf-8"))
        rows = existing_payload.get("switches")
        if isinstance(rows, list):
            existing_rows = [r for r in rows if isinstance(r, dict)]

    merged_rows = _merge_specs(existing_rows, retry_rows)
    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"switches": merged_rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    failures_json = out_path.with_name(f"{out_path.stem}.retry.failures.json")
    failures_csv = out_path.with_name(f"{out_path.stem}.retry.failures.csv")
    _write_failures_json(failures_json, failures)
    _write_failures_csv(failures_csv, failures)

    print(f"retry targets: {len(retry_targets)}")
    print(f"retried success rows: {len(retry_rows)}")
    print(f"wrote: {out_path} ({len(merged_rows)} total rows)")
    print(f"wrote: {failures_json} ({len(failures)} failures)")
    print(f"wrote: {failures_csv} ({len(failures)} failures)")


if __name__ == "__main__":
    main()

