#!/usr/bin/env python3
"""Retry extraction only for failed plate/foam IDs from failures CSV."""

from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.swagkey_spec_scraper import (
    fetch_html,
    parse_foam_spec_from_html,
    parse_plate_spec_from_html,
)


def _read_failed_rows(path: Path) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8", newline="") as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            fam = str(row.get("family") or "").strip().lower()
            sid = str(row.get("id") or "").strip()
            if fam in {"plates", "foams"} and sid:
                out.append({"family": fam, "id": sid})
    return out


def _load_targets(path: Path) -> dict[str, list[dict[str, str]]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, list[dict[str, str]]] = {"plates": [], "foams": []}
    for fam in ("plates", "foams"):
        rows = payload.get(fam)
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            sid = str(row.get("id") or "").strip()
            url = str(row.get("url") or "").strip()
            name = str(row.get("name") or "").strip()
            if sid and url:
                out[fam].append({"id": sid, "url": url, "name": name})
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


def _merge_rows(existing_rows: list[dict[str, Any]], retry_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
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


def _pick_parser(family: str):
    return parse_plate_spec_from_html if family == "plates" else parse_foam_spec_from_html


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--targets", required=True, help="Full compat targets JSON path")
    parser.add_argument("--failures-csv", required=True, help="Previous failures CSV path")
    parser.add_argument("--out", required=True, help="Output JSON path for merged compat specs")
    parser.add_argument("--existing-specs", default="", help="Existing compat specs JSON to merge with retry rows")
    parser.add_argument("--cache-dir", default="", help="Optional HTML cache directory")
    parser.add_argument("--timeout-s", type=float, default=20.0)
    parser.add_argument("--max-retries", type=int, default=3)
    parser.add_argument("--retry-backoff-ms", type=int, default=700)
    parser.add_argument("--sleep-ms", type=int, default=300)
    args = parser.parse_args()

    targets = _load_targets(Path(args.targets))
    failed_rows = _read_failed_rows(Path(args.failures_csv))
    failed_ids = {(r["family"], r["id"]) for r in failed_rows}

    cache_dir = Path(args.cache_dir).resolve() if args.cache_dir else None
    retries: dict[str, list[dict[str, Any]]] = {"plates": [], "foams": []}
    failures: list[dict[str, Any]] = []

    all_targets: list[tuple[str, dict[str, str]]] = []
    for fam in ("plates", "foams"):
        for row in targets[fam]:
            if (fam, row["id"]) in failed_ids:
                all_targets.append((fam, row))

    for idx, (fam, row) in enumerate(all_targets):
        sid = row["id"]
        url = row["url"]
        name = row["name"]
        try:
            html_doc = _retry_fetch_html(
                url,
                timeout_s=max(0.1, args.timeout_s),
                max_retries=max(0, args.max_retries),
                retry_backoff_ms=max(0, args.retry_backoff_ms),
            )
            if cache_dir is not None:
                cache_path = cache_dir / fam / f"{sid}.html"
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_text(html_doc, encoding="utf-8")
            parser_fn = _pick_parser(fam)
            meta = parser_fn(html_doc, fallback_name=name)
            merged_row: dict[str, Any] = {"id": sid, "url": url}
            merged_row.update(meta)
            retries[fam].append(merged_row)
            if not meta:
                failures.append(
                    {
                        "family": fam,
                        "id": sid,
                        "url": url,
                        "stage": "parse",
                        "error": "no extractable compatibility fields found",
                    },
                )
        except Exception as exc:  # noqa: BLE001
            failures.append({"family": fam, "id": sid, "url": url, "stage": "retry", "error": str(exc)})
        if idx < len(all_targets) - 1 and args.sleep_ms > 0:
            time.sleep(args.sleep_ms / 1000.0)

    existing_payload: dict[str, Any] = {"plates": [], "foams": []}
    if args.existing_specs:
        payload = json.loads(Path(args.existing_specs).read_text(encoding="utf-8"))
        for fam in ("plates", "foams"):
            rows = payload.get(fam)
            if isinstance(rows, list):
                existing_payload[fam] = [r for r in rows if isinstance(r, dict)]

    out_payload = {
        "plates": _merge_rows(existing_payload["plates"], retries["plates"]),
        "foams": _merge_rows(existing_payload["foams"], retries["foams"]),
    }

    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    failures_json = out_path.with_name(f"{out_path.stem}.retry.failures.json")
    failures_csv = out_path.with_name(f"{out_path.stem}.retry.failures.csv")
    _write_failures_json(failures_json, failures)
    _write_failures_csv(failures_csv, failures)

    print(f"retry targets: {len(all_targets)}")
    print(f"retried success rows: {len(retries['plates']) + len(retries['foams'])}")
    print(f"wrote: {out_path} (plates={len(out_payload['plates'])}, foams={len(out_payload['foams'])})")
    print(f"wrote: {failures_json} ({len(failures)} failures)")
    print(f"wrote: {failures_csv} ({len(failures)} failures)")


if __name__ == "__main__":
    main()

