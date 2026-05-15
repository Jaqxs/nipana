"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";

const BACKGROUNDS = [
  "/assets/WhatsApp Image 2026-05-05 at 9.52.38 PM.jpeg",
  "/assets/WhatsApp Image 2026-05-05 at 9.52.38 PM (1).jpeg",
  "/assets/WhatsApp Image 2026-05-05 at 9.52.38 PM (2).jpeg"
];

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Login failed.");
    }
  };

  const fillDemo = (which: "admin" | "ops") => {
    setEmail(which === "admin" ? "director@nipanaatlas.co.tz" : "ceo@nipanaatlas.co.tz");
    setPassword("nipana2026");
    setError(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Global Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {BACKGROUNDS.map((bg, idx) => (
          <div
            key={bg}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: idx === bgIndex ? 1 : 0,
              backgroundImage: `url('${bg}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        {/* Subtle Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] px-6 py-10 md:py-12 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl mx-4">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-lg"
            style={{ background: "#b8893d" }}
          >
            <img src="/assets/logo.jpeg" alt="NIPANA Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl text-ink leading-tight">Welcome back</h1>
            <p className="text-ink-muted text-sm mt-2">Sign in to NIPANA Atlas · GBMS</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">Email</div>
            <div className="relative">
              <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nipana.tz"
                className="input bg-white"
                style={{ paddingLeft: "44px" }}
              />
            </div>
          </label>

          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Password</span>
              <button type="button" className="text-[11px] text-gold-700 hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <i className="ri-lock-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input bg-white"
                style={{ paddingLeft: "44px", paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
                aria-label="Toggle password visibility"
              >
                <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-gold-500"
              />
              Remember this device
            </label>
          </div>

          {error && (
            <div className="surface-flat border-rose-500/30 bg-rose-100/40 px-3 py-2.5 text-sm text-rose-700 flex items-center gap-2">
              <i className="ri-error-warning-line" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <><i className="ri-loader-4-line animate-spin" /> Signing in...</>
            ) : (
              <><i className="ri-login-circle-line" /> Sign in</>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint text-center">Demo accounts</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => fillDemo("admin")} className="surface-flat bg-white/50 p-3 text-left hover:border-gold-500 transition">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700 mb-1">Director</div>
            <div className="text-sm text-ink font-medium">Administrative</div>
            <div className="text-[11px] text-ink-muted truncate">director@nipanaatlas.co.tz</div>
          </button>
          <button onClick={() => fillDemo("ops")} className="surface-flat bg-white/50 p-3 text-left hover:border-gold-500 transition">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">CEO</div>
            <div className="text-sm text-ink font-medium">Administrative</div>
            <div className="text-[11px] text-ink-muted truncate">ceo@nipanaatlas.co.tz</div>
          </button>
        </div>

        <p className="text-[10px] text-ink-faint mt-8 text-center uppercase tracking-wider">
          © 2026 NIPANA Atlas · Mwanza Operations
        </p>
      </div>
    </div>
  );
}
