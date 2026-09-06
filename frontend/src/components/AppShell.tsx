import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, CreditCard, Download, LayoutDashboard, LogOut, Menu, ReceiptText, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { exportTransactionsCsv } from "@/lib/export";
import { useFinanceStore } from "@/hooks/useFinanceStore";
import { endSession, useSession } from "@/lib/session";

const navItems = [
  { href: "/", label: "Dashboard mensal", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ReceiptText },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/anual", label: "Visão anual", icon: BarChart3 },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data, resetState } = useFinanceStore();
  const user = useSession();

  const handleExport = () => exportTransactionsCsv(data.transactions, data.cards);

  const handleLogout = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error("Erro ao encerrar sessão no backend:", error);
    } finally {
      if (typeof resetState === "function") {
        resetState();
      }
      localStorage.clear();
      window.location.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 selection:bg-cyan-800/60">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800/80 bg-slate-950/95 px-5 py-6 backdrop-blur-xl transition-transform duration-200 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} data-testid="app-sidebar">
        <div className="mb-12 flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)} data-testid="brand-home-link">
            <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-800 text-cyan-100 shadow-[0_0_26px_rgba(8,145,178,0.25)]" data-testid="brand-mark"><Sparkles size={19} /></span>
            <span><span className="block font-heading text-lg font-semibold tracking-tight text-white" data-testid="brand-name">CashControl</span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500" data-testid="brand-tagline">Personal finance</span></span>
          </Link>
          <button className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" data-testid="mobile-close-button"><X size={18} /></button>
        </div>
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="navigation-label">Navegação</p>
        <nav className="space-y-1.5" aria-label="Navegação principal" data-testid="main-navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location.pathname === href;
            return <Link key={href} to={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors duration-200 ${active ? "border-cyan-800/60 bg-cyan-950/50 text-cyan-200" : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100"}`} data-testid={`nav-${label.toLowerCase().replaceAll(" ", "-")}-link`}><Icon size={18} className={active ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"} /><span>{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-cyan-400" />}</Link>;
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4" data-testid="sidebar-tip-card">
            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400"><Sparkles size={15} /></div>
            <p className="font-heading text-sm font-semibold text-slate-200" data-testid="sidebar-tip-title">Clareza financeira</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500" data-testid="sidebar-tip-copy">Acompanhe seus hábitos e transforme intenção em plano.</p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3" data-testid="account-card">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200" data-testid="account-name">{user?.name || "Usuário"}</p>
              <p className="truncate text-[10px] text-slate-600" data-testid="account-email">{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} className="rounded-md p-2 text-slate-500 transition-colors duration-200 hover:bg-rose-950/60 hover:text-rose-300" aria-label="Sair da conta" data-testid="logout-button">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/70 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" data-testid="mobile-overlay" />}
      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#070b12]/90 px-4 backdrop-blur-xl md:hidden" data-testid="mobile-header">
        <button className="rounded-md p-2 text-slate-300 hover:bg-slate-800" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" data-testid="mobile-menu-button"><Menu size={20} /></button>
        <span className="font-heading text-sm font-semibold text-slate-100" data-testid="mobile-title">CashControl</span>
        <button className="rounded-md p-2 text-slate-300 hover:bg-slate-800" onClick={handleExport} aria-label="Exportar dados" data-testid="mobile-export-button"><Download size={17} /></button>
      </header>
      <main className="min-h-screen px-4 pb-12 pt-20 md:ml-72 md:px-8 md:pt-8" data-testid="app-main">
        <div className="mx-auto max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
