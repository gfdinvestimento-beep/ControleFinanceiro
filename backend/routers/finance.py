import re

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pypdf import PdfReader

from lib.auth import current_user
from lib.db import db
from models.auth import UserPublic
from models.finance import FinanceDataModel, PdfImportPreview, PdfImportRow

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("", response_model=FinanceDataModel)
async def get_finance(user: UserPublic = Depends(current_user)):
    record = await db.finances.find_one({"user_id": user.id})
    return FinanceDataModel(**record["data"]) if record else FinanceDataModel()


@router.put("", response_model=FinanceDataModel)
async def save_finance(data: FinanceDataModel, user: UserPublic = Depends(current_user)):
    await db.finances.update_one({"user_id": user.id}, {"$set": {"data": data.model_dump(), "user_id": user.id}}, upsert=True)
    return data


@router.post("/pdf-preview", response_model=PdfImportPreview)
async def pdf_preview(file: UploadFile = File(...), user: UserPublic = Depends(current_user)):
    if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Envie um arquivo PDF")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="O PDF deve ter no máximo 10 MB")
    try:
        reader = PdfReader(file.file)
        text = "\n".join(page.extract_text() or "" for page in list(reader.pages)[:50])
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Não foi possível ler o PDF: {exc}")
    rows: list[PdfImportRow] = []
    skipped = 0
    pattern = re.compile(r"(?P<date>\d{2}[/.]\d{2}[/.]\d{4}).*?(?P<amount>-?R?\$?\s?[\d.]+,\d{2}|-?[\d.]+,\d{2})\s*$")
    for line in text.splitlines():
        match = pattern.search(line.strip())
        if not match:
            continue
        raw_date = match.group("date").replace(".", "/")
        day, month, year = raw_date.split("/")
        raw_amount = match.group("amount").replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
        amount = abs(float(raw_amount))
        description = line[: match.start("amount")].replace(match.group("date"), "").strip(" -·")
        if not description or amount <= 0:
            skipped += 1
            continue
        rows.append(PdfImportRow(date=f"{year}-{month}-{day}", description=description[:140], amount=amount))
    return PdfImportPreview(rows=rows, extractedText=text[:12000], skipped=skipped)
