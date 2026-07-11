"""Normalize ``eval_events`` payloads into countable interaction signals."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from keyboard_recommender.recommendation_quality.signal_processor.collection_hints import (
    merge_trait_hint_maps,
    trait_hints_from_collection_label,
)
from keyboard_recommender.recommendation_quality.signal_processor.rules import (
    extract_comparison_item_ids,
    extract_domain_and_item,
    extract_family,
    is_negative_feedback,
)


@dataclass
class RawInteractionSignals:
    """Counters used by the weighting engine (MVP — all explainable)."""

    part_clicks: dict[str, float] = field(default_factory=dict)
    part_saves: dict[str, float] = field(default_factory=dict)
    part_dislikes: dict[str, float] = field(default_factory=dict)
    comparison_pairs: float = 0.0
    family_clicks: dict[str, float] = field(default_factory=dict)
    trait_hints: dict[str, float] = field(default_factory=dict)
    refinement_events: float = 0.0
    acceptance_events: float = 0.0
    rejection_events: float = 0.0
    revisit_events: float = 0.0
    repeated_view_events: float = 0.0
    collection_tag_events: float = 0.0
    weighted_mass: float = 0.0
    signal_mix: dict[str, float] = field(default_factory=dict)


def recent_interaction_payloads(
    rows: Sequence[tuple[str, Mapping[str, Any]]],
    *,
    scenario_id: str | None,
) -> list[Mapping[str, Any]]:
    """Keep payloads that belong to ``scenario_id`` (or all rows if ``scenario_id`` is None)."""
    out: list[Mapping[str, Any]] = []
    for etype, payload in rows:
        p = dict(payload)
        p.setdefault("event_type", etype)
        row_scenario = p.get("scenario_id")
        meta = p.get("metadata") if isinstance(p.get("metadata"), dict) else {}
        meta_scenario = meta.get("scenarioId") or meta.get("scenario_id")
        effective = row_scenario or meta_scenario
        if scenario_id is None or str(effective or "") == scenario_id:
            out.append(p)
    return out


def _bump_mix(sig: RawInteractionSignals, et: str, w: float) -> None:
    if w <= 0:
        return
    sig.signal_mix[et] = sig.signal_mix.get(et, 0.0) + w


def _meta_trait_hints(meta: Mapping[str, Any]) -> dict[str, float]:
    raw = meta.get("traitHints") or meta.get("trait_hints")
    if not isinstance(raw, dict):
        return {}
    out: dict[str, float] = {}
    for k, v in raw.items():
        key = str(k).strip()
        if not key:
            continue
        try:
            out[key] = float(v)
        except (TypeError, ValueError):
            continue
    return out


def aggregate_interaction_rows(
    payloads: Sequence[Mapping[str, Any]],
    *,
    temporal_decay_per_step: float = 1.0,
) -> RawInteractionSignals:
    """
    Weight recent events higher: index ``i`` (0 = newest) uses ``temporal_decay_per_step ** i``.
    """
    sig = RawInteractionSignals()
    decay = float(temporal_decay_per_step)
    if decay <= 0.0:
        decay = 1.0

    for idx, p in enumerate(payloads):
        w = decay**idx
        sig.weighted_mass += w
        et = str(p.get("event_type") or "")
        _bump_mix(sig, et, w)
        meta = p.get("metadata") if isinstance(p.get("metadata"), dict) else {}

        _domain, item_id = extract_domain_and_item(meta)
        fam = extract_family(meta)

        if et == "interaction.click" and item_id:
            sig.part_clicks[item_id] = sig.part_clicks.get(item_id, 0.0) + w
            if fam:
                sig.family_clicks[fam] = sig.family_clicks.get(fam, 0.0) + w
        elif et == "interaction.bookmark" and item_id:
            sig.part_saves[item_id] = sig.part_saves.get(item_id, 0.0) + w
        elif et == "interaction.comparison":
            sig.comparison_pairs += w
            a, b = extract_comparison_item_ids(meta)
            for x in (a, b):
                if x:
                    sig.part_clicks[x] = sig.part_clicks.get(x, 0.0) + 0.5 * w
        elif et == "interaction.feedback" and is_negative_feedback(meta) and item_id:
            sig.part_dislikes[item_id] = sig.part_dislikes.get(item_id, 0.0) + w
        elif et == "interaction.refinement":
            sig.refinement_events += w
            merge_trait_hint_maps(sig.trait_hints, _meta_trait_hints(meta), scale=w * 0.5)
        elif et == "interaction.acceptance" and item_id:
            sig.part_saves[item_id] = sig.part_saves.get(item_id, 0.0) + w
            sig.acceptance_events += w
            merge_trait_hint_maps(sig.trait_hints, _meta_trait_hints(meta), scale=w)
        elif et == "interaction.rejection" and item_id:
            sig.part_dislikes[item_id] = sig.part_dislikes.get(item_id, 0.0) + w
            sig.rejection_events += w
        elif et == "interaction.revisit":
            sig.revisit_events += w
            merge_trait_hint_maps(sig.trait_hints, _meta_trait_hints(meta), scale=w)
        elif et == "interaction.repeated_view" and item_id:
            sig.repeated_view_events += w
            sig.part_clicks[item_id] = sig.part_clicks.get(item_id, 0.0) + w * 0.45
        elif et == "interaction.collection_tag":
            label = meta.get("collection") or meta.get("label") or meta.get("collectionLabel")
            if isinstance(label, str) and label.strip():
                merge_trait_hint_maps(sig.trait_hints, trait_hints_from_collection_label(label), scale=w)
                sig.collection_tag_events += w
    return sig
