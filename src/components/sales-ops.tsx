import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line,
} from "recharts";
import { Euro, Receipt, TrendingUp, CalendarCheck, Footprints, Megaphone, Users, Building, Package, ShoppingBasket, Sparkles } from "lucide-react";
import { type SalesSnapshot, formatEUR } from "@/lib/sales-mock";
import { useT } from "@/lib/use-t";

export function SalesOps({ data, factor = 1 }: { data: SalesSnapshot; factor?: number }) {
  const tt = useT();
  const scaled = useMemo(() => ({
    revenue: Math.round(data.revenue * factor),
    orders: Math.round(data.orders * factor),
    avgTicket: +(data.avgTicket * (0.97 + factor * 0.03)).toFixed(2),
    reservationsRevenue: Math.round(data.reservationsRevenue * factor),
    walkInsRevenue: Math.round(data.walkInsRevenue * factor),
    costs: {
      cogs:      Math.round(data.costs.cogs * factor),
      marketing: Math.round(data.costs.marketing * factor),
      staff:     Math.round(data.costs.staff * factor),
      rent:      Math.round(data.costs.rent * factor),
      other:     Math.round(data.costs.other * factor),
    },
  }), [data, factor]);

  const totalSplit = scaled.reservationsRevenue + scaled.walkInsRevenue;
  const splitData = [
    { name: tt("Reservierungen", "Reservations"), value: scaled.reservationsRevenue, color: "hsl(var(--primary))" },
    { name: "Walk-ins",                            value: scaled.walkInsRevenue,      color: "hsl(var(--primary) / 0.35)" },
  ];

  const ratio = (n: number) => (scaled.revenue > 0 ? (n / scaled.revenue) * 100 : 0);
  const totalCosts = scaled.costs.cogs + scaled.costs.marketing + scaled.costs.staff + scaled.costs.rent + scaled.costs.other;
  const ebitda = scaled.revenue - totalCosts;
  const ebitdaMargin = scaled.revenue > 0 ? (ebitda / scaled.revenue) * 100 : 0;

  

  return (
    <div className="space-y-6">
      {/* KPI scorecards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SalesKpi icon={Euro}    label={tt("Gesamtumsatz", "Total revenue")}                  value={formatEUR(scaled.revenue)} delta="+8.4%" tone="primary" />
        <SalesKpi icon={Receipt} label={tt("Bestellungen (Bons)", "Orders (tickets)")}        value={scaled.orders.toLocaleString()} delta="+5.1%" tone="emerald" />
        <SalesKpi icon={TrendingUp} label={tt("Ø Bon (Spend / Head)", "Avg ticket (spend/head)")} value={formatEUR(scaled.avgTicket)} delta="+2.3%" tone="violet" />
      </section>

      {/* EBITDA hero */}
      <Card className="shadow-sm overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">EBITDA</span>
                  <Badge variant="secondary" className="font-normal text-[10px]">{tt("vor Steuern · Zinsen · Abschreibungen", "before taxes · interest · depreciation")}</Badge>
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className={`text-4xl font-semibold tracking-tight tabular-nums ${ebitda >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatEUR(ebitda)}
                  </span>
                  <span className={`text-lg font-medium tabular-nums ${ebitda >= 0 ? "text-emerald-600/80" : "text-red-600/80"}`}>
                    {ebitdaMargin.toFixed(1)}% {tt("Marge", "margin")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {tt("Umsatz", "Revenue")} {formatEUR(scaled.revenue)} − {tt("Kosten", "Costs")} {formatEUR(totalCosts)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:min-w-[320px]">
              <MiniStat label={tt("Umsatz", "Revenue")} value={formatEUR(scaled.revenue)}  tone="primary" />
              <MiniStat label={tt("Kosten", "Costs")}   value={formatEUR(totalCosts)}      tone="slate" />
              <MiniStat label="EBITDA"                   value={formatEUR(ebitda)}          tone="emerald" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost structure */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{tt("Kostenstruktur", "Cost structure")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {tt("Ausgaben in % vom Umsatz · niedriger = besser", "Spending as % of revenue · lower is better")}
            </p>
          </div>
          <Badge variant="secondary" className="font-normal tabular-nums">
            EBITDA {ebitdaMargin.toFixed(1)}%
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <CostRatio icon={ShoppingBasket} label={tt("Wareneinsatz", "COGS")}      amount={scaled.costs.cogs}     ratio={ratio(scaled.costs.cogs)}      target={30} tone="rose" />
            <CostRatio icon={Users}     label={tt("Personal", "Staff")}              amount={scaled.costs.staff}     ratio={ratio(scaled.costs.staff)}     target={30} tone="primary" />
            <CostRatio icon={Building}  label={tt("Miete", "Rent")}                  amount={scaled.costs.rent}      ratio={ratio(scaled.costs.rent)}      target={10} tone="amber" />
            <CostRatio icon={Megaphone} label="Marketing"                            amount={scaled.costs.marketing} ratio={ratio(scaled.costs.marketing)} target={5}  tone="violet" />
            <CostRatio icon={Package}   label={tt("Sonstige (HQ)", "Other (HQ)")}    amount={scaled.costs.other}    ratio={ratio(scaled.costs.other)}     target={7}  tone="slate" />
          </div>

          <div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="bg-rose-500"        style={{ width: `${ratio(scaled.costs.cogs)}%` }} />
              <div className="bg-primary"         style={{ width: `${ratio(scaled.costs.staff)}%` }} />
              <div className="bg-amber-500"       style={{ width: `${ratio(scaled.costs.rent)}%` }} />
              <div className="bg-violet-500"      style={{ width: `${ratio(scaled.costs.marketing)}%` }} />
              <div className="bg-slate-400"       style={{ width: `${ratio(scaled.costs.other)}%` }} />
              <div className="bg-emerald-500/70"  style={{ width: `${Math.max(0, ratio(ebitda))}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <LegendDot color="bg-rose-500"       label={`${tt("Wareneinsatz", "COGS")} ${ratio(scaled.costs.cogs).toFixed(1)}%`} />
              <LegendDot color="bg-primary"        label={`${tt("Personal", "Staff")} ${ratio(scaled.costs.staff).toFixed(1)}%`} />
              <LegendDot color="bg-amber-500"      label={`${tt("Miete", "Rent")} ${ratio(scaled.costs.rent).toFixed(1)}%`} />
              <LegendDot color="bg-violet-500"     label={`Marketing ${ratio(scaled.costs.marketing).toFixed(1)}%`} />
              <LegendDot color="bg-slate-400"      label={`${tt("Sonstige", "Other")} ${ratio(scaled.costs.other).toFixed(1)}%`} />
              <LegendDot color="bg-emerald-500/70" label={`EBITDA ${ebitdaMargin.toFixed(1)}%`} />
            </div>
          </div>
        </CardContent>
      </Card>





      {/* Revenue split */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{tt("Umsatz-Split", "Revenue split")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{tt("Reservierungen vs. Walk-ins", "Reservations vs. walk-ins")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
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
            <div className="grid grid-cols-1 gap-3">
              <SplitStat
                icon={CalendarCheck}
                label={tt("Reservierungen", "Reservations")}
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
          </div>
        </CardContent>
      </Card>


      {/* Revenue trend */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{tt("Umsatzverlauf — Letzte 7 Tage", "Revenue trend — last 7 days")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{tt("Tagesumsatz in € (Mock)", "Daily revenue in € (mock)")}</p>
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
                formatter={(v: number) => [formatEUR(v), tt("Umsatz", "Revenue")]}
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
  const tt = useT();
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${tone === "primary" ? "text-primary" : ""}`} />
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground">{share.toFixed(1)}% {tt("des Umsatzes", "of revenue")}</div>
    </div>
  );
}

function CostRatio({
  icon: Icon, label, amount, ratio, target, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; amount: number; ratio: number; target: number;
  tone: "primary" | "violet" | "amber" | "slate" | "rose";
}) {
  const toneMap = {
    primary: { chip: "bg-primary/10 text-primary", bar: "bg-primary" },
    violet:  { chip: "bg-violet-500/10 text-violet-600", bar: "bg-violet-500" },
    amber:   { chip: "bg-amber-500/10 text-amber-600", bar: "bg-amber-500" },
    slate:   { chip: "bg-slate-500/10 text-slate-600", bar: "bg-slate-400" },
    rose:    { chip: "bg-rose-500/10 text-rose-600", bar: "bg-rose-500" },
  } as const;
  const overBudget = ratio > target;
  const tt = useT();
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="flex items-center justify-between gap-2">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${toneMap[tone].chip}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
          overBudget ? "text-red-600 bg-red-500/10" : "text-emerald-600 bg-emerald-500/10"
        }`}>
          {tt("Ziel", "Target")} ≤{target}%
        </span>
      </div>
      <div className="mt-3">
        <div className="text-xs text-muted-foreground">{label} {tt("Quote", "ratio")}</div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">
          {ratio.toFixed(1)}<span className="text-base text-muted-foreground font-normal">%</span>
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">{formatEUR(amount)}</div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${toneMap[tone].bar}`} style={{ width: `${Math.min(100, ratio * (50 / target))}%` }} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "primary" | "slate" | "emerald" }) {
  const toneMap = {
    primary: "text-primary",
    slate:   "text-foreground",
    emerald: "text-emerald-600",
  } as const;
  return (
    <div className="rounded-lg bg-card/70 backdrop-blur border p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold tabular-nums mt-0.5 ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}
