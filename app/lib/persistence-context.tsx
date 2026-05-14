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
  invoices: any[];
  quotations: any[];
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
  addInvoice: (invoice: any) => void;
  updateInvoice: (id: string, updates: any) => void;
  addQuotation: (quotation: any) => void;
  updateQuotation: (id: string, updates: any) => void;
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const [txs, inv, flows, cts, sts, invs, qts] = await Promise.all([
        backendClient.get("transactions"),
        backendClient.get("inventory"),
        backendClient.get("cash-flow"),
        backendClient.get("contacts"),
        backendClient.get("sites"),
        backendClient.get("invoices"),
        backendClient.get("quotations"),
      ]);
      
      setTransactions(txs.length ? txs : [...mock.RECENT_TX]);
      setInventory(inv.length ? inv : [...mock.INVENTORY_BATCHES]);
      setFlows(flows.length ? flows : [...mock.CASH_FLOW]);
      setCustomers(cts.filter((c: any) => c.type === "Customer").length ? cts.filter((c: any) => c.type === "Customer") : [...mock.CUSTOMERS]);
      setSuppliers(cts.filter((c: any) => c.type === "Supplier").length ? cts.filter((c: any) => c.type === "Supplier") : [...mock.SUPPLIERS]);
      setSites(sts.length ? sts : [...mock.SITES]);
      setInvoices(invs.length ? invs : []);
      setQuotations(qts.length ? qts : []);
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
    try {
      const saved = await backendClient.post("transactions", tx);
      setTransactions(prev => [saved, ...prev]);
    } catch (e: any) {
      console.error(e);
      const msg = e.message || "Please check your connection.";
      alert(`Failed to record transaction: ${msg}`);
    }
  };
  const updateTransaction = async (ref: string, updates: any) => {
    setTransactions(prev => prev.map(t => t.ref === ref ? { ...t, ...updates } : t));
    try { await backendClient.patch(`transactions/${ref}`, updates); } catch (e) { console.error(e); }
  };
  const deleteTransaction = async (ref: string) => {
    try {
      await backendClient.delete(`transactions/${ref}`);
      setTransactions(prev => prev.filter(t => t.ref !== ref));
    } catch (e) { console.error(e); }
  };

  const addInventoryBatch = async (batch: any) => {
    setInventory(prev => [batch, ...prev]);
    try { await backendClient.post("inventory", batch); } catch (e) { console.error(e); }
  };
  const updateInventoryBatch = async (batchId: string, updates: any) => {
    setInventory(prev => prev.map(b => (b.batchId === batchId || b.batch === batchId) ? { ...b, ...updates } : b));
    try { await backendClient.patch("inventory", batchId, updates); } catch (e) { console.error(e); }
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
    try {
      const saved = await backendClient.post("cash-flow", entry);
      setFlows(prev => [saved, ...prev]);
    } catch (e) {
      console.error(e);
      alert("Failed to record cash flow entry.");
    }
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
    try {
      await backendClient.post("inventory/movements", {
        batchId: m.b || m.batchId,
        type: m.m || m.type,
        before: m.before,
        delta: m.d || m.delta,
        after: m.after,
        user: m.by || m.user || "System",
        reference: m.l || m.reference
      });
    } catch (e) { console.error(e); }
  };

  const addInvoice = async (inv: any) => {
    try {
      const saved = await backendClient.post("invoices", inv);
      setInvoices(prev => [saved, ...prev]);
    } catch (e) {
      console.error(e);
      alert("Failed to create invoice.");
    }
  };
  const updateInvoice = async (id: string, updates: any) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    try { await backendClient.patch("invoices", id, updates); } catch (e) { console.error(e); }
  };
  const addQuotation = async (q: any) => {
    try {
      const saved = await backendClient.post("quotations", q);
      setQuotations(prev => [saved, ...prev]);
    } catch (e) {
      console.error(e);
      alert("Failed to create quotation.");
    }
  };
  const updateQuotation = async (id: string, updates: any) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    try { await backendClient.patch("quotations", id, updates); } catch (e) { console.error(e); }
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
      invoices,
      addInvoice,
      updateInvoice,
      quotations,
      addQuotation,
      updateQuotation,
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
