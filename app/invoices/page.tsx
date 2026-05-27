"use client";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePersistence } from "../lib/persistence-context";
import { useRole } from "../lib/role-context";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TABS = ["All", "Draft", "Pending", "Sent", "Paid", "Overdue"];

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [prefilledCustomer, setPrefilledCustomer] = useState("");
  const { invoices, addInvoice, updateInvoice } = usePersistence();
  const { isAdmin } = useRole();
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();

  const downloadPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById("invoice-content");
        if (el) {
          el.style.height = "auto";
          el.style.overflow = "visible";
          el.style.padding = "24px";
          el.style.backgroundColor = "white";
        }
      }
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`invoice-${preview?.no || "download"}.pdf`);
  };

  const printDocument = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById("invoice-content");
        if (el) {
          el.style.height = "auto";
          el.style.overflow = "visible";
          el.style.padding = "24px";
          el.style.backgroundColor = "white";
        }
      }
    });
    const imgData = canvas.toDataURL("image/png");
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; }
            img { max-width: 100%; height: auto; }
            @page { margin: 0; }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setCreating(true);
      const cust = searchParams.get("customer");
      if (cust) setPrefilledCustomer(cust);
    }
  }, [searchParams]);

  const filtered = invoices
    .filter((i) => inRangeFromShortDate(i.issued))
    .filter((i) => tab === "All" || i.status === tab)
    .filter((i) => !search ||
      i.no.toLowerCase().includes(search.toLowerCase()) ||
      i.customer.toLowerCase().includes(search.toLowerCase()));

  const totalReceivable = invoices.filter((i) => ["Sent", "Pending", "Overdue"].includes(i.status))
    .reduce((a, b) => a + b.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").reduce((a, b) => a + b.amount, 0);

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
        title="Invoices"
        description={`Customer invoices and payment status · ${rangeLabel}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-secondary" onClick={() => setReminding(true)}>
              <i className="ri-mail-send-line" /> Send reminders
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New invoice
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total receivable</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{format(totalReceivable)}</div>
          <div className="text-xs text-ink-muted mt-2">Pending + Sent + Overdue</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Overdue</div>
          <div className="font-numeric text-[30px] text-rose-700 mt-2">{format(overdue)}</div>
          <div className="text-xs text-ink-muted mt-2">2 invoices · longest 14 days</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Days Sales Outstanding</div>
          <div className="font-numeric text-[30px] text-ink mt-2">23.4 <span className="text-base text-ink-muted">days</span></div>
          <div className="text-xs text-sage-700 mt-2">▼ 2.1 vs last month</div>
        </div>
      </div>

      <div className="surface-flat p-3 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>
        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={tab} onChange={(e) => setTab(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {TABS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {(tab !== "All" || search) && (
          <button onClick={() => { setTab("All"); setSearch(""); }} className="text-xs text-gold-700 hover:underline">
            Clear all
          </button>
        )}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer..."
            className="bg-transparent outline-none w-56 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th>
              <th className="text-right">Amount</th>{isAdmin && <th>Submitted by</th>}<th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-ink-faint py-12">No invoices match your filters.</td></tr>
            ) : filtered.map((i) => (
              <tr key={i.no} className="clickable" onClick={() => setPreview(i)}>
                <td data-label="Invoice" className="font-numeric text-ink">{i.no}</td>
                <td data-label="Customer" className="text-ink-soft">{i.customer}</td>
                <td data-label="Issued" className="text-ink-muted">{i.issued}</td>
                <td data-label="Due" className="text-ink-muted">{i.due}</td>
                <td data-label="Amount" className="text-right font-numeric text-ink">{format(i.amount)}</td>
                {isAdmin && <td data-label="Submitted by" className="text-ink-muted">{i.createdBy}</td>}
                <td data-label="Status"><Badge tone={statusToTone(i.status)}>{i.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View invoice", icon: "ri-eye-line", onClick: () => setPreview(i) },
                    { label: "Download PDF", icon: "ri-download-line", onClick: () => { setPreview(i); setTimeout(() => window.print(), 500); } },
                    { label: "Email to customer", icon: "ri-mail-send-line", onClick: () => alert(`Email ${i.customer}`) },
                    ...(i.status === "Overdue" || i.status === "Sent" ? [
                      { label: "Send reminder", icon: "ri-notification-line", onClick: () => alert("Reminder sent") },
                      { label: "Mark as paid", icon: "ri-check-double-line", onClick: () => alert("Marked paid") },
                    ] : []),
                    { label: "Duplicate", icon: "ri-file-copy-line", onClick: () => alert("Duplicated"), divider: true },
                    { label: "Cancel invoice", icon: "ri-close-circle-line", onClick: () => alert("Cancelled"), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Invoice preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} size="xl"
        eyebrow="Invoice preview" title={preview?.no}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPreview(null)}>Close</button>
            <button className="btn-secondary" onClick={() => alert("Emailing feature coming soon")}><i className="ri-mail-send-line" />Email to customer</button>
            <button className="btn-secondary" onClick={printDocument}><i className="ri-printer-line" />Print</button>
            <button className="btn-primary" onClick={downloadPDF}><i className="ri-download-line" />Download</button>
          </>
        }>
        {preview && <InvoicePreview invoice={preview} />}
      </Modal>

      {/* New invoice modal */}
      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="Section 7 · New invoice" title="Create invoice"
        footer={<><button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button><button className="btn-primary" form="new-invoice-form">Create Invoice</button></>}>
        <NewInvoiceForm onSave={(data) => {
          addInvoice({
            ...data,
            no: `INV-2026-${Math.floor(Math.random() * 90000) + 10000}`,
            status: "Pending"
          });
          setCreating(false);
        }} id="new-invoice-form" initialCustomer={prefilledCustomer} />
      </Modal>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        resource="invoices"
        rowCount={filtered.length}
        onExport={(format) => {
          if (format === "csv" || format === "xlsx") {
            import("../lib/export-utils").then(({ exportToCSV }) => {
              exportToCSV(filtered, "invoices-export.csv");
            });
          } else {
            window.print();
          }
        }}
      />

      {/* Reminders modal */}
      <Modal open={reminding} onClose={() => setReminding(false)}
        eyebrow="Receivables" title="Send overdue reminders"
        footer={<><button className="btn-secondary" onClick={() => setReminding(false)}>Cancel</button><button className="btn-primary" onClick={() => setReminding(false)}>Send to overdue customers</button></>}>
        <p className="text-sm text-ink-muted mb-4">A polite reminder will be emailed to customers with overdue invoices.</p>
        <ul className="space-y-2 text-sm">
          {invoices.filter((i) => i.status === "Overdue").map((i) => (
            <li key={i.no} className="flex items-center gap-3 surface-flat p-3">
              <i className="ri-mail-line text-gold-600" />
              <span className="text-ink">{i.customer}</span>
              <span className="text-ink-muted ml-auto font-numeric">{format(i.amount)}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function InvoicePreview({ invoice }: { invoice: any }) {
  const { format } = useCurrency();
  return (
    <div id="invoice-content">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: "#b8893d" }}>
              <img src="/assets/logo.jpeg" alt="NIPANA Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-display text-xl text-ink">NIPANA Atlas</div>
              <div className="text-xs text-ink-muted">Mwanza, Tanzania · TIN 109-204-883</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-ink">Invoice</div>
          <div className="text-sm text-ink-muted font-numeric">{invoice.no}</div>
          <div className="mt-2"><Badge tone={statusToTone(invoice.status)}>{invoice.status}</Badge></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Bill to</div>
          <div className="font-medium text-ink">{invoice.customer}</div>
          <div className="text-sm text-ink-muted">Customer details from database</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Issued · Due</div>
          <div className="text-ink">{new Date(invoice.issued).toLocaleDateString()}</div>
          <div className="text-ink">{new Date(invoice.due).toLocaleDateString()}</div>
        </div>
      </div>

      <table className="ledger">
        <thead>
          <tr><th>Description</th><th className="text-right">Weight</th><th className="text-right">Purity</th><th className="text-right">Unit price</th><th className="text-right">Subtotal</th></tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item: any, idx: number) => (
            <tr key={idx}>
              <td>{item.description}</td>
              <td className="text-right font-numeric">{item.weight || "—"} {item.weight ? "g" : ""}</td>
              <td className="text-right">{item.karat || "—"}</td>
              <td className="text-right font-numeric">{format(item.price)}</td>
              <td className="text-right font-numeric text-ink">{format((item.weight || 1) * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-6">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span className="font-numeric">{format(invoice.amount)}</span></div>
          <div className="flex justify-between text-ink-muted"><span>Tax (0%)</span><span className="font-numeric">$0.00</span></div>
          <div className="divider-rule" />
          <div className="flex justify-between text-ink"><span>Total due</span><span className="font-numeric text-lg">{format(invoice.amount)}</span></div>
        </div>
      </div>
    </div>
  );
}

function NewInvoiceForm({ onSave, id, initialCustomer }: { onSave: (data: any) => void, id?: string, initialCustomer?: string }) {
  const [formData, setFormData] = useState({
    customer: initialCustomer || "",
    issued: new Date().toISOString().split('T')[0],
    due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        <Field label="Customer ID"><input className="input" placeholder="Auto-generated" disabled /></Field>
        <Field label="Issue date"><input type="date" className="input" value={formData.issued} onChange={e => setFormData({...formData, issued: e.target.value})} /></Field>
        <Field label="Due date"><input type="date" className="input" value={formData.due} onChange={e => setFormData({...formData, due: e.target.value})} /></Field>
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

      <Field label="Notes / payment terms"><textarea rows={2} className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></Field>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}
