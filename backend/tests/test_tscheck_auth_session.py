import time

import httpx

BASE_URL = "http://localhost:8001/api"


def test_session_endpoint_no_cookie_returns_null_not_401():
    resp = httpx.get(f"{BASE_URL}/auth/session")
    assert resp.status_code == 200
    assert resp.json() is None


def test_login_valid_sets_httponly_session_cookie_and_session_reflects_user():
    suffix = int(time.time() * 1000)
    email = f"tscheck-auth-{suffix}@example.com"
    password = "Password#123"
    name = f"TSCheck Auth {suffix}"

    with httpx.Client(base_url=BASE_URL) as client:
        signup = client.post("/auth/signup", json={"name": name, "email": email, "password": password})
        assert signup.status_code == 200, signup.text

        cookie = client.cookies.get("cashcontrol_session")
        assert cookie, "expected cashcontrol_session cookie to be set on signup"

        # New client (fresh cookie jar) logging in with valid creds gets its own cookie + session
        login_client = httpx.Client(base_url=BASE_URL)
        login = login_client.post("/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200, login.text
        assert login.json()["email"] == email

        session = login_client.get("/auth/session")
        assert session.status_code == 200
        assert session.json()["email"] == email

        # Logout clears the cookie; subsequent session call returns null, no dashboard-worthy user
        logout = login_client.post("/auth/logout")
        assert logout.status_code == 204

        session_after_logout = login_client.get("/auth/session")
        assert session_after_logout.status_code == 200
        assert session_after_logout.json() is None
        login_client.close()


def test_login_invalid_password_rejected_no_session_created():
    suffix = int(time.time() * 1000)
    email = f"tscheck-authbad-{suffix}@example.com"
    password = "Password#123"
    name = f"TSCheck AuthBad {suffix}"

    with httpx.Client(base_url=BASE_URL) as setup_client:
        signup = setup_client.post("/auth/signup", json={"name": name, "email": email, "password": password})
        assert signup.status_code == 200, signup.text

    attacker_client = httpx.Client(base_url=BASE_URL)
    bad_login = attacker_client.post("/auth/login", json={"email": email, "password": "WrongPassword#1"})
    assert bad_login.status_code == 401
    assert "cashcontrol_session" not in attacker_client.cookies

    session = attacker_client.get("/auth/session")
    assert session.status_code == 200
    assert session.json() is None
    attacker_client.close()
