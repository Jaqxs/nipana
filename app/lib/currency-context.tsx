"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type CurrencyCode = "TZS";

interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  symbol: string;
  rate: number; // multiplier from base currency (TZS is now base 1)
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  TZS: { code: "TZS", label: "Tanzanian Shilling", symbol: "TSh", rate: 1, decimals: 0 },
};

const USD_META = { code: "USD", label: "US Dollar", symbol: "$", rate: 1, decimals: 2 };

interface FormatOpts {
  decimals?: number;
  signed?: boolean;
  /** Use compact notation (1.2M, 4.5B) — good for KPIs */
  compact?: boolean;
}

interface CurrencyCtx {
  code: CurrencyCode;
  setCode: (c: CurrencyCode) => void;
  meta: CurrencyMeta;
  format: (amount: number, opts?: FormatOpts) => string;
  /** Always-USD format for things like gold spot rates that are global by convention */
  formatUSD: (usdAmount: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

function compactFmt(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 1 : 2).replace(/\.?0+$/, "") + "B";
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, "") + "M";
  if (abs >= 1_000) return (value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.?0+$/, "") + "K";
  return value.toFixed(0);
}

function fmt(amount: number, meta: { symbol: string; rate: number; decimals: number }, opts?: FormatOpts) {
  const value = amount * meta.rate;
  const sign = opts?.signed && value > 0 ? "+" : "";
  const negative = value < 0 ? "−" : sign;
  const abs = Math.abs(value);

  if (opts?.compact) {
    return `${negative}${meta.symbol} ${compactFmt(abs)}`;
  }

  const decimals = opts?.decimals ?? meta.decimals;
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${negative}${meta.symbol} ${formatted}`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>("TZS");
  const meta = CURRENCIES[code];
  const value: CurrencyCtx = {
    code,
    setCode,
    meta,
    format: (n, opts) => fmt(n, meta, opts),
    formatUSD: (n) => fmt(n, USD_META),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCurrency must be used within CurrencyProvider");
  return c;
}

