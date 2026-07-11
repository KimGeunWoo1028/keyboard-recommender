#!/usr/bin/env python3
"""Run spec scrape for new_in_crawl targets (switch + plate/foam)."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def _run(cmd: list[str]) -> int:
    print("$", " ".join(cmd))
    completed = subprocess.run(cmd, check=False)
    return int(completed.returncode)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    backend = Path(__file__).resolve().parents[1]
    default_dir = backend / "data" / "swagkey_inventory" / "new_in_crawl_targets"
    parser.add_argument(
        "--targets-dir",
        type=Path,
        default=default_dir,
        help="Directory containing new_in_crawl_*_targets.json",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=backend / "data" / "swagkey_inventory" / "new_in_crawl_specs",
        help="Directory for extracted spec JSON outputs",
    )
    args = parser.parse_args()

    targets_dir = args.targets_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    switch_targets = targets_dir / "new_in_crawl_switch_targets.json"
    compat_targets = targets_dir / "new_in_crawl_compat_targets.json"
    if not switch_targets.is_file() and not compat_targets.is_file():
        print("error: target files not found; run generate_new_in_crawl_spec_targets.py first", file=sys.stderr)
        return 1

    exit_code = 0
    if switch_targets.is_file():
        switch_out = out_dir / "new_in_crawl_switch_specs.json"
        switch_cache = out_dir / "switch_html_cache"
        code = _run(
            [
                sys.executable,
                str(backend / "scripts" / "extract_swagkey_specs.py"),
                "--targets",
                str(switch_targets),
                "--out",
                str(switch_out),
                "--cache-dir",
                str(switch_cache),
            ],
        )
        exit_code = exit_code or code

    if compat_targets.is_file():
        compat_out = out_dir / "new_in_crawl_compat_specs.json"
        compat_cache = out_dir / "compat_html_cache"
        code = _run(
            [
                sys.executable,
                str(backend / "scripts" / "extract_swagkey_compat_specs.py"),
                "--targets",
                str(compat_targets),
                "--out",
                str(compat_out),
                "--cache-dir",
                str(compat_cache),
            ],
        )
        exit_code = exit_code or code

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
