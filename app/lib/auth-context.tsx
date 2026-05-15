"use client";
import { createContext, useContext, ReactNode } from "react";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";

interface AuthUser {
  name: string;
  email: string;
  role: "admin" | "sales_ops";
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const ready = status !== "loading";
  const user = session?.user as AuthUser | null;

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { ok: false, error: "Invalid credentials." };
    }
    return { ok: true };
  };

  const logout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, ready, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
