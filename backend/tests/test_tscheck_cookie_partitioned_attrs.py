import os
import time

import httpx

# Secure/Partitioned cookie attributes are only emitted over real HTTPS (the
# public ingress), never on the plain-HTTP localhost:8001 backend port, so this
# criterion must be verified against the public APP_URL - the same path browsers
# and embedding parent sites actually hit.
BASE_URL = os.environ.get("APP_URL", "https://cashcontrol-47.preview.emergentagent.com") + "/api"


def test_login_sets_cookie_with_httponly_secure_samesite_none_partitioned():
    """Cross-site/iframe embedding (e.g. preview shown inside a parent-origin iframe)
    requires the session cookie to carry HttpOnly, Secure, SameSite=None and the
    CHIPS `Partitioned` attribute so browsers store it under the parent origin's
    partition key instead of silently dropping it as third-party."""
    suffix = int(time.time() * 1000)
    email = f"tscheck-cookieattrs-{suffix}@example.com"
    password = "Password#123"
    name = f"TSCheck CookieAttrs {suffix}"

    with httpx.Client(base_url=BASE_URL) as client:
        signup = client.post("/auth/signup", json={"name": name, "email": email, "password": password})
        assert signup.status_code == 200, signup.text

    login_client = httpx.Client(base_url=BASE_URL)
    try:
        login = login_client.post("/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200, login.text

        set_cookie_headers = login.headers.get_list("set-cookie") if hasattr(login.headers, "get_list") else [login.headers.get("set-cookie")]
        session_cookie_header = next((h for h in set_cookie_headers if h and h.startswith("cashcontrol_session=")), None)
        assert session_cookie_header, f"expected cashcontrol_session Set-Cookie header, got: {set_cookie_headers}"

        lowered = session_cookie_header.lower()
        assert "httponly" in lowered, session_cookie_header
        assert "secure" in lowered, session_cookie_header
        assert "samesite=none" in lowered, session_cookie_header
        assert "partitioned" in lowered, session_cookie_header
    finally:
        login_client.close()
