export type TransactionType = "income" | "expense";
export type PaymentMethod = "credit" | "pix" | "cash" | "debit";
export type CostClass = "fixed" | "variable" | "extra" | "additional";

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  cardId: string;
  description: string;
  amount: number;
  costClass: CostClass;
}

export interface Installment {
  id: string;
  purchaseDate: string;
  cardId: string;
  category: string;
  description: string;
  totalAmount: number;
  installments: number;
  costClass: CostClass;
}

export interface FinanceData {
  cards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
}

export interface MonthlyExpense {
  id: string;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  amount: number;
  costClass: CostClass;
  cardId: string;
  source: "transaction" | "installment";
}

export const CATEGORIES = [
  "Salário",
  "Investimentos",
  "Outras Receitas",
  "Moradia",
  "Supermercado",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Viagem",
  "Outros",
] as const;

export const COST_CLASSES: { value: CostClass; label: string; hint: string; color: string }[] = [
  { value: "fixed", label: "Fixo", hint: "Contas recorrentes e previsíveis", color: "cyan" },
  { value: "variable", label: "Variável", hint: "Essenciais que mudam mês a mês", color: "sky" },
  { value: "extra", label: "Extra", hint: "Escolhas e desejos planejados", color: "amber" },
  { value: "additional", label: "Adicional", hint: "Gastos fora do plano", color: "rose" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "credit", label: "Crédito" },
  { value: "pix", label: "Pix" },
  { value: "cash", label: "Dinheiro" },
  { value: "debit", label: "Débito" },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
};

export const monthKey = (value: string) => value.slice(0, 7);

export const monthLabel = (key: string, short = false) => {
  const [year, month] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: short ? "short" : "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", "/");
};

export const addMonths = (key: string, count: number) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + count, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const invoiceMonth = (date: string, card?: CreditCard) => {
  const base = monthKey(date);
  if (card && Number(date.slice(8, 10)) > card.closingDay) return addMonths(base, 1);
  return base;
};

export const installmentRowsForMonth = (data: FinanceData, month: string): MonthlyExpense[] =>
  data.installments.flatMap((item) => {
    const card = data.cards.find((entry) => entry.id === item.cardId);
    const firstMonth = invoiceMonth(item.purchaseDate, card);
    const rows: (MonthlyExpense | null)[] = Array.from({ length: item.installments }, (_, index) => {
      const rowMonth = addMonths(firstMonth, index);
      if (rowMonth !== month) return null;
      return {
        id: `${item.id}-${index + 1}`,
        date: item.purchaseDate,
        category: item.category,
        paymentMethod: "credit",
        description: `${item.description} · ${index + 1}/${item.installments}`,
        amount: item.totalAmount / item.installments,
        costClass: item.costClass,
        cardId: item.cardId,
        source: "installment",
      };
    });
    return rows.filter((row): row is MonthlyExpense => row !== null);
  });

export const expensesForMonth = (data: FinanceData, month: string): MonthlyExpense[] => {
  const direct = data.transactions
    .filter((item) => item.type === "expense")
    .filter((item) => {
      if (item.paymentMethod === "credit") {
        return invoiceMonth(item.date, data.cards.find((card) => card.id === item.cardId)) === month;
      }
      return monthKey(item.date) === month;
    })
    .map((item) => ({ ...item, source: "transaction" as const }));
  return [...direct, ...installmentRowsForMonth(data, month)];
};

export const incomeForMonth = (data: FinanceData, month: string) =>
  data.transactions
    .filter((item) => item.type === "income" && monthKey(item.date) === month)
    .reduce((total, item) => total + item.amount, 0);

export const expenseTotals = (expenses: MonthlyExpense[]) => ({
  total: expenses.reduce((total, item) => total + item.amount, 0),
  essential: expenses
    .filter((item) => item.costClass === "fixed" || item.costClass === "variable")
    .reduce((total, item) => total + item.amount, 0),
  wants: expenses
    .filter((item) => item.costClass === "extra" || item.costClass === "additional")
    .reduce((total, item) => total + item.amount, 0),
});

const isoDate = (offset: number, day: number) => {
  const date = new Date();
  date.setDate(Math.max(1, date.getDate() + offset));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const createSeedData = (): FinanceData => {
  const cardId = "seed-card-nubank";
  return {
    cards: [{ id: cardId, name: "Nubank Platinum", limit: 8500, closingDay: 15, dueDay: 25 }],
    transactions: [
      { id: "seed-income", date: isoDate(0, 5), type: "income", category: "Salário", paymentMethod: "pix", cardId: "", description: "Salário mensal", amount: 9200, costClass: "fixed" },
      { id: "seed-rent", date: isoDate(0, 7), type: "expense", category: "Moradia", paymentMethod: "pix", cardId: "", description: "Aluguel e condomínio", amount: 2400, costClass: "fixed" },
      { id: "seed-market", date: isoDate(-2, 9), type: "expense", category: "Supermercado", paymentMethod: "debit", cardId: "", description: "Compras da semana", amount: 486.4, costClass: "variable" },
      { id: "seed-health", date: isoDate(-5, 12), type: "expense", category: "Saúde", paymentMethod: "credit", cardId, description: "Farmácia", amount: 168.9, costClass: "variable" },
      { id: "seed-leisure", date: isoDate(-7, 18), type: "expense", category: "Lazer", paymentMethod: "pix", cardId: "", description: "Jantar de sexta", amount: 214, costClass: "extra" },
    ],
    installments: [{ id: "seed-installment", purchaseDate: isoDate(-10, 11), cardId, category: "Viagem", description: "Passagens de férias", totalAmount: 2400, installments: 4, costClass: "extra" }],
  };
};
