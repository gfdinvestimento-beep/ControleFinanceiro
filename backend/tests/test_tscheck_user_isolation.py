"""Criterion: Isolamento entre usuários — two users never see each other's finance data."""
import uuid

import httpx

from tests.conftest import api_url


def _signup(suffix: str) -> httpx.Client:
    client = httpx.Client(base_url=api_url(""), timeout=30.0)
    email = f"tscheck-isolation-{suffix}@example.com"
    resp = client.post("/auth/signup", json={"name": f"TSCheck {suffix}", "email": email, "password": "Password#123"})
    assert resp.status_code == 200, resp.text
    return client


def test_two_users_do_not_share_finance_data():
    suffix_a = uuid.uuid4().hex[:8]
    suffix_b = uuid.uuid4().hex[:8]
    client_a = _signup(suffix_a)
    client_b = _signup(suffix_b)
    try:
        tx_id = f"tscheck-isolation-tx-{suffix_a}"
        payload_a = {
            "cards": [],
            "transactions": [
                {
                    "id": tx_id,
                    "date": "2026-01-15",
                    "type": "expense",
                    "category": "Outros",
                    "paymentMethod": "pix",
                    "cardId": "",
                    "description": f"tscheck isolation {suffix_a}",
                    "amount": 42.5,
                    "costClass": "variable",
                }
            ],
            "installments": [],
        }
        put_resp = client_a.put("/finance", json=payload_a)
        assert put_resp.status_code == 200, put_resp.text
        assert put_resp.json()["transactions"][0]["id"] == tx_id

        # User A sees their own transaction.
        get_a = client_a.get("/finance")
        assert get_a.status_code == 200
        assert any(t["id"] == tx_id for t in get_a.json()["transactions"])

        # User B's own GET must not contain user A's transaction.
        get_b = client_b.get("/finance")
        assert get_b.status_code == 200
        assert all(t["id"] != tx_id for t in get_b.json()["transactions"])
    finally:
        client_a.close()
        client_b.close()


def test_finance_requires_authenticated_session():
    anon = httpx.Client(base_url=api_url(""), timeout=30.0)
    try:
        resp = anon.get("/finance")
        assert resp.status_code == 401
    finally:
        anon.close()
