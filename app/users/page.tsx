"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useAuth } from "../lib/auth-context";

export default function UserManagementPage() {
  const { user, isAdmin } = { user: useAuth().user, isAdmin: useAuth().user?.role === "admin" };
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "sales_ops",
  });
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInviteLink("");
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invite");
      
      setInviteLink(data.inviteLink);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  if (!isAdmin) {
    return (
      <div className="surface p-8 text-center text-ink-muted">
        <i className="ri-lock-2-line text-4xl mb-4 block" />
        <p>You do not have permission to access User Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system access and roles for all workers."
        actions={
          <button className="btn-primary" onClick={() => { setInviting(true); setInviteLink(""); }}>
            <i className="ri-mail-send-line" /> Invite new staff
          </button>
        }
      />

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-ink-faint">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-ink-faint">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="font-medium text-ink">{u.name || "Pending Onboarding"}</div>
                  <div className="text-[11px] text-ink-muted">{u.email}</div>
                </td>
                <td>
                  <Badge tone={u.role === "admin" ? "gold" : "sage"}>
                    {u.role.toUpperCase()}
                  </Badge>
                </td>
                <td>
                  <Badge tone={u.status === "active" ? "sage" : "amber"}>
                    {(u.status || "active").toUpperCase()}
                  </Badge>
                </td>
                <td className="text-ink-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  <button className="text-ink-faint hover:text-rose-700 transition">
                    <i className="ri-delete-bin-line" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        eyebrow="Access Control"
        title="Invite new staff member"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setInviting(false)}>Done</button>
            {!inviteLink && <button className="btn-primary" form="invite-user-form">Generate Link</button>}
          </>
        }
      >
        {!inviteLink ? (
          <form id="invite-user-form" onSubmit={handleInviteUser} className="space-y-4">
            {error && <div className="bg-rose-50 text-rose-700 p-3 rounded text-sm">{error}</div>}
            <div className="space-y-4">
              <Field label="Email Address">
                <input 
                  type="email" 
                  className="input" 
                  required 
                  placeholder="staff@nipanaatlas.co.tz"
                  value={inviteData.email} 
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                />
              </Field>
              <Field label="Assign Role">
                <select 
                  className="input" 
                  value={inviteData.role} 
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                >
                  <option value="sales_ops">Sales & Operations</option>
                  <option value="admin">Administrator</option>
                </select>
              </Field>
            </div>
            <p className="text-[11px] text-ink-muted mt-2">
              An invitation record will be created. You will need to share the generated link with the user manually.
            </p>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-sage-50 text-sage-700 p-4 rounded-lg border border-sage-200">
              <div className="text-xs uppercase tracking-widest font-bold mb-2">Invitation Ready</div>
              <div className="text-sm break-all font-mono bg-white p-3 rounded border border-sage-200 mb-4 select-all">
                {inviteLink}
              </div>
              <button 
                onClick={copyToClipboard}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <i className="ri-file-copy-line" /> Copy Link
              </button>
            </div>
            <p className="text-[11px] text-ink-muted text-center">
              Send this link to <strong>{inviteData.email}</strong>. It will expire in 48 hours.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}
