from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class OperationalThresholds:
    confidence_min_mean: float
    diversity_min_mean: float
    compatibility_min_mean: float
    reranking_max_mean: float


@dataclass(frozen=True, slots=True)
class OperationalSignalSummary:
    confidence_mean: float
    diversity_mean: float
    compatibility_mean: float
    reranking_mean: float
    samples: int


@dataclass(frozen=True, slots=True)
class OperationalThresholdResult:
    breached_confidence_drop: bool
    breached_diversity_collapse: bool
    breached_compatibility_instability: bool
    breached_reranking_distortion: bool
    summary: OperationalSignalSummary

    @property
    def breached_any(self) -> bool:
        return (
            self.breached_confidence_drop
            or self.breached_diversity_collapse
            or self.breached_compatibility_instability
            or self.breached_reranking_distortion
        )


def _mean(xs: list[float]) -> float:
    if not xs:
        return 0.0
    return float(sum(xs) / len(xs))


def evaluate_thresholds(
    *,
    confidence_values: list[float],
    diversity_values: list[float],
    compatibility_values: list[float],
    reranking_values: list[float],
    thresholds: OperationalThresholds,
) -> OperationalThresholdResult:
    c_mean = _mean(confidence_values)
    d_mean = _mean(diversity_values)
    k_mean = _mean(compatibility_values)
    r_mean = _mean(reranking_values)
    n = min(len(diversity_values), len(compatibility_values), len(reranking_values))
    return OperationalThresholdResult(
        breached_confidence_drop=bool(confidence_values) and c_mean < thresholds.confidence_min_mean,
        breached_diversity_collapse=bool(diversity_values) and d_mean < thresholds.diversity_min_mean,
        breached_compatibility_instability=bool(compatibility_values) and k_mean < thresholds.compatibility_min_mean,
        breached_reranking_distortion=bool(reranking_values) and r_mean > thresholds.reranking_max_mean,
        summary=OperationalSignalSummary(
            confidence_mean=round(c_mean, 6),
            diversity_mean=round(d_mean, 6),
            compatibility_mean=round(k_mean, 6),
            reranking_mean=round(r_mean, 6),
            samples=n,
        ),
    )
