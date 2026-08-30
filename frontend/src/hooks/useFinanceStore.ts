import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createSeedData, type CreditCard, type FinanceData, type Installment, type Transaction } from "@/lib/finance";
import { apiGet, apiPut } from "@/lib/api";
import { useSession } from "@/lib/session";

const storageKey = (userId: string) => `cashcontrol-finance-data-v1-${userId}`;

const loadData = (key: string): FinanceData => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as FinanceData;
  } catch {
    // The app still renders with a clean seeded workspace if storage is unavailable.
  }
  return createSeedData();
};

export const useFinanceStore = () => {
  const user = useSession();
  const key = storageKey(user.id);
  const [data, setData] = useState<FinanceData>(() => loadData(key));
  const hydrated = useRef(false);
  const serverData = useQuery({ queryKey: ["finance", user.id], queryFn: () => apiGet<FinanceData>("/finance"), retry: false });
  const sync = useMutation({ mutationFn: (next: FinanceData) => apiPut<FinanceData>("/finance", next) });

  useEffect(() => {
    if (!serverData.data || hydrated.current) return;
    const local = loadData(key);
    const serverIsEmpty = !serverData.data.cards.length && !serverData.data.transactions.length && !serverData.data.installments.length;
    const next = serverIsEmpty ? local : serverData.data;
    setData(next);
    localStorage.setItem(key, JSON.stringify(next));
    if (serverIsEmpty) sync.mutate(next);
    hydrated.current = true;
  }, [key, serverData.data, sync]);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem(key, JSON.stringify(data));
  }, [data, key]);

  const update = useCallback((updater: (current: FinanceData) => FinanceData) => {
    setData((current) => {
      const next = updater(current);
      localStorage.setItem(key, JSON.stringify(next));
      sync.mutate(next);
      return next;
    });
  }, [key, sync]);

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
