"use client";
import { useState } from "react";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { InventoryAreaChart, StockByPurityChart } from "../components/Charts";
import { INVENTORY_BATCHES, fmtWeight, GOLD_PRICE } from "../lib/mockData";
import { useCurrency } from "../lib/currency-context";

type Batch = typeof INVENTORY_BATCHES[number];

// Removed hardcoded MOVEMENTS

import { usePersistence } from "../lib/persistence-context";

export default function InventoryPage() {
  const { inventory, addInventoryBatch, updateInventoryBatch, movements, addMovement, loading, error } = usePersistence();
  const [tab, setTab] = useState<"batches" | "movements">("batches");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Batch | null>(null);
  const [purity, setPurity] = useState("All");
  const [location, setLocation] = useState("All");
  const [confirm, setConfirm] = useState<{ batch: Batch; action: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { format, formatUSD } = useCurrency();

  // New Batch Form State
  const [newBatch, setNewBatch] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: "",
    karat: "24K",
    location: "Vault A",
    cost: "",
    source: ""
  });

  const handleSaveBatch = () => {
    if (!newBatch.weight || !newBatch.source) return alert("Please fill in required fields");
    const karatVal = newBatch.karat === "Raw" ? 0 : parseInt(newBatch.karat);
    const weightVal = parseFloat(newBatch.weight);
    const fineVal = weightVal * (karatVal / 24);

    const batchId = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
    addInventoryBatch({
      batch: batchId,
      weight: weightVal,
      karat: karatVal,
      fine: isNaN(fineVal) ? 0 : fineVal,
      location: newBatch.location,
      status: "Available",
      value: parseFloat(newBatch.cost) || 0,
      source: newBatch.source
    });
    addMovement({
      t: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
      b: batchId,
      m: "Manual Entry",
      before: 0,
      d: weightVal,
      after: weightVal,
      by: "J. Assey",
      l: newBatch.source
    });
    setAdding(false);
    setNewBatch({
      date: new Date().toISOString().split('T')[0],
      weight: "",
      karat: "24K",
      location: "Vault A",
      cost: "",
      source: ""
    });
  };

  const handleConfirmAction = (data?: any) => {
    if (!confirm) return;
    const { batch, action } = confirm;
    const now = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

    if (action === "archive") {
      updateInventoryBatch(batch.batch, { status: "Archived" });
    } else if (action === "move") {
      const newLoc = data?.location || "In Transit";
      updateInventoryBatch(batch.batch, { location: newLoc });
      addMovement({
        t: now, b: batch.batch, m: "Movement", before: batch.weight, d: 0, after: batch.weight, by: "J. Assey", l: `To ${newLoc}`
      });
    } else if (action === "refine") {
      updateInventoryBatch(batch.batch, { status: "Processing", location: "Processing" });
      addMovement({
        t: now, b: batch.batch, m: "Processing In", before: batch.weight, d: 0, after: batch.weight, by: "System", l: "Sent to Refinery"
      });
    } else if (action === "adjust") {
      const newWeight = parseFloat(data?.weight) || batch.weight;
      const delta = newWeight - batch.weight;
      updateInventoryBatch(batch.batch, { weight: newWeight, fine: (newWeight * (batch.karat / 24)) });
      addMovement({
        t: now, b: batch.batch, m: "Adjustment", before: batch.weight, d: delta, after: newWeight, by: "Admin · J. Assey", l: data?.reason || "Reconciliation"
      });
    }
    setConfirm(null);
  };

  const totalWeight = inventory.reduce((a, b) => a + b.weight, 0);
  const fineWeight = inventory.reduce((a, b) => a + b.fine, 0);
  const totalValue = inventory.reduce((a, b) => a + b.value, 0);

  const PURITIES = ["All", "24K", "22K", "18K", "Raw"];
  const LOCATIONS = ["All", "Vault A", "Vault B", "Processing", "In Transit"];

  const batches = inventory
    .filter((b) => purity === "All" || (purity === "Raw" ? !b.karat : `${b.karat}K` === purity))
    .filter((b) => location === "All" || b.location === location);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Batches across vaults and transit, auto-valued at the active gold price."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <i className="ri-add-line" /> Add batch
            </button>
          </>
        }
      />

      {loading && <div className="surface p-8 text-center text-ink-muted mb-6"><i className="ri-loader-4-line animate-spin text-2xl" /> Syncing with backend...</div>}
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-6 text-sm flex items-center gap-2"><i className="ri-error-warning-line" /> {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total stock weight</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{fmtWeight(totalWeight)}</div>
          <div className="text-xs text-ink-muted mt-2">{inventory.length} active batches</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total fine weight</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{fmtWeight(fineWeight)}</div>
          <div className="text-xs text-ink-muted mt-2">Pure gold equivalent</div>
        </div>
        <div className="surface p-5" style={{ background: "#fdf6e4" }}>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Stock value</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{format(totalValue)}</div>
          <div className="text-xs text-gold-700 mt-2">@ {formatUSD(GOLD_PRICE.current)}/g (USD) · weighted avg {format(totalValue / fineWeight)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">By purity</div>
          <div className="font-display text-lg text-ink mb-2">Composition</div>
          <StockByPurityChart />
        </div>
        <div className="lg:col-span-2 surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">24-hour stock level</div>
          <div className="font-display text-lg text-ink mb-2">Movement over time</div>
          <InventoryAreaChart />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="surface-flat p-1 inline-flex gap-1">
          <FilterChip active={tab === "batches"} onClick={() => setTab("batches")}>Batches</FilterChip>
          <FilterChip active={tab === "movements"} onClick={() => setTab("movements")}>Movement log</FilterChip>
        </div>
        {tab === "batches" && (
          <>
            <div className="surface-flat p-1 inline-flex gap-1">
              {PURITIES.map((p) => <FilterChip key={p} active={purity === p} onClick={() => setPurity(p)}>{p}</FilterChip>)}
            </div>
            <div className="surface-flat p-1 inline-flex gap-1">
              {LOCATIONS.map((l) => <FilterChip key={l} active={location === l} onClick={() => setLocation(l)}>{l}</FilterChip>)}
            </div>
          </>
        )}
      </div>

      {tab === "batches" && (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr><th>Batch</th><th>Weight</th><th>Karat</th><th>Fine wt.</th><th>Source</th><th>Location</th><th>Status</th><th className="text-right">Value</th><th /></tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No batches match these filters.</td></tr>
              ) : batches.map((b) => (
                <tr key={b.batch} className="clickable" onClick={() => setDetail(b)}>
                  <td className="font-numeric text-ink">{b.batch}</td>
                  <td className="font-numeric">{b.weight.toFixed(2)} g</td>
                  <td>{b.karat ? `${b.karat}K` : "Raw"}</td>
                  <td className="font-numeric">{b.fine.toFixed(2)} g</td>
                  <td className="text-ink-soft">{b.source}</td>
                  <td className="text-ink-muted">{b.location}</td>
                  <td><Badge tone={statusToTone(b.status)}>{b.status}</Badge></td>
                  <td className="text-right font-numeric text-ink">{b.value ? format(b.value) : "—"}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(b) },
                      { label: "Adjust weight", icon: "ri-edit-line", onClick: () => setConfirm({ batch: b, action: "adjust" }) },
                      { label: "Move location", icon: "ri-arrow-right-line", onClick: () => setConfirm({ batch: b, action: "move" }) },
                      { label: "Send to refinery", icon: "ri-fire-line", onClick: () => setConfirm({ batch: b, action: "refine" }) },
                      { label: "Print certificate", icon: "ri-printer-line", onClick: () => alert(`Printing certificate for ${b.batch}`) },
                      { label: "Archive batch", icon: "ri-archive-line", onClick: () => setConfirm({ batch: b, action: "archive" }), danger: true, divider: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movements" && (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr><th>Time</th><th>Batch</th><th>Movement</th><th>Before</th><th>Δ</th><th>After</th><th>By</th><th>Linked</th><th /></tr>
            </thead>
            <tbody>
              {movements.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="text-ink-muted">{r.t}</td>
                  <td className="font-numeric text-ink">{r.b}</td>
                  <td>{r.m}</td>
                  <td className="font-numeric text-ink-muted">{r.before.toFixed(1)}</td>
                  <td className={`font-numeric ${r.d < 0 ? "text-rose-700" : r.d > 0 ? "text-sage-700" : "text-ink-muted"}`}>
                    {r.d > 0 ? "+" : ""}{r.d.toFixed(1)} g
                  </td>
                  <td className="font-numeric text-ink">{r.after.toFixed(1)}</td>
                  <td className="text-ink-soft">{r.by}</td>
                  <td className="text-ink-muted">{r.l}</td>
                  <td className="text-right">
                    <RowActionsMenu actions={[
                      { label: "View linked record", icon: "ri-external-link-line", onClick: () => alert(`Open ${r.l}`) },
                      { label: "Open batch", icon: "ri-archive-line", onClick: () => alert(`Open ${r.b}`) },
                      { label: "Export entry", icon: "ri-download-line", onClick: () => alert("Export") },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add batch modal */}
      <Modal open={adding} onClose={() => setAdding(false)}
        eyebrow="Inventory" title="Add new batch"
        footer={<><button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button><button className="btn-primary" onClick={handleSaveBatch}>Save batch</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Batch ID"><input className="input" placeholder="Auto-generated BATCH-20260504-NNNN" disabled /></Field>
          <Field label="Entry date"><input type="date" className="input" value={newBatch.date} onChange={(e) => setNewBatch({ ...newBatch, date: e.target.value })} /></Field>
          <Field label="Weight (grams)"><input className="input" placeholder="0.000" value={newBatch.weight} onChange={(e) => setNewBatch({ ...newBatch, weight: e.target.value })} /></Field>
          <Field label="Purity">
            <select className="input" value={newBatch.karat} onChange={(e) => setNewBatch({ ...newBatch, karat: e.target.value })}>
              <option>24K</option><option>22K</option><option>21K</option><option>18K</option>
              <option>14K</option><option>9K</option><option>Raw</option>
            </select>
          </Field>
          <Field label="Location">
            <select className="input" value={newBatch.location} onChange={(e) => setNewBatch({ ...newBatch, location: e.target.value })}>
              <option>Vault A</option><option>Vault B</option><option>Processing</option><option>In Transit</option>
            </select>
          </Field>
          <Field label="Acquisition cost"><input className="input" placeholder="0.00" value={newBatch.cost} onChange={(e) => setNewBatch({ ...newBatch, cost: e.target.value })} /></Field>
          <Field label="Source — purchase transaction" full>
            <input className="input" placeholder="TX-NNNNNN reference" value={newBatch.source} onChange={(e) => setNewBatch({ ...newBatch, source: e.target.value })} />
          </Field>
          <Field label="Notes / quality" full>
            <textarea rows={2} className="input" placeholder="Optional assay notes" />
          </Field>
        </div>
      </Modal>

      {/* Batch detail — redesigned */}
      <BatchDetailModal 
        batch={detail} 
        onClose={() => setDetail(null)} 
        format={format} 
        formatUSD={formatUSD}
        onPrint={(b) => alert(`Printing certificate for ${b.batch}`)}
        onMove={(b) => setConfirm({ batch: b, action: "move" })}
        onAdjust={(b) => setConfirm({ batch: b, action: "adjust" })}
      />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="inventory batches" rowCount={batches.length} />

      {/* Action confirmation & Real Inputs */}
      <InventoryActionModal confirm={confirm} onClose={() => setConfirm(null)} onConfirm={handleConfirmAction} />
    </div>
  );
}

function BatchDetailModal({ batch, onClose, format, formatUSD, onPrint, onMove, onAdjust }: {
  batch: Batch | null;
  onClose: () => void;
  format: (n: number) => string;
  formatUSD: (n: number) => string;
  onPrint?: (b: Batch) => void;
  onMove?: (b: Batch) => void;
  onAdjust?: (b: Batch) => void;
}) {
  if (!batch) return null;
  const finePct = batch.weight > 0 ? (batch.fine / batch.weight) * 100 : 0;
  const alloyWeight = batch.weight - batch.fine;
  const batchMovements = movements.filter((m: any) => m.b === batch.batch);

  return (
    <Modal open={!!batch} onClose={onClose} size="xl"
      eyebrow="Batch" title={batch.batch}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary" onClick={() => onPrint?.(batch)}><i className="ri-printer-line" />Print certificate</button>
        <button className="btn-secondary" onClick={() => onMove?.(batch)}><i className="ri-arrow-right-line" />Move location</button>
        <button className="btn-primary" onClick={() => onAdjust?.(batch)}><i className="ri-edit-line" />Adjust</button>
      </>}>
      {/* Hero */}
      <div className="surface-flat p-5 mb-5 flex items-start gap-5">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#fdf6e4" }}>
          <i className="ri-archive-2-line text-3xl text-gold-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge tone={statusToTone(batch.status)}>{batch.status}</Badge>
            <span className="text-xs text-ink-muted">{batch.location}</span>
            <span className="text-ink-faint">·</span>
            <span className="text-xs text-ink-muted">From {batch.source}</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="font-numeric text-[32px] text-ink leading-none">{batch.weight.toFixed(2)}<span className="text-base text-ink-muted ml-1">g gross</span></div>
            <div className="font-numeric text-lg text-ink-soft">{batch.fine.toFixed(2)}<span className="text-xs text-ink-muted ml-1">g fine</span></div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Current value</div>
          <div className="font-numeric text-[24px] text-ink leading-none mt-1">{batch.value ? format(batch.value) : "—"}</div>
          <div className="text-[11px] text-ink-muted mt-1">@ {formatUSD(74.05)}/g spot</div>
        </div>
      </div>

      {/* Composition + body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="surface-flat p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-3">Composition</div>
          {/* horizontal stacked bar */}
          <div className="h-3 rounded-full overflow-hidden bg-paper-200 flex">
            <div className="h-full" style={{ width: `${finePct}%`, background: "#b8893d" }} />
            <div className="h-full" style={{ width: `${100 - finePct}%`, background: "#dcb35a", opacity: 0.5 }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-500" />
                <span className="text-ink-muted text-xs">Fine gold</span>
              </div>
              <div className="font-numeric text-ink mt-0.5">{batch.fine.toFixed(2)} g</div>
              <div className="text-[11px] text-ink-faint">{finePct.toFixed(1)}%</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#dcb35a", opacity: 0.5 }} />
                <span className="text-ink-muted text-xs">Alloy</span>
              </div>
              <div className="font-numeric text-ink mt-0.5">{alloyWeight.toFixed(2)} g</div>
              <div className="text-[11px] text-ink-faint">{(100 - finePct).toFixed(1)}%</div>
            </div>
          </div>
          <div className="divider-rule my-4" />
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Acquisition</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Cost</span><span className="font-numeric text-ink">{batch.value ? format(batch.value * 0.94) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Per gram</span><span className="font-numeric text-ink">{batch.value && batch.fine ? format((batch.value * 0.94) / batch.fine) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Mark-to-market</span><span className="font-numeric text-sage-700">+6.4%</span></div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Properties</div>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <Row label="Purity" value={batch.karat ? `${batch.karat}K` : "Raw"} />
              <Row label="Location" value={batch.location} />
              <Row label="Status" value={<Badge tone={statusToTone(batch.status)}>{batch.status}</Badge>} />
              <Row label="Source" value={batch.source} />
              <Row label="Entered" value="May 04, 2026" />
              <Row label="Last updated" value="May 04, 09:14" />
            </dl>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Movement timeline</div>
            <div className="surface-flat overflow-hidden">
              <table className="ledger">
                <thead>
                  <tr><th>When</th><th>Type</th><th>Δ</th><th>By</th><th>Linked</th></tr>
                </thead>
                <tbody>
                  {batchMovements.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-ink-faint py-6">No movements recorded.</td></tr>
                  ) : batchMovements.map((m: any, i: number) => (
                    <tr key={i}>
                      <td className="text-ink-muted">{m.t}</td>
                      <td>{m.m}</td>
                      <td className={`font-numeric ${m.d < 0 ? "text-rose-700" : m.d > 0 ? "text-sage-700" : "text-ink-muted"}`}>
                        {m.d > 0 ? "+" : ""}{m.d.toFixed(1)} g
                      </td>
                      <td className="text-ink-soft">{m.by}</td>
                      <td className="text-ink-muted">{m.l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Linked records</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <LinkedCard icon="ri-exchange-line" label="Source transaction" value="TX-018340" />
              <LinkedCard icon="ri-fire-line" label="Refining batch" value="Refining #224" />
              <LinkedCard icon="ri-file-pdf-line" label="Assay certificate" value="ASSAY-0042.pdf" clickable />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function LinkedCard({ icon, label, value, clickable }: { icon: string; label: string; value: string; clickable?: boolean }) {
  return (
    <div className={`surface-flat p-3 flex items-center gap-3 ${clickable ? "cursor-pointer hover:border-gold-500" : ""}`}>
      <div className="w-9 h-9 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
        <i className={`${icon} text-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
        <div className="text-sm text-ink font-numeric truncate">{value}</div>
      </div>
      {clickable && <i className="ri-arrow-right-up-line text-ink-faint" />}
    </div>
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

function InventoryActionModal({ confirm, onClose, onConfirm }: { confirm: any; onClose: () => void; onConfirm: (data?: any) => void }) {
  const [data, setData] = useState<any>({});
  if (!confirm) return null;

  const isAdjust = confirm.action === "adjust";
  const isMove = confirm.action === "move";
  const isRefine = confirm.action === "refine";
  const isArchive = confirm.action === "archive";

  return (
    <Modal open={!!confirm} onClose={onClose}
      eyebrow={confirm.action} title={`${confirm.action[0].toUpperCase() + confirm.action.slice(1)} ${confirm.batch.batch}`}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => onConfirm(data)}>Confirm</button></>}>
      <div className="space-y-4">
        {isAdjust && (
          <>
            <Field label="New weight (grams)">
              <input type="number" className="input" placeholder={confirm.batch.weight.toString()} onChange={(e) => setData({ ...data, weight: e.target.value })} />
            </Field>
            <Field label="Adjustment reason">
              <select className="input" onChange={(e) => setData({ ...data, reason: e.target.value })}>
                <option>Reconciliation</option>
                <option>Assay Correction</option>
                <option>Scale Recalibration</option>
                <option>Moisture Loss</option>
              </select>
            </Field>
          </>
        )}
        {isMove && (
          <Field label="Target location">
            <select className="input" onChange={(e) => setData({ ...data, location: e.target.value })}>
              <option>Vault A</option>
              <option>Vault B</option>
              <option>Processing</option>
              <option>In Transit</option>
              <option>Refinery</option>
            </select>
          </Field>
        )}
        {(isRefine || isArchive) && (
          <p className="text-sm text-ink-soft">
            {isRefine ? "This will mark the batch as 'Processing' and move it to the refinery queue." : "This will remove the batch from active inventory and archive it for record-keeping."}
          </p>
        )}
        <p className="text-[10px] text-ink-faint uppercase tracking-wider mt-2">Logged by Julius Assey · System Audit Trail Active</p>
      </div>
    </Modal>
  );
}
