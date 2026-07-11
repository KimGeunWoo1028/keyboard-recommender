"""
Health check routes for load balancers and monitoring.

Kept separate from versioned API (`/api/v1`) so ops can call `/health` without
coupling to API versions.
"""

from typing import Any

from fastapi import APIRouter

from keyboard_recommender.config.settings import get_settings, resolved_env_file_path

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness probe")
def health() -> dict[str, Any]:
    """
    Process is up. Includes **non-secret** evaluation persistence flags so you can
    verify ``backend/.env`` is picked up without tailing logs.
    """
    settings = get_settings()
    env_path = resolved_env_file_path()
    return {
        "status": "ok",
        "evaluationPersistenceEnabled": settings.enable_evaluation_persistence,
        "evaluationSnapshotsEnabled": settings.enable_evaluation_snapshots,
        "diagnosticsPersistenceEnabled": settings.enable_diagnostics_persistence,
        "envFile": str(env_path),
        "envFileExists": env_path.is_file(),
    }
