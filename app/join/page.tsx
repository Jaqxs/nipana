"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-4">
        <div className="surface p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="ri-checkbox-circle-line" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Welcome to NIPANA!</h1>
          <p className="text-ink-soft mt-2">Your account is ready. Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="surface p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-8">
          <img src="/assets/logo.jpeg" alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-ink">Join NIPANA Atlas</h1>
          <p className="text-ink-soft mt-1">Set up your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-muted mb-1.5 font-semibold">Full Name</label>
            <input
              type="text"
              required
              className="input-field w-full"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-muted mb-1.5 font-semibold">New Password</label>
            <input
              type="password"
              required
              className="input-field w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-muted mb-1.5 font-semibold">Confirm Password</label>
            <input
              type="password"
              required
              className="input-field w-full"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 text-sm rounded-lg flex items-center gap-2">
              <i className="ri-error-warning-line" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? "Setting up..." : "Complete Setup"}
            <i className="ri-arrow-right-line" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-paper text-ink-muted">Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
}
