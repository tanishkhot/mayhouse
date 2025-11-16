from fastapi.testclient import TestClient

from app.api.design_experience import router as design_experience_router
from app.api.design_experience import verify_token, design_experience_service
from fastapi import FastAPI
from datetime import datetime, timezone


def _utcnow():
    return datetime.now(timezone.utc)


def create_test_app():
    app = FastAPI()
    app.include_router(design_experience_router)
    return app


def test_start_session_and_steps(monkeypatch):
    app = create_test_app()
    client = TestClient(app)

    # Mock auth
    monkeypatch.setattr(
        "app.api.design_experience.verify_token",
        lambda token: {"sub": "test-user-id"} if token else None,
    )

    now = _utcnow().isoformat()

    # Mock service methods to avoid DB
    monkeypatch.setattr(
        "app.api.design_experience.design_experience_service.start_session",
        lambda host_id, experience_id: {
            "id": "sess-1",
            "experience_id": experience_id or "",
            "incomplete_fields": {},
            "created_at": now,
            "updated_at": now,
        },
    )
    monkeypatch.setattr(
        "app.api.design_experience.design_experience_service.upsert_basics",
        lambda session_id, host_id, payload: {
            "id": session_id,
            "updated_at": now,
        },
    )
    monkeypatch.setattr(
        "app.api.design_experience.design_experience_service.upsert_logistics",
        lambda session_id, host_id, payload: {
            "id": session_id,
            "updated_at": now,
        },
    )
    monkeypatch.setattr(
        "app.api.design_experience.design_experience_service.reorder_media",
        lambda session_id, host_id, order: {
            "id": session_id,
            "updated_at": now,
        },
    )
    monkeypatch.setattr(
        "app.api.design_experience.design_experience_service.get_review",
        lambda session_id, host_id: {
            "experience": {"title": "t"},
            "photos": [],
            "validation_report": {"ready_for_submit": True},
        },
    )
    monkeypatch.setattr(
        "app.api.design_experience.design_experience_service.submit",
        lambda session_id, host_id: {"experience_id": "exp-1", "status": "submitted"},
    )

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
    assert r.json()["step"] == "basics"

    # Logistics
    r = client.patch(
        "/design-experience/session/sess-1/logistics",
        json={"meeting_point": "Gateway of India"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["step"] == "logistics"

    # Reorder media
    r = client.patch(
        "/design-experience/session/sess-1/media",
        json={"order": ["p1", "p2"]},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["step"] == "media"

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


