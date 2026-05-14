export const fmtCurrency = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(n);

export const fmtWeight = (g: number) =>
  g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g.toFixed(1)} g`;

// Production-ready empty states
export const KPIS = {
  totalSales: 0,
  totalExpenses: 0,
  netProfit: 0,
  stockWeight: 0,
  stockValue: 0,
  cashPosition: 0,
  pendingInvoices: { count: 0, value: 0 },
  activeQuotations: 0,
};

export const SALES_VS_EXPENSES: any[] = [];
export const PROFIT_TREND: any[] = [];
export const STOCK_BY_PURITY: any[] = [];
export const RECENT_TX: any[] = [];
export const PENDING_INVOICES: any[] = [];
export const ALERTS: any[] = [];
export const INVENTORY_BATCHES: any[] = [];
export const QUOTATIONS: any[] = [];
export const CASH_FLOW: any[] = [];
export const CUSTOMERS: any[] = [];
export const SUPPLIERS: any[] = [];
export const ANOMALIES: any[] = [];
export const SITES: any[] = [];

export const GOLD_PRICE = {
  current: 0,
  currency: "USD",
  unit: "per gram",
  source: "N/A",
  asOf: "N/A",
  delta: 0,
  history: [],
};

export const GOLD_FLOW = {
  sold: {
    weight_g: 0,
    value_usd: 0,
    count: 0,
    spark: [],
    avgPricePerGram: 0,
  },
  purchased: {
    weight_g: 0,
    value_usd: 0,
    count: 0,
    spark: [],
    avgPricePerGram: 0,
  },
};
