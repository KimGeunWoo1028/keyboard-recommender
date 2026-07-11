# Swagkey catalog image mirror — storage policy

**Status:** Phase 7 (2026-07-10)  
**Scope:** Mirrored product thumbnails for catalog browse only.

## Decision

| Item | Policy |
|------|--------|
| Source of truth | `swagkey_products.seed.json` keeps CDN `imageUrl` |
| Local files | `backend/data/swagkey_images/{idx}.{ext}` (`jpg` / `png` / `webp`) |
| Git | **Binary images are not committed** — directory kept via `.gitkeep` only |
| API serving | FastAPI static mount `/media/swagkey-images` |
| Runtime URL | When a local file exists, catalog API returns `/media/swagkey-images/{idx}.{ext}`; otherwise CDN fallback |
| Frontend | `resolveCatalogImageUrl()` prefixes `NEXT_PUBLIC_API_URL` for relative mirror paths |

## Operations

### Initial mirror (dev)

```powershell
cd backend
python scripts/download_swagkey_images.py
```

### Re-sync after seed imageUrl changes

```powershell
python scripts/download_swagkey_images.py --force
```

### Reports

- `backend/data/swagkey_inventory/swagkey_image_mirror_report.json`

## Disk sizing (estimate)

- ~167 browse-eligible products with images (seed pool)
- Typical thumbnail: 20–80 KB each
- **Plan ~15–30 MB** for full mirror on disk

## Production notes

- Populate `data/swagkey_images/` on deploy (CI artifact, object storage sync, or runbook step).
- Do not rely on git for image bytes.
- Revisit copyright / Swagkey terms before public redistribution beyond hotlink-equivalent serving.

## Related

- `scripts/download_swagkey_images.py`
- `keyboard_recommender/catalog/swagkey_image_mirror.py`
- `keyboard_recommender/infrastructure/swagkey_images.py`
- `docs/swagkey-product-images-roadmap.md` § Phase 7
