import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Trophy, TrendingUp, Users, Star, Gauge, Phone, LayoutDashboard,
  Building2, MessageSquare, Settings, Bell, Search,
} from "lucide-react";
import { PUBS } from "@/lib/pubs-mock";
import { SALES_GLOBAL, SALES_BY_PUB, formatEUR } from "@/lib/sales-mock";
import { ArrowUpRight } from "lucide-react";
import { DateRangePicker, RANGE_FACTOR, RANGE_LABELS, type DateRange } from "@/components/date-range-picker";
import { LiveFeedback } from "@/components/live-feedback";
import { SalesOps } from "@/components/sales-ops";

export const Route = createFileRoute("/hq/")({
  head: () => ({
    meta: [
      { title: "Pub Ops Navigator — HQ Dashboard" },
      { name: "description", content: "Management-Dashboard für die Pub-Kette: KPIs, Leaderboard und Direct Contact." },
    ],
  }),
  component: HQPage,
});

const chartData = PUBS.slice(0, 5).map((p) => ({
  name: p.name.replace(/^The /, ""),
  value: p.spendPerBooking,
}));

function HQPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>("last7");
  const [pulseKey, setPulseKey] = useState(0);
  const factor = RANGE_FACTOR[range];

  const kpis = useMemo(() => ({
    score: Math.round(82 * factor),
    booking: Math.round(76 * factor),
    walkIn: Math.max(5, Math.round(22 * (2 - factor))),
    feedback: Math.min(5, +(4.6 * (0.96 + factor * 0.04)).toFixed(1)),
  }), [factor]);

  const handleRangeChange = (v: DateRange) => {
    setRange(v);
    setPulseKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r bg-card">
        <div className="h-16 flex items-center gap-2 px-6 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Pub Ops</div>
            <div className="text-[11px] text-muted-foreground leading-tight">Navigator</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: Building2, label: "Pubs" },
            { icon: TrendingUp, label: "Performance" },
            { icon: MessageSquare, label: "Feedback" },
            { icon: Users, label: "Teams" },
            { icon: Settings, label: "Settings" },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">← Admin</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card/60 backdrop-blur flex items-center justify-between px-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">HQ Dashboard</h1>
            <p className="text-xs text-muted-foreground truncate">Zeitraum: {RANGE_LABELS[range]}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DateRangePicker value={range} onChange={handleRangeChange} />
            <Button variant="outline" size="icon" className="hidden sm:inline-flex"><Search className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="hidden sm:inline-flex"><Bell className="h-4 w-4" /></Button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-semibold">HQ</div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales &amp; Operations</TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                Live Feedback
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">3</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* KPIs */}
              <section key={pulseKey} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
                <KpiCard icon={Gauge} label="Ø Pub Performance Score" value={`${kpis.score}`} suffix="/100" delta="+3.2%" tone="primary" />
                <KpiCard icon={TrendingUp} label="Gesamt Booking Ratio" value={`${kpis.booking}`} suffix="%" delta="+1.8%" tone="emerald" />
                <KpiCard icon={Users} label="Walk-In Quote" value={`${kpis.walkIn}`} suffix="%" delta="-0.6%" tone="amber" negative />
                <KpiCard icon={Star} label="Interner Feedback-Schnitt" value={`${kpis.feedback}`} suffix=" ⭐" delta="+0.1" tone="violet" />
              </section>

              {/* Middle row: Leaderboard + Direct Contact */}
              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">Leaderboard</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Ranking nach Pub Performance Score</p>
                    </div>
                    <Badge variant="secondary" className="font-normal">{PUBS.length} Pubs</Badge>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Pub</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Booking</TableHead>
                          <TableHead className="text-right">Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PUBS.map((p) => (
                          <TableRow
                            key={p.id}
                            onClick={() => navigate({ to: "/hq/$pubId", params: { pubId: p.id } })}
                            className={`cursor-pointer group ${p.rank === 1 ? "bg-amber-50/60 dark:bg-amber-500/5" : ""}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {p.rank === 1 ? (
                                  <Trophy className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <span className="text-muted-foreground font-mono text-xs">{p.rank}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium group-hover:text-primary transition-colors">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.city}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center justify-end font-semibold ${
                                p.score >= 85 ? "text-emerald-600" : p.score >= 75 ? "text-foreground" : "text-amber-600"
                              }`}>{p.score}</span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{p.bookingRatio}%</TableCell>
                            <TableCell className="text-right tabular-nums">{p.feedback.toFixed(1)} ⭐</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Direct Contact</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Schnell-Eingreif-Liste · Filialleiter</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {PUBS.slice(0, 6).map((p) => (
                      <div key={p.name} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.manager}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.name}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noreferrer">
                            <Button size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white">
                              <WhatsAppIcon className="h-4 w-4" />
                            </Button>
                          </a>
                          <a href={`tel:${p.phone}`}>
                            <Button size="icon" className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Chart */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Spend per Booking — Top 5 Pubs</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Durchschnittlicher Umsatz pro Buchung (€)</p>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `€${v}`} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`€${v}`, "Spend / Booking"]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.45)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="mt-0 space-y-6">
              <SalesOps data={SALES_GLOBAL} factor={factor} />

              {/* Per-Pub Sales Breakdown */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Sales nach Filiale</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Umsatz, Bons und Ø Bon für jede Bar — Klick öffnet die Detailansicht
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal">{PUBS.length} Pubs</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pub</TableHead>
                        <TableHead className="text-right">Umsatz</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Bons</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Ø Bon</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Reservierungen</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Walk-ins</TableHead>
                        <TableHead className="text-right">Top Seller</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...PUBS]
                        .map((p) => ({ pub: p, s: SALES_BY_PUB[p.id] }))
                        .sort((a, b) => b.s.revenue - a.s.revenue)
                        .map(({ pub, s }) => {
                          const revenue = Math.round(s.revenue * factor);
                          const orders = Math.round(s.orders * factor);
                          const avg = +(revenue / orders).toFixed(2);
                          const resv = Math.round(s.reservationsRevenue * factor);
                          const walk = Math.round(s.walkInsRevenue * factor);
                          const top = s.topSellers[0];
                          return (
                            <TableRow
                              key={pub.id}
                              onClick={() => navigate({ to: "/hq/$pubId", params: { pubId: pub.id } })}
                              className="cursor-pointer group"
                            >
                              <TableCell>
                                <div className="font-medium group-hover:text-primary transition-colors">{pub.name}</div>
                                <div className="text-xs text-muted-foreground">{pub.city}</div>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">{formatEUR(revenue)}</TableCell>
                              <TableCell className="text-right tabular-nums hidden sm:table-cell">{orders.toLocaleString("de-DE")}</TableCell>
                              <TableCell className="text-right tabular-nums hidden md:table-cell">{formatEUR(avg)}</TableCell>
                              <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">{formatEUR(resv)}</TableCell>
                              <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">{formatEUR(walk)}</TableCell>
                              <TableCell className="text-right">
                                <div className="text-xs font-medium truncate max-w-[160px] ml-auto">{top.name}</div>
                                <div className="text-[10px] text-muted-foreground">{top.qty}× · {formatEUR(top.revenue)}</div>
                              </TableCell>
                              <TableCell>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="mt-0">
              <LiveFeedback />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, suffix, delta, tone, negative,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; suffix?: string; delta: string;
  tone: "primary" | "emerald" | "amber" | "violet"; negative?: boolean;
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
  } as const;
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            negative ? "text-red-600 bg-red-500/10" : "text-emerald-600 bg-emerald-500/10"
          }`}>{delta}</span>
        </div>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {value}<span className="text-base text-muted-foreground font-normal">{suffix}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}
