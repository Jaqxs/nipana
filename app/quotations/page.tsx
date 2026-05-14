"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { useCurrency } from "../lib/currency-context";
import { usePersistence } from "../lib/persistence-context";

const STATUSES = ["All", "DRAFT", "PENDING", "APPROVED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"];

export default function QuotationsPage() {
  const searchParams = useSearchParams();
  const { quotations, addQuotation, updateQuotation } = usePersistence();
  const [tab, setTab] = useState("All");
  const [detail, setDetail] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState<any | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [prefilledCustomer, setPrefilledCustomer] = useState("");
  const { format } = useCurrency();

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setCreating(true);
      const cust = searchParams.get("customer");
      if (cust) setPrefilledCustomer(cust);
    }
  }, [searchParams]);

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "All" ? quotations.length : quotations.filter((q) => q.status === s).length;
    return acc;
  }, {});

  const filtered = tab === "All" ? quotations : quotations.filter((q) => q.status === tab);

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Price quotations. Accepted ones convert directly to invoices."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New quotation
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {["DRAFT", "PENDING", "APPROVED", "ACCEPTED", "EXPIRED"].map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`surface p-4 text-left transition ${tab === s ? "border-gold-500 ring-1 ring-gold-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <Badge tone={statusToTone(s)}>{s}</Badge>
              <span className="font-numeric text-2xl text-ink">{counts[s] || 0}</span>
            </div>
            <div className="text-xs text-ink-muted mt-2">
              {s === "DRAFT" && "Editing"}
              {s === "PENDING" && "Awaiting Admin"}
              {s === "APPROVED" && "With customer"}
              {s === "ACCEPTED" && "Ready to convert"}
              {s === "EXPIRED" && "Action needed"}
            </div>
          </button>
        ))}
      </div>

      <div className="surface-flat p-1 inline-flex gap-1 mb-4 flex-wrap">
        {STATUSES.map((s) => (
          <FilterChip key={s} active={tab === s} onClick={() => setTab(s)}>
            {s}{tab !== s && counts[s] ? <span className="ml-1.5 text-ink-faint">{counts[s]}</span> : null}
          </FilterChip>
        ))}
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr><th>Quote</th><th>Customer</th><th>Expires</th><th className="text-right">Amount</th><th>Status</th><th /><th /></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-ink-faint py-12">No quotations in this status.</td></tr>
            ) : filtered.map((q: any) => {
              const expired = q.status === "EXPIRED";
              return (
                <tr key={q.no} className="clickable" onClick={() => setDetail(q)}>
                  <td className="font-numeric text-ink">{q.no}</td>
                  <td className="text-ink-soft">{q.customer}</td>
                  <td className={expired ? "text-rose-700" : "text-ink-muted"}>
                    <span className="inline-flex items-center gap-1.5">
                      <i className={expired ? "ri-time-line" : "ri-calendar-line"} />
                      {new Date(q.expiry).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="text-right font-numeric text-ink">{format(q.amount)}</td>
                  <td><Badge tone={statusToTone(q.status)}>{q.status}</Badge></td>
                  <td className="text-right">
                    {q.status === "ACCEPTED" ? (
                      <button onClick={(e) => { e.stopPropagation(); setConverting(q); }} className="text-gold-700 hover:underline text-xs font-medium inline-flex items-center gap-1">
                        Convert to invoice <i className="ri-arrow-right-line" />
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDetail(q); }} className="text-ink-muted hover:text-ink text-xs">View</button>
                    )}
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(q) },
                      { label: "Edit", icon: "ri-edit-line", onClick: () => alert(`Edit ${q.no}`) },
                      { label: "Send to customer", icon: "ri-mail-send-line", onClick: () => alert("Sent") },
                      ...(q.status === "ACCEPTED" ? [
                        { label: "Convert to invoice", icon: "ri-arrow-right-line", onClick: () => setConverting(q) },
                      ] : []),
                      ...(q.status === "EXPIRED" ? [
                        { label: "Reissue", icon: "ri-refresh-line", onClick: () => alert("Reissued") },
                      ] : []),
                      { label: "Download PDF", icon: "ri-download-line", onClick: () => alert("Downloading"), divider: true },
                      { label: "Archive", icon: "ri-archive-line", onClick: () => alert("Archived"), danger: true, divider: true },
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg"
        eyebrow="Quotation" title={detail?.no}
        footer={<>
          <button className="btn-secondary" onClick={() => setDetail(null)}>Close</button>
          <button className="btn-secondary"><i className="ri-edit-line" />Edit</button>
          {detail?.status === "ACCEPTED" && (
            <button className="btn-primary" onClick={() => { setConverting(detail); setDetail(null); }}>
              <i className="ri-arrow-right-line" />Convert to invoice
            </button>
          )}
        </>}>
        {detail && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <Badge tone={statusToTone(detail.status)}>{detail.status}</Badge>
              <span className="text-sm text-ink-muted">Expires {new Date(detail.expiry).toLocaleDateString()}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-5">
              <Row label="Customer" value={detail.customer} />
              <Row label="Issued by" value="Maria Rweyemamu" />
              <Row label="Date" value={new Date(detail.date || detail.createdAt).toLocaleDateString()} />
              <Row label="Notes" value={detail.notes || "—"} />
            </dl>
            <table className="ledger">
              <thead><tr><th>Description</th><th className="text-right">Weight</th><th>Purity</th><th className="text-right">Unit price</th><th className="text-right">Subtotal</th></tr></thead>
              <tbody>
                {(detail.items || []).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{item.description}</td>
                    <td className="text-right font-numeric">{item.weight || "—"} {item.weight ? "g" : ""}</td>
                    <td>{item.karat || "—"}</td>
                    <td className="text-right font-numeric">{format(item.price)}</td>
                    <td className="text-right font-numeric text-ink">{format((item.weight || 1) * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-ink"><span>Total</span><span className="font-numeric text-lg">{format(detail.amount)}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Convert confirm */}
      <Modal open={!!converting} onClose={() => setConverting(null)}
        eyebrow="Confirm" title="Convert quotation to invoice"
        footer={<>
          <button className="btn-secondary" onClick={() => setConverting(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => setConverting(null)}>Create invoice</button>
        </>}>
        {converting && (
          <p className="text-sm text-ink-soft">
            All line items from <span className="font-numeric text-ink">{converting.no}</span> will be copied into a new invoice for <span className="text-ink font-medium">{converting.customer}</span>. The quotation status will move to CONVERTED.
          </p>
        )}
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="quotations" rowCount={filtered.length} />

      {/* Create quotation */}
      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="New quotation" title="Create quotation"
        footer={<><button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button><button className="btn-primary" form="new-quote-form">Create Quotation</button></>}>
        <NewQuotationForm onSave={(data) => {
          addQuotation({
            ...data,
            no: `QTN-2026-${Math.floor(Math.random() * 90000) + 10000}`,
            status: "DRAFT"
          });
          setCreating(false);
        }} id="new-quote-form" initialCustomer={prefilledCustomer} />
      </Modal>
    </div>
  );
}

function NewQuotationForm({ onSave, id, initialCustomer }: { onSave: (data: any) => void, id?: string, initialCustomer?: string }) {
  const [formData, setFormData] = useState({
    customer: initialCustomer || "",
    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    if (initialCustomer) {
      setFormData(prev => ({ ...prev, customer: initialCustomer }));
    }
  }, [initialCustomer]);
  const [lines, setLines] = useState([{ description: "", weight: "", karat: "24K", price: "" }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = lines.reduce((acc, l) => acc + (parseFloat(l.weight || "1") * parseFloat(l.price || "0")), 0);
    onSave({
      ...formData,
      amount,
      items: lines.map(l => ({
        ...l,
        weight: l.weight ? parseFloat(l.weight) : null,
        price: parseFloat(l.price || "0")
      }))
    });
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer"><input className="input" placeholder="Select customer" required value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} /></Field>
        <Field label="Expiry date"><input type="date" className="input" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} /></Field>
        <Field label="Notes / terms" full><textarea rows={2} className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Line items</span>
          <button type="button" onClick={() => setLines([...lines, { description: "", weight: "", karat: "24K", price: "" }])} className="text-xs text-gold-700 hover:underline">+ Add line</button>
        </div>
        <div className="space-y-2">
          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input className="input col-span-5" placeholder="Description" required value={l.description} onChange={e => {
                const n = [...lines]; n[idx].description = e.target.value; setLines(n);
              }} />
              <input className="input col-span-2" placeholder="Weight (g)" value={l.weight} onChange={e => {
                const n = [...lines]; n[idx].weight = e.target.value; setLines(n);
              }} />
              <select className="input col-span-2" value={l.karat} onChange={e => {
                const n = [...lines]; n[idx].karat = e.target.value; setLines(n);
              }}><option>24K</option><option>22K</option><option>18K</option></select>
              <input className="input col-span-2" placeholder="Price" required value={l.price} onChange={e => {
                const n = [...lines]; n[idx].price = e.target.value; setLines(n);
              }} />
              <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="btn-ghost col-span-1 justify-center">
                <i className="ri-delete-bin-line" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</dt><dd className="text-ink">{value}</dd></div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}
