import { PUBS } from "./pubs-mock";

export type SalesSnapshot = {
  revenue: number;        // €
  orders: number;         // bons
  avgTicket: number;      // €
  reservationsRevenue: number;
  walkInsRevenue: number;
  topSellers: TopSeller[];
  revenueTrend: { day: string; revenue: number }[];
  costs: CostBreakdown;
};

export type CostBreakdown = {
  cogs: number;        // € Cost of Goods Sold
  marketing: number;   // €
  staff: number;       // €
  rent: number;        // €
  other: number;       // € (HQ staff + rent + misc)
};

export type TopSeller = {
  name: string;
  category: "Drinks" | "Food" | "Cocktails";
  qty: number;
  revenue: number;
};

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function trend(base: number) {
  return DAYS.map((d, i) => ({
    day: d,
    // weekend bump
    revenue: Math.round(base * (0.7 + Math.sin(i * 0.9) * 0.15 + (i >= 4 ? 0.35 : 0))),
  }));
}

function snapshot(seed: number): SalesSnapshot {
  const revenue = 9_000 + seed * 1_400;
  const orders = 220 + seed * 35;
  const reservationsRevenue = Math.round(revenue * (0.58 + (seed % 3) * 0.04));
  const walkInsRevenue = revenue - reservationsRevenue;
  // realistic German pub cost structure with slight per-pub variance
  const cogsPct      = 0.28 + (seed % 3) * 0.01;    // ~28–30% wareneinsatz
  const marketingPct = 0.04 + (seed % 3) * 0.005;   // ~4–5%
  const staffPct     = 0.28 + (seed % 4) * 0.008;   // ~28–31%
  const rentPct      = 0.09 + (seed % 3) * 0.005;   // ~9–10%
  const otherPct     = 0.06 + (seed % 2) * 0.005;   // ~6–6.5% (HQ allocation)
  return {
    revenue,
    orders,
    avgTicket: +(revenue / orders).toFixed(2),
    reservationsRevenue,
    walkInsRevenue,
    revenueTrend: trend(revenue / 5),
    topSellers: (() => {
      // Real Pub & Go menu items (prices in €, qty scaled by pub seed)
      const items: { name: string; category: TopSeller["category"]; price: number; baseQty: number }[] = [
        { name: "Pils 0,3l",              category: "Drinks",    price: 2.60, baseQty: 420 },
        { name: "Helles 0,4l",            category: "Drinks",    price: 3.30, baseQty: 360 },
        { name: "Weizen 0,5l",            category: "Drinks",    price: 3.80, baseQty: 240 },
        { name: "Hey Daddy Cola 0,3l",    category: "Drinks",    price: 2.80, baseQty: 280 },
        { name: "Apfelschorle 0,3l",      category: "Drinks",    price: 2.80, baseQty: 190 },
        { name: "Weißwein 0,2l",          category: "Drinks",    price: 5.50, baseQty: 140 },
        { name: "Daddy Spritz 0,2l",      category: "Cocktails", price: 4.90, baseQty: 175 },
        { name: "Longdrink 0,4l",         category: "Cocktails", price: 4.50, baseQty: 130 },
        { name: "Classic Hotdog",         category: "Food",      price: 4.90, baseQty: 210 },
        { name: "Kino-Popcorn",           category: "Food",      price: 3.50, baseQty: 150 },
        { name: "Nachos mit Käsedip",     category: "Food",      price: 5.50, baseQty: 120 },
      ];
      const scale = 0.6 + seed * 0.08;
      return items.map((it) => {
        const qty = Math.round(it.baseQty * scale);
        return { name: it.name, category: it.category, qty, revenue: Math.round(qty * it.price) };
      });
    })(),
    costs: {
      cogs:      Math.round(revenue * cogsPct),
      marketing: Math.round(revenue * marketingPct),
      staff:     Math.round(revenue * staffPct),
      rent:      Math.round(revenue * rentPct),
      other:     Math.round(revenue * otherPct),
    },
  };
}

// Per-pub snapshots — seeded by inverse rank so top pubs earn more
export const SALES_BY_PUB: Record<string, SalesSnapshot> = Object.fromEntries(
  PUBS.map((p) => [p.id, snapshot(PUBS.length - p.rank + 1)]),
);

// Global = sum across all pubs
export const SALES_GLOBAL: SalesSnapshot = (() => {
  const all = Object.values(SALES_BY_PUB);
  const revenue = all.reduce((s, x) => s + x.revenue, 0);
  const orders = all.reduce((s, x) => s + x.orders, 0);
  const reservationsRevenue = all.reduce((s, x) => s + x.reservationsRevenue, 0);
  const walkInsRevenue = all.reduce((s, x) => s + x.walkInsRevenue, 0);

  // aggregate top sellers
  const map = new Map<string, TopSeller>();
  for (const s of all) {
    for (const ts of s.topSellers) {
      const cur = map.get(ts.name);
      if (cur) {
        cur.qty += ts.qty;
        cur.revenue += ts.revenue;
      } else {
        map.set(ts.name, { ...ts });
      }
    }
  }
  const topSellers = [...map.values()].sort((a, b) => b.revenue - a.revenue);

  // sum trend day-by-day
  const revenueTrend = DAYS.map((d, i) => ({
    day: d,
    revenue: all.reduce((s, x) => s + x.revenueTrend[i].revenue, 0),
  }));

  const costs = all.reduce(
    (acc, x) => ({
      cogs:      acc.cogs + x.costs.cogs,
      marketing: acc.marketing + x.costs.marketing,
      staff:     acc.staff + x.costs.staff,
      rent:      acc.rent + x.costs.rent,
      other:     acc.other + x.costs.other,
    }),
    { cogs: 0, marketing: 0, staff: 0, rent: 0, other: 0 },
  );

  return {
    revenue,
    orders,
    avgTicket: +(revenue / orders).toFixed(2),
    reservationsRevenue,
    walkInsRevenue,
    topSellers,
    revenueTrend,
    costs,
  };
})();

export const formatEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ----- Product × Pub matrix for the Sortiments-Heatmap -----
export type ProductMatrix = {
  products: { name: string; category: TopSeller["category"] }[];
  pubIds: string[];
  byPub: Record<string, Record<string, { qty: number; revenue: number }>>;
  avgQty: Record<string, number>;
  avgRevenue: Record<string, number>;
};

export function getProductMatrix(): ProductMatrix {
  const pubIds = Object.keys(SALES_BY_PUB);
  const productMap = new Map<string, TopSeller["category"]>();
  const byPub: Record<string, Record<string, { qty: number; revenue: number }>> = {};

  for (const pid of pubIds) {
    byPub[pid] = {};
    for (const s of SALES_BY_PUB[pid].topSellers) {
      productMap.set(s.name, s.category);
      byPub[pid][s.name] = { qty: s.qty, revenue: s.revenue };
    }
  }

  const products = [...productMap.entries()].map(([name, category]) => ({ name, category }));
  const avgQty: Record<string, number> = {};
  const avgRevenue: Record<string, number> = {};
  for (const p of products) {
    const qs = pubIds.map((pid) => byPub[pid][p.name]?.qty ?? 0);
    const rs = pubIds.map((pid) => byPub[pid][p.name]?.revenue ?? 0);
    avgQty[p.name] = qs.reduce((a, b) => a + b, 0) / pubIds.length;
    avgRevenue[p.name] = rs.reduce((a, b) => a + b, 0) / pubIds.length;
  }

  return { products, pubIds, byPub, avgQty, avgRevenue };
}

