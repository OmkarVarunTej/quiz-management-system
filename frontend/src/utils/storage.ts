import { AuthUser } from "@/types";

const TOKEN_KEY = "qms_token";
const USER_KEY = "qms_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};
export const setStoredUser = (user: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
