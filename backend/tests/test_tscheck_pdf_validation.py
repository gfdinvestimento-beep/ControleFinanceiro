"""Criterion: Validação de PDF — non-PDF rejected, oversized PDF gets 413, unreadable PDF fails gracefully."""
import io
import uuid

import httpx

from tests.conftest import api_url


def _signed_in_client(suffix: str) -> httpx.Client:
    client = httpx.Client(base_url=api_url(""), timeout=30.0)
    email = f"tscheck-pdfval-{suffix}@example.com"
    resp = client.post("/auth/signup", json={"name": f"TSCheck Pdf {suffix}", "email": email, "password": "Password#123"})
    assert resp.status_code == 200, resp.text
    return client


def test_non_pdf_file_rejected():
    client = _signed_in_client(uuid.uuid4().hex[:8])
    try:
        files = {"file": ("note.txt", io.BytesIO(b"not a pdf"), "text/plain")}
        resp = client.post("/finance/pdf-preview", files=files)
        assert resp.status_code == 415, resp.text
        assert "PDF" in resp.json()["detail"]
    finally:
        client.close()


def test_oversized_pdf_rejected_with_413():
    client = _signed_in_client(uuid.uuid4().hex[:8])
    try:
        oversized = b"%PDF-1.4\n" + b"0" * (10 * 1024 * 1024 + 10)
        files = {"file": ("big.pdf", io.BytesIO(oversized), "application/pdf")}
        resp = client.post("/finance/pdf-preview", files=files)
        assert resp.status_code == 413, resp.text
    finally:
        client.close()


def test_unreadable_pdf_returns_friendly_422():
    client = _signed_in_client(uuid.uuid4().hex[:8])
    try:
        garbage = b"%PDF-1.4 this is not a real pdf structure" + b"\x00" * 200
        files = {"file": ("broken.pdf", io.BytesIO(garbage), "application/pdf")}
        resp = client.post("/finance/pdf-preview", files=files)
        assert resp.status_code == 422, resp.text
        assert "detail" in resp.json()
    finally:
        client.close()
