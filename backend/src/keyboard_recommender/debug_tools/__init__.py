"""
Developer-only replay / trace / compare helpers.

Safe to import from scripts and tests; the HTTP app does not depend on this package.
"""

from keyboard_recommender.debug_tools.compare import compare_snapshot_files
from keyboard_recommender.debug_tools.io import extract_snapshot_dict, load_json_document, parse_survey_document
from keyboard_recommender.debug_tools.replay import (
    REPLAY_BUNDLE_SCHEMA_VERSION,
    run_replay_bundle,
)
from keyboard_recommender.debug_tools.trace import build_pipeline_trace

__all__ = [
    "REPLAY_BUNDLE_SCHEMA_VERSION",
    "build_pipeline_trace",
    "compare_snapshot_files",
    "extract_snapshot_dict",
    "load_json_document",
    "parse_survey_document",
    "run_replay_bundle",
]
