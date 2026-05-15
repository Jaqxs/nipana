"use client";
import { createContext, useContext, ReactNode } from "react";

import { useAuth } from "./auth-context";

export type Role = "admin" | "sales_ops";

interface RoleCtx {
  role: Role;
  isAdmin: boolean;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role || "sales_ops";
  
  return (
    <Ctx.Provider value={{ role, isAdmin: role === "admin" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRole must be used within RoleProvider");
  return c;
}
