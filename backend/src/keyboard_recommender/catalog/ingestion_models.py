"""Catalog ingestion models and stage report envelopes."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

Family = Literal["switch", "plate", "foam", "layout", "case", "keycap"]
SourceType = Literal["vendor_pages", "structured_feeds", "manual_overrides"]


@dataclass(frozen=True, slots=True)
class SourceFileRef:
    source_type: SourceType
    path: str


@dataclass(frozen=True, slots=True)
class RawCatalogRecord:
    source_type: SourceType
    source_path: str
    family: Family
    item_id: str
    name: str
    subtype: str
    metadata: dict[str, Any]
    source_url: str = ""
    tags: tuple[str, ...] = ()
    aliases: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class NormalizedCatalogRecord:
    source_type: SourceType
    source_path: str
    family: Family
    item_id: str
    name: str
    subtype: str
    metadata: dict[str, Any]
    source_url: str = ""
    tags: tuple[str, ...] = ()
    aliases: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ValidationIssue:
    level: Literal["error", "warning"]
    code: str
    item_id: str
    family: Family | str
    message: str


@dataclass(frozen=True, slots=True)
class CatalogDiff:
    new_ids: tuple[str, ...]
    changed_ids: tuple[str, ...]
    removed_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class IngestionConfig:
    require_review: bool = True
    review_approved: bool = False
    apply_removals: bool = False


@dataclass(slots=True)
class IngestionReport:
    detected_sources: list[SourceFileRef] = field(default_factory=list)
    extracted_count: int = 0
    normalized_count: int = 0
    validation_errors: list[ValidationIssue] = field(default_factory=list)
    validation_warnings: list[ValidationIssue] = field(default_factory=list)
    diff: CatalogDiff = field(default_factory=lambda: CatalogDiff((), (), ()))
    published: bool = False
    review_required: bool = True
    summary_lines: list[str] = field(default_factory=list)

