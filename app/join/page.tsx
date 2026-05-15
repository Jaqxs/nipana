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
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 text-white">
        <div className="surface p-12 max-w-md w-full text-center border-gold-500/20 shadow-[0_0_50px_rgba(184,137,61,0.1)]">
          <div className="w-20 h-20 bg-gold-500/10 text-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
            <i className="ri-shield-user-line" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-3 bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">
            Welcome to the Atlas
          </h1>
          <p className="text-white/60 mb-8">Your secure access has been provisioned. Taking you in...</p>
          <div className="flex justify-center">
            <div className="w-12 h-1 border-t-2 border-gold-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-900/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-900/10 blur-[120px] rounded-full" />
      
      <div className="surface p-10 max-w-md w-full shadow-2xl border-white/5 relative z-10 backdrop-blur-xl bg-white/[0.02]">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full rounded-2xl object-cover grayscale brightness-125 border border-gold-500/30" />
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(184,137,61,0.4)]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Secure Onboarding</h1>
          <p className="text-white/40 text-sm tracking-wide uppercase">NIPANA Atlas · Private Network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gold-500/80 font-bold ml-1">Full Identity</label>
            <div className="relative">
              <i className="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-gold-500/50 focus:ring-0 transition-all"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gold-500/80 font-bold ml-1">Security Key</label>
            <div className="relative">
              <i className="ri-lock-password-line absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-gold-500/50 focus:ring-0 transition-all"
                placeholder="Choose Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gold-500/80 font-bold ml-1">Verify Key</label>
            <div className="relative">
              <i className="ri-shield-keyhole-line absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-gold-500/50 focus:ring-0 transition-all"
                placeholder="Repeat Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-start gap-3 animate-headShake">
              <i className="ri-error-warning-line text-lg shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl shadow-lg shadow-gold-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <i className="ri-loader-4-line animate-spin text-xl" />
            ) : (
              <>
                Finalize Access
                <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-white/20 text-[10px] uppercase tracking-widest">
          End-to-End Encrypted Provisioning
        </p>
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
