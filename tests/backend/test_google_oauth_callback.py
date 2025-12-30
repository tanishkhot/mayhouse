import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client():
    # Support running from either repo root or from within backend/ (as in the plan).
    try:
        from main import app  # type: ignore
    except Exception:
        from backend.main import app  # type: ignore

    return TestClient(app)


def test_google_oauth_callback_redirects_with_token(monkeypatch, client):
    async def fake_exchange_code_for_token(code: str):
        return {
            "user_info": {
                "email": "ameyakhot18@gmail.com",
                "name": "Test User",
                "id": "google-id-123",
                "picture": "https://example.invalid/p.png",
            }
        }

    async def fake_get_or_create_oauth_user(google_user_info):
        return {
            "id": "28cbdb94-0000-0000-0000-000000000000",
            "email": google_user_info["email"],
            "role": "host",
        }

    async def fake_create_supabase_session_token(user):
        return "test.jwt.token"

    monkeypatch.setattr(
        "app.api.oauth.exchange_code_for_token", fake_exchange_code_for_token
    )
    monkeypatch.setattr(
        "app.api.oauth.get_or_create_oauth_user", fake_get_or_create_oauth_user
    )
    monkeypatch.setattr(
        "app.api.oauth.create_supabase_session_token",
        fake_create_supabase_session_token,
    )

    resp = client.get(
        "/auth/oauth/google/callback",
        params={
            "code": "fake-code",
            "state": "mh1.eyJ2IjoxLCJmcm9udGVuZF91cmwiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAifQ",
        },
        follow_redirects=False,
    )

    assert resp.status_code in (302, 307)
    location = resp.headers["location"]
    assert location.startswith("http://localhost:3000/auth/callback#")
    assert "access_token=test.jwt.token" in location
    assert "token_type=bearer" in location


