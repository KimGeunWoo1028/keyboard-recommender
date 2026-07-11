from fastapi import APIRouter

from keyboard_recommender.api.v1 import (
    auth,
    cases,
    catalog_full,
    foam,
    keycaps,
    layouts,
    plates,
    recommendations,
    switches,
    terminology,
)
from keyboard_recommender.api.v1.debug import router as debug_router

router = APIRouter()
router.include_router(debug_router)
router.include_router(auth.router)
router.include_router(recommendations.router)
router.include_router(terminology.router)
router.include_router(switches.router)
router.include_router(plates.router)
router.include_router(foam.router)
router.include_router(layouts.router)
router.include_router(cases.router)
router.include_router(keycaps.router)
router.include_router(catalog_full.router)
