from fastapi.testclient import TestClient
from fastapi import FastAPI
from datetime import datetime, timezone

from app.api.design_experience import router as design_experience_router


def _utcnow():
    return datetime.now(timezone.utc).isoformat()


def main():
    app = FastAPI()
    app.include_router(design_experience_router)
    client = TestClient(app)

    # Monkeypatch token verification to avoid real JWT
    import app.api.design_experience as de
    de.verify_token = lambda token: {"sub": "test-user-id"} if token else None

    now = _utcnow()

    # Monkeypatch service methods to avoid DB
    async def _start_session(host_id, experience_id):
        return {
            "id": "sess-1",
            "experience_id": experience_id or "",
            "incomplete_fields": {},
            "created_at": now,
            "updated_at": now,
        }
    async def _upsert_basics(session_id, host_id, payload):
        return {"id": session_id, "updated_at": now}
    async def _upsert_logistics(session_id, host_id, payload):
        return {"id": session_id, "updated_at": now}
    async def _reorder_media(session_id, host_id, order):
        return {"id": session_id, "updated_at": now}
    async def _get_review(session_id, host_id):
        return {
            "experience": {"title": "t"},
            "photos": [],
            "validation_report": {"ready_for_submit": True},
        }
    async def _submit(session_id, host_id):
        return {"experience_id": "exp-1", "status": "submitted"}

    de.design_experience_service.start_session = _start_session
    de.design_experience_service.upsert_basics = _upsert_basics
    de.design_experience_service.upsert_logistics = _upsert_logistics
    de.design_experience_service.reorder_media = _reorder_media
    de.design_experience_service.get_review = _get_review
    de.design_experience_service.submit = _submit

    # Start session
    r = client.post(
        "/design-experience/session",
        json={"experience_id": None},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["session_id"] == "sess-1"
    assert data["step"] == 1

    # Basics
    r = client.patch(
        "/design-experience/session/sess-1/basics",
        json={"title": "My Title", "description": "desc"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text

    # Logistics
    r = client.patch(
        "/design-experience/session/sess-1/logistics",
        json={"meeting_point": "Gateway of India"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text

    # Reorder media
    r = client.patch(
        "/design-experience/session/sess-1/media",
        json={"order": ["p1", "p2"]},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text

    # Review
    r = client.get(
        "/design-experience/session/sess-1/review",
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["validation_report"]["ready_for_submit"] is True

    # Submit
    r = client.post(
        "/design-experience/session/sess-1/submit",
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "submitted"

    print("OK: design-experience flow passed")


if __name__ == "__main__":
    main()


