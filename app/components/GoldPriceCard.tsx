"use client";
import { useEffect, useState } from "react";
import { GoldPriceSparkline } from "./Charts";
import { GOLD_PRICE } from "../lib/mockData";

interface Props {
  isAdmin?: boolean;
  onUpdate?: () => void;
}

export function GoldPriceCard({ isAdmin, onUpdate }: Props) {
  const [data, setData] = useState({
    current: GOLD_PRICE.current,
    delta: GOLD_PRICE.delta,
    source: GOLD_PRICE.source,
    asOf: GOLD_PRICE.asOf,
    history: GOLD_PRICE.history
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("/api/market/gold");
        if (res.ok) {
          const market = await res.json();
          setData(prev => ({
            ...prev,
            current: market.current,
            delta: market.delta,
            source: market.source,
            asOf: market.asOf
          }));
        }
      } catch (e) {
        console.error("Failed to fetch market price", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 1000 * 60 * 5); // Update every 5 mins
    return () => clearInterval(interval);
  }, []);

  const { current, delta, source, asOf, history } = data;
  const hasHistory = history && history.length > 0;
  const high = hasHistory ? Math.max(...history) : 0;
  const low = hasHistory ? Math.min(...history) : 0;
  const dayChange = (current - delta) !== 0 ? ((delta / (current - delta)) * 100) : 0;

  return (
    <div className={`surface p-5 flex flex-col transition-opacity duration-500 ${loading ? 'opacity-70' : 'opacity-100'}`} style={{ background: "#fdf6e4" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700 flex items-center gap-2">
            Active Gold Price
            {loading && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-numeric text-[40px] text-ink leading-none">
              ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-ink-soft text-sm">/ gram · USD</span>
          </div>
          <div className="text-xs text-gold-700 mt-1.5 inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 surface-flat px-2 py-0.5">
              <i className={delta >= 0 ? "ri-arrow-up-line" : "ri-arrow-down-line"} />
              ${Math.abs(delta).toFixed(2)} ({dayChange.toFixed(2)}%)
            </span>
            <span className="text-ink-muted">{source}</span>
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: "#b8893d" }}
        >
          <img src="/assets/logo.jpeg" alt="NIPANA Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="mt-4">
        <GoldPriceSparkline data={history} />
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted text-center -mt-1">Historical Context</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="surface-flat px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">7d high</div>
          <div className="font-numeric text-base text-ink mt-0.5">${high.toFixed(2)}</div>
        </div>
        <div className="surface-flat px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">7d low</div>
          <div className="font-numeric text-base text-ink mt-0.5">${low.toFixed(2)}</div>
        </div>
        <div className="surface-flat px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Live</div>
          <div className="font-numeric text-base text-sage-700 mt-0.5">Active</div>
        </div>
      </div>

      <div className="divider-rule my-4" />

      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>Last Update: {asOf}</span>
        {isAdmin && (
          <button onClick={onUpdate} className="text-gold-700 font-medium hover:underline inline-flex items-center gap-1">
            Force Refresh <i className="ri-refresh-line" />
          </button>
        )}
      </div>
    </div>
  );
}
