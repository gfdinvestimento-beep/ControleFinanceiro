import React from "react";
import { endSession } from "@/lib/session";
import { LogOut } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const handleLogout = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex">
      <main className="flex-1 p-6">
        {children}
        <button 
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400"
        >
          <LogOut size={16} />
          Sair
        </button>
      </main>
    </div>
  );
}

export default AppShell;
