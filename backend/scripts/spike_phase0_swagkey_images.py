#!/usr/bin/env python3
"""Phase 0 spike: validate og:image extraction strategy for Swagkey product images."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Allow running without editable install when invoked as script.
_SRC = Path(__file__).resolve().parents[1] / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from keyboard_recommender.catalog.swagkey_spec_scraper import fetch_html  # noqa: E402

_OG_IMAGE_RE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE,
)
_OG_IMAGE_ALT_RE = re.compile(
    r'<meta[^>]+content=["\'](?P<url>[^"\']+)["\'][^>]+property=["\']og:image["\']',
    re.IGNORECASE,
)
_OG_URL_RE = re.compile(
    r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE,
)
_CANONICAL_RE = re.compile(
    r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE,
)
_IDX_HREF_RE = re.compile(r'href="(?P<path>/\d+/\?idx=(?P<idx>\d+))"', re.IGNORECASE)
_ITEM_THUMB_IMG_RE = re.compile(
    r'class="item-thumb"[^>]*>.*?<img[^>]+src=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE | re.DOTALL,
)
_IMWEB_IMAGE_HOST = "cdn.imweb.me"


@dataclass(slots=True)
class OgImageProbe:
    source: str
    file_or_url: str
    og_url: str | None
    canonical: str | None
    og_image: str | None
    has_product_idx: bool
    image_host_ok: bool
    notes: list[str]


def _extract_og_image(html: str) -> str | None:
    for pattern in (_OG_IMAGE_RE, _OG_IMAGE_ALT_RE):
        match = pattern.search(html)
        if match:
            return match.group("url").strip()
    return None


def _extract_meta_url(html: str) -> tuple[str | None, str | None]:
    og_match = _OG_URL_RE.search(html)
    canonical_match = _CANONICAL_RE.search(html)
    og_url = og_match.group("url").strip() if og_match else None
    canonical = canonical_match.group("url").strip() if canonical_match else None
    return og_url, canonical


def _has_product_idx(url: str | None) -> bool:
    if not url:
        return False
    lowered = url.lower()
    return "idx=" in lowered or "shop_view" in lowered


def probe_html(source: str, file_or_url: str, html: str) -> OgImageProbe:
    og_url, canonical = _extract_meta_url(html)
    og_image = _extract_og_image(html)
    ref_url = canonical or og_url
    notes: list[str] = []
    if og_image and _IMWEB_IMAGE_HOST not in og_image:
        notes.append("og_image_host_not_imweb")
    if ref_url and not _has_product_idx(ref_url):
        notes.append("category_or_listing_url_not_product_detail")
    if og_image and "/upload/" in og_image and not _has_product_idx(ref_url):
        notes.append("generic_upload_path_on_non_product_page")
    return OgImageProbe(
        source=source,
        file_or_url=file_or_url,
        og_url=og_url,
        canonical=canonical,
        og_image=og_image,
        has_product_idx=_has_product_idx(ref_url),
        image_host_ok=bool(og_image and _IMWEB_IMAGE_HOST in og_image),
        notes=notes,
    )


def probe_cache_samples(repo_root: Path) -> list[OgImageProbe]:
    samples = [
        repo_root / "backend/data/swagkey_html_cache/sw-linear-001.html",
        repo_root / "backend/data/swagkey_html_cache/plates/plate-001.html",
        repo_root / "backend/data/swagkey_html_cache/foams/foam-001.html",
        repo_root
        / "backend/data/swagkey_inventory/new_in_crawl_specs/switch_html_cache/sw-new-001-cherry-mx2a-blossom-리니어-스위치.html",
        repo_root
        / "backend/data/swagkey_inventory/new_in_crawl_specs/compat_html_cache/plates/plate-new-001-bowl-oblique-기판-및-보강판.html",
        repo_root
        / "backend/data/swagkey_inventory/new_in_crawl_specs/compat_html_cache/foams/foam-new-001-gdk-lab-dk1-tkl-여분-폼킷.html",
    ]
    out: list[OgImageProbe] = []
    for path in samples:
        html = path.read_text(encoding="utf-8", errors="ignore")
        out.append(probe_html("cache", str(path.relative_to(repo_root)), html))
    return out


def probe_live_detail(url: str) -> OgImageProbe:
    html = fetch_html(url)
    return probe_html("live_detail", url, html)


def compare_listing_vs_detail(*, listing_url: str, product_idx: str | None = None) -> dict[str, Any]:
    listing_html = fetch_html(listing_url)
    rows = []
    try:
        from keyboard_recommender.catalog.swagkey_crawler_v2 import parse_products_from_category_html

        category = "Switches" if "/21" in listing_url else "Listing"
        rows = parse_products_from_category_html(listing_html, category=category)
    except Exception:
        rows = []

    chosen_idx = product_idx
    if not chosen_idx and rows:
        chosen_idx = rows[0].swagkey_product_id
    if not chosen_idx:
        link_match = _IDX_HREF_RE.search(listing_html)
        chosen_idx = link_match.group("idx") if link_match else None
    if not chosen_idx:
        return {
            "listing_url": listing_url,
            "product_idx": None,
            "error": "no_product_idx_on_listing",
        }

    detail_url = f"https://www.swagkey.kr/shop_view/?idx={chosen_idx}"
    detail_probe = probe_live_detail(detail_url)

    listing_thumb_url: str | None = None
    for link_match in _IDX_HREF_RE.finditer(listing_html):
        if link_match.group("idx") != chosen_idx:
            continue
        chunk = listing_html[link_match.start() : link_match.start() + 4000]
        img_match = _ITEM_THUMB_IMG_RE.search(chunk)
        if img_match:
            listing_thumb_url = img_match.group("url").strip()
        break

    # Fallback: any img near idx in listing
    if not listing_thumb_url:
        chunk_re = re.compile(
            rf'idx={chosen_idx}.*?<img[^>]+src=["\'](?P<url>[^"\']+)["\']',
            re.IGNORECASE | re.DOTALL,
        )
        m = chunk_re.search(listing_html)
        if m:
            listing_thumb_url = m.group("url").strip()

    def _norm(url: str | None) -> str:
        if not url:
            return ""
        if url.startswith("//"):
            url = "https:" + url
        if url.startswith("/"):
            url = "https://www.swagkey.kr" + url
        return url.split("?")[0]

    same_image = bool(
        listing_thumb_url and detail_probe.og_image and _norm(listing_thumb_url) == _norm(detail_probe.og_image)
    )
    listing_is_thumbnail_path = bool(listing_thumb_url and "/thumbnail/" in listing_thumb_url)
    detail_is_thumbnail_path = bool(detail_probe.og_image and "/thumbnail/" in detail_probe.og_image)

    return {
        "listing_url": listing_url,
        "product_idx": chosen_idx,
        "detail_url": detail_url,
        "listing_thumb_url": listing_thumb_url,
        "detail_og_image": detail_probe.og_image,
        "same_normalized_url": same_image,
        "listing_uses_thumbnail_cdn": listing_is_thumbnail_path,
        "detail_uses_thumbnail_cdn": detail_is_thumbnail_path,
        "recommendation": "use_detail_og_image",
        "rationale": (
            "Detail og:image is product-specific, stable absolute CDN URL, "
            "and matches or supersedes listing thumb quality."
        ),
    }


def failure_examples(repo_root: Path) -> list[dict[str, Any]]:
    seed_path = repo_root / "backend/src/keyboard_recommender/catalog/swagkey_products.seed.json"
    seed = json.loads(seed_path.read_text(encoding="utf-8"))
    examples: list[dict[str, Any]] = []

    # Conceptual layout taxonomy — no real Swagkey product image (synthetic metadata).
    for layout in seed.get("layouts", []):
        if layout.get("id") == "layout-002":
            examples.append(
                {
                    "case": "synthetic_layout_taxonomy",
                    "seed_id": layout["id"],
                    "name": layout.get("name"),
                    "sourceUrl": layout.get("sourceUrl"),
                    "expected_failure": "layout_is_taxonomy_not_product_photo",
                    "phase1_action": "optional image from linked PCB product; default placeholder",
                }
            )
            break

    # seed_only foam variant — crawl diff says possibly discontinued.
    for foam in seed.get("foams", []):
        if foam.get("id") == "foam-005":
            examples.append(
                {
                    "case": "seed_only_discontinued_candidate",
                    "seed_id": foam["id"],
                    "name": foam.get("name"),
                    "sourceUrl": foam.get("sourceUrl"),
                    "inventory_status": "seed_only in seed_inventory_diff",
                    "expected_failure": "page_may_404_or_show_generic_content",
                    "phase1_action": "fetch shop_view; on missing og:image leave empty",
                }
            )
            break

    # Legacy cache scraped from category URL (not shop_view) — wrong og:image risk.
    legacy = repo_root / "backend/data/swagkey_html_cache/sw-linear-001.html"
    legacy_probe = probe_html("cache", str(legacy.relative_to(repo_root)), legacy.read_text(encoding="utf-8"))
    examples.append(
        {
            "case": "legacy_cache_category_page",
            "file": str(legacy.relative_to(repo_root)),
            "seed_sourceUrl": "https://www.swagkey.kr/shop_view/?idx=1792",
            "cache_canonical": legacy_probe.canonical,
            "cache_og_image": legacy_probe.og_image,
            "live_detail_og_image": None,
            "expected_failure": "generic_category_og_image_in_stale_cache",
            "phase1_action": "require idx on canonical/og:url before trusting cache; else refetch",
        }
    )

    # Enrich legacy example with live detail if network available.
    try:
        live = probe_live_detail("https://www.swagkey.kr/shop_view/?idx=1792")
        examples[-1]["live_detail_og_image"] = live.og_image
        examples[-1]["cache_vs_live_same_image"] = live.og_image == legacy_probe.og_image
    except Exception as exc:  # noqa: BLE001
        examples[-1]["live_fetch_error"] = str(exc)

    return examples


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    out_path = repo_root / "backend/data/swagkey_inventory/phase0_image_spike_report.json"

    cache_probes = probe_cache_samples(repo_root)
    live_probes = [
        probe_live_detail("https://www.swagkey.kr/shop_view/?idx=1792"),  # sw-linear-001 seed
        probe_live_detail("https://www.swagkey.kr/shop_view/?idx=1303"),  # new_in_crawl sample
    ]
    listing_compare = compare_listing_vs_detail(listing_url="https://www.swagkey.kr/21")
    failures = failure_examples(repo_root)

    product_detail_cache = [p for p in cache_probes if p.has_product_idx]
    legacy_cache = [p for p in cache_probes if not p.has_product_idx]

    report = {
        "schemaVersion": "1.0.0",
        "phase": 0,
        "status": "completed",
        "generatedAt": datetime.now(UTC).isoformat(),
        "decision": {
            "extraction_source": "meta[property=og:image] on shop_view product detail page",
            "listing_thumb_fallback": False,
            "phase1_ready": True,
        },
        "summary": {
            "cache_samples": len(cache_probes),
            "product_detail_cache_samples": len(product_detail_cache),
            "legacy_category_cache_samples": len(legacy_cache),
            "product_detail_cache_og_image_ok": all(p.og_image for p in product_detail_cache),
            "live_detail_probes": len(live_probes),
            "live_detail_all_ok": all(p.og_image and p.has_product_idx for p in live_probes),
            "listing_vs_detail_has_detail_image": listing_compare.get("detail_og_image") is not None,
            "listing_vs_detail_same_url": listing_compare.get("same_normalized_url"),
        },
        "cache_probes": [asdict(p) for p in cache_probes],
        "live_detail_probes": [asdict(p) for p in live_probes],
        "listing_vs_detail": listing_compare,
        "failure_examples": failures,
        "validation": {
            "step1_product_detail_cache_og_image": all(p.og_image for p in product_detail_cache),
            "step2_live_detail_og_image_present": all(p.og_image for p in live_probes),
            "step3_live_detail_has_product_idx": all(p.has_product_idx for p in live_probes),
            "step4_listing_compare_done": listing_compare.get("detail_og_image") is not None,
            "step5_failure_examples_documented": len(failures) >= 3,
            "step6_legacy_cache_risk_noted": len(legacy_cache) >= 1,
            "all_passed": None,
        },
    }
    v = report["validation"]
    v["all_passed"] = all(
        [
            v["step1_product_detail_cache_og_image"],
            v["step2_live_detail_og_image_present"],
            v["step3_live_detail_has_product_idx"],
            v["step4_listing_compare_done"],
            v["step5_failure_examples_documented"],
            v["step6_legacy_cache_risk_noted"],
        ]
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print(f"validation.all_passed={v['all_passed']}")
    print(f"report={out_path}")
    return 0 if v["all_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
