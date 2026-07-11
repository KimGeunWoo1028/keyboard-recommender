"""ASGI middleware: hard-block internal debug HTTP routes in production."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from keyboard_recommender.config.settings import Settings


class ProductionDebugBlockMiddleware(BaseHTTPMiddleware):
    """
    Return 404 for ``/api/v1/debug`` when ``app_environment == production``.

    Defense in depth alongside :func:`keyboard_recommender.api.deps.require_internal_debug_api`
    and production coercion in :class:`Settings`.
    """

    def __init__(self, app, *, settings: Settings) -> None:
        super().__init__(app)
        self._settings = settings

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        if self._settings.app_environment == "production" and request.url.path.startswith("/api/v1/debug"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        return await call_next(request)
