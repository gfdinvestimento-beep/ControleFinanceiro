// Session boundary: auth is an httpOnly cookie the backend owns; the frontend's one
// duty is wiping the react-query cache so one account's data never renders for the next.
import { queryClient } from "./queryClient";
import { apiPost } from "./api";
import { createContext, useContext } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export const SessionContext = createContext<AuthUser | null>(null);

export const useSession = () => {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSession must be used inside SessionContext");
  return user;
};

const SESSION_HINT = "cashcontrol-session-active";

export const hasSessionHint = () => localStorage.getItem(SESSION_HINT) === "1";
export const clearSessionHint = () => localStorage.removeItem(SESSION_HINT);

// Call after every successful login/signup.
export function beginSession(): void {
  queryClient.clear();
  localStorage.setItem(SESSION_HINT, "1");
}

// Call from every sign-out control; the hard redirect resets all in-memory state.
export async function endSession(redirectTo: string = "/login"): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } finally {
    queryClient.clear();
    clearSessionHint();
    window.location.assign(redirectTo);
  }
}
