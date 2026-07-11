from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_script_module():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "retry_failed_swagkey_compat_specs.py"
    spec = importlib.util.spec_from_file_location("retry_failed_swagkey_compat_specs_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_read_failed_rows_filters_to_plate_foam(tmp_path: Path) -> None:
    mod = _load_script_module()
    p = tmp_path / "failures.csv"
    p.write_text(
        "family,id,url,stage,error\n"
        "plates,plate-001,https://a,fetch,timeout\n"
        "foams,foam-001,https://b,parse,none\n"
        "switches,sw-001,https://c,fetch,timeout\n",
        encoding="utf-8",
    )
    rows = mod._read_failed_rows(p)
    assert rows == [{"family": "plates", "id": "plate-001"}, {"family": "foams", "id": "foam-001"}]


def test_merge_rows_prefers_retry_values() -> None:
    mod = _load_script_module()
    existing = [{"id": "plate-001", "material": "FR4"}, {"id": "plate-002", "material": "POM"}]
    retry = [{"id": "plate-001", "material": "Aluminum"}]
    merged = mod._merge_rows(existing, retry)
    by_id = {r["id"]: r for r in merged}
    assert by_id["plate-001"]["material"] == "Aluminum"
    assert by_id["plate-002"]["material"] == "POM"

