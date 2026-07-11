"""
Diversity reranking + audit types.

`rerank_family_lists` is loaded lazily so importing `diversity.config` (or any
lightweight submodule) does not pull the full trait-engine / compatibility graph
during package initialization — avoiding circular imports with `QualityConfig`.
"""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.diversity.types import DiversityFamilyAudit, DiversityRerankAudit

__all__ = [
    "DiversityFamilyAudit",
    "DiversityRerankAudit",
    "rerank_family_lists",
]


def __getattr__(name: str):
    if name == "rerank_family_lists":
        from keyboard_recommender.recommendation_quality.diversity.rerank import rerank_family_lists

        return rerank_family_lists
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
