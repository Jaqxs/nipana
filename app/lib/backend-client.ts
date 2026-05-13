const API_BASE = "/api";

export const backendClient = {
  async get(resource: string) {
    const res = await fetch(`${API_BASE}/${resource}`);
    if (!res.ok) throw new Error(`Failed to fetch ${resource}`);
    return res.json();
  },

  async post(resource: string, data: any) {
    const res = await fetch(`${API_BASE}/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create ${resource}`);
    return res.json();
  },

  async patch(resource: string, id: string, data: any) {
    const res = await fetch(`${API_BASE}/${resource}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update ${resource}`);
    return res.json();
  },

  async delete(resource: string, id: string) {
    const res = await fetch(`${API_BASE}/${resource}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete ${resource}`);
    return res.json();
  }
};
