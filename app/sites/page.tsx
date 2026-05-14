"use client";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { usePersistence } from "../lib/persistence-context";

import { Stat } from "../components/Stat";

export default function SitesPage() {
  const { sites, addSite, updateSite, loading, error } = usePersistence();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    manager: "",
    capacity: "",
    currentStock: 0,
    security: "Standard",
    status: "Active",
    staffCount: 0
  });

  const handleSave = () => {
    if (!formData.name || !formData.location) return alert("Name and Location are required");
    
    if (editing) {
      updateSite(editing.id, { ...formData, capacity: parseFloat(formData.capacity.toString()) });
      setEditing(null);
    } else {
      addSite({
        ...formData,
        id: `SITE-00${sites.length + 1}`,
        capacity: parseFloat(formData.capacity.toString()),
        currentStock: 0,
        lastAudit: "Just now"
      });
      setCreating(false);
    }
    setFormData({ name: "", location: "", manager: "", capacity: "", currentStock: 0, security: "Standard", status: "Active", staffCount: 0 });
  };

  const filtered = sites.filter((s) => 
    !search || 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.location.toLowerCase().includes(search.toLowerCase()) ||
    s.manager.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = sites.reduce((a, b) => a + b.capacity, 0);
  const currentTotalStock = sites.reduce((a, b) => a + b.currentStock, 0);
  const avgUtilization = (currentTotalStock / totalCapacity) * 100;

  return (
    <div>
      <PageHeader
        title="Sites & Locations"
        description="Manage secure vaults, collection hubs, and field operations."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => {
              setEditing(null);
              setFormData({ name: "", location: "", manager: "", capacity: "", currentStock: 0, security: "Standard", status: "Active", staffCount: 0 });
              setCreating(true);
            }}>
              <i className="ri-add-line" /> Add site
            </button>
          </>
        }
      />

      {loading && <div className="surface p-8 text-center text-ink-muted mb-6"><i className="ri-loader-4-line animate-spin text-2xl" /> Syncing with backend...</div>}
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-6 text-sm flex items-center gap-2"><i className="ri-error-warning-line" /> {error}</div>}

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Sites" value={sites.length.toString()} hint={`${sites.filter(s => s.status === "Active").length} operational`} icon="ri-map-pin-2-line" />
        <Stat label="Network Capacity" value={`${totalCapacity}kg`} hint="Aggregate storage" icon="ri-database-2-line" />
        <Stat label="Current Occupancy" value={`${currentTotalStock.toFixed(1)}kg`} hint={`${avgUtilization.toFixed(1)}% utilization`} icon="ri-safe-2-line" tone="gold" />
        <Stat label="Security Events" value="0" hint="Last 24 hours" icon="ri-shield-check-line" tone="sage" />
      </div>

      <div className="surface-flat p-3 flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search site, manager..."
            className="bg-transparent outline-none w-48 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Name & ID</th><th>Location</th><th>Manager</th>
              <th className="text-right">Staff</th><th className="w-48">Utilization</th>
              <th className="text-right">Stock (kg)</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-ink-faint py-12">No sites found.</td></tr>
            ) : filtered.map((s) => {
              const utilization = (s.currentStock / s.capacity) * 100;
              return (
                <tr key={s.id}>
                  <td data-label="Name & ID">
                    <div className="font-medium text-ink">{s.name}</div>
                    <div className="text-[10px] font-numeric text-ink-faint uppercase tracking-wider">{s.id}</div>
                  </td>
                  <td data-label="Location" className="text-ink-soft">{s.location}</td>
                  <td data-label="Manager" className="text-ink-muted">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-paper-200 flex items-center justify-center text-[10px] font-bold text-ink-soft">
                        {s.manager.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      {s.manager}
                    </div>
                  </td>
                  <td data-label="Staff" className="text-right font-numeric text-ink-muted">{s.staffCount}</td>
                  <td data-label="Utilization">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-faint">
                        <span>{utilization.toFixed(0)}%</span>
                        <span>{s.capacity}kg max</span>
                      </div>
                      <div className="h-1.5 w-full bg-paper-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${utilization > 80 ? "bg-rose-500" : utilization > 50 ? "bg-gold-500" : "bg-sage-500"}`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td data-label="Stock (kg)" className="text-right font-numeric text-ink font-medium">{s.currentStock.toFixed(2)}</td>
                  <td data-label="Status"><Badge tone={s.status === "Active" ? "sage" : s.status === "Maintenance" ? "amber" : "terracotta"} dot>{s.status}</Badge></td>
                  <td className="text-right">
                    <RowActionsMenu actions={[
                      { label: "Edit details", icon: "ri-edit-line", onClick: () => {
                        setEditing(s);
                        setFormData({ 
                          name: s.name, 
                          location: s.location, 
                          manager: s.manager, 
                          capacity: s.capacity.toString(), 
                          currentStock: s.currentStock, 
                          security: s.security, 
                          status: s.status,
                          staffCount: s.staffCount
                        });
                      } },
                      { label: "Manage staff", icon: "ri-group-line", onClick: () => {
                        setEditing(s);
                        setFormData({ ...s, capacity: s.capacity.toString() });
                        setCreating(true);
                      } },
                      { label: "Full audit", icon: "ri-clipboard-line", onClick: () => {
                        updateSite(s.id, { lastAudit: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) });
                        alert(`Audit for ${s.name} completed and logged.`);
                      } },
                      { label: "Security override", icon: "ri-shield-keyhole-line", onClick: () => {
                        if (confirm(`INITIATE SECURITY OVERRIDE FOR ${s.name}?\n\nThis will lock all vault doors and notify the rapid response team.`)) {
                          alert("SECURITY PROTOCOL INITIATED. Authorities have been notified.");
                        }
                      }, danger: true, divider: true },
                      { label: s.status === "Active" ? "Deactivate" : "Activate", icon: s.status === "Active" ? "ri-pause-line" : "ri-play-line", onClick: () => {
                        updateSite(s.id, { status: s.status === "Active" ? "Inactive" : "Active" });
                      }, divider: true },
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }}
        eyebrow="Site Management" title={editing ? `Update ${editing.id}` : "Register new facility"}
        footer={<>
          <button className="btn-secondary" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{editing ? "Apply changes" : "Confirm facility"}</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Site Name" full>
            <input className="input" placeholder="e.g. Mwanza Vault" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </Field>
          <Field label="Location">
            <input className="input" placeholder="City / Region" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </Field>
          <Field label="Manager">
            <input className="input" placeholder="Full name" value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} />
          </Field>
          <Field label="Storage Capacity (kg)">
            <input className="input font-numeric" type="number" placeholder="0" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
          </Field>
          <Field label="Staff Count">
            <input className="input font-numeric" type="number" placeholder="0" value={formData.staffCount} onChange={(e) => setFormData({ ...formData, staffCount: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Security Protocol">
            <select className="input" value={formData.security} onChange={(e) => setFormData({ ...formData, security: e.target.value })}>
              <option>Standard</option><option>High</option><option>Maximum</option>
            </select>
          </Field>
          <Field label="Operational Status">
            <select className="input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <option>Active</option><option>Inactive</option><option>Maintenance</option>
            </select>
          </Field>
        </div>
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="sites" rowCount={filtered.length} />
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
