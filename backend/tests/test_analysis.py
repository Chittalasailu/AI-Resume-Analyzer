from unittest.mock import patch

FAKE_ANALYSIS = {
    "ats_score": 82,
    "skills": ["Python", "SQL"],
    "strengths": ["Clear formatting"],
    "improvements": ["Add measurable impact"],
    "summary": "Solid junior engineer profile.",
}


def _upload(client, token, filename="resume.pdf"):
    with (
        patch("app.main.extract_text", return_value="dummy resume text"),
        patch("app.main.analyze_resume", return_value=FAKE_ANALYSIS),
    ):
        return client.post(
            "/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (filename, b"%PDF-1.4 fake pdf bytes", "application/pdf")},
        )


def test_upload_creates_persisted_analysis(client, unique_user, signup_and_login):
    token = signup_and_login(unique_user)

    resp = _upload(client, token)
    assert resp.status_code == 200
    assert resp.json()["analysis"]["ats_score"] == 82

    history = client.get("/history", headers={"Authorization": f"Bearer {token}"})
    analyses = history.json()["analyses"]
    assert len(analyses) == 1
    assert analyses[0]["ats_score"] == 82
    assert analyses[0]["skills"] == ["Python", "SQL"]
    assert analyses[0]["suggestions"] == ["Add measurable impact"]
    assert analyses[0]["user_id"]


def test_history_isolated_between_users(client, unique_user, signup_and_login):
    token_a = signup_and_login(unique_user)
    _upload(client, token_a)

    user_b = dict(
        username=f"{unique_user['username']}_b",
        email=f"b_{unique_user['email']}",
        password="AnotherPass123",
    )
    token_b = signup_and_login(user_b)

    history_b = client.get("/history", headers={"Authorization": f"Bearer {token_b}"})
    assert history_b.json()["analyses"] == []

    history_a = client.get("/history", headers={"Authorization": f"Bearer {token_a}"})
    assert len(history_a.json()["analyses"]) == 1


def test_delete_removes_own_analysis(client, unique_user, signup_and_login):
    token = signup_and_login(unique_user)
    _upload(client, token)
    history = client.get("/history", headers={"Authorization": f"Bearer {token}"})
    analysis_id = history.json()["analyses"][0]["id"]

    resp = client.delete(
        f"/history/{analysis_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200

    history_after = client.get("/history", headers={"Authorization": f"Bearer {token}"})
    assert history_after.json()["analyses"] == []


def test_cannot_delete_other_users_analysis(client, unique_user, signup_and_login):
    token_a = signup_and_login(unique_user)
    _upload(client, token_a)
    history_a = client.get("/history", headers={"Authorization": f"Bearer {token_a}"})
    analysis_id = history_a.json()["analyses"][0]["id"]

    user_b = dict(
        username=f"{unique_user['username']}_c",
        email=f"c_{unique_user['email']}",
        password="AnotherPass123",
    )
    token_b = signup_and_login(user_b)

    resp = client.delete(
        f"/history/{analysis_id}", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert resp.status_code == 404

    history_a_after = client.get("/history", headers={"Authorization": f"Bearer {token_a}"})
    assert len(history_a_after.json()["analyses"]) == 1


def test_delete_nonexistent_analysis_returns_404(client, unique_user, signup_and_login):
    token = signup_and_login(unique_user)
    resp = client.delete(
        "/history/does-not-exist", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 404
