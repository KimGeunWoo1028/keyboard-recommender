"""Structured, human-readable pipeline traces (no second engine pass)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from keyboard_recommender.recommendation_quality.evaluation.benchmarking import (
    fallback_recovery_effectiveness,
    reranking_impact_analysis,
)


def _lines_from_nl(payload: Mapping[str, Any]) -> list[str]:
    nl = payload.get("nlPreferenceAnalysis")
    if not isinstance(nl, dict):
        return ["natural_language: no analysis block."]
    if not nl.get("applied"):
        return ["natural_language: not applied (empty or whitespace input)."]
    n_terms = len(nl.get("matchedTermIds") or [])
    pc = float(nl.get("parsingConfidence") or 0.0)
    lines = [
        f"natural_language: applied, matched {n_terms} term(s), parsing_confidence={pc:.3f}.",
        f"normalized: {nl.get('normalizedText', '')!r}"[:200],
    ]
    unk = nl.get("unknownTokens") or []
    if unk:
        lines.append(f"unknown_tokens: {list(unk)[:12]!r}")
    return lines


def _lines_trait_winners(snapshot: Mapping[str, Any]) -> list[str]:
    sel = snapshot.get("selected")
    if not isinstance(sel, dict):
        return ["trait_matching: missing selected block."]
    lines: list[str] = []
    for domain in ("switch", "plate", "foam", "layout"):
        row = sel.get(domain)
        if not isinstance(row, dict):
            continue
        iid = row.get("itemId")
        raw_c = row.get("rawCosine")
        score = row.get("score")
        lines.append(f"{domain}: pick={iid!r} raw_cosine={raw_c} blended_score={score}")
    return lines or ["trait_matching: no winner rows."]


def _lines_final_api(payload: Mapping[str, Any]) -> list[str]:
    recs = payload.get("recommendations")
    if not isinstance(recs, list):
        return ["final: no recommendations list."]
    out: list[str] = []
    for r in recs:
        if not isinstance(r, dict):
            continue
        dom = r.get("domain")
        iid = r.get("itemId")
        conf = r.get("confidence")
        out.append(f"final_pick: domain={dom!r} itemId={iid!r} confidence={conf}")
    eng = payload.get("build", {}).get("engineScores") if isinstance(payload.get("build"), dict) else {}
    if isinstance(eng, dict) and eng:
        out.append(
            "engine_scores: "
            f"switch={eng.get('switchScore')} plate={eng.get('plateScore')} "
            f"foam={eng.get('foamScore')} layout={eng.get('layoutScore')}",
        )
    return out


def build_pipeline_trace(
    *,
    payload: Mapping[str, Any],
    snapshot: Mapping[str, Any],
    diagnostics: Mapping[str, Any],
) -> dict[str, Any]:
    """
    Five-stage trace: NL blend → cosine winners → compatibility → diversity → fallback → final.

    Uses the same audit blocks as the live API for interpretability.
    """
    rerank = reranking_impact_analysis(snapshot)
    fb = fallback_recovery_effectiveness(snapshot)
    ca = snapshot.get("compatibilityAudit")
    compat_lines: list[str]
    if isinstance(ca, dict):
        eff = float(ca.get("effectivePenaltyTotal", 0.0))
        raw = float(ca.get("rawPenaltyTotal", 0.0))
        n_rules = len(ca.get("lines") or [])
        compat_lines = [
            f"compatibility: effective_penalty={eff:.4f} raw_penalty={raw:.4f} rules={n_rules}.",
        ]
        for ln in (ca.get("lines") or [])[:12]:
            if isinstance(ln, dict):
                compat_lines.append(
                    f"  - {ln.get('ruleId')}: eff={ln.get('effectivePenalty')} — {ln.get('message', '')}"[:240],
                )
    else:
        compat_lines = ["compatibility: no audit (none triggered)."]

    stages: list[dict[str, Any]] = [
        {
            "id": "inputs",
            "title": "Survey answers",
            "summaryLines": [f"keys: {sorted((payload.get('answers') or {}).keys())!r}"],
            "data": {"answers": payload.get("answers")},
        },
        {
            "id": "natural_language",
            "title": "NLP preference blend",
            "summaryLines": _lines_from_nl(payload),
            "data": payload.get("nlPreferenceAnalysis"),
        },
        {
            "id": "trait_similarity",
            "title": "Weighted cosine winners (per domain)",
            "summaryLines": _lines_trait_winners(snapshot),
            "data": {"selected": snapshot.get("selected")},
        },
        {
            "id": "compatibility_penalties",
            "title": "Soft compatibility adjustments",
            "summaryLines": compat_lines,
            "data": snapshot.get("compatibilityAudit"),
        },
        {
            "id": "diversity_reranking",
            "title": "Diversity rerank (alternate slots)",
            "summaryLines": list(rerank.get("summaryLines") or []),
            "data": {"rerankingImpact": rerank, "diversityAudit": snapshot.get("diversityAudit")},
        },
        {
            "id": "fallback_recovery",
            "title": "Fallback recovery",
            "summaryLines": list(fb.get("summaryLines") or []),
            "data": {"fallbackEffectiveness": fb, "fallbackAudit": snapshot.get("fallbackAudit")},
        },
        {
            "id": "final_selection",
            "title": "API recommendations + confidence",
            "summaryLines": _lines_final_api(payload)
            + [ln for ln in (diagnostics.get("summaryLines") or [])[:3] if isinstance(ln, str)],
            "data": {
                "recommendationConfidence": snapshot.get("recommendationConfidence"),
                "diagnosticSummary": diagnostics.get("summaryLines"),
            },
        },
    ]

    flat_lines: list[str] = []
    for s in stages:
        flat_lines.append(f"=== {s['id']} :: {s['title']} ===")
        flat_lines.extend(str(x) for x in s.get("summaryLines") or [])

    return {
        "schemaVersion": "debug.pipeline_trace.v1",
        "stages": stages,
        "flatSummaryLines": flat_lines,
        "penaltyTrace": diagnostics.get("penaltyTrace"),
        "rerankTrace": diagnostics.get("rerankTrace"),
    }
