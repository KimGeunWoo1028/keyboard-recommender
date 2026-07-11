"""Classify cleaned Swagkey inventory items into recommender families."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.swagkey_inventory import InventoryItem

CLASSIFIER_SCHEMA_VERSION = "1.0.0"

RecommenderFamily = Literal["switch", "plate", "foam", "layout", "case_kit", "keycap", "out_of_scope"]

RECOMMENDER_FAMILY_ORDER: tuple[RecommenderFamily, ...] = (
    "switch",
    "plate",
    "foam",
    "layout",
    "case_kit",
    "keycap",
    "out_of_scope",
)

_WS_RE = re.compile(r"\s+")


@dataclass(frozen=True, slots=True)
class ClassificationResult:
    family: RecommenderFamily
    rule_id: str
    matched_keywords: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ClassifiedInventoryItem:
    id: str
    category: str
    brand: str
    product_name: str
    normalized_name: str
    family: RecommenderFamily
    rule_id: str
    matched_keywords: tuple[str, ...]


@dataclass
class ClassificationReport:
    schema_version: str = CLASSIFIER_SCHEMA_VERSION
    source_inventory: str = ""
    generated_at: str = ""
    total_items: int = 0
    by_family: dict[str, int] = field(default_factory=dict)
    by_rule: dict[str, int] = field(default_factory=dict)
    summary_lines: list[str] = field(default_factory=list)


def _fold(text: str) -> str:
    return _WS_RE.sub(" ", (text or "").strip()).casefold()


def _contains_any(text: str, keywords: tuple[str, ...]) -> tuple[str, ...]:
    matched = tuple(kw for kw in keywords if kw.casefold() in text)
    return matched


@dataclass(frozen=True, slots=True)
class _Rule:
    family: RecommenderFamily
    rule_id: str
    keywords: tuple[str, ...] = ()
    categories: frozenset[str] = frozenset()
    exclude_keywords: tuple[str, ...] = ()
    match_category_only: bool = False


# Order matters: first matching rule wins.
_CLASSIFICATION_RULES: tuple[_Rule, ...] = (
    _Rule("keycap", "category:keycaps", categories=frozenset({"Keycaps"}), match_category_only=True),
    _Rule("out_of_scope", "category:deskpads", categories=frozenset({"Deskpads"}), match_category_only=True),
    # Switches category before accessory keywords (e.g. 공장윤활 must not match 윤활).
    _Rule("switch", "category:switches", categories=frozenset({"Switches"}), match_category_only=True),
    _Rule(
        "out_of_scope",
        "keyword:accessory_or_merch",
        keywords=(
            "키캡",
            "keycap",
            "장패드",
            "데스크매트",
            "deskmat",
            "mousepad",
            "마우스패드",
            "마우스",
            "mouse",
            "윤활",
            "krytox",
            "superlube",
            "lubricant",
            "스테빌",
            "stabilizer",
            "스프링",
            "spring",
            "케이블",
            "cable",
            "어댑터",
            "adapter",
            "풀러",
            "puller",
            "오프너",
            "핀셋",
            "드라이버",
            "붓",
            "brush",
            "키링",
            "keyring",
            "가방",
            "bag",
            "dustcover",
            "덮개",
            "굿즈",
            "phone case",
            "빌드 서비스",
            "테스터",
            "tester",
            "스티커",
            "sticker",
            "네임택",
            "name tag",
            "nameplate",
            "트레이",
            "tray",
            "그립테이프",
            "grip tape",
            "무게추",
            "weight",
            "iphone",
            "스탠드",
            "stand",
            "접착식",
            "spacer",
            "스페이서",
            "라이저",
            "riser",
            "교정기",
            "주입기",
            "슬라이더",
            "slider",
            "픽커",
            "picker",
            "체크베이지",
        ),
        exclude_keywords=("공장윤활", "factory lubed"),
    ),
    _Rule("plate", "keyword:plate", keywords=("보강판", " plate", "plate/", "plate kit")),
    _Rule(
        "foam",
        "keyword:foam",
        keywords=(
            "폼킷",
            "foam kit",
            "foam film",
            "폼 필름",
            "포론",
            "poron",
            "pe폼",
            "pe 폼",
            "흡음재",
            "dampening",
            "신슐레이터",
            "insulator",
            "eva",
        ),
        exclude_keywords=("마우스패드", "mousepad"),
    ),
    _Rule(
        "layout",
        "keyword:layout",
        keywords=("기판", "pcb", "레이아웃"),
        exclude_keywords=("키보드 스위치",),
    ),
    _Rule(
        "switch",
        "keyword:switch",
        keywords=(
            "스위치",
            "switch",
            "리니어",
            "linear",
            "택타일",
            "tactile",
            "클릭",
            "click",
            "저소음",
            "silent",
            "마그네틱",
            "magnetic",
            "자석축",
            "은축",
            "흑축",
            "적축",
            "갈축",
            "체리 mx",
            "cherry mx",
            " he 스위치",
            "he switch",
            "마그네틱 스위치",
            "magnetic switch",
        ),
        exclude_keywords=(
            "스위치 풀러",
            "switch puller",
            "스위치 폼",
            "switch foam",
            "스위치 스펙",
            "switch spec",
            "스위치 스프링",
            "switch spring",
            "스위치 오프너",
            "switch opener",
            "스위치 슬라이더",
            "switch slider",
            "스위치 프로그레시브",
            "스위치 사냥",
            "키보드",
            "keyboard",
            " kit",
            "he kit",
            "he+",
            "sonic he",
            "he버전",
        ),
    ),
    _Rule(
        "case_kit",
        "keyword:case_kit",
        keywords=(
            "베어본",
            "barebone",
            "bare bone",
            " b kit",
            "kit",
            "완제품",
            "기계식 키보드",
            "mechanical keyboard",
            "커스텀 키보드",
            "custom keyboard",
            "파츠",
            "parts",
            "하우징",
            "housing",
            "상판",
            "top case",
            "하부",
            "bottom",
            "베어 본",
            "keyboard r",
            "sonic he",
            "he kit",
            "he+",
        ),
        exclude_keywords=("기판", "보강판", "스위치", "키캡"),
    ),
    _Rule(
        "case_kit",
        "category:keyboards_fallback",
        categories=frozenset({"Keyboards"}),
        match_category_only=True,
        exclude_keywords=(
            "기판",
            "보강판",
            "pcb",
            " plate",
            "plate/",
            "plate kit",
            "폼킷",
            "foam kit",
            "스위치",
            "switch",
        ),
    ),
    _Rule(
        "out_of_scope",
        "category:gaming_fallback",
        categories=frozenset({"Gaming"}),
        match_category_only=True,
    ),
    _Rule(
        "out_of_scope",
        "category:accessories_fallback",
        categories=frozenset({"Accessories"}),
        match_category_only=True,
    ),
)


def _rule_matches(rule: _Rule, *, category: str, folded_name: str) -> tuple[str, ...] | None:
    if rule.categories and category not in rule.categories:
        return None
    if rule.match_category_only and not rule.categories:
        return None
    if rule.match_category_only and rule.categories and category in rule.categories and not rule.keywords:
        if rule.exclude_keywords and _contains_any(folded_name, rule.exclude_keywords):
            return None
        return ()
    if rule.keywords:
        matched = _contains_any(folded_name, rule.keywords)
        if not matched:
            return None
        if rule.exclude_keywords and _contains_any(folded_name, rule.exclude_keywords):
            return None
        return matched
    if rule.match_category_only and rule.categories and category in rule.categories:
        return ()
    return None


def classify_product_name(
    product_name: str,
    *,
    category: str = "",
) -> ClassificationResult:
    folded = _fold(product_name)
    for rule in _CLASSIFICATION_RULES:
        matched = _rule_matches(rule, category=category, folded_name=folded)
        if matched is not None:
            return ClassificationResult(
                family=rule.family,
                rule_id=rule.rule_id,
                matched_keywords=matched,
            )
    return ClassificationResult(family="out_of_scope", rule_id="fallback:unclassified")


def classify_inventory_item(item: InventoryItem) -> ClassifiedInventoryItem:
    result = classify_product_name(item.normalized_name, category=item.category)
    return ClassifiedInventoryItem(
        id=item.id,
        category=item.category,
        brand=item.brand,
        product_name=item.product_name,
        normalized_name=item.normalized_name,
        family=result.family,
        rule_id=result.rule_id,
        matched_keywords=result.matched_keywords,
    )


def load_inventory_items_from_json(path: Path) -> list[InventoryItem]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("items")
    if not isinstance(rows, list):
        msg = "inventory json: missing items array"
        raise ValueError(msg)
    items: list[InventoryItem] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        item_id = str(row.get("id") or "").strip()
        product_name = str(row.get("productName") or row.get("product_name") or "").strip()
        normalized = str(row.get("normalizedName") or row.get("normalized_name") or product_name).strip()
        if not item_id or not product_name:
            continue
        items.append(
            InventoryItem(
                id=item_id,
                category=str(row.get("category") or "").strip(),
                brand=str(row.get("brand") or "").strip(),
                product_name=product_name,
                normalized_name=normalized,
            ),
        )
    return items


def classify_inventory_items(items: list[InventoryItem]) -> tuple[list[ClassifiedInventoryItem], ClassificationReport]:
    classified = [classify_inventory_item(item) for item in items]
    report = ClassificationReport(total_items=len(classified))
    by_family: dict[str, int] = {}
    by_rule: dict[str, int] = {}
    for row in classified:
        by_family[row.family] = by_family.get(row.family, 0) + 1
        by_rule[row.rule_id] = by_rule.get(row.rule_id, 0) + 1
    report.by_family = by_family
    report.by_rule = by_rule
    report.summary_lines = build_classification_summary(report)
    return classified, report


def build_classification_summary(report: ClassificationReport) -> list[str]:
    lines = [f"total items: {report.total_items}", "by family:"]
    for family in RECOMMENDER_FAMILY_ORDER:
        if family in report.by_family:
            lines.append(f"  - {family}: {report.by_family[family]}")
    recommender_total = sum(report.by_family.get(f, 0) for f in RECOMMENDER_FAMILY_ORDER if f != "out_of_scope")
    lines.append(f"recommender candidates (excl. out_of_scope): {recommender_total}")
    return lines


def build_candidates_payload(
    classified: list[ClassifiedInventoryItem],
    *,
    source_inventory: str,
    report: ClassificationReport,
) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = {family: [] for family in RECOMMENDER_FAMILY_ORDER}
    for row in classified:
        grouped[row.family].append(
            {
                "id": row.id,
                "category": row.category,
                "brand": row.brand,
                "productName": row.product_name,
                "normalizedName": row.normalized_name,
                "family": row.family,
                "ruleId": row.rule_id,
                "matchedKeywords": list(row.matched_keywords),
            },
        )
    return {
        "schemaVersion": CLASSIFIER_SCHEMA_VERSION,
        "source": {
            "inventoryJson": Path(source_inventory).name,
            "inventoryPath": source_inventory.replace("\\", "/"),
            "generatedAt": report.generated_at or datetime.now(UTC).isoformat(),
        },
        "stats": {
            "totalItems": report.total_items,
            "byFamily": report.by_family,
            "byRule": report.by_rule,
            "recommenderCandidateCount": sum(
                report.by_family.get(f, 0) for f in RECOMMENDER_FAMILY_ORDER if f != "out_of_scope"
            ),
        },
        "candidates": grouped,
    }


def format_classification_report_text(report: ClassificationReport, classified: list[ClassifiedInventoryItem]) -> str:
    lines = ["Swagkey inventory classification report", "========================================", ""]
    lines.extend(report.summary_lines)
    if report.by_rule:
        lines.extend(["", "by rule:"])
        for rule_id, count in sorted(report.by_rule.items()):
            lines.append(f"  - {rule_id}: {count}")
    samples = [row for row in classified if row.family != "out_of_scope"][:15]
    if samples:
        lines.extend(["", "recommender sample (first 15):"])
        for row in samples:
            kw = ", ".join(row.matched_keywords) if row.matched_keywords else "-"
            lines.append(f"  [{row.family}] {row.product_name} ({row.rule_id}; {kw})")
    lines.append("")
    return "\n".join(lines)


def classify_inventory_json_file(
    inventory_path: Path,
    *,
    generated_at: datetime | None = None,
) -> tuple[list[ClassifiedInventoryItem], ClassificationReport, dict[str, Any]]:
    items = load_inventory_items_from_json(inventory_path)
    classified, report = classify_inventory_items(items)
    report.source_inventory = str(inventory_path).replace("\\", "/")
    report.generated_at = (generated_at or datetime.now(UTC)).isoformat()
    payload = build_candidates_payload(classified, source_inventory=report.source_inventory, report=report)
    return classified, report, payload


def write_classification_outputs(
    *,
    payload: dict[str, Any],
    report: ClassificationReport,
    classified: list[ClassifiedInventoryItem],
    out_json: Path,
    report_txt: Path,
) -> None:
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_txt.write_text(format_classification_report_text(report, classified), encoding="utf-8")
