import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line,
} from "recharts";
import { Euro, Receipt, TrendingUp, CalendarCheck, Footprints, Megaphone, Users, Building, Package } from "lucide-react";
import { type SalesSnapshot, formatEUR } from "@/lib/sales-mock";

export function SalesOps({ data, factor = 1 }: { data: SalesSnapshot; factor?: number }) {
  const scaled = useMemo(() => ({
    revenue: Math.round(data.revenue * factor),
    orders: Math.round(data.orders * factor),
    avgTicket: +(data.avgTicket * (0.97 + factor * 0.03)).toFixed(2),
    reservationsRevenue: Math.round(data.reservationsRevenue * factor),
    walkInsRevenue: Math.round(data.walkInsRevenue * factor),
    costs: {
      marketing: Math.round(data.costs.marketing * factor),
      staff:     Math.round(data.costs.staff * factor),
      rent:      Math.round(data.costs.rent * factor),
      other:     Math.round(data.costs.other * factor),
    },
  }), [data, factor]);

  const totalSplit = scaled.reservationsRevenue + scaled.walkInsRevenue;
  const splitData = [
    { name: "Reservierungen", value: scaled.reservationsRevenue, color: "hsl(var(--primary))" },
    { name: "Walk-ins",       value: scaled.walkInsRevenue,      color: "hsl(var(--primary) / 0.35)" },
  ];

  const ratio = (n: number) => (scaled.revenue > 0 ? (n / scaled.revenue) * 100 : 0);
  const totalCosts = scaled.costs.marketing + scaled.costs.staff + scaled.costs.rent + scaled.costs.other;
  const margin = scaled.revenue - totalCosts;

  const maxSellerRev = Math.max(...data.topSellers.map((s) => s.revenue));

  return (
    <div className="space-y-6">
      {/* KPI scorecards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SalesKpi icon={Euro}    label="Gesamtumsatz"            value={formatEUR(scaled.revenue)} delta="+8.4%" tone="primary" />
        <SalesKpi icon={Receipt} label="Bestellungen (Bons)"     value={scaled.orders.toLocaleString("de-DE")} delta="+5.1%" tone="emerald" />
        <SalesKpi icon={TrendingUp} label="Ø Bon (Spend / Head)" value={formatEUR(scaled.avgTicket)} delta="+2.3%" tone="violet" />
      </section>

      {/* Top sellers + revenue split */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Seller — Konsum</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Meistverkaufte Produkte nach Umsatzanteil</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topSellers.map((s, i) => {
              const share = (s.revenue / data.revenue) * 100;
              const barW = (s.revenue / maxSellerRev) * 100;
              return (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium truncate">{s.name}</span>
                      <Badge variant="secondary" className="font-normal text-[10px]">{s.category}</Badge>
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

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Umsatz-Split</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Reservierungen vs. Walk-ins</p>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={splitData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {splitData.map((d) => (<Cell key={d.name} fill={d.color} />))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8, border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))", fontSize: 12,
                    }}
                    formatter={(v: number, name) => [formatEUR(v), name as string]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <SplitStat
                icon={CalendarCheck}
                label="Reservierungen"
                value={formatEUR(scaled.reservationsRevenue)}
                share={(scaled.reservationsRevenue / totalSplit) * 100}
                tone="primary"
              />
              <SplitStat
                icon={Footprints}
                label="Walk-ins"
                value={formatEUR(scaled.walkInsRevenue)}
                share={(scaled.walkInsRevenue / totalSplit) * 100}
                tone="muted"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Revenue trend */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Umsatzverlauf — Letzte 7 Tage</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Tagesumsatz in € (Mock)</p>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8, border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))", fontSize: 12,
                }}
                formatter={(v: number) => [formatEUR(v), "Umsatz"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function SalesKpi({
  icon: Icon, label, value, delta, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; delta: string;
  tone: "primary" | "emerald" | "violet";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    violet: "bg-violet-500/10 text-violet-600",
  } as const;
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-500/10">
            {delta}
          </span>
        </div>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SplitStat({
  icon: Icon, label, value, share, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; share: number; tone: "primary" | "muted";
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${tone === "primary" ? "text-primary" : ""}`} />
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground">{share.toFixed(1)}% des Umsatzes</div>
    </div>
  );
}
