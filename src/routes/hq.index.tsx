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
  Trophy, TrendingUp, Users, Star, Gauge, Phone, LayoutDashboard,
  Building2, MessageSquare, Settings, Bell, Search, Target, CalendarCheck, Smartphone, Gift, Activity,
} from "lucide-react";
import { PUBS, computeScore, getAppReach } from "@/lib/pubs-mock";
import { SALES_GLOBAL, SALES_BY_PUB, formatEUR } from "@/lib/sales-mock";
import { ArrowUpRight } from "lucide-react";
import { DateRangePicker, RANGE_FACTOR, RANGE_LABELS, type DateRange } from "@/components/date-range-picker";
import { LiveFeedback } from "@/components/live-feedback";
import { SalesOps } from "@/components/sales-ops";
import { Sortiment } from "@/components/sortiment";
import { SortimentMatrix } from "@/components/sortiment-matrix";
import { EventsResults } from "@/components/events-results";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { ActiveOps } from "@/components/active-ops";
import { RequireRole, LogoutButton } from "@/components/auth-guard";

export const Route = createFileRoute("/hq/")({
  head: () => ({
    meta: [
      { title: "Pub Ops Navigator — HQ Dashboard" },
      { name: "description", content: "Management-Dashboard für die Pub-Kette: KPIs, Leaderboard und Direct Contact." },
    ],
  }),
  component: () => (
    <RequireRole roles={["hq_admin"]}>
      <HQPage />
    </RequireRole>
  ),
});


function HQPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>("last7");
  const [pulseKey, setPulseKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const factor = RANGE_FACTOR[range];

  const kpis = useMemo(() => {
    const avgRevenueTarget = PUBS.reduce((s, p) => s + p.revenueTarget, 0) / PUBS.length;
    const avgWalkIn        = PUBS.reduce((s, p) => s + p.walkInRatio, 0) / PUBS.length;
    const avgFeedback      = PUBS.reduce((s, p) => s + p.feedback, 0) / PUBS.length;
    const avgBooking       = PUBS.reduce((s, p) => s + p.bookingRatio, 0) / PUBS.length;
    const avgScore         = PUBS.reduce((s, p) => s + computeScore(p), 0) / PUBS.length;
    const totalAppUsers    = PUBS.reduce((s, p) => s + p.activeAppUsers, 0);
    const totalAppTarget   = PUBS.reduce((s, p) => s + p.appUsersTarget, 0);
    const appReach         = Math.round((totalAppUsers / totalAppTarget) * 100);
    return {
      score:        Math.round(avgScore * factor),
      revenueGoal:  Math.round(avgRevenueTarget * factor),
      walkIn:       Math.round(avgWalkIn * factor),
      feedback:     Math.min(5, +(avgFeedback * (0.96 + factor * 0.04)).toFixed(1)),
      booking:      Math.round(avgBooking * factor),
      appReach,
      appUsers:     totalAppUsers,
      appTarget:    totalAppTarget,
    };
  }, [factor]);

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
            { icon: LayoutDashboard, label: "Overview", tab: "overview" },
            { icon: Building2, label: "Pubs", tab: "pubs" },
            { icon: Activity, label: "Active Ops", tab: "active-ops" },
            { icon: TrendingUp, label: "Sales & Ops", tab: "sales" },
            { icon: Building2, label: "Sortiment", tab: "sortiment" },
            { icon: CalendarCheck, label: "Events", tab: "events" },
            { icon: MessageSquare, label: "Feedback", tab: "feedback" },
          ].map(({ icon: Icon, label, tab }) => {
            const active = activeTab === tab;
            return (
              <button
                key={label}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
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
            <a href="/feedback" target="_blank" rel="noopener" className="hidden md:inline-flex">
              <Button variant="outline" size="sm">Gast-View</Button>
            </a>
            <Button variant="outline" size="icon" className="hidden sm:inline-flex"><Search className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="hidden sm:inline-flex"><Bell className="h-4 w-4" /></Button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-semibold">HQ</div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pubs" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Pubs
              </TabsTrigger>
              <TabsTrigger value="active-ops" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Active Ops
              </TabsTrigger>
              <TabsTrigger value="sales">Sales &amp; Operations</TabsTrigger>
              <TabsTrigger value="sortiment">Sortiment</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                Live Feedback
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">3</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pubs" className="mt-0">
              <PubsGrid onOpen={(id) => navigate({ to: "/hq/$pubId", params: { pubId: id } })} />
            </TabsContent>

            <TabsContent value="active-ops" className="mt-0">
              <ActiveOps />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* KPIs */}
              <section key={pulseKey} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
                <KpiCard icon={Gauge} label="Ø Pub Performance Score" value={`${kpis.score}`} suffix="/100" delta="+3.2%" tone="primary" />
                <KpiCard icon={Target} label="Ø Umsatz-Ziel" value={`${kpis.revenueGoal}`} suffix="%" delta="+2.4%" tone={kpis.revenueGoal >= 100 ? "emerald" : "amber"} />
                <KpiCard
                  icon={Smartphone}
                  label="Ø App-User Reach"
                  value={`${kpis.appReach}`}
                  suffix="%"
                  delta="+5.1%"
                  tone={kpis.appReach >= 100 ? "emerald" : kpis.appReach >= 80 ? "amber" : "primary"}
                  sub={`${kpis.appUsers.toLocaleString("de-DE")} / ${kpis.appTarget.toLocaleString("de-DE")} User`}
                />
                <KpiCard icon={Users} label="Ø Walk-In Ratio" value={`${kpis.walkIn}`} suffix="%" delta="+0.8%" tone="amber" />
                <KpiCard icon={Star} label="Ø Gäste-Feedback" value={`${kpis.feedback}`} suffix=" ⭐" delta="+0.1" tone="violet" />
              </section>

              {/* Middle row: Leaderboard + Direct Contact */}
              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">Leaderboard</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Score = Mittel aus Umsatz-Ziel, Walk-In Ratio &amp; Gäste-Feedback
                      </p>
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
                          <TableHead className="text-right hidden sm:table-cell">Umsatz-Ziel</TableHead>
                          <TableHead className="text-right hidden md:table-cell">Walk-In</TableHead>
                          <TableHead className="text-right">Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...PUBS]
                          .map((p) => ({ p, score: computeScore(p) }))
                          .sort((a, b) => b.score - a.score)
                          .map(({ p, score }, idx) => (
                          <TableRow
                            key={p.id}
                            onClick={() => navigate({ to: "/hq/$pubId", params: { pubId: p.id } })}
                            className={`cursor-pointer group ${idx === 0 ? "bg-amber-50/60 dark:bg-amber-500/5" : ""}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {idx === 0 ? (
                                  <Trophy className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <span className="text-muted-foreground font-mono text-xs">{idx + 1}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium group-hover:text-primary transition-colors">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.city}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center justify-end font-semibold ${
                                score >= 85 ? "text-emerald-600" : score >= 75 ? "text-foreground" : "text-amber-600"
                              }`}>{score}</span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums hidden sm:table-cell">
                              <span className={p.revenueTarget >= 100 ? "text-emerald-600 font-medium" : "text-amber-600"}>{p.revenueTarget}%</span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums hidden md:table-cell">{p.walkInRatio}%</TableCell>
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

              {/* Booking Ratio overview */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-emerald-600" />
                      Booking Ratio nach Filiale
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anteil reservierter Tische — Ø {kpis.booking}% über alle {PUBS.length} Pubs
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal tabular-nums">Ø {kpis.booking}%</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[...PUBS].sort((a, b) => b.bookingRatio - a.bookingRatio).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate({ to: "/hq/$pubId", params: { pubId: p.id } })}
                      className="cursor-pointer rounded-lg border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{p.city}</div>
                        </div>
                        <span className={`text-base font-semibold tabular-nums ${
                          p.bookingRatio >= 80 ? "text-emerald-600" : p.bookingRatio >= 70 ? "text-foreground" : "text-amber-600"
                        }`}>{p.bookingRatio}%</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.bookingRatio >= 80 ? "bg-emerald-500" : p.bookingRatio >= 70 ? "bg-primary" : "bg-amber-500"}`}
                          style={{ width: `${p.bookingRatio}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* App-User Reach nach Filiale */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      App-User Reach nach Filiale
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktive App-Nutzer im Einzugsgebiet vs. Marketing-Zielwert — sichert das Umsatzziel von 100 %.
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal tabular-nums">Ø {kpis.appReach}%</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[...PUBS]
                    .map((p) => ({ p, reach: getAppReach(p) }))
                    .sort((a, b) => b.reach - a.reach)
                    .map(({ p, reach }) => (
                      <div
                        key={p.id}
                        onClick={() => navigate({ to: "/hq/$pubId", params: { pubId: p.id } })}
                        className="cursor-pointer rounded-lg border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate tabular-nums">
                              {p.activeAppUsers.toLocaleString("de-DE")} / {p.appUsersTarget.toLocaleString("de-DE")}
                            </div>
                          </div>
                          <span className={`text-base font-semibold tabular-nums ${
                            reach >= 100 ? "text-emerald-600" : reach >= 80 ? "text-foreground" : "text-amber-600"
                          }`}>{reach}%</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${reach >= 100 ? "bg-emerald-500" : reach >= 80 ? "bg-primary" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(100, reach)}%` }}
                          />
                        </div>
                      </div>
                    ))}
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
                      Umsatz, Ø Bon und EBITDA für jede Bar — Klick öffnet die Detailansicht
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
                        <TableHead className="text-right hidden md:table-cell">Ø Bon</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Reservierungen</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Walk-ins</TableHead>
                        <TableHead className="text-right">EBITDA</TableHead>
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
                          const totalCosts = Math.round((s.costs.cogs + s.costs.marketing + s.costs.staff + s.costs.rent + s.costs.other) * factor);
                          const ebitda = revenue - totalCosts;
                          const ebitdaPct = revenue > 0 ? (ebitda / revenue) * 100 : 0;
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
                              <TableCell className="text-right tabular-nums hidden md:table-cell">{formatEUR(avg)}</TableCell>
                              <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">{formatEUR(resv)}</TableCell>
                              <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">{formatEUR(walk)}</TableCell>
                              <TableCell className="text-right">
                                <div className={`text-sm font-semibold tabular-nums ${ebitda >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {formatEUR(ebitda)}
                                </div>
                                <div className="text-[10px] text-muted-foreground tabular-nums">{ebitdaPct.toFixed(1)}% Marge</div>
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

            <TabsContent value="sortiment" className="mt-0 space-y-6">
              <Sortiment data={SALES_GLOBAL} factor={factor} title="Sortiment & Konsum — Alle Filialen" />
              <SortimentMatrix />
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <EventsResults />
            </TabsContent>




            <TabsContent value="feedback" className="mt-0 space-y-4">
              <RewardsSummary factor={factor} />
              <LiveFeedback />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, suffix, delta, tone, negative, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; suffix?: string; delta: string;
  tone: "primary" | "emerald" | "amber" | "violet"; negative?: boolean;
  sub?: string;
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
          {sub && <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function RewardsSummary({ factor }: { factor: number }) {
  // Mock-Auswertung im gewählten Zeitraum.
  const apologyCredits = Math.round(8200 * factor);
  const apologyCount = Math.round(11 * factor);
  const autoInvites = Math.round(46 * factor);
  const invitesClicked = Math.round(autoInvites * 0.41);
  const invitesConfirmed = Math.round(autoInvites * 0.18);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Wiedergutmachungs-Credits</div>
            <div className="text-xl font-semibold tabular-nums">
              {apologyCredits.toLocaleString("de-DE")} <span className="text-xs text-muted-foreground font-normal">Cr.</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{apologyCount} Fälle im gewählten Zeitraum</div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Star className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Google-Einladungen (auto)</div>
            <div className="text-xl font-semibold tabular-nums">
              {autoInvites} <span className="text-xs text-muted-foreground font-normal">verschickt</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {invitesClicked} Link geöffnet · {invitesConfirmed} als bewertet bestätigt · richtlinienkonform, ohne Anreize
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

