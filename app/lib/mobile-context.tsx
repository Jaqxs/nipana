"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface MobileContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <MobileContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (!context) throw new Error("useMobile must be used within MobileProvider");
  return context;
}
