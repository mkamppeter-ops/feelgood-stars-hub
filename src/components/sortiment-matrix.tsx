import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, AlertTriangle, BarChart3, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getProductMatrix, formatEUR, type TopSeller } from "@/lib/sales-mock";
import { PUBS } from "@/lib/pubs-mock";

type Cat = TopSeller["category"];
const CAT_FILTERS: ("all" | Cat)[] = ["all", "Drinks", "Food", "Cocktails"];
const CAT_LABEL: Record<"all" | Cat, string> = {
  all: "Alle",
  Drinks: "Getränke",
  Food: "Speisen",
  Cocktails: "Cocktails",
};

// Color band based on index vs. chain average (100 = chain avg)
function cellStyle(idx: number): { className: string; intensity: "high" | "low" | "neutral" } {
  if (idx >= 130) return { className: "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold", intensity: "high" };
  if (idx >= 110) return { className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", intensity: "high" };
  if (idx >= 91)  return { className: "bg-muted/60 text-foreground/80", intensity: "neutral" };
  if (idx >= 71)  return { className: "bg-rose-500/10 text-rose-700 dark:text-rose-300", intensity: "low" };
  return { className: "bg-rose-500/25 text-rose-700 dark:text-rose-300 font-semibold", intensity: "low" };
}

export function SortimentMatrix() {
  const [filter, setFilter] = useState<"all" | Cat>("all");
  const [sortMode, setSortMode] = useState<"revenue" | "spread">("revenue");
  const matrix = useMemo(() => getProductMatrix(), []);

  // pub display order = same as PUBS (by rank)
  const pubList = useMemo(
    () => PUBS.filter((p) => matrix.pubIds.includes(p.id)),
    [matrix.pubIds],
  );

  const rows = useMemo(() => {
    const filtered = matrix.products.filter((p) => filter === "all" || p.category === filter);
    return filtered
      .map((p) => {
        const cells = pubList.map((pub) => {
          const cell = matrix.byPub[pub.id][p.name];
          const qty = cell?.qty ?? 0;
          const revenue = cell?.revenue ?? 0;
          const avg = matrix.avgQty[p.name] || 1;
          const idx = Math.round((qty / avg) * 100);
          return { pub, qty, revenue, idx };
        });
        const idxs = cells.map((c) => c.idx);
        const spread = Math.max(...idxs) - Math.min(...idxs);
        return { product: p, cells, spread, avgRevenue: matrix.avgRevenue[p.name] };
      })
      .sort((a, b) =>
        sortMode === "spread"
          ? b.spread - a.spread
          : b.avgRevenue - a.avgRevenue,
      );
  }, [matrix, filter, sortMode, pubList]);

  // Insights
  const insights = useMemo(() => {
    let topPerformer = { idx: -Infinity, product: "", pub: "", qty: 0 };
    let biggestGap = { idx: Infinity, product: "", pub: "", qty: 0 };
    let totalSpread = 0;
    for (const r of rows) {
      for (const c of r.cells) {
        if (c.idx > topPerformer.idx) topPerformer = { idx: c.idx, product: r.product.name, pub: c.pub.name, qty: c.qty };
        if (c.idx < biggestGap.idx) biggestGap = { idx: c.idx, product: r.product.name, pub: c.pub.name, qty: c.qty };
      }
      totalSpread += r.spread;
    }
    const avgSpread = rows.length > 0 ? Math.round(totalSpread / rows.length) : 0;
    return { topPerformer, biggestGap, avgSpread };
  }, [rows]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">Sortiment nach Filiale</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Index vs. Kettendurchschnitt (100 = Schnitt) — hebt Top-Performer und Sortimentslücken hervor
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {CAT_FILTERS.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={filter === c ? "default" : "ghost"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setFilter(c)}
                >
                  {CAT_LABEL[c]}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 border-l border-border pl-2 ml-1">
              <Button
                size="sm"
                variant={sortMode === "revenue" ? "secondary" : "ghost"}
                className="h-7 text-xs px-2.5"
                onClick={() => setSortMode("revenue")}
              >
                Nach Umsatz
              </Button>
              <Button
                size="sm"
                variant={sortMode === "spread" ? "secondary" : "ghost"}
                className="h-7 text-xs px-2.5"
                onClick={() => setSortMode("spread")}
              >
                Größte Streuung
              </Button>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <InsightChip
            icon={Trophy}
            tone="emerald"
            label="Top-Abweichler"
            value={`${insights.topPerformer.product} @ ${insights.topPerformer.pub}`}
            delta={`+${insights.topPerformer.idx - 100}%`}
          />
          <InsightChip
            icon={AlertTriangle}
            tone="rose"
            label="Größte Lücke"
            value={`${insights.biggestGap.product} @ ${insights.biggestGap.pub}`}
            delta={`${insights.biggestGap.idx - 100}%`}
          />
          <InsightChip
            icon={BarChart3}
            tone="slate"
            label="Ø Streuung"
            value={`${insights.avgSpread} Punkte`}
            delta={insights.avgSpread > 100 ? "hoch" : insights.avgSpread > 60 ? "mittel" : "niedrig"}
          />
        </div>
      </CardHeader>

      <CardContent>
        <TooltipProvider delayDuration={150}>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card text-left font-medium text-xs text-muted-foreground py-2 pr-3 min-w-[160px]">
                    Produkt
                  </th>
                  {pubList.map((p) => (
                    <th key={p.id} className="px-1 py-2 text-center">
                      <Link
                        to="/hq/$pubId"
                        params={{ pubId: p.id }}
                        className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors block leading-tight"
                        title={p.name}
                      >
                        {p.name.replace(/^The /, "").split(" ").slice(0, 2).join(" ")}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product.name}>
                    <td className="sticky left-0 z-10 bg-card py-1.5 pr-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{row.product.name}</span>
                        <Badge variant="secondary" className="font-normal text-[9px] px-1.5 py-0">
                          {CAT_LABEL[row.product.category]}
                        </Badge>
                      </div>
                    </td>
                    {row.cells.map((c) => {
                      const style = cellStyle(c.idx);
                      const showWarn = c.idx <= 70;
                      return (
                        <td key={c.pub.id} className="p-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to="/hq/$pubId"
                                params={{ pubId: c.pub.id }}
                                className={`flex items-center justify-center gap-0.5 h-9 rounded-md tabular-nums text-xs transition-all hover:ring-2 hover:ring-primary/40 ${style.className}`}
                              >
                                {c.idx}
                                {showWarn && <AlertCircle className="h-3 w-3" />}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <div className="font-medium">{c.pub.name}</div>
                              <div className="text-muted-foreground">{row.product.name}</div>
                              <div className="mt-1 space-y-0.5">
                                <div>Menge: <span className="font-medium text-foreground">{c.qty}×</span></div>
                                <div>Umsatz: <span className="font-medium text-foreground">{formatEUR(c.revenue)}</span></div>
                                <div>vs. Schnitt: <span className={`font-medium ${c.idx >= 100 ? "text-emerald-500" : "text-rose-500"}`}>{c.idx >= 100 ? "+" : ""}{c.idx - 100}%</span></div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-muted-foreground">
          <span>Index-Skala:</span>
          <LegendSwatch className="bg-rose-500/25" label="≤ 70" />
          <LegendSwatch className="bg-rose-500/10" label="71–90" />
          <LegendSwatch className="bg-muted/60" label="91–109" />
          <LegendSwatch className="bg-emerald-500/10" label="110–129" />
          <LegendSwatch className="bg-emerald-500/25" label="≥ 130" />
        </div>
      </CardContent>
    </Card>
  );
}

function InsightChip({
  icon: Icon, tone, label, value, delta,
}: {
  icon: typeof Trophy;
  tone: "emerald" | "rose" | "slate";
  label: string;
  value: string;
  delta: string;
}) {
  const toneClasses = {
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    rose:    "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    slate:   "bg-muted text-foreground",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${toneClasses}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xs font-medium truncate">{value}</div>
      </div>
      <div className={`text-xs font-semibold tabular-nums shrink-0 ${tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-muted-foreground"}`}>
        {delta}
      </div>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-5 rounded ${className}`} />
      {label}
    </span>
  );
}
