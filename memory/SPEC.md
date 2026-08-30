# CashControl — living spec

## What it does
Local-first personal finance dashboard in Portuguese with monthly, credit-card and annual views. The dashboard consolidates direct transactions and active installments, calculates invoice competence from each card's closing day, and exposes the 50/30/20 rule plus emergency-fund targets.

## Data model
- `CreditCard`: id, name, limit, closingDay, dueDay. Maximum five cards.
- `Transaction`: id, date, type (income/expense), category, paymentMethod, cardId, description, amount, costClass.
- `Installment`: id, purchaseDate, cardId, category, description, totalAmount, installments (2–12), costClass.

## Key flows
- Dashboard mensal (`/`) starts with seeded demo data: five transactions, one card and one four-part installment. Month selector drives all summaries and charts.
- Lançamentos (`/lancamentos`) supports add/edit/delete for transactions, cards and installments, quick filters, conditional credit-card selection and CSV export.
- Cartões (`/cartoes`) shows invoice totals, available limit and charts per selected month.
- Visão anual (`/anual`) shows the category × month matrix, cash-flow lines and essential-cost bars against the annual average.
- Data is persisted in browser localStorage under `cashcontrol-finance-data-v1`; deleting a card clears its links from transactions and installments.
- CSV export and CSV bank-statement import are local browser actions; imported rows are normalized into the same transaction store. PDF import is not included.
- Monthly Insights are deterministic recommendations derived from the selected month's income, expense classes, top categories and net savings.

## Business rules
- Credit purchase is assigned to the purchase month when purchase day is <= card closing day; otherwise it is assigned to the next month.
- Installment rows begin in that invoice month and advance one month per installment.
- Essential cost is fixed + variable expenses. CLT reserve = essential × 6; autonomous reserve = essential × 12.
- Needs are fixed/variable, wants are extra/additional, and future is net savings. Percentages use monthly income as denominator.

## Auth and roles
No authentication, accounts or role gates in this MVP. It is a single local browser workspace.