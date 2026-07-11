"""
Catalog layer: **authoring traits** (L/M/H) → numeric → engine vector projection.

* Dictionary & allowlists: `catalog.trait_dictionary`
* Tier parsing: `catalog.normalize`
* Engine bridge: `catalog.projection`
* Validation / duplicate helpers: `catalog.validation`
* Import DTOs: `catalog.import_models`
"""

from keyboard_recommender.catalog.import_models import CatalogComponentImport, TraitTierRow
from keyboard_recommender.catalog.metadata_models import FoamMetadata, LayoutMetadata, PlateMetadata, SwitchMetadata
from keyboard_recommender.catalog.normalize import TraitTier, parse_tier, sparse_tiers_to_scores, tier_to_score
from keyboard_recommender.catalog.projection import merge_survey_vector_with_catalog_hint, project_catalog_to_engine_vector
from keyboard_recommender.catalog.trait_dictionary import CATALOG_TRAIT_IDS, FAMILY_TRAIT_ALLOWLIST, TRAIT_DICTIONARY
from keyboard_recommender.catalog.validation import find_duplicate_slugs, normalize_component_slug, validate_family_traits

__all__ = (
    "CATALOG_TRAIT_IDS",
    "TRAIT_DICTIONARY",
    "FAMILY_TRAIT_ALLOWLIST",
    "CatalogComponentImport",
    "FoamMetadata",
    "TraitTier",
    "TraitTierRow",
    "LayoutMetadata",
    "PlateMetadata",
    "SwitchMetadata",
    "find_duplicate_slugs",
    "merge_survey_vector_with_catalog_hint",
    "normalize_component_slug",
    "parse_tier",
    "project_catalog_to_engine_vector",
    "sparse_tiers_to_scores",
    "tier_to_score",
    "validate_family_traits",
)
