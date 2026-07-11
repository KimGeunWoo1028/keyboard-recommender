"""Aggregate compatibility penalties with intent gating (soft, capped)."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.compatibility import rules as compat_rules
from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit, PenaltyLine
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.recommendation_quality.intent.explicit_intent import ExplicitBuildIntent
from keyboard_recommender.trait_engine.models import KeyboardPart


def compatibility_intent_multiplier(intent: ExplicitBuildIntent) -> float:
    """
    Return a multiplier in [0, 1] applied to *raw* penalty totals.

    When users explicitly prefer extremes, multiplier → 0 (penalties fade, not inverted).
    """
    # If we have no confidence in intent signals, do not scale penalties down.
    if intent.confidence <= 0.0:
        return 1.0
    m = 1.0 - (intent.extremes_preferred * intent.confidence)
    return max(0.0, min(1.0, m))


def evaluate_build_compatibility(
    switch: KeyboardPart,
    plate: KeyboardPart,
    foam: KeyboardPart,
    layout: KeyboardPart,
    case: KeyboardPart,
    keycap: KeyboardPart,
    intent: ExplicitBuildIntent,
    cfg: QualityConfig,
) -> BuildCompatibilityAudit:
    """Run all registered rules and return per-line + capped effective total."""
    mult = compatibility_intent_multiplier(intent)
    raw_entries: list[tuple[str, float, str, str, str]] = []
    raw_total = 0.0

    for outcome in compat_rules.iter_rule_penalties(switch, plate, foam, layout, case, keycap, cfg):
        if outcome.severity == "warning":
            raw_entries.append((outcome.rule_id, 0.0, outcome.message, outcome.severity, outcome.category))
            continue
        if outcome.raw_penalty <= 0.0:
            continue
        raw_entries.append((outcome.rule_id, outcome.raw_penalty, outcome.message, outcome.severity, outcome.category))
        raw_total += outcome.raw_penalty

    raw_total = max(0.0, raw_total)
    eff_uncapped = raw_total * mult
    eff_total = min(cfg.max_effective_penalty, eff_uncapped)

    lines: list[PenaltyLine] = []
    hard_count = sum(1 for _id, _raw, _msg, sev, _cat in raw_entries if sev == "hard_incompatibility")
    warning_count = sum(1 for _id, _raw, _msg, sev, _cat in raw_entries if sev == "warning")
    soft_count = sum(1 for _id, _raw, _msg, sev, _cat in raw_entries if sev == "soft_penalty")
    summary_lines: list[str] = []
    if hard_count > 0:
        summary_lines.append(f"{hard_count} physically incompatible combination(s) were detected.")
    if soft_count > 0:
        summary_lines.append(f"{soft_count} soft compatibility penalty rule(s) were applied.")
    if warning_count > 0:
        summary_lines.append(f"{warning_count} uncommon-but-valid warning(s) were flagged.")

    if raw_total <= 1e-12:
        for rule_id, _raw, msg, sev, cat in raw_entries:
            if sev != "warning":
                continue
            lines.append(
                PenaltyLine(
                    rule_id=rule_id,
                    raw_penalty=0.0,
                    effective_penalty=0.0,
                    message=msg,
                    severity=sev,
                    state="warning",
                    category=cat,
                ),
            )
        return BuildCompatibilityAudit(
            lines=tuple(lines),
            intent_multiplier=mult,
            raw_penalty_total=0.0,
            effective_penalty_total=0.0,
            has_hard_incompatibility=hard_count > 0,
            hard_incompatibility_count=hard_count,
            soft_penalty_count=soft_count,
            warning_count=warning_count,
            summary_lines=tuple(summary_lines),
        )

    # Partition capped effective penalty across non-warning rules by raw share (stable, sums exactly).
    for rule_id, raw, msg, sev, cat in raw_entries:
        if sev == "warning":
            lines.append(
                PenaltyLine(
                    rule_id=rule_id,
                    raw_penalty=0.0,
                    effective_penalty=0.0,
                    message=msg,
                    severity=sev,
                    state="warning",
                    category=cat,
                ),
            )
            continue
        share = raw / raw_total
        eff = share * eff_total
        lines.append(
            PenaltyLine(
                rule_id=rule_id,
                raw_penalty=raw,
                effective_penalty=round(eff, 6),
                message=msg,
                severity=sev,
                state="hard" if sev == "hard_incompatibility" else "soft",
                category=cat,
            ),
        )

    return BuildCompatibilityAudit(
        lines=tuple(lines),
        intent_multiplier=mult,
        raw_penalty_total=round(raw_total, 6),
        effective_penalty_total=round(eff_total, 6),
        has_hard_incompatibility=hard_count > 0,
        hard_incompatibility_count=hard_count,
        soft_penalty_count=soft_count,
        warning_count=warning_count,
        summary_lines=tuple(summary_lines),
    )
