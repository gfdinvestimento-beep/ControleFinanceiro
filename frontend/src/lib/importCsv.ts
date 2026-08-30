import type { CreditCard, Transaction, TransactionType, PaymentMethod, CostClass } from "@/lib/finance";

const normalize = (value: string) => value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const valueFrom = (row: Record<string, string>, names: string[]) => names.map(normalize).map((name) => row[name]).find((value) => value !== undefined)?.trim() ?? "";

const splitCsvLine = (line: string, separator: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === separator && !quoted) { cells.push(current.trim()); current = ""; } else current += char;
  }
  cells.push(current.trim());
  return cells;
};

const parseDate = (value: string) => {
  const clean = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const match = clean.match(/^(\d{2})[\/.](\d{2})[\/.](\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
};

const parseAmount = (value: string) => {
  const clean = value.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  return Number(normalized.replace(/[^\d.-]/g, ""));
};

const matchValue = <T extends string>(value: string, map: Record<string, T>, fallback: T) => map[normalize(value)] ?? fallback;

export const parseTransactionsCsv = (text: string, cards: CreditCard[]) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { transactions: [] as Transaction[], skipped: 0 };
  const separator = (lines[0].match(/;/g) ?? []).length >= (lines[0].match(/,/g) ?? []).length ? ";" : ",";
  const headers = splitCsvLine(lines[0], separator).map(normalize);
  const transactions: Transaction[] = [];
  let skipped = 0;
  const types: Record<string, TransactionType> = { receita: "income", income: "income", entrada: "income", despesa: "expense", expense: "expense", saida: "expense" };
  const payments: Record<string, PaymentMethod> = { credito: "credit", credit: "credit", pix: "pix", dinheiro: "cash", cash: "cash", debito: "debit", debit: "debit" };
  const classes: Record<string, CostClass> = { fixo: "fixed", fixed: "fixed", variavel: "variable", variable: "variable", extra: "extra", adicional: "additional", additional: "additional" };
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line, separator);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const date = parseDate(valueFrom(row, ["data", "date"]));
    const amount = parseAmount(valueFrom(row, ["valor", "amount", "value"]));
    const description = valueFrom(row, ["descricao", "description", "historico", "history"]);
    if (!date || !description || !Number.isFinite(amount) || amount <= 0) { skipped += 1; continue; }
    const paymentMethod = matchValue(valueFrom(row, ["pagamento", "forma de pagamento", "payment"]), payments, "pix");
    const cardText = valueFrom(row, ["cartao", "cartão", "card"]);
    const card = cards.find((item) => normalize(item.name) === normalize(cardText));
    transactions.push({ id: crypto.randomUUID(), date, type: matchValue(valueFrom(row, ["tipo", "type"]), types, "expense"), category: valueFrom(row, ["categoria", "category"]) || "Outros", paymentMethod, cardId: paymentMethod === "credit" ? card?.id ?? "" : "", description, amount, costClass: matchValue(valueFrom(row, ["classificacao", "classificação", "cost class"]), classes, "variable") });
  }
  return { transactions, skipped };
};
