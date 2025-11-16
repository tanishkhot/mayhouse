"""
Service orchestrating the Design Experience session flow.
Persists partial step payloads and merges to underlying experiences.
"""

from __future__ import annotations

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from supabase import Client
from app.core.database import get_service_client
from app.schemas.design_experience import (
    StepBasicsPayload,
    StepLogisticsPayload,
    StepMediaReorder,
    DesignSessionReview,
)
from app.schemas.experience import ExperienceStatus


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DesignExperienceService:
    def __init__(self) -> None:
        self._db: Optional[Client] = None

    @property
    def _db_client(self) -> Client:
        """Lazy initialization of database client."""
        if self._db is None:
            self._db = get_service_client()
        return self._db

    def _sessions(self):
        return self._db_client.table("experience_design_sessions")

    async def start_session(self, host_id: str, experience_id: Optional[str]) -> Dict[str, Any]:
        now = _utcnow_iso()

        # If resuming, ensure session exists or create a new session referencing the experience
        if experience_id:
            existing = (
                self._sessions()
                .select("*")
                .eq("host_id", host_id)
                .eq("experience_id", experience_id)
                .limit(1)
                .execute()
            )
            if existing.data:
                return existing.data[0]

        # Otherwise create a fresh session; underlying experience will be created on submit
        record = {
            "host_id": host_id,
            "experience_id": experience_id or "",
            "step_completion": {"basics": False, "media": False, "logistics": False},
            "incomplete_fields": {},
            "autosave_version": 1,
            "last_saved_at": now,
            "created_at": now,
            "updated_at": now,
        }
        res = self._sessions().insert(record).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to start design session",
            )
        return res.data[0]

    async def upsert_basics(self, session_id: str, host_id: str, payload: StepBasicsPayload) -> Dict[str, Any]:
        now = _utcnow_iso()
        update = {
            "basics_payload": payload.model_dump(exclude_none=True),
            "updated_at": now,
            "last_saved_at": now,
        }
        res = (
            self._sessions().update(update).eq("id", session_id).eq("host_id", host_id).execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return res.data[0]

    async def upsert_logistics(self, session_id: str, host_id: str, payload: StepLogisticsPayload) -> Dict[str, Any]:
        now = _utcnow_iso()
        update = {
            "logistics_payload": payload.model_dump(exclude_none=True),
            "updated_at": now,
            "last_saved_at": now,
        }
        res = (
            self._sessions().update(update).eq("id", session_id).eq("host_id", host_id).execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return res.data[0]

    async def reorder_media(self, session_id: str, host_id: str, reorder: StepMediaReorder) -> Dict[str, Any]:
        now = _utcnow_iso()
        update = {
            "media_order": reorder.order,
            "updated_at": now,
            "last_saved_at": now,
        }
        res = (
            self._sessions().update(update).eq("id", session_id).eq("host_id", host_id).execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return res.data[0]

    async def get_review(self, session_id: str, host_id: str) -> DesignSessionReview:
        res = self._sessions().select("*").eq("id", session_id).eq("host_id", host_id).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = res.data[0]

        # Construct a lightweight review payload from partials
        experience_preview: Dict[str, Any] = {}
        experience_preview.update(session.get("basics_payload") or {})
        experience_preview.update(session.get("logistics_payload") or {})

        photos: List[Dict[str, Any]] = session.get("photos_preview") or []
        validation_report = {
            "incomplete_fields": session.get("incomplete_fields") or {},
            "ready_for_submit": len((session.get("incomplete_fields") or {})) == 0,
        }
        return DesignSessionReview(
            experience=experience_preview,
            photos=photos,
            validation_report=validation_report,
        )

    async def submit(self, session_id: str, host_id: str) -> Dict[str, Any]:
        # Merge partials, validate, create/patch underlying experience, set SUBMITTED
        res = self._sessions().select("*").eq("id", session_id).eq("host_id", host_id).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = res.data[0]

        # Minimal validation — full validation can be added later
        basics = session.get("basics_payload") or {}
        logistics = session.get("logistics_payload") or {}
        required = ["title", "description", "domain", "duration_minutes", "traveler_max_capacity", "price_inr", "meeting_point"]
        missing = [f for f in required if not (basics.get(f) or logistics.get(f))]
        if missing:
            raise HTTPException(status_code=422, detail={"missing_fields": missing})

        # Create or update experience via service client
        exp_table = self._db.table("experiences")
        now = _utcnow_iso()
        if not session.get("experience_id"):
            # create draft
            record = {
                "host_id": host_id,
                "title": basics.get("title"),
                "promise": (basics.get("description") or "")[:200],
                "description": basics.get("description"),
                "unique_element": basics.get("what_to_expect") or "",
                "host_story": "",
                "experience_domain": basics.get("domain"),
                "experience_theme": basics.get("theme"),
                "country": "India",
                "city": "Mumbai",
                "neighborhood": logistics.get("neighborhood"),
                "meeting_landmark": (logistics.get("meeting_point") or "").split(",")[0] if logistics.get("meeting_point") else None,
                "meeting_point_details": logistics.get("meeting_point"),
                "duration_minutes": basics.get("duration_minutes"),
                "traveler_min_capacity": 1,
                "traveler_max_capacity": logistics.get("traveler_max_capacity"),
                "price_inr": logistics.get("price_inr"),
                "inclusions": ["Professional local guide"],
                "traveler_should_bring": logistics.get("what_to_bring") or [],
                "accessibility_notes": logistics.get("requirements") or [],
                "experience_safety_guidelines": logistics.get("safety_guidelines"),
                "status": ExperienceStatus.SUBMITTED.value,
                "created_at": now,
                "updated_at": now,
              }
            created = exp_table.insert(record).execute()
            if not created.data:
                raise HTTPException(status_code=500, detail="Failed to create experience")
            experience_id = created.data[0]["id"]
            self._sessions().update({"experience_id": experience_id, "updated_at": now}).eq("id", session_id).execute()
        else:
            experience_id = session["experience_id"]
            exp_table.update(
                {
                    "title": basics.get("title"),
                    "promise": (basics.get("description") or "")[:200],
                    "description": basics.get("description"),
                    "unique_element": basics.get("what_to_expect") or "",
                    "experience_domain": basics.get("domain"),
                    "experience_theme": basics.get("theme"),
                    "neighborhood": logistics.get("neighborhood"),
                    "meeting_landmark": (logistics.get("meeting_point") or "").split(",")[0] if logistics.get("meeting_point") else None,
                    "meeting_point_details": logistics.get("meeting_point"),
                    "duration_minutes": basics.get("duration_minutes"),
                    "traveler_max_capacity": logistics.get("traveler_max_capacity"),
                    "price_inr": logistics.get("price_inr"),
                    "status": ExperienceStatus.SUBMITTED.value,
                    "updated_at": now,
                }
            ).eq("id", experience_id).execute()

        return {"experience_id": experience_id, "status": "submitted"}


design_experience_service = DesignExperienceService()


