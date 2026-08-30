import type { CostClass, PaymentMethod, TransactionType } from "@/lib/finance";

export interface PdfImportRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  cardId: string;
  costClass: CostClass;
}

export interface PdfImportPreview {
  rows: PdfImportRow[];
  extractedText: string;
  skipped: number;
}
