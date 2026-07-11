"""Extract Swagkey product representative images from cached or live HTML."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

from keyboard_recommender.catalog.swagkey_spec_scraper import fetch_html

_IMWEB_CDN_HOST = "cdn.imweb.me"
_THUMBNAIL_PATH_PREFIX = "/thumbnail/"

_OG_IMAGE_RE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE,
)
_OG_IMAGE_ALT_RE = re.compile(
    r'<meta[^>]+content=["\'](?P<url>[^"\']+)["\'][^>]+property=["\']og:image["\']',
    re.IGNORECASE,
)
_OG_IMAGE_WIDTH_RE = re.compile(
    r'<meta[^>]+property=["\']og:image:width["\'][^>]+content=["\'](?P<value>\d+)["\']',
    re.IGNORECASE,
)
_OG_IMAGE_WIDTH_ALT_RE = re.compile(
    r'<meta[^>]+content=["\'](?P<value>\d+)["\'][^>]+property=["\']og:image:width["\']',
    re.IGNORECASE,
)
_OG_IMAGE_HEIGHT_RE = re.compile(
    r'<meta[^>]+property=["\']og:image:height["\'][^>]+content=["\'](?P<value>\d+)["\']',
    re.IGNORECASE,
)
_OG_IMAGE_HEIGHT_ALT_RE = re.compile(
    r'<meta[^>]+content=["\'](?P<value>\d+)["\'][^>]+property=["\']og:image:height["\']',
    re.IGNORECASE,
)
_OG_URL_RE = re.compile(
    r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE,
)
_OG_URL_ALT_RE = re.compile(
    r'<meta[^>]+content=["\'](?P<url>[^"\']+)["\'][^>]+property=["\']og:url["\']',
    re.IGNORECASE,
)
_CANONICAL_RE = re.compile(
    r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](?P<url>[^"\']+)["\']',
    re.IGNORECASE,
)
_CANONICAL_ALT_RE = re.compile(
    r'<link[^>]+href=["\'](?P<url>[^"\']+)["\'][^>]+rel=["\']canonical["\']',
    re.IGNORECASE,
)

__all__ = [
    "OgImageResult",
    "fetch_html",
    "is_valid_swagkey_product_image_url",
    "page_has_product_idx",
    "parse_og_image_from_html",
    "parse_page_reference_url",
]


@dataclass(frozen=True, slots=True)
class OgImageResult:
    image_url: str
    width: int | None = None
    height: int | None = None
    og_url: str | None = None
    canonical_url: str | None = None
    source: str = "og:image"
    has_product_idx: bool = False
    cache_trusted: bool = False


def _first_match(patterns: tuple[re.Pattern[str], ...], html: str) -> str | None:
    for pattern in patterns:
        match = pattern.search(html)
        if match:
            return match.group(1).strip()
    return None


def _parse_positive_int(value: str | None) -> int | None:
    if not value:
        return None
    try:
        parsed = int(value)
    except ValueError:
        return None
    return parsed if parsed > 0 else None


def parse_page_reference_url(html: str) -> tuple[str | None, str | None]:
    og_url = _first_match((_OG_URL_RE, _OG_URL_ALT_RE), html)
    canonical = _first_match((_CANONICAL_RE, _CANONICAL_ALT_RE), html)
    return og_url, canonical


def page_has_product_idx(url: str | None) -> bool:
    if not url:
        return False
    lowered = url.lower()
    return "idx=" in lowered or "shop_view" in lowered


def is_valid_swagkey_product_image_url(url: str) -> bool:
    """Accept only imweb CDN thumbnail paths (reject favicon/upload fallbacks)."""
    raw = (url or "").strip()
    if not raw:
        return False
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        return False
    if parsed.netloc.lower() != _IMWEB_CDN_HOST:
        return False
    return parsed.path.startswith(_THUMBNAIL_PATH_PREFIX)


def parse_og_image_from_html(html: str, *, require_product_page: bool = True) -> OgImageResult | None:
    """Parse product og:image from Swagkey HTML.

    Returns None when og:image is missing, invalid, or the page is not a product detail URL.
    """
    image_url = _first_match((_OG_IMAGE_RE, _OG_IMAGE_ALT_RE), html)
    if not image_url or not is_valid_swagkey_product_image_url(image_url):
        return None

    og_url, canonical = parse_page_reference_url(html)
    ref_url = canonical or og_url
    has_idx = page_has_product_idx(ref_url)
    if require_product_page and not has_idx:
        return None

    width = _parse_positive_int(_first_match((_OG_IMAGE_WIDTH_RE, _OG_IMAGE_WIDTH_ALT_RE), html))
    height = _parse_positive_int(_first_match((_OG_IMAGE_HEIGHT_RE, _OG_IMAGE_HEIGHT_ALT_RE), html))

    return OgImageResult(
        image_url=image_url,
        width=width,
        height=height,
        og_url=og_url,
        canonical_url=canonical,
        has_product_idx=has_idx,
        cache_trusted=has_idx,
    )
