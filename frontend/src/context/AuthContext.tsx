import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { AuthUser, Role } from "@/types";
import { authService } from "@/services/auth.service";
import { clearSession, getStoredUser, getToken, setStoredUser, setToken } from "@/utils/storage";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  facultyLogin: (email: string, password: string) => Promise<void>;
  facultyRegister: (name: string, email: string, password: string) => Promise<void>;
  studentLogin: (email: string, password: string) => Promise<void>;
  studentRegister: (name: string, regNo: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authService.me();
        setUser(me);
        setStoredUser(me);
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const applySession = useCallback((token: string, authUser: AuthUser) => {
    setToken(token);
    setStoredUser(authUser);
    setUser(authUser);
  }, []);

  const facultyLogin = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await authService.facultyLogin(email, password);
      applySession(token, u);
    },
    [applySession]
  );

  const facultyRegister = useCallback(
    async (name: string, email: string, password: string) => {
      const { token, user: u } = await authService.facultyRegister(name, email, password);
      applySession(token, u);
    },
    [applySession]
  );

  const studentLogin = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await authService.studentLogin(email, password);
      applySession(token, u);
    },
    [applySession]
  );

  const studentRegister = useCallback(
    async (name: string, regNo: string, email: string, password: string) => {
      const { token, user: u } = await authService.studentRegister(name, regNo, email, password);
      applySession(token, u);
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        facultyLogin,
        facultyRegister,
        studentLogin,
        studentRegister,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { Role };
