import { useCallback, useEffect, useState } from "react";
import { createSeedData, type CreditCard, type FinanceData, type Installment, type Transaction } from "@/lib/finance";

const STORAGE_KEY = "cashcontrol-finance-data-v1";

const loadData = (): FinanceData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as FinanceData;
  } catch {
    // The app still renders with a clean seeded workspace if storage is unavailable.
  }
  return createSeedData();
};

export const useFinanceStore = () => {
  const [data, setData] = useState<FinanceData>(() => loadData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback((updater: (current: FinanceData) => FinanceData) => {
    setData((current) => updater(current));
  }, []);

  const saveTransaction = useCallback((item: Transaction) => update((current) => ({
    ...current,
    transactions: [item, ...current.transactions.filter((entry) => entry.id !== item.id)],
  })), [update]);

  const importTransactions = useCallback((items: Transaction[]) => update((current) => ({
    ...current,
    transactions: [...items, ...current.transactions],
  })), [update]);

  const removeTransaction = useCallback((id: string) => update((current) => ({
    ...current,
    transactions: current.transactions.filter((entry) => entry.id !== id),
  })), [update]);

  const saveCard = useCallback((item: CreditCard) => update((current) => ({
    ...current,
    cards: [item, ...current.cards.filter((entry) => entry.id !== item.id)],
  })), [update]);

  const removeCard = useCallback((id: string) => update((current) => ({
    ...current,
    cards: current.cards.filter((entry) => entry.id !== id),
    transactions: current.transactions.map((item) => item.cardId === id ? { ...item, cardId: "" } : item),
    installments: current.installments.map((item) => item.cardId === id ? { ...item, cardId: "" } : item),
  })), [update]);

  const saveInstallment = useCallback((item: Installment) => update((current) => ({
    ...current,
    installments: [item, ...current.installments.filter((entry) => entry.id !== item.id)],
  })), [update]);

  const removeInstallment = useCallback((id: string) => update((current) => ({
    ...current,
    installments: current.installments.filter((entry) => entry.id !== id),
  })), [update]);

  return { data, saveTransaction, importTransactions, removeTransaction, saveCard, removeCard, saveInstallment, removeInstallment };
};
