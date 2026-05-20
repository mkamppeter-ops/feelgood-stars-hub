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
    topSellers: [
      { name: "Craft Beer 0,4l",  category: "Drinks",    qty: 412 + seed * 18, revenue: Math.round(revenue * 0.28) },
      { name: "Smash Burger",     category: "Food",      qty: 188 + seed * 9,  revenue: Math.round(revenue * 0.21) },
      { name: "Signature Cocktail", category: "Cocktails", qty: 134 + seed * 7,  revenue: Math.round(revenue * 0.17) },
      { name: "Loaded Fries",     category: "Food",      qty: 221 + seed * 11, revenue: Math.round(revenue * 0.11) },
      { name: "House Lager 0,5l", category: "Drinks",    qty: 305 + seed * 12, revenue: Math.round(revenue * 0.09) },
      { name: "Aperol Spritz",    category: "Cocktails", qty: 96 + seed * 5,   revenue: Math.round(revenue * 0.07) },
    ],
    costs: {
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
  const topSellers = [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  // sum trend day-by-day
  const revenueTrend = DAYS.map((d, i) => ({
    day: d,
    revenue: all.reduce((s, x) => s + x.revenueTrend[i].revenue, 0),
  }));

  const costs = all.reduce(
    (acc, x) => ({
      marketing: acc.marketing + x.costs.marketing,
      staff:     acc.staff + x.costs.staff,
      rent:      acc.rent + x.costs.rent,
      other:     acc.other + x.costs.other,
    }),
    { marketing: 0, staff: 0, rent: 0, other: 0 },
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
