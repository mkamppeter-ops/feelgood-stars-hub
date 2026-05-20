import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wine, UtensilsCrossed, Martini, Package } from "lucide-react";
import { type SalesSnapshot, type TopSeller, formatEUR } from "@/lib/sales-mock";

type Cat = TopSeller["category"];

const CAT_META: Record<Cat | "all", { label: string; icon: typeof Wine; tone: string }> = {
  all:       { label: "Alle",       icon: Package,           tone: "bg-muted text-foreground" },
  Drinks:    { label: "Getränke",   icon: Wine,              tone: "bg-amber-500/10 text-amber-600" },
  Food:      { label: "Speisen",    icon: UtensilsCrossed,   tone: "bg-emerald-500/10 text-emerald-600" },
  Cocktails: { label: "Cocktails",  icon: Martini,           tone: "bg-violet-500/10 text-violet-600" },
};

export function Sortiment({ data, factor = 1, title = "Sortiment & Konsum" }: {
  data: SalesSnapshot;
  factor?: number;
  title?: string;
}) {
  const [filter, setFilter] = useState<Cat | "all">("all");

  const scaledSellers = useMemo(
    () => data.topSellers.map((s) => ({
      ...s,
      qty: Math.round(s.qty * factor),
      revenue: Math.round(s.revenue * factor),
    })),
    [data, factor],
  );

  const totals = useMemo(() => {
    const acc: Record<Cat, { qty: number; revenue: number }> = {
      Drinks:    { qty: 0, revenue: 0 },
      Food:      { qty: 0, revenue: 0 },
      Cocktails: { qty: 0, revenue: 0 },
    };
    for (const s of scaledSellers) {
      acc[s.category].qty += s.qty;
      acc[s.category].revenue += s.revenue;
    }
    return acc;
  }, [scaledSellers]);

  const totalRevenue = scaledSellers.reduce((s, x) => s + x.revenue, 0);
  const filtered = filter === "all" ? scaledSellers : scaledSellers.filter((s) => s.category === filter);
  const maxRev = Math.max(...filtered.map((s) => s.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Category summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(totals) as Cat[]).map((c) => {
          const Icon = CAT_META[c].icon;
          const share = totalRevenue > 0 ? (totals[c].revenue / totalRevenue) * 100 : 0;
          return (
            <Card key={c} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${CAT_META[c].tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="font-normal tabular-nums">{share.toFixed(1)}%</Badge>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">{CAT_META[c].label}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                    {formatEUR(totals[c].revenue)}
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    {totals[c].qty.toLocaleString("de-DE")} verkauft
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Filterable seller list */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Meistverkaufte Produkte nach Umsatzanteil
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(["all", "Drinks", "Food", "Cocktails"] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={filter === c ? "default" : "ghost"}
                className="h-7 text-xs px-2.5"
                onClick={() => setFilter(c)}
              >
                {CAT_META[c].label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((s, i) => {
            const share = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
            const barW = (s.revenue / maxRev) * 100;
            const Icon = CAT_META[s.category].icon;
            return (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${CAT_META[s.category].tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium truncate">{s.name}</span>
                    <Badge variant="secondary" className="font-normal text-[10px]">{CAT_META[s.category].label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs tabular-nums">
                    <span className="text-muted-foreground">{s.qty}×</span>
                    <span className="font-semibold w-20 text-right">{formatEUR(s.revenue)}</span>
                    <span className="text-muted-foreground w-12 text-right">{share.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-primary/40"}`}
                    style={{ width: `${barW}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
