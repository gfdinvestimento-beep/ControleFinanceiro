from typing import Literal
from pydantic import BaseModel, Field


class CreditCardModel(BaseModel):
    id: str
    name: str
    limit: float
    closingDay: int
    dueDay: int


class TransactionModel(BaseModel):
    id: str
    date: str
    type: Literal["income", "expense"]
    category: str
    paymentMethod: Literal["credit", "pix", "cash", "debit"]
    cardId: str
    description: str
    amount: float
    costClass: Literal["fixed", "variable", "extra", "additional"]


class InstallmentModel(BaseModel):
    id: str
    purchaseDate: str
    cardId: str
    category: str
    description: str
    totalAmount: float
    installments: int = Field(ge=2, le=12)
    costClass: Literal["fixed", "variable", "extra", "additional"]


class FinanceDataModel(BaseModel):
    cards: list[CreditCardModel] = Field(default_factory=list)
    transactions: list[TransactionModel] = Field(default_factory=list)
    installments: list[InstallmentModel] = Field(default_factory=list)


class PdfImportRow(BaseModel):
    date: str
    description: str
    amount: float
    type: Literal["income", "expense"] = "expense"
    category: str = "Outros"
    paymentMethod: Literal["credit", "pix", "cash", "debit"] = "pix"
    cardId: str = ""
    costClass: Literal["fixed", "variable", "extra", "additional"] = "variable"


class PdfImportPreview(BaseModel):
    rows: list[PdfImportRow]
    extractedText: str
    skipped: int
