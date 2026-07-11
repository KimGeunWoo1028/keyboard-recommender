"""Internal debug HTTP routes (gated by settings + optional token)."""

from keyboard_recommender.api.v1.debug.router import router

__all__ = ["router"]
