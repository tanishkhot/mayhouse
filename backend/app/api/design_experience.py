"""
Design Experience API - Session-based stepwise creation flow.
"""

from typing import Dict, Any
import uuid
from fastapi import APIRouter, Header, HTTPException, status, UploadFile, File, Form
from app.core.auth_helpers import get_user_from_token
from app.services.design_experience_service import design_experience_service
from app.schemas.design_experience import (
    DesignSessionStartRequest,
    DesignSessionStartResponse,
    StepBasicsPayload,
    StepLogisticsPayload,
    StepMediaReorder,
    DesignSessionReview,
    ExperienceGenerationRequest,
    ExperienceGenerationResponse,
    QASaveRequest,
    QAGenerationRequest,
    QAAnswer,
)

router = APIRouter(prefix="/design-experience", tags=["Design Experience"])


async def _get_user_id_from_auth(
    authorization: str | None,
    anonymous_user_id: str | None,
) -> str:
    """
    Extract user ID from authorization header.
    Supports both Supabase Auth tokens (OAuth) and custom JWT tokens (wallet).
    """
    if authorization:
        user = await get_user_from_token(authorization)
        return user["id"]

    if anonymous_user_id:
        try:
            uuid.UUID(anonymous_user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Anonymous-User-Id header (must be a UUID)",
            )
        return anonymous_user_id

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing Authorization header",
    )


@router.post("/session", response_model=DesignSessionStartResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    body: DesignSessionStartRequest,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    session = await design_experience_service.start_session(user_id, body.experience_id)
    return DesignSessionStartResponse(
        session_id=session["id"],
        experience_id=session.get("experience_id") or "",
        step=1,
        incomplete_fields=session.get("incomplete_fields") or {},
        created_at=session["created_at"],
        updated_at=session["updated_at"],
    )


@router.patch("/session/{session_id}/basics")
async def upsert_basics(
    session_id: str,
    payload: StepBasicsPayload,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    updated = await design_experience_service.upsert_basics(session_id, user_id, payload)
    return {"session_id": updated["id"], "updated_at": updated["updated_at"], "step": "basics"}


@router.post("/session/{session_id}/media")
async def upload_media(
    session_id: str,
    file: UploadFile = File(...),
    is_cover_photo: bool = Form(False),
    caption: str | None = Form(None),
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    # For MVP: we don't persist actual files here. In Phase 2, delegate to photo service.
    await _get_user_id_from_auth(authorization, anonymous_user_id)
    fake_photo = {
        "id": f"session-photo-{session_id}",
        "url": "about:blank",
        "is_cover_photo": is_cover_photo,
        "caption": caption,
    }
    return {"photo": fake_photo, "message": "Queued for upload (placeholder)"}


@router.patch("/session/{session_id}/media")
async def reorder_media(
    session_id: str,
    order: StepMediaReorder,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    updated = await design_experience_service.reorder_media(session_id, user_id, order)
    return {"session_id": updated["id"], "updated_at": updated["updated_at"], "step": "media"}


@router.patch("/session/{session_id}/logistics")
async def upsert_logistics(
    session_id: str,
    payload: StepLogisticsPayload,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    updated = await design_experience_service.upsert_logistics(session_id, user_id, payload)
    return {"session_id": updated["id"], "updated_at": updated["updated_at"], "step": "logistics"}


@router.get("/session/{session_id}/review", response_model=DesignSessionReview)
async def get_review(
    session_id: str,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    return await design_experience_service.get_review(session_id, user_id)


@router.post("/session/{session_id}/submit")
async def submit(
    session_id: str,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    return await design_experience_service.submit(session_id, user_id)


@router.post("/generate", response_model=ExperienceGenerationResponse)
async def generate_experience(
    body: ExperienceGenerationRequest,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    """
    Generate experience fields from a natural language description.
    This is a pre-session step - user hasn't started a design session yet.
    Uses AI to generate structured experience data from free-form text.
    """
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    generated = await design_experience_service.generate_from_description(
        user_id, 
        body.description
    )
    return ExperienceGenerationResponse(**generated)


@router.patch("/session/{session_id}/qa-answers")
async def save_qa_answers(
    session_id: str,
    body: QASaveRequest,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    """
    Save Q&A answers to a design session.
    Stores answers from the guided "Let's Build Together" flow.
    """
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    updated = await design_experience_service.save_qa_answers(
        session_id, user_id, body.qa_answers
    )
    return {
        "session_id": updated["id"],
        "updated_at": updated["updated_at"],
        "qa_answers_count": len(body.qa_answers)
    }


@router.post("/generate-from-qa", response_model=ExperienceGenerationResponse)
async def generate_from_qa(
    body: QAGenerationRequest,
    authorization: str = Header(None),
    anonymous_user_id: str | None = Header(None, alias="X-Anonymous-User-Id"),
):
    """
    Generate experience fields from Q&A answers.
    Takes array of question-answer pairs and extracts structured experience data using AI.
    """
    user_id = await _get_user_id_from_auth(authorization, anonymous_user_id)
    generated = await design_experience_service.generate_from_qa(
        user_id, 
        body.qa_answers
    )
    return ExperienceGenerationResponse(**generated)


