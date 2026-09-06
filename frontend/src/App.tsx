import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Dashboard from "@/pages/Dashboard";
import Entries from "@/pages/Entries";
import Cards from "@/pages/Cards";
import Annual from "@/pages/Annual";
import Login from "@/pages/Login";
import { apiGet } from "@/lib/api";
import { SessionContext, type AuthUser } from "@/lib/session";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  const auth = useQuery({
    queryKey: ["auth"],
    queryFn: () => apiGet<AuthUser | null>("/auth/session"),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (auth.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-sm text-slate-500" data-testid="auth-loading">
        Carregando seu espaço seguro...
      </div>
    );
  }

  if (auth.isError || !auth.data) {
    return <Login />;
  }

  return (
    <SessionContext.Provider value={auth.data}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lancamentos" element={<Entries />} />
        <Route path="/cartoes" element={<Cards />} />
        <Route path="/anual" element={<Annual />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionContext.Provider>
  );
}
