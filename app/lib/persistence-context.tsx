"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import * as mock from "./mockData";
import { backendClient } from "./backend-client";

interface PersistenceContextType {
  transactions: any[];
  inventory: any[];
  customers: any[];
  suppliers: any[];
  cashFlow: any[];
  sites: any[];
  movements: any[];
  loading: boolean;
  error: string | null;
  addTransaction: (tx: any) => void;
  updateTransaction: (ref: string, updates: any) => void;
  deleteTransaction: (ref: string) => void;
  addInventoryBatch: (batch: any) => void;
  updateInventoryBatch: (id: string, updates: any) => void;
  addCustomer: (customer: any) => void;
  updateCustomer: (id: string, updates: any) => void;
  addSupplier: (supplier: any) => void;
  updateSupplier: (id: string, updates: any) => void;
  deleteCustomer: (id: string) => void;
  deleteSupplier: (id: string) => void;
  addCashFlow: (entry: any) => void;
  addSite: (site: any) => void;
  updateSite: (id: string, updates: any) => void;
  addMovement: (movement: any) => void;
  refreshData: () => Promise<void>;
}

const PersistenceContext = createContext<PersistenceContextType | undefined>(undefined);

export function PersistenceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const [txs, inv, flows, cts, sts] = await Promise.all([
        backendClient.get("transactions"),
        backendClient.get("inventory"),
        backendClient.get("cash-flow"),
        backendClient.get("contacts"),
        backendClient.get("sites"),
      ]);
      
      setTransactions(txs.length ? txs : [...mock.RECENT_TX]);
      setInventory(inv.length ? inv : [...mock.INVENTORY_BATCHES]);
      setFlows(flows.length ? flows : [...mock.CASH_FLOW]);
      setCustomers(cts.filter((c: any) => c.type === "Customer").length ? cts.filter((c: any) => c.type === "Customer") : [...mock.CUSTOMERS]);
      setSuppliers(cts.filter((c: any) => c.type === "Supplier").length ? cts.filter((c: any) => c.type === "Supplier") : [...mock.SUPPLIERS]);
      setSites(sts.length ? sts : [...mock.SITES]);
      setError(null);
    } catch (err: any) {
      console.warn("Backend unavailable, falling back to Safe Mode (Local State)", err);
      setError("Backend connection failed. Using local storage mode.");
      // Keep mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addTransaction = async (tx: any) => {
    setTransactions(prev => [tx, ...prev]);
    try { await backendClient.post("transactions", tx); } catch (e) { console.error(e); }
  };
  const updateTransaction = async (ref: string, updates: any) => {
    setTransactions(prev => prev.map(t => t.ref === ref ? { ...t, ...updates } : t));
    // Implementation for specific ID update needed if using REST properly
  };
  const deleteTransaction = async (ref: string) => {
    setTransactions(prev => prev.filter(t => t.ref !== ref));
  };

  const addInventoryBatch = async (batch: any) => {
    setInventory(prev => [batch, ...prev]);
    try { await backendClient.post("inventory", batch); } catch (e) { console.error(e); }
  };
  const updateInventoryBatch = async (id: string, updates: any) => {
    setInventory(prev => prev.map(b => b.batch === id ? { ...b, ...updates } : b));
    try { await backendClient.patch("inventory", id, updates); } catch (e) { console.error(e); }
  };

  const addCustomer = async (customer: any) => {
    setCustomers(prev => [customer, ...prev]);
    try { await backendClient.post("contacts", { ...customer, type: "Customer" }); } catch (e) { console.error(e); }
  };
  const updateCustomer = async (id: string, updates: any) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try { await backendClient.patch("contacts", id, updates); } catch (e) { console.error(e); }
  };

  const addSupplier = async (supplier: any) => {
    setSuppliers(prev => [supplier, ...prev]);
    try { await backendClient.post("contacts", { ...supplier, type: "Supplier" }); } catch (e) { console.error(e); }
  };
  const updateSupplier = async (id: string, updates: any) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try { await backendClient.patch("contacts", id, updates); } catch (e) { console.error(e); }
  };
  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    try { await backendClient.delete("contacts", id); } catch (e) { console.error(e); }
  };
  const deleteSupplier = async (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    try { await backendClient.delete("contacts", id); } catch (e) { console.error(e); }
  };

  const addCashFlow = async (entry: any) => {
    setFlows(prev => [entry, ...prev]);
    try { await backendClient.post("cash-flow", entry); } catch (e) { console.error(e); }
  };

  const addSite = async (site: any) => {
    setSites(prev => [...prev, site]);
    try { await backendClient.post("sites", site); } catch (e) { console.error(e); }
  };
  const updateSite = async (id: string, updates: any) => {
    setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try { await backendClient.patch("sites", id, updates); } catch (e) { console.error(e); }
  };

  const addMovement = async (m: any) => {
    setMovements(prev => [m, ...prev]);
    // In backend, movements are created automatically by inventory updates or via inventoryService.addMovement
  };

  return (
    <PersistenceContext.Provider value={{
      transactions,
      inventory,
      customers,
      suppliers,
      cashFlow: flows,
      sites,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addInventoryBatch,
      updateInventoryBatch,
      addCustomer,
      updateCustomer,
      addSupplier,
      updateSupplier,
      deleteCustomer,
      deleteSupplier,
      addCashFlow,
      addSite,
      updateSite,
      movements,
      addMovement,
      loading,
      error,
      refreshData,
    }}>
      {children}
    </PersistenceContext.Provider>
  );
}

export function usePersistence() {
  const context = useContext(PersistenceContext);
  if (!context) throw new Error("usePersistence must be used within PersistenceProvider");
  return context;
}
