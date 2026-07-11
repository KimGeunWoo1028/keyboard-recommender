"""
Build and configure the FastAPI application.

Keeping `create_app()` here (instead of only in `main.py`) makes it easy to:
- reuse the same app in tests with different settings
- add middleware, CORS, and routers in one place
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.engine import Engine

from keyboard_recommender.api.health import router as health_router
from keyboard_recommender.api.v1.router import router as v1_router
from keyboard_recommender.config.env_validation import validate_environment_configuration
from keyboard_recommender.config.settings import Settings, get_settings
from keyboard_recommender.infrastructure.avatars import avatar_dir
from keyboard_recommender.infrastructure.swagkey_images import swagkey_images_dir
from keyboard_recommender.infrastructure.persistence import session as db_session
from keyboard_recommender.infrastructure.safety import ProductionDebugBlockMiddleware, apply_runtime_log_policy


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create a new FastAPI instance with routes and middleware."""
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        """Run on startup/shutdown: release DB pool on exit."""
        validate_environment_configuration(settings)
        apply_runtime_log_policy(settings)
        avatar_dir(settings)
        swagkey_images_dir(settings)
        yield
        engine: Engine = db_session.engine
        engine.dispose()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(ProductionDebugBlockMiddleware, settings=settings)

    app.state.settings = settings

    app.include_router(health_router)
    app.include_router(v1_router, prefix="/api/v1")

    media_avatars = Path(settings.avatar_upload_dir)
    media_avatars.mkdir(parents=True, exist_ok=True)
    app.mount("/media/avatars", StaticFiles(directory=str(media_avatars)), name="avatars")

    media_swagkey_images = swagkey_images_dir(settings)
    app.mount(
        "/media/swagkey-images",
        StaticFiles(directory=str(media_swagkey_images)),
        name="swagkey-images",
    )

    @app.get("/", tags=["meta"], summary="Service index")
    def root() -> dict[str, str]:
        """`/docs` and `/health` live here; the API is under `/api/v1`."""
        return {
            "service": settings.app_name,
            "health": "/health",
            "docs": "/docs",
            "openapi": "/openapi.json",
            "api_v1": "/api/v1",
        }

    return app
