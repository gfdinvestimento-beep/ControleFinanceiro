import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Lightbulb, PiggyBank, Receipt, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppShell from "@/components/AppShell";
import MetricCard from "@/components/MetricCard";
import MonthSelect from "@/components/MonthSelect";
import { useFinanceStore } from "@/hooks/useFinanceStore";
import { currentMonth, expenseTotals, expensesForMonth, formatCurrency, monthLabel, incomeForMonth, PAYMENT_METHODS } from "@/lib/finance";
import { exportTransactionsCsv } from "@/lib/export";

const chartColors = ["#22d3ee", "#38bdf8", "#0e7490", "#64748b", "#f59e0b", "#fb7185", "#a5b4fc"];

export default function Dashboard() {
  const { data } = useFinanceStore();
  const [month, setMonth] = useState(currentMonth());
  const expenses = useMemo(() => expensesForMonth(data, month), [data, month]);
  const totals = useMemo(() => expenseTotals(expenses), [expenses]);
  const income = useMemo(() => incomeForMonth(data, month), [data, month]);
  const balance = income - totals.total;
  const savingsPercent = income ? (balance / income) * 100 : 0;
  const categories = useMemo(() => Object.entries(expenses.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + item.amount }), {})).map(([name, value]) => ({ name, value })), [expenses]);
  const payments = useMemo(() => PAYMENT_METHODS.map((method) => ({ name: method.label, value: expenses.filter((item) => item.paymentMethod === method.value).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.value > 0), [expenses]);
  const needsPercent = income ? (totals.essential / income) * 100 : 0;
  const wantsPercent = income ? (totals.wants / income) * 100 : 0;
  const ruleRows = [
    { name: "Necessidades", description: "Fixo + Variável", total: totals.essential, percent: needsPercent, goal: 50, healthy: needsPercent <= 50, color: "cyan" },
    { name: "Desejos", description: "Extra + Adicional", total: totals.wants, percent: wantsPercent, goal: 30, healthy: wantsPercent <= 30, color: "amber" },
    { name: "Futuro / Poupança", description: "Receitas − Despesas", total: Math.max(balance, 0), percent: savingsPercent, goal: 20, healthy: savingsPercent >= 20, color: "emerald" },
  ];
  const insights = useMemo(() => {
    const rankedCategory = [...categories].sort((a, b) => b.value - a.value)[0];
    const items: string[] = [];
    if (!income) items.push("Adicione uma receita no período para acompanhar sua taxa de economia.");
    else if (needsPercent > 50) items.push(`Necessidades estão em ${needsPercent.toFixed(1)}% da receita. Revise ${rankedCategory?.name ?? "as maiores categorias"} primeiro.`);
    else items.push(`Necessidades em ${needsPercent.toFixed(1)}%: você está dentro da meta de 50% neste mês.`);
    if (wantsPercent > 30) items.push(`Desejos passaram da meta em ${ (wantsPercent - 30).toFixed(1) } p.p.; experimente definir um teto para gastos extras.`);
    else items.push(`Há espaço nos desejos: ${wantsPercent.toFixed(1)}% da receita contra uma meta de 30%.`);
    if (balance < 0) items.push("O mês está negativo. Priorize despesas essenciais e pause compras não planejadas.");
    else if (savingsPercent >= 20) items.push(`Ótimo ritmo de poupança: ${savingsPercent.toFixed(1)}% da receita ficou livre no período.`);
    else items.push(`Sua economia está em ${savingsPercent.toFixed(1)}%. Um pequeno ajuste já aproxima você da meta de 20%.`);
    return items;
  }, [balance, categories, income, needsPercent, savingsPercent, wantsPercent]);

  return <AppShell>
    <div className="animate-[page-in_400ms_ease-out]" data-testid="monthly-dashboard-page">
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-800/80 pb-7 sm:flex-row sm:items-end" data-testid="dashboard-header">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-500" data-testid="dashboard-eyebrow">Visão geral · {monthLabel(month)}</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl" data-testid="dashboard-title">Seu dinheiro, em perspectiva.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400" data-testid="dashboard-description">Uma leitura objetiva do seu mês para tomar decisões com mais tranquilidade.</p></div>
        <div className="flex flex-wrap items-center gap-3"><MonthSelect value={month} onChange={setMonth} /><Button variant="outline" onClick={() => exportTransactionsCsv(data.transactions, data.cards)} className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white" data-testid="dashboard-export-csv-button"><Download size={15} /> Exportar CSV</Button></div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo financeiro" data-testid="monthly-summary-cards">
        <MetricCard label="Receitas totais" value={formatCurrency(income)} detail={`${data.transactions.filter((item) => item.type === "income" && item.date.startsWith(month)).length} lançamentos no período`} icon={ArrowUpRight} tone="emerald" />
        <MetricCard label="Despesas totais" value={formatCurrency(totals.total)} detail={`${expenses.length} itens consolidados`} icon={ArrowDownRight} tone="rose" />
        <MetricCard label="Saldo líquido" value={formatCurrency(balance)} detail={balance >= 0 ? "Mês fechando no azul" : "Atenção ao ritmo de gastos"} icon={Wallet} tone={balance >= 0 ? "cyan" : "rose"} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]" data-testid="budget-analysis-section">
        <Card className="border-slate-800 bg-slate-900/85" data-testid="rule-503020-card"><CardHeader className="border-b border-slate-800/80"><div className="flex items-center justify-between"><div><CardTitle className="font-heading text-lg text-slate-100" data-testid="rule-503020-title">Regra 50 / 30 / 20</CardTitle><p className="mt-1 text-sm text-slate-500" data-testid="rule-503020-description">Como o seu dinheiro está sendo distribuído</p></div><span className="rounded-lg bg-cyan-950/60 px-2.5 py-1 text-xs font-semibold text-cyan-300" data-testid="rule-503020-goal">Meta mensal</span></div></CardHeader><CardContent className="p-0"><div className="divide-y divide-slate-800/80" data-testid="rule-503020-table">
          {ruleRows.map((row) => <div key={row.name} className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-slate-800/30" data-testid={`rule-row-${row.name.toLowerCase().replaceAll(" ", "-")}`}><div><p className="font-medium text-slate-200">{row.name}</p><p className="mt-1 text-xs text-slate-500">{row.description}</p></div><div><div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-400">{formatCurrency(row.total)}</span><span className="text-slate-500">meta {row.goal}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${row.color === "amber" ? "bg-amber-400" : row.color === "emerald" ? "bg-emerald-400" : "bg-cyan-400"}`} style={{ width: `${Math.min(Math.max(row.percent, 0), 100)}%` }} /></div></div><div className="text-right"><p className="font-heading text-lg font-semibold text-slate-100">{row.percent.toFixed(1)}%</p><Badge variant="outline" className={`mt-1 whitespace-nowrap ${row.healthy ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-rose-500/25 bg-rose-500/10 text-rose-400"}`} data-testid={`rule-status-${row.name.toLowerCase().replaceAll(" ", "-")}`}>{row.healthy ? "✅ Saudável" : row.name === "Futuro / Poupança" ? "❌ Muito abaixo" : `❌ Acima de ${row.goal}%`}</Badge></div></div>)}
        </div></CardContent></Card>
        <Card className="border-slate-800 bg-slate-900/85" data-testid="emergency-fund-card"><CardHeader className="border-b border-slate-800/80"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400"><PiggyBank size={17} /></span><div><CardTitle className="font-heading text-lg text-slate-100" data-testid="emergency-fund-title">Reserva de emergência</CardTitle><p className="mt-1 text-sm text-slate-500" data-testid="emergency-fund-description">Proteção baseada no essencial</p></div></div></CardHeader><CardContent className="space-y-5 p-5"><div><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Custo de vida essencial</p><p className="mt-2 font-heading text-2xl font-semibold text-slate-50" data-testid="essential-cost-value">{formatCurrency(totals.essential)}</p><p className="mt-1 text-xs text-slate-500">Despesas fixas e variáveis do mês</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3" data-testid="clt-reserve-value"><p className="text-[10px] uppercase tracking-wider text-slate-500">6 meses</p><p className="mt-2 font-heading text-base font-semibold text-cyan-300">{formatCurrency(totals.essential * 6)}</p></div><div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3" data-testid="autonomo-reserve-value"><p className="text-[10px] uppercase tracking-wider text-slate-500">12 meses</p><p className="mt-2 font-heading text-base font-semibold text-cyan-300">{formatCurrency(totals.essential * 12)}</p></div></div></CardContent></Card>
      </section>

      <section className="mt-6" data-testid="monthly-insights-section"><Card className="border-slate-800 bg-slate-900/85" data-testid="monthly-insights-card"><CardHeader className="border-b border-slate-800/80"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-amber-950/50 text-amber-400"><Lightbulb size={17} /></span><div><CardTitle className="font-heading text-lg text-slate-100" data-testid="monthly-insights-title">Insights mensais</CardTitle><p className="mt-1 text-sm text-slate-500" data-testid="monthly-insights-description">Recomendações baseadas nos seus dados locais</p></div></div></CardHeader><CardContent className="grid gap-3 p-5 md:grid-cols-3">{insights.map((insight, index) => <div key={insight} className="rounded-lg border border-slate-800 bg-slate-950/45 p-4" data-testid={`monthly-insight-${index + 1}`}><p className="text-sm leading-relaxed text-slate-300">{insight}</p></div>)}</CardContent></Card></section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" data-testid="monthly-charts-section">
        <Card className="border-slate-800 bg-slate-900/85" data-testid="income-expense-chart-card"><CardHeader><CardTitle className="font-heading text-base text-slate-100">Receitas vs despesas</CardTitle><p className="text-sm text-slate-500">Comparativo do período selecionado</p></CardHeader><CardContent><div className="h-64" data-testid="income-expense-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: monthLabel(month, true), Receitas: income, Despesas: totals.total }]} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Number(value) / 1000}k`} /><Tooltip cursor={{ fill: "#1e293b", opacity: 0.35 }} contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} /><Legend /><Bar dataKey="Receitas" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={700} /><Bar dataKey="Despesas" fill="#22d3ee" radius={[4, 4, 0, 0]} animationDuration={700} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-slate-800 bg-slate-900/85" data-testid="category-chart-card"><CardHeader><CardTitle className="font-heading text-base text-slate-100">Despesas por categoria</CardTitle><p className="text-sm text-slate-500">Onde o orçamento encontrou destino</p></CardHeader><CardContent><div className="h-64" data-testid="category-donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={3} animationDuration={800}>{categories.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /></PieChart></ResponsiveContainer></div></CardContent></Card>
      </section>
      <section className="mt-6"><Card className="border-slate-800 bg-slate-900/85" data-testid="payment-chart-card"><CardHeader><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-cyan-400"><Receipt size={17} /></span><div><CardTitle className="font-heading text-base text-slate-100">Gastos por forma de pagamento</CardTitle><p className="text-sm text-slate-500">Inclui parcelas faturadas no período</p></div></div></CardHeader><CardContent><div className="h-56" data-testid="payment-method-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={payments} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Number(value) / 1000}k`} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} /><Bar dataKey="value" name="Valor" fill="#38bdf8" radius={[4, 4, 0, 0]} animationDuration={700} /></BarChart></ResponsiveContainer></div></CardContent></Card></section>
      <p className="mt-8 text-xs text-slate-600" data-testid="dashboard-data-note">Atualizado localmente · {expenses.length} despesas consolidadas entre lançamentos e parcelas ativas.</p>
    </div>
  </AppShell>;
}
