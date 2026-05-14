"use client";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { RECENT_TX } from "../lib/mockData";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePersistence } from "../lib/persistence-context";

const TYPES = ["All", "Gold Sale", "Gold Purchase", "Op. Expense", "Processing", "Logistics", "Cash Inflow", "Cash Outflow"];
const STATUS = ["All", "Pending", "Confirmed", "Rejected"];

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const { 
    transactions, addTransaction, updateTransaction, deleteTransaction,
    addInventoryBatch, addCashFlow, loading, error
  } = usePersistence();
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirming, setConfirming] = useState<{ tx: any; action: string } | null>(null);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setCreating(true);
      setNewTx({
        date: new Date().toISOString().split('T')[0],
        type: searchParams.get("type") || "Gold Sale",
        amount: "",
        currency: "USD",
        party: searchParams.get("party") || "",
        description: ""
      });
    }
  }, [searchParams]);

  // New Transaction Form State
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Gold Sale",
    amount: "",
    currency: "USD",
    party: "",
    description: ""
  });

  const handleCreate = () => {
    if (!newTx.amount || !newTx.party) return alert("Please fill in required fields");
    const amount = parseFloat(newTx.amount) * (newTx.type.toLowerCase().includes("purchase") || newTx.type.toLowerCase().includes("expense") || newTx.type.toLowerCase().includes("outflow") ? -1 : 1);
    
    if (editing) {
      updateTransaction(editing.ref, {
        date: newTx.date,
        type: newTx.type,
        party: newTx.party,
        amount: amount,
      });
      setEditing(null);
    } else {
      addTransaction({
        ref: `TX-${Math.floor(Math.random() * 90000) + 10000}`,
        date: newTx.date,
        type: newTx.type,
        party: newTx.party,
        amount: amount,
        status: "pending"
      });
    }
    setCreating(false);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      type: "Gold Sale",
      amount: "",
      currency: "USD",
      party: "",
      description: ""
    });
  };

  const handleConfirmAction = () => {
    if (!confirming) return;
    if (confirming.action === "approve") {
      updateTransaction(confirming.tx.ref, { status: "confirmed" });
      
      const { type, amount, party, ref } = confirming.tx;
      const absAmount = Math.abs(amount);
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

      // Side Effects
      if (type === "Gold Purchase") {
        addInventoryBatch({
          batch: `BATCH-${ref.split('-')[1]}-${Math.floor(Math.random()*900)+100}`,
          weight: absAmount / 75, // mock weight from amount
          karat: 24,
          fine: absAmount / 75,
          location: "Vault A",
          status: "Available",
          value: absAmount,
          source: ref
        });
        addCashFlow({
          date: now, type: "out", category: "Gold purchase", desc: `${party} · ${ref}`, amount: absAmount
        });
      } else if (type === "Gold Sale") {
        addCashFlow({
          date: now, type: "in", category: "Gold sale proceeds", desc: `${party} · ${ref}`, amount: absAmount
        });
      }
    } else if (confirming.action === "reject") {
      updateTransaction(confirming.tx.ref, { status: "rejected" });
    } else if (confirming.action === "delete") {
      deleteTransaction(confirming.tx.ref);
    }
    setConfirming(null);
  };

  const filtered = transactions
    .filter((r) => inRangeFromShortDate(r.date))
    .filter((r) => type === "All" || r.type === type)
    .filter((r) => status === "All" || r.status.toLowerCase() === status.toLowerCase())
    .filter((r) => !search ||
      r.ref.toLowerCase().includes(search.toLowerCase()) ||
      r.party.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`All purchases, sales, and expenses · ${rangeLabel} · ${filtered.length} entries`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New transaction
            </button>
          </>
        }
      />

      {loading && <div className="surface p-8 text-center text-ink-muted mb-6"><i className="ri-loader-4-line animate-spin text-2xl" /> Syncing with backend...</div>}
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-6 text-sm flex items-center gap-2"><i className="ri-error-warning-line" /> {error}</div>}

      {/* Compact filter row with dropdowns */}
      <div className="surface-flat p-3 flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {(type !== "All" || status !== "All" || search) && (
          <button
            onClick={() => { setType("All"); setStatus("All"); setSearch(""); }}
            className="text-xs text-gold-700 hover:underline"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, party..."
            className="bg-transparent outline-none w-48 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Reference</th><th>Date</th><th>Type</th><th>Counterparty</th>
              <th className="text-right">Amount</th><th>Submitted by</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-ink-faint py-12">No transactions match your filters.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.ref} className="clickable" onClick={() => setDetail(t)}>
                <td className="font-numeric text-ink">{t.ref}</td>
                <td className="text-ink-muted">{formatDate(t.date)}</td>
                <td>{t.type}</td>
                <td className="text-ink-soft">{t.party}</td>
                <td className={`text-right font-numeric ${t.amount < 0 ? "text-rose-700" : "text-sage-700"}`}>
                  {t.amount < 0 ? "−" : "+"}{format(Math.abs(t.amount))}
                </td>
                <td className="text-ink-muted">J. Assey</td>
                <td><Badge tone={statusToTone(t.status)}>{t.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(t) },
                    { label: "Edit", icon: "ri-edit-line", onClick: () => {
                      setEditing(t);
                      setNewTx({
                        date: t.date.includes("-") ? t.date : new Date().toISOString().split('T')[0],
                        type: t.type,
                        amount: Math.abs(t.amount).toString(),
                        currency: "USD",
                        party: t.party,
                        description: ""
                      });
                      setCreating(true);
                    } },
                    { label: "Duplicate", icon: "ri-file-copy-line", onClick: () => {
                      addTransaction({ ...t, ref: `TX-${Math.floor(Math.random() * 90000) + 10000}`, status: "pending" });
                    } },
                    ...(t.status === "pending" ? [
                      { label: "Approve", icon: "ri-check-line", onClick: () => setConfirming({ tx: t, action: "approve" }) },
                      { label: "Reject", icon: "ri-close-line", onClick: () => setConfirming({ tx: t, action: "reject" }), danger: true },
                    ] : []),
                      { label: "Download receipt", icon: "ri-download-line", onClick: () => {
                        const link = document.createElement("a");
                        link.href = "#";
                        link.download = `receipt-${t.ref}.pdf`;
                        link.click();
                        alert("Mock receipt download started");
                      } },
                    { label: "Delete", icon: "ri-delete-bin-line", onClick: () => setConfirming({ tx: t, action: "delete" }), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionDetailModal 
        tx={detail} 
        onClose={() => setDetail(null)} 
        onApprove={(tx) => setConfirming({ tx, action: "approve" })}
        onPrint={(tx) => alert(`Printing transaction ${tx.ref}`)}
        onDownloadReceipt={(tx) => alert(`Downloading receipt for ${tx.ref}`)}
      />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="transactions" rowCount={filtered.length} />

      <Modal open={!!confirming} onClose={() => setConfirming(null)}
        eyebrow="Confirm action" title={confirming ? `${confirming.action[0].toUpperCase() + confirming.action.slice(1)} ${confirming.tx.ref}?` : ""}
        footer={<>
          <button className="btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
          <button className={confirming?.action === "approve" ? "btn-primary" : "btn-secondary"}
            style={confirming?.action !== "approve" ? { background: "#a85944", color: "#fff", border: "none" } : undefined}
            onClick={handleConfirmAction}>
            {confirming?.action === "approve" ? "Approve" : confirming?.action === "reject" ? "Reject" : "Delete"}
          </button>
        </>}>
        <p className="text-sm text-ink-soft">
          {confirming?.action === "approve" && "Approving will lock this transaction and propagate it to inventory and cash flow."}
          {confirming?.action === "reject" && "The submitter will be notified. They can revise and resubmit."}
          {confirming?.action === "delete" && "This action cannot be undone. The audit log entry will remain."}
        </p>
      </Modal>

      <Modal open={creating} onClose={() => { setCreating(false); setEditing(null); }} size="lg"
        eyebrow={editing ? "Edit transaction" : "New transaction"} title={editing ? `Update ${editing.ref}` : "Record a transaction"}
        footer={<>
          <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn-secondary" onClick={handleCreate}>Save draft</button>
          <button className="btn-primary" onClick={handleCreate}>Submit for approval</button>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Date"><input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="input" /></Field>
          <Field label="Type">
            <select className="input" value={newTx.type} onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}>
              {TYPES.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <div className="flex">
              <input className="input rounded-r-none" placeholder="0.00" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} />
              <select className="input rounded-l-none w-24" value={newTx.currency} onChange={(e) => setNewTx({ ...newTx, currency: e.target.value })}>
                <option>USD</option><option>TZS</option>
              </select>
            </div>
          </Field>
          <Field label="Counterparty"><input className="input" placeholder="Supplier or customer" value={newTx.party} onChange={(e) => setNewTx({ ...newTx, party: e.target.value })} /></Field>
          <Field label="Reference number"><input className="input" placeholder="Auto-generated" disabled /></Field>
          <Field label="AI suggested category" hint="92% confidence">
            <div className="input flex items-center gap-2">
              <i className="ri-sparkling-2-line text-gold-600" />
              <span className="text-ink">Logistics & Security</span>
              <button className="ml-auto text-xs text-ink-muted hover:underline">Override</button>
            </div>
          </Field>
          <Field label="Description" full>
            <textarea rows={3} className="input" placeholder="Minimum 10 characters" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} />
          </Field>
          <Field label="Receipt attachment" full>
            <button type="button" className="input flex items-center gap-2 text-ink-muted text-left">
              <i className="ri-attachment-line" /> Upload PDF or image
            </button>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
function Field({ label, children, full, hint }: { label: string; children: React.ReactNode; full?: boolean; hint?: string }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
        {hint && <span className="text-[11px] text-gold-700">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
