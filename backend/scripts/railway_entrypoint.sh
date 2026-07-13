#!/bin/sh
# Railway entrypoint: mirror Swagkey thumbnails then start Uvicorn.
set -e
cd "$(dirname "$0")/.." || exit 1
export PYTHONPATH=src
echo "[railway] Mirroring Swagkey thumbnails (best-effort)..."
python scripts/download_swagkey_images.py --max-failures 20 || echo "[railway] swagkey mirror failed; continuing with CDN fallback"
exec uvicorn keyboard_recommender.main:app --host 0.0.0.0 --port "$PORT" --app-dir src
