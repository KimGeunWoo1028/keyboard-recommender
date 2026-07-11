#!/usr/bin/env python3
"""Extract normalized plate/foam compatibility specs from Swagkey product pages."""

from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.swagkey_spec_scraper import (
    fetch_html,
    load_component_targets,
    parse_foam_spec_from_html,
    parse_plate_spec_from_html,
)


def _html_cache_path(cache_dir: Path, family: str, sid: str) -> Path:
    return cache_dir / family / f"{sid}.html"


def _read_cached(path: Path) -> str | None:
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8", errors="ignore")


def _safe_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


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


def _write_failures_json(path: Path, failures: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"failures": failures}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _write_failures_csv(path: Path, failures: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=["family", "id", "url", "stage", "error"])
        writer.writeheader()
        for row in failures:
            writer.writerow(
                {
                    "family": str(row.get("family") or ""),
                    "id": str(row.get("id") or ""),
                    "url": str(row.get("url") or ""),
                    "stage": str(row.get("stage") or ""),
                    "error": str(row.get("error") or ""),
                }
            )


def _extract_family(
    *,
    family_key: str,
    targets_path: Path,
    cache_dir: Path | None,
    timeout_s: float,
    max_retries: int,
    retry_backoff_ms: int,
    sleep_ms: int,
    use_cache_only: bool,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    targets = load_component_targets(targets_path, family_key)
    parse = parse_plate_spec_from_html if family_key == "plates" else parse_foam_spec_from_html
    rows: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for i, target in enumerate(targets):
        html_doc: str | None = None
        cache_path = _html_cache_path(cache_dir, family_key, target.id) if cache_dir is not None else None
        if cache_path is not None:
            html_doc = _read_cached(cache_path)
        if html_doc is None and not use_cache_only:
            try:
                html_doc = _retry_fetch_html(
                    target.url,
                    timeout_s=timeout_s,
                    max_retries=max_retries,
                    retry_backoff_ms=retry_backoff_ms,
                )
                if cache_path is not None:
                    _safe_write(cache_path, html_doc)
            except Exception as exc:  # noqa: BLE001
                failures.append(
                    {"family": family_key, "id": target.id, "url": target.url, "stage": "fetch", "error": str(exc)},
                )
                html_doc = None
        if html_doc is None:
            if use_cache_only:
                failures.append(
                    {
                        "family": family_key,
                        "id": target.id,
                        "url": target.url,
                        "stage": "cache",
                        "error": "cache miss while --use-cache-only is set",
                    },
                )
            continue
        try:
            meta = parse(html_doc, fallback_name=target.name)
            if not meta:
                failures.append(
                    {
                        "family": family_key,
                        "id": target.id,
                        "url": target.url,
                        "stage": "parse",
                        "error": "no extractable compatibility fields found",
                    },
                )
            row: dict[str, Any] = {"id": target.id, "url": target.url}
            row.update(meta)
            rows.append(row)
        except Exception as exc:  # noqa: BLE001
            failures.append(
                {"family": family_key, "id": target.id, "url": target.url, "stage": "parse", "error": str(exc)},
            )
        if i < len(targets) - 1 and sleep_ms > 0:
            time.sleep(sleep_ms / 1000.0)
    return rows, failures


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--targets", required=True, help="JSON path with plates/foams target lists")
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument("--cache-dir", default="", help="Optional HTML cache directory")
    parser.add_argument("--sleep-ms", type=int, default=400)
    parser.add_argument("--timeout-s", type=float, default=20.0)
    parser.add_argument("--max-retries", type=int, default=2)
    parser.add_argument("--retry-backoff-ms", type=int, default=500)
    parser.add_argument("--failures-json-out", default="", help="Optional failures report JSON path")
    parser.add_argument("--failures-csv-out", default="", help="Optional failures report CSV path")
    parser.add_argument("--use-cache-only", action="store_true", help="Do not fetch network, parse cached HTML only")
    args = parser.parse_args()

    targets_path = Path(args.targets).resolve()
    out_path = Path(args.out).resolve()
    cache_dir = Path(args.cache_dir).resolve() if args.cache_dir else None

    plates, p_fail = _extract_family(
        family_key="plates",
        targets_path=targets_path,
        cache_dir=cache_dir,
        timeout_s=max(0.1, args.timeout_s),
        max_retries=max(0, args.max_retries),
        retry_backoff_ms=max(0, args.retry_backoff_ms),
        sleep_ms=max(0, args.sleep_ms),
        use_cache_only=args.use_cache_only,
    )
    foams, f_fail = _extract_family(
        family_key="foams",
        targets_path=targets_path,
        cache_dir=cache_dir,
        timeout_s=max(0.1, args.timeout_s),
        max_retries=max(0, args.max_retries),
        retry_backoff_ms=max(0, args.retry_backoff_ms),
        sleep_ms=max(0, args.sleep_ms),
        use_cache_only=args.use_cache_only,
    )
    failures = p_fail + f_fail

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"plates": plates, "foams": foams}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    failures_json = Path(args.failures_json_out).resolve() if args.failures_json_out else out_path.with_name(
        f"{out_path.stem}.failures.json",
    )
    failures_csv = Path(args.failures_csv_out).resolve() if args.failures_csv_out else out_path.with_name(
        f"{out_path.stem}.failures.csv",
    )
    _write_failures_json(failures_json, failures)
    _write_failures_csv(failures_csv, failures)

    print(f"wrote: {out_path} (plates={len(plates)}, foams={len(foams)})")
    print(f"wrote: {failures_json} ({len(failures)} failures)")
    print(f"wrote: {failures_csv} ({len(failures)} failures)")


if __name__ == "__main__":
    main()

