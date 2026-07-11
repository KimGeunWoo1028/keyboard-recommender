"""Interpret community keyboard terminology → internal trait axes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, status

from keyboard_recommender.schemas.terminology import (
    TerminologyInterpretRequest,
    TerminologyInterpretResponse,
    TermMatchResponse,
    TraitConflictResponse,
)
from keyboard_recommender.terminology.dictionary import default_dictionary
from keyboard_recommender.terminology.engine import interpret_community_text

router = APIRouter(prefix="/terminology", tags=["terminology"])


@router.post(
    "/interpret",
    response_model=TerminologyInterpretResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
    summary="Map community keyboard terms to internal trait vector",
)
def post_interpret_terminology(
    body: Annotated[TerminologyInterpretRequest, Body()],
) -> TerminologyInterpretResponse:
    result = interpret_community_text(body.text, default_dictionary())
    return TerminologyInterpretResponse(
        normalized_text=result.normalized_text,
        trait_vector=dict(result.trait_vector),
        matches=[
            TermMatchResponse(
                term_id=m.term_id,
                surface=m.surface,
                intrinsic_confidence=m.intrinsic_confidence,
                effective_confidence=m.effective_confidence,
            )
            for m in result.matches
        ],
        conflicts=[
            TraitConflictResponse(
                axis=c.axis,
                term_a=c.term_a,
                term_b=c.term_b,
                signed_impulse_a=c.signed_impulse_a,
                signed_impulse_b=c.signed_impulse_b,
            )
            for c in result.conflicts
        ],
        unknown_tokens=list(result.unknown_tokens),
        warnings=list(result.warnings),
        parsing_confidence=result.parsing_confidence,
    )
