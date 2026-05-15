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
  const [creating, setCreating] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      
      setCreating(false);
      setNewUserData({ name: "", email: "", password: "", role: "sales_ops" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
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
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <i className="ri-user-add-line" /> Add new user
          </button>
        }
      />

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
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
                <td className="font-medium text-ink">{u.name}</td>
                <td className="text-ink-muted">{u.email}</td>
                <td>
                  <Badge tone={u.role === "admin" ? "gold" : "sage"}>
                    {u.role.toUpperCase()}
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
        open={creating}
        onClose={() => setCreating(false)}
        eyebrow="Access Control"
        title="Add new system user"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn-primary" form="create-user-form">Create User</button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input 
                className="input" 
                required 
                value={newUserData.name} 
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
              />
            </Field>
            <Field label="Email Address">
              <input 
                type="email" 
                className="input" 
                required 
                value={newUserData.email} 
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              />
            </Field>
            <Field label="Initial Password">
              <input 
                type="password" 
                className="input" 
                required 
                value={newUserData.password} 
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <select 
                className="input" 
                value={newUserData.role} 
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
              >
                <option value="sales_ops">Sales & Operations</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
          </div>
        </form>
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
