from __future__ import annotations

from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_extractor import (
    OgImageResult,
    is_valid_swagkey_product_image_url,
    page_has_product_idx,
    parse_og_image_from_html,
)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_FOAM_CACHE = (
    _REPO_ROOT
    / "backend/data/swagkey_html_cache/foams/foam-001.html"
)
_SWITCH_NEW_CACHE = (
    _REPO_ROOT
    / "backend/data/swagkey_inventory/new_in_crawl_specs/switch_html_cache/sw-new-001-cherry-mx2a-blossom-리니어-스위치.html"
)
_LEGACY_SWITCH_CACHE = _REPO_ROOT / "backend/data/swagkey_html_cache/sw-linear-001.html"


def _read(path: Path) -> str:
    assert path.is_file(), f"missing fixture: {path}"
    return path.read_text(encoding="utf-8", errors="ignore")


def test_parse_og_image_from_foam_cache_fixture() -> None:
    result = parse_og_image_from_html(_read(_FOAM_CACHE))
    assert result == OgImageResult(
        image_url="https://cdn.imweb.me/thumbnail/20250916/17413e2972115.jpg",
        width=1200,
        height=627,
        og_url="https://www.swagkey.kr/24/?idx=253",
        canonical_url="https://www.swagkey.kr/24/?idx=253",
        has_product_idx=True,
        cache_trusted=True,
    )


def test_parse_og_image_from_new_in_crawl_switch_fixture() -> None:
    result = parse_og_image_from_html(_read(_SWITCH_NEW_CACHE))
    assert result is not None
    assert result.image_url == "https://cdn.imweb.me/thumbnail/20250929/20e180cf66330.jpg"
    assert result.has_product_idx is True
    assert "idx=1303" in (result.canonical_url or "")


def test_parse_og_image_missing_returns_none() -> None:
    html = "<html><head><title>No image</title></head><body></body></html>"
    assert parse_og_image_from_html(html) is None


def test_parse_og_image_rejects_legacy_category_cache_without_product_idx() -> None:
    result = parse_og_image_from_html(_read(_LEGACY_SWITCH_CACHE))
    assert result is None


def test_parse_og_image_rejects_generic_upload_path_even_with_og_image_meta() -> None:
    html = """
    <html><head>
      <meta property="og:url" content="https://www.swagkey.kr/39"/>
      <meta property="og:image" content="https://cdn.imweb.me/upload/S20220103536cb52c56eda/40cb6d924983a.png"/>
    </head></html>
    """
    assert parse_og_image_from_html(html) is None


def test_parse_og_image_rejects_favicon_like_paths() -> None:
    html = """
    <html><head>
      <meta property="og:url" content="https://www.swagkey.kr/shop_view/?idx=1"/>
      <meta property="og:image" content="https://cdn.imweb.me/thumbnail/20221021/34bd421fb548a.png"/>
      <link rel="apple-touch-icon" href="https://cdn.imweb.me/thumbnail/20221021/34bd421fb548a.png"/>
    </head></html>
    """
    # Still thumbnail path shape — allowed when page has idx.
    result = parse_og_image_from_html(html)
    assert result is not None
    assert result.image_url.endswith("34bd421fb548a.png")

    assert is_valid_swagkey_product_image_url("https://cdn.imweb.me/upload/site-logo.png") is False
    assert is_valid_swagkey_product_image_url("https://vendor-cdn.imweb.me/thumbnail/x.jpg") is False


def test_parse_og_image_allow_relaxed_product_page_check() -> None:
    html = """
    <html><head>
      <meta property="og:url" content="https://www.swagkey.kr/shop_view/?idx=999"/>
      <meta property="og:image" content="https://cdn.imweb.me/thumbnail/20260101/abc.jpg"/>
      <meta property="og:image:width" content="800"/>
      <meta property="og:image:height" content="600"/>
    </head></html>
    """
    result = parse_og_image_from_html(html, require_product_page=False)
    assert result is not None
    assert result.width == 800
    assert result.height == 600


def test_page_has_product_idx() -> None:
    assert page_has_product_idx("https://www.swagkey.kr/shop_view/?idx=1792") is True
    assert page_has_product_idx("https://www.swagkey.kr/24/?idx=253") is True
    assert page_has_product_idx("https://www.swagkey.kr/39") is False
