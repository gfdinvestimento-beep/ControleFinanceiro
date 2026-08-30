import type { CreditCard, Transaction } from "@/lib/finance";
import { formatDate } from "@/lib/finance";

export const exportTransactionsCsv = (transactions: Transaction[], cards: CreditCard[]) => {
  const cardName = (id: string) => cards.find((card) => card.id === id)?.name ?? "";
  const rows = [
    ["Data", "Tipo", "Categoria", "Pagamento", "Cartão", "Descrição", "Valor", "Classificação"],
    ...transactions.map((item) => [formatDate(item.date), item.type === "income" ? "Receita" : "Despesa", item.category, item.paymentMethod, cardName(item.cardId), item.description, item.amount.toFixed(2).replace(".", ","), item.costClass]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cashcontrol-lancamentos-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};
