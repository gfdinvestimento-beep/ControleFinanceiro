"""Criterion: Importação PDF com revisão — a textual PDF row (date, description, amount)
is recognized by /finance/pdf-preview so the frontend can offer it for review."""
import uuid
from pathlib import Path

import httpx

from tests.conftest import api_url

FIXTURE_PDF = Path(__file__).parent / "fixtures" / "tscheck_sample.pdf"


def test_pdf_preview_extracts_date_description_amount():
    client = httpx.Client(base_url=api_url(""), timeout=30.0)
    try:
        email = f"tscheck-pdfimport-{uuid.uuid4().hex[:8]}@example.com"
        signup = client.post("/auth/signup", json={"name": "TSCheck Pdf Import", "email": email, "password": "Password#123"})
        assert signup.status_code == 200, signup.text

        with open(FIXTURE_PDF, "rb") as fh:
            resp = client.post("/finance/pdf-preview", files={"file": ("extrato.pdf", fh, "application/pdf")})
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert len(body["rows"]) == 1, body
        row = body["rows"][0]
        assert row["date"] == "2026-01-15"
        assert "Mercado" in row["description"]
        assert row["amount"] == 125.50
    finally:
        client.close()
