import { useState, type FormEvent } from "react";
import { LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost, ApiError } from "@/lib/api";
import { beginSession, type AuthUser } from "@/lib/session";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiPost<AuthUser>(
        mode === "login" ? "/auth/login" : "/auth/signup", 
        mode === "login" ? { email, password } : { name, email, password }
      );
      beginSession();
      window.location.assign("/");
    } catch (caught) {
      if (caught instanceof ApiError) {
        const detail = caught.body && typeof caught.body === "object" && "detail" in caught.body 
          ? String((caught.body as Record<string, unknown>).detail) 
          : caught.message;
        setError(detail || "Não foi possível concluir. Tente novamente.");
      } else if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("Não foi possível concluir. Tente novamente.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b12] px-5 py-10 text-slate-100" data-testid="login-page">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block" data-testid="login-brand-panel">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-800 text-cyan-100 shadow-[0_0_26px_rgba(8,145,178,0.25)]">
              <Sparkles size={20} />
            </span>
            <span className="font-heading text-xl font-semibold">CashControl</span>
          </div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-500">Personal finance, com clareza</p>
          <h1 className="max-w-lg font-heading text-5xl font-semibold leading-[1.05] tracking-tight text-slate-50">Seu dinheiro merece um espaço só dele.</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">Tenha seus lançamentos, cartões e metas organizados em um ambiente privado e sincronizado.</p>
          <div className="mt-10 grid gap-3">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <ShieldCheck size={17} className="text-emerald-400" /> Dados isolados por conta
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <LockKeyhole size={17} className="text-cyan-400" /> Sessão protegida por cookie httpOnly
            </div>
          </div>
        </section>
        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20 sm:p-8" data-testid="login-card">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-800 text-cyan-100">
                <Sparkles size={18} />
              </span>
              <span className="font-heading text-lg font-semibold">CashControl</span>
            </div>
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">Área privada</p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-slate-50" data-testid="login-title">
            {mode === "login" ? "Bem-vindo de volta" : "Crie seu espaço"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500" data-testid="login-description">
            {mode === "login" ? "Entre para acessar seus dados financeiros." : "Uma conta para manter sua vida financeira no lugar."}
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4" data-testid="auth-form">
            {mode === "signup" && (
              <label className="block" data-testid="auth-name-field">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Seu nome</span>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3 text-slate-600" size={16} />
                  <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-10 pr-3 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-cyan-700" placeholder="Como podemos chamar você?" required minLength={2} data-testid="auth-name-input" />
                </div>
              </label>
            )}
            <label className="block" data-testid="auth-email-field">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">E-mail</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-600" size={16} />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-10 pr-3 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-cyan-700" placeholder="voce@email.com" required data-testid="auth-email-input" />
              </div>
            </label>
            <label className="block" data-testid="auth-password-field">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Senha</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 text-slate-600" size={16} />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-10 pr-3 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-cyan-700" placeholder="Mínimo de 8 caracteres" required minLength={8} data-testid="auth-password-input" />
              </div>
            </label>
            {error && (
              <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert" data-testid="auth-error">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="h-10 w-full bg-cyan-800 text-white hover:bg-cyan-700" data-testid="auth-submit-button">
              {busy ? "Aguarde..." : mode === "login" ? "Entrar com segurança" : "Criar minha conta"}
            </Button>
          </form>
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="mt-6 w-full text-center text-sm text-slate-500 transition-colors duration-200 hover:text-cyan-300" data-testid="auth-mode-toggle">
            {mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}
          </button>
        </section>
      </div>
    </main>
  );
}
