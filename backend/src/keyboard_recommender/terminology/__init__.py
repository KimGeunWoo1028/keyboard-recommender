"""
Community keyboard terminology → structured internal trait axes.

Public entry points for other packages:

* `interpret_community_text` — token match + weighted merge + conflict report
* `merge_with_survey_traits` — blend NL interpretation with survey rule vector
* `default_dictionary` / `COMMUNITY_TERMS` — curated lexicon
* `validate_dictionary` — CI-safe checks against `trait_engine.axes.TRAIT_AXIS_IDS`
"""

from keyboard_recommender.terminology.dictionary import COMMUNITY_TERMS, default_dictionary
from keyboard_recommender.terminology.engine import interpret_community_text, merge_with_survey_traits
from keyboard_recommender.terminology.models import (
    CommunityTermDefinition,
    InterpretOptions,
    InterpretationResult,
    TraitConflict,
    TraitContribution,
    TermMatch,
)
from keyboard_recommender.terminology.validation import validate_dictionary, validate_term_definition

__all__ = (
    "COMMUNITY_TERMS",
    "CommunityTermDefinition",
    "InterpretOptions",
    "InterpretationResult",
    "TraitConflict",
    "TraitContribution",
    "TermMatch",
    "default_dictionary",
    "interpret_community_text",
    "merge_with_survey_traits",
    "validate_dictionary",
    "validate_term_definition",
)
