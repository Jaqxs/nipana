import React from "react";

interface StatProps {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone?: "ink" | "rose" | "sage" | "gold";
}

export function Stat({ label, value, hint, icon, tone = "ink" }: StatProps) {
  const toneClasses = {
    ink: "text-ink",
    rose: "text-rose-700",
    sage: "text-sage-700",
    gold: "text-gold-700"
  };

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
        <i className={`${icon} text-gold-600 text-base opacity-70`} />
      </div>
      <div className={`font-numeric text-[26px] leading-none ${toneClasses[tone]}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-2">{hint}</div>
    </div>
  );
}
