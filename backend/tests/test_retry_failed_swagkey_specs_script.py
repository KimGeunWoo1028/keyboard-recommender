from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_script_module():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "retry_failed_swagkey_specs.py"
    spec = importlib.util.spec_from_file_location("retry_failed_swagkey_specs_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_read_failed_ids(tmp_path: Path) -> None:
    mod = _load_script_module()
    p = tmp_path / "failures.csv"
    p.write_text("id,url,stage,error\nsw-linear-001,https://a,fetch,timeout\nsw-linear-002,https://b,parse,none\n", encoding="utf-8")
    out = mod._read_failed_ids(p)
    assert out == {"sw-linear-001", "sw-linear-002"}


def test_merge_specs_prefers_retry_rows() -> None:
    mod = _load_script_module()
    existing = [{"id": "sw-linear-001", "spring_weight_g": 40}, {"id": "sw-linear-002", "spring_weight_g": 45}]
    retry = [{"id": "sw-linear-001", "spring_weight_g": 48}]
    merged = mod._merge_specs(existing, retry)
    by_id = {r["id"]: r for r in merged}
    assert by_id["sw-linear-001"]["spring_weight_g"] == 48
    assert by_id["sw-linear-002"]["spring_weight_g"] == 45

