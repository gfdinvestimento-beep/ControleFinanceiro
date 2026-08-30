import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Dashboard from "@/pages/Dashboard";
import Entries from "@/pages/Entries";
import Cards from "@/pages/Cards";
import Annual from "@/pages/Annual";
import Login from "@/pages/Login";
import { apiGet } from "@/lib/api";
import { clearSessionHint, hasSessionHint, SessionContext, type AuthUser } from "@/lib/session";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  const shouldCheckSession = hasSessionHint();
  const auth = useQuery({ queryKey: ["auth"], queryFn: () => apiGet<AuthUser>("/auth/me"), retry: false, staleTime: 1000 * 60 * 5, enabled: shouldCheckSession });
  if (!shouldCheckSession) return <Login />;
  if (auth.isPending) return <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-sm text-slate-500" data-testid="auth-loading">Carregando seu espaço seguro...</div>;
  if (auth.isError || !auth.data) { clearSessionHint(); return <Login />; }
  return <SessionContext.Provider value={auth.data}><Routes><Route path="/" element={<Dashboard />} /><Route path="/lancamentos" element={<Entries />} /><Route path="/cartoes" element={<Cards />} /><Route path="/anual" element={<Annual />} /></Routes></SessionContext.Provider>;
}
