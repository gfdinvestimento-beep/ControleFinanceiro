import { endSession } from "@/lib/session";

// No botão de Sair/Logout do seu componente:
const handleLogout = async () => {
  try {
    await endSession();
  } catch (error) {
    console.error("Erro ao deslogar:", error);
  }
};
