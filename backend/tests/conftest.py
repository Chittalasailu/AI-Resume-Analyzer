import os
import sys
import uuid
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

# Point the app at an isolated, file-backed SQLite database before app.database
# is imported, so the whole test session shares one on-disk DB independent of
# whatever DATABASE_URL/.env is configured for local dev.
TEST_DB_PATH = BACKEND_ROOT / "tests" / "_test.db"
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

os.environ["JWT_SECRET"] = "test-secret"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from fastapi.testclient import TestClient  # noqa: E402

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
    engine.dispose()  # release SQLite's file handle so the unlink below works on Windows
    TEST_DB_PATH.unlink(missing_ok=True)


@pytest.fixture()
def unique_user():
    suffix = uuid.uuid4().hex[:10]
    return {
        "username": f"user_{suffix}",
        "email": f"user_{suffix}@example.com",
        "password": "SecurePass123",
    }


@pytest.fixture()
def signup_and_login(client):
    def _do(user: dict) -> str:
        resp = client.post("/signup", json=user)
        assert resp.status_code == 200, resp.text
        resp = client.post(
            "/login", json={"username": user["username"], "password": user["password"]}
        )
        assert resp.status_code == 200, resp.text
        return resp.json()["access_token"]

    return _do
