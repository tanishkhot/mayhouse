"""
Design Experience API - Session-based stepwise creation flow.
"""

from typing import Dict, Any
from fastapi import APIRouter, Header, HTTPException, status, UploadFile, File, Form
from app.core.jwt_utils import verify_token
from app.services.design_experience_service import design_experience_service
from app.schemas.design_experience import (
    DesignSessionStartRequest,
    DesignSessionStartResponse,
    StepBasicsPayload,
    StepLogisticsPayload,
    StepMediaReorder,
    DesignSessionReview,
)

router = APIRouter(prefix="/design-experience", tags=["Design Experience"])


def _get_user_id_from_auth(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.post("/session", response_model=DesignSessionStartResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    body: DesignSessionStartRequest,
    authorization: str = Header(None),
):
    user_id = _get_user_id_from_auth(authorization)
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
):
    user_id = _get_user_id_from_auth(authorization)
    updated = await design_experience_service.upsert_basics(session_id, user_id, payload)
    return {"session_id": updated["id"], "updated_at": updated["updated_at"], "step": "basics"}


@router.post("/session/{session_id}/media")
async def upload_media(
    session_id: str,
    file: UploadFile = File(...),
    is_cover_photo: bool = Form(False),
    caption: str | None = Form(None),
    authorization: str = Header(None),
):
    # For MVP: we don't persist actual files here. In Phase 2, delegate to photo service.
    _get_user_id_from_auth(authorization)
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
):
    user_id = _get_user_id_from_auth(authorization)
    updated = await design_experience_service.reorder_media(session_id, user_id, order)
    return {"session_id": updated["id"], "updated_at": updated["updated_at"], "step": "media"}


@router.patch("/session/{session_id}/logistics")
async def upsert_logistics(
    session_id: str,
    payload: StepLogisticsPayload,
    authorization: str = Header(None),
):
    user_id = _get_user_id_from_auth(authorization)
    updated = await design_experience_service.upsert_logistics(session_id, user_id, payload)
    return {"session_id": updated["id"], "updated_at": updated["updated_at"], "step": "logistics"}


@router.get("/session/{session_id}/review", response_model=DesignSessionReview)
async def get_review(
    session_id: str,
    authorization: str = Header(None),
):
    user_id = _get_user_id_from_auth(authorization)
    return await design_experience_service.get_review(session_id, user_id)


@router.post("/session/{session_id}/submit")
async def submit(
    session_id: str,
    authorization: str = Header(None),
):
    user_id = _get_user_id_from_auth(authorization)
    return await design_experience_service.submit(session_id, user_id)


