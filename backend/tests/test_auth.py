def test_signup_success(client, unique_user):
    resp = client.post("/signup", json=unique_user)
    assert resp.status_code == 200
    assert resp.json() == {"message": "User created successfully"}


def test_login_success_returns_token_and_safe_user(client, unique_user):
    client.post("/signup", json=unique_user)
    resp = client.post(
        "/login",
        json={"username": unique_user["username"], "password": unique_user["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert body["user"]["username"] == unique_user["username"]
    assert body["user"]["email"] == unique_user["email"]
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_signup_duplicate_username_rejected(client, unique_user):
    client.post("/signup", json=unique_user)
    dup = dict(unique_user, email=f"other_{unique_user['email']}")
    resp = client.post("/signup", json=dup)
    assert resp.status_code == 400


def test_signup_duplicate_email_rejected(client, unique_user):
    client.post("/signup", json=unique_user)
    dup = dict(unique_user, username=f"other_{unique_user['username']}")
    resp = client.post("/signup", json=dup)
    assert resp.status_code == 400


def test_login_invalid_password_rejected(client, unique_user):
    client.post("/signup", json=unique_user)
    resp = client.post(
        "/login", json={"username": unique_user["username"], "password": "wrong-password"}
    )
    assert resp.status_code == 401


def test_login_unknown_user_rejected(client):
    resp = client.post("/login", json={"username": "no-such-user", "password": "whatever123"})
    assert resp.status_code == 401


def test_upload_requires_authentication(client):
    resp = client.post(
        "/upload", files={"file": ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")}
    )
    assert resp.status_code == 401


def test_history_requires_authentication(client):
    resp = client.get("/history")
    assert resp.status_code == 401


def test_invalid_jwt_rejected(client):
    resp = client.get("/history", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_valid_jwt_grants_access(client, unique_user, signup_and_login):
    token = signup_and_login(unique_user)
    resp = client.get("/history", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == {"analyses": []}
