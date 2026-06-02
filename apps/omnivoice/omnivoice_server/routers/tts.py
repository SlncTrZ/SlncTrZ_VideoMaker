"""
/v1/tts — Simple TTS endpoint with saved voice profiles.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from ..services.inference import InferenceService, SynthesisRequest
from ..services.metrics import MetricsService
from ..services.profiles import ProfileNotFoundError, ProfileService
from ..utils.audio import tensors_to_formatted_bytes

logger = logging.getLogger(__name__)
router = APIRouter()


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    profile_ids: str = Field(..., min_length=1)


def _get_inference(request: Request) -> InferenceService:
    return request.app.state.inference_svc


def _get_profiles(request: Request) -> ProfileService:
    return request.app.state.profile_svc


def _get_metrics(request: Request) -> MetricsService:
    return request.app.state.metrics_svc


@router.post("/tts")
async def synthesize_tts(
    body: TTSRequest,
    inference_svc: InferenceService = Depends(_get_inference),
    profile_svc: ProfileService = Depends(_get_profiles),
    metrics_svc: MetricsService = Depends(_get_metrics),
):
    profile_id = body.profile_ids
    try:
        ref_audio_path = profile_svc.get_ref_audio_path(profile_id)
        ref_text = profile_svc.get_ref_text(profile_id)
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile '{profile_id}' not found.",
        )

    req = SynthesisRequest(
        text=body.text,
        mode="clone",
        ref_audio_path=str(ref_audio_path),
        ref_text=ref_text,
    )

    try:
        result = await inference_svc.synthesize(req)
        metrics_svc.record_success(result.latency_s)
    except Exception as e:
        metrics_svc.record_error()
        logger.exception("TTS synthesis failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthesis failed: {e}",
        )

    try:
        audio_bytes, media_type = tensors_to_formatted_bytes(result.tensors, "wav")
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Audio format not available: {e}",
        )

    return Response(
        content=audio_bytes,
        media_type=media_type,
        headers={
            "X-Audio-Duration-S": str(round(result.duration_s, 3)),
            "X-Synthesis-Latency-S": str(round(result.latency_s, 3)),
        },
    )
