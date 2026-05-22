import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {
  Trophy, TrendingUp, Users, Star, Gauge, Phone, LayoutDashboard,
  Building2, MessageSquare, Settings, Bell, Search, Target, CalendarCheck, Smartphone, Gift, Activity, Megaphone, UserCog,
} from "lucide-react";
import { Marketing } from "@/components/marketing";
import { PUBS, computeScore, getAppReach } from "@/lib/pubs-mock";
import { SALES_GLOBAL, SALES_BY_PUB, formatEUR } from "@/lib/sales-mock";
import { ArrowUpRight, Store } from "lucide-react";
import { DateRangePicker, RANGE_FACTOR, useRangeLabels, type DateRange } from "@/components/date-range-picker";
import { LiveFeedback } from "@/components/live-feedback";
import { SalesOps } from "@/components/sales-ops";
import { Sortiment } from "@/components/sortiment";
import { SortimentMatrix } from "@/components/sortiment-matrix";
import { EventsResults } from "@/components/events-results";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { ActiveOps } from "@/components/active-ops";
import { RequireRole, LogoutButton } from "@/components/auth-guard";
import { DataSettings } from "@/components/data-settings";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TicketInbox } from "@/components/hq/ticket-inbox";
import { HROverview } from "@/components/hq/hr-overview";
import { HQNewsComposer } from "@/components/hq/hq-news-composer";
import { Inbox } from "lucide-react";
import { useSession, ROLE_TICKET_CATEGORY, ROLE_PERSON, ROLE_DEFAULT_TAB, TAB_OWNER, type Role } from "@/lib/auth-mock";
import { useTickets } from "@/lib/tickets-store";

export const Route = createFileRoute("/hq/")({
  head: () => ({
    meta: [
      { title: "Pub Ops Navigator — HQ Dashboard" },
      { name: "description", content: "Management dashboard for the pub chain: KPIs, leaderboard and direct contact." },
    ],
  }),
  component: () => (
    <RequireRole roles={["hq_admin", "it_admin", "facility_admin", "ops_admin"]}>
      <HQPage />
    </RequireRole>
  ),
});


function HQPage() {
  const { t } = useTranslation();
  const rangeLabels = useRangeLabels();
  const navigate = useNavigate();
  const session = useSession();
  const tickets = useTickets();
  const role = session?.role as Role | undefined;
  const isSuper = role === "hq_admin";
  const myCat = role ? ROLE_TICKET_CATEGORY[role] : undefined;
  const myTicketCount = (isSuper ? tickets : tickets.filter((t) => t.category === myCat))
    .filter((t) => t.status !== "done").length;
  // Every HQ role sees every tab; only the default landing differs.
  const defaultTab = (role && ROLE_DEFAULT_TAB[role]) || "overview";
  const person = role ? ROLE_PERSON[role] : null;
  const [range, setRange] = useState<DateRange>("last7");
  const [pulseKey, setPulseKey] = useState(0);
  const [activeTab, setActiveTab] = useState(defaultTab);
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
          {([
            { icon: LayoutDashboard, label: t("nav.overview"), tab: "overview", badge: undefined as number | undefined },
            { icon: Inbox, label: t("nav.inbox", "Inbox"), tab: "inbox", badge: myTicketCount },
            { icon: UserCog, label: t("nav.hr", "HR"), tab: "hr", badge: undefined as number | undefined },
            { icon: Building2, label: t("nav.pubs"), tab: "pubs", badge: undefined as number | undefined },
            { icon: Activity, label: t("nav.activeOps"), tab: "active-ops", badge: undefined as number | undefined },
            { icon: TrendingUp, label: t("nav.salesOps"), tab: "sales", badge: undefined as number | undefined },
            { icon: Building2, label: t("nav.sortiment"), tab: "sortiment", badge: undefined as number | undefined },
            { icon: CalendarCheck, label: t("nav.events"), tab: "events", badge: undefined as number | undefined },
            { icon: MessageSquare, label: t("nav.feedback"), tab: "feedback", badge: undefined as number | undefined },
            { icon: Megaphone, label: t("nav.hqNews", "HQ News"), tab: "hq-news", badge: undefined as number | undefined },
            { icon: Megaphone, label: t("nav.marketing", "Marketing"), tab: "marketing", badge: undefined as number | undefined },
            { icon: Settings, label: t("nav.dataSettings"), tab: "settings", badge: undefined as number | undefined },
          ]).map(({ icon: Icon, label, tab, badge }) => {
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
                <span className="flex-1 text-left">{label}</span>
                {typeof badge === "number" && badge > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
          <Link
            to="/pub"
            className="mt-3 pt-3 border-t w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Store className="h-4 w-4" />
            {t("nav.localView", "Lokale Pub-Ansicht")}
          </Link>
        </nav>
        <div className="p-3 border-t">
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">← {t("nav.admin")}</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card/60 backdrop-blur flex items-center justify-between px-6 gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight truncate">{t("hq.title")}</h1>
              {role && TAB_OWNER[activeTab] && (
                <span
                  className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
                  title={t("hq.owner.hint", "Tab-Lead")}
                >
                  <span className="opacity-60">{t("hq.owner.label", "Lead")}:</span>
                  <span className="font-medium text-foreground/80">{ROLE_PERSON[TAB_OWNER[activeTab]].name}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{t("common.period")}: {rangeLabels[range]}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DateRangePicker value={range} onChange={handleRangeChange} />
            <a href="/feedback" target="_blank" rel="noopener" className="hidden md:inline-flex">
              <Button variant="outline" size="sm">{t("common.guestView")}</Button>
            </a>
            <LanguageSwitcher />
            <Button variant="outline" size="icon" className="hidden sm:inline-flex"><Search className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="hidden sm:inline-flex"><Bell className="h-4 w-4" /></Button>
            <div
              className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-semibold"
              title={person?.name ?? "HQ"}
            >
              {person?.initials ?? "HQ"}
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">{t("nav.overview")}</TabsTrigger>
              <TabsTrigger value="inbox" className="gap-2">
                <Inbox className="h-3.5 w-3.5" />
                {t("nav.inbox", "Inbox")}
                {myTicketCount > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
                    {myTicketCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pubs" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {t("nav.pubs")}
              </TabsTrigger>
              <TabsTrigger value="active-ops" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                {t("nav.activeOps")}
              </TabsTrigger>
              <TabsTrigger value="sales">{t("nav.sales")}</TabsTrigger>
              <TabsTrigger value="sortiment">{t("nav.sortiment")}</TabsTrigger>
              <TabsTrigger value="events">{t("nav.events")}</TabsTrigger>
              <TabsTrigger value="hr" className="gap-1.5">
                <UserCog className="h-3.5 w-3.5" />
                {t("nav.hr", "HR")}
              </TabsTrigger>
              <TabsTrigger value="marketing" className="gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                {t("nav.marketing", "Marketing")}
              </TabsTrigger>
              <TabsTrigger value="hq-news" className="gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                {t("nav.hqNews", "HQ News")}
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                {t("nav.liveFeedback")}
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">3</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hq-news" className="mt-0">
              <HQNewsComposer />
            </TabsContent>

            <TabsContent value="hr" className="mt-0">
              <HROverview range={range} />
            </TabsContent>

            <TabsContent value="inbox" className="mt-0">
              <TicketInbox />
            </TabsContent>

            <TabsContent value="pubs" className="mt-0">
              <PubsGrid onOpen={(id) => navigate({ to: "/hq/$pubId", params: { pubId: id } })} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <DataSettings />
            </TabsContent>

            <TabsContent value="active-ops" className="mt-0">
              <ActiveOps />
            </TabsContent>

            <TabsContent value="marketing" className="mt-0">
              <Marketing />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* KPIs */}
              <section key={pulseKey} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
                <KpiCard icon={Gauge} label={t("hq.kpi.score")} value={`${kpis.score}`} suffix="/100" delta="+3.2%" tone="primary" />
                <KpiCard icon={Target} label={t("hq.kpi.revenueGoal")} value={`${kpis.revenueGoal}`} suffix="%" delta="+2.4%" tone={kpis.revenueGoal >= 100 ? "emerald" : "amber"} />
                <KpiCard
                  icon={Smartphone}
                  label={t("hq.kpi.appReach")}
                  value={`${kpis.appReach}`}
                  suffix="%"
                  delta="+5.1%"
                  tone={kpis.appReach >= 100 ? "emerald" : kpis.appReach >= 80 ? "amber" : "primary"}
                  sub={`${kpis.appUsers.toLocaleString()} / ${kpis.appTarget.toLocaleString()} ${t("hq.kpi.users")}`}
                />
                <KpiCard icon={Users} label={t("hq.kpi.walkIn")} value={`${kpis.walkIn}`} suffix="%" delta="+0.8%" tone="amber" />
                <KpiCard icon={Star} label={t("hq.kpi.guestFeedback")} value={`${kpis.feedback}`} suffix=" ⭐" delta="+0.1" tone="violet" />
              </section>

              {/* Middle row: Leaderboard + Direct Contact */}
              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{t("hq.leaderboard.title")}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("hq.leaderboard.subtitle")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-normal">{t("hq.leaderboard.countPubs", { count: PUBS.length })}</Badge>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>{t("hq.leaderboard.colPub")}</TableHead>
                          <TableHead className="text-right">{t("hq.leaderboard.colScore")}</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">{t("hq.leaderboard.colRevenue")}</TableHead>
                          <TableHead className="text-right hidden md:table-cell">{t("hq.leaderboard.colWalkIn")}</TableHead>
                          <TableHead className="text-right">{t("hq.leaderboard.colFeedback")}</TableHead>
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
                    <CardTitle className="text-base">{t("hq.contact.title")}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{t("hq.contact.subtitle")}</p>
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
                      {t("hq.booking.title")}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("hq.booking.subtitle", { avg: kpis.booking, count: PUBS.length })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal tabular-nums">{t("hq.booking.avg", { avg: kpis.booking })}</Badge>
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
                      {t("hq.appReach.title")}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("hq.appReach.subtitle")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal tabular-nums">{t("hq.booking.avg", { avg: kpis.appReach })}</Badge>
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
                              {p.activeAppUsers.toLocaleString()} / {p.appUsersTarget.toLocaleString()}
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
                    <CardTitle className="text-base">{t("hq.sales.title")}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("hq.sales.subtitle")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal">{t("hq.leaderboard.countPubs", { count: PUBS.length })}</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("hq.sales.colPub")}</TableHead>
                        <TableHead className="text-right">{t("hq.sales.colRevenue")}</TableHead>
                        <TableHead className="text-right hidden md:table-cell">{t("hq.sales.colAvgTicket")}</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">{t("hq.sales.colReservations")}</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">{t("hq.sales.colWalkIns")}</TableHead>
                        <TableHead className="text-right">{t("hq.sales.colEBITDA")}</TableHead>
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
                                <div className="text-[10px] text-muted-foreground tabular-nums">{t("hq.sales.margin", { pct: ebitdaPct.toFixed(1) })}</div>
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
              <Sortiment data={SALES_GLOBAL} factor={factor} title={t("hq.sortiment.title")} />
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
  const { t } = useTranslation();
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
            <div className="text-xs text-muted-foreground">{t("hq.rewards.apologyTitle")}</div>
            <div className="text-xl font-semibold tabular-nums">
              {apologyCredits.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{t("hq.rewards.creditUnit")}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{t("hq.rewards.apologyCases", { count: apologyCount })}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Star className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">{t("hq.rewards.googleTitle")}</div>
            <div className="text-xl font-semibold tabular-nums">
              {autoInvites} <span className="text-xs text-muted-foreground font-normal">{t("hq.rewards.sent")}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t("hq.rewards.googleDetail", { clicked: invitesClicked, confirmed: invitesConfirmed })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PubsGrid({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<"score" | "name">("score");
  const sorted = useMemo(() => {
    const arr = [...PUBS];
    if (sort === "score") {
      arr.sort((a, b) => computeScore(b) - computeScore(a));
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("hq.pubsGrid.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("hq.pubsGrid.subtitle", { count: PUBS.length })}</p>
        </div>
        <div className="inline-flex rounded-md border p-0.5 text-xs">
          <button
            onClick={() => setSort("score")}
            className={`px-3 py-1.5 rounded ${sort === "score" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t("hq.pubsGrid.sortScore")}
          </button>
          <button
            onClick={() => setSort("name")}
            className={`px-3 py-1.5 rounded ${sort === "name" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t("hq.pubsGrid.sortName")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((p) => {
          const score = computeScore(p);
          const scoreTone =
            score >= 85 ? "text-emerald-600 bg-emerald-500/10"
            : score >= 75 ? "text-foreground bg-muted"
            : "text-amber-600 bg-amber-500/10";
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="text-left rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.city}</div>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums ${scoreTone}`}>
                  {score}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("hq.pubsGrid.revenue")}</div>
                  <div className={`font-semibold tabular-nums ${p.revenueTarget >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
                    {p.revenueTarget}%
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("hq.pubsGrid.walkIn")}</div>
                  <div className="font-semibold tabular-nums">{p.walkInRatio}%</div>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("hq.pubsGrid.feedback")}</div>
                  <div className="font-semibold tabular-nums">{p.feedback.toFixed(1)} ⭐</div>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("hq.pubsGrid.booking")}</div>
                  <div className={`font-semibold tabular-nums ${p.bookingRatio >= 80 ? "text-emerald-600" : p.bookingRatio >= 70 ? "" : "text-amber-600"}`}>
                    {p.bookingRatio}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                <span className="truncate">{p.manager}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


