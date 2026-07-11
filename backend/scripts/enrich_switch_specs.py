from __future__ import annotations

import argparse
import json
from pathlib import Path

from keyboard_recommender.catalog.spec_enrichment import merge_switch_specs_into_seed


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge scraped switch specs into swagkey seed metadata.")
    parser.add_argument("--seed", required=True, help="Path to swagkey_products.seed.json")
    parser.add_argument("--specs", required=True, help="Path to scraped switch specs JSON")
    parser.add_argument("--out", default="", help="Output path (default: overwrite --seed)")
    args = parser.parse_args()

    seed_path = Path(args.seed).resolve()
    specs_path = Path(args.specs).resolve()
    out_path = Path(args.out).resolve() if args.out else seed_path

    seed_payload = json.loads(seed_path.read_text(encoding="utf-8"))
    specs_payload = json.loads(specs_path.read_text(encoding="utf-8"))
    merged = merge_switch_specs_into_seed(seed_payload, specs_payload)
    out_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote: {out_path}")


if __name__ == "__main__":
    main()

