"""
ASGI entry point for production and local runs.

Run locally:
    uvicorn keyboard_recommender.main:app --reload --app-dir src

`app` is the object Uvicorn imports by default.
"""

from keyboard_recommender.app_factory import create_app

app = create_app()
