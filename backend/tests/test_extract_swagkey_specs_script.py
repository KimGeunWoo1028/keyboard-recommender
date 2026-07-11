from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_script_module():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "extract_swagkey_specs.py"
    spec = importlib.util.spec_from_file_location("extract_swagkey_specs_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_retry_fetch_html_retries_then_succeeds(monkeypatch) -> None:
    mod = _load_script_module()
    calls = {"count": 0}

    def fake_fetch(url: str, *, timeout_s: float):  # noqa: ARG001
        calls["count"] += 1
        if calls["count"] < 2:
            raise TimeoutError("timeout")
        return "<html>ok</html>"

    monkeypatch.setattr(mod, "fetch_html", fake_fetch)
    html = mod._retry_fetch_html("https://example.com", timeout_s=1.0, max_retries=2, retry_backoff_ms=0)
    assert "ok" in html
    assert calls["count"] == 2


def test_write_failures_reports(tmp_path: Path) -> None:
    mod = _load_script_module()
    failures = [{"id": "sw-linear-001", "url": "https://a", "stage": "fetch", "error": "timeout"}]
    json_path = tmp_path / "failures.json"
    csv_path = tmp_path / "failures.csv"
    mod._write_failures_json(json_path, failures)
    mod._write_failures_csv(csv_path, failures)
    assert json_path.exists()
    assert csv_path.exists()
    assert "timeout" in json_path.read_text(encoding="utf-8")
    assert "fetch" in csv_path.read_text(encoding="utf-8")

