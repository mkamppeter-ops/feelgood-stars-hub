import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation, Trans } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Trophy, Gauge, Star, TrendingUp, MapPin, ArrowUp, Sparkles, Globe, Smartphone,
  LayoutDashboard, Ticket, GraduationCap, Megaphone, Users, Newspaper, Package,
} from "lucide-react";
import { PUBS } from "@/lib/pubs-mock";
import { SALES_BY_PUB } from "@/lib/sales-mock";
import { FEEDBACK, CATEGORY_META, CATEGORY_ORDER, type FeedbackItem } from "@/lib/feedback-mock";
import { DateRangePicker, RANGE_FACTOR, useRangeLabels, type DateRange } from "@/components/date-range-picker";
import { SalesOps } from "@/components/sales-ops";
import { HQConnect } from "@/components/pub/hq-connect";
import { Academy } from "@/components/pub/academy";
import { MarketingHub } from "@/components/pub/marketing-hub";
import { PromoShop } from "@/components/pub/promo-shop";
import { TeamHR } from "@/components/pub/team-hr";
import { HQNews } from "@/components/pub/hq-news";
import { useT } from "@/lib/use-t";

import { RequireRole, LogoutButton } from "@/components/auth-guard";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "@/lib/auth-mock";

export const Route = createFileRoute("/pub")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode === "staff" ? "staff" : "manager") as "manager" | "staff",
  }),
  head: () => ({
    meta: [
      { title: "Pub Ops Navigator — Local View" },
      { name: "description", content: "Local dashboard for the bar manager." },
    ],
  }),
  component: () => (
    <RequireRole roles={["pub_manager", "bar_staff", "hq_admin", "it_admin", "facility_admin", "ops_admin"]}>
      <PubLocalView />
    </RequireRole>
  ),
});

function PubLocalView() {
  const { t } = useTranslation();
  const tt = useT();
  const rangeLabels = useRangeLabels();
  const { mode } = Route.useSearch();
  const session = useSession();
  const isStaff = session?.role === "bar_staff" || mode === "staff";
  const isManager = session?.role === "pub_manager";
  const lockedPubId = session?.pubId ?? PUBS[2].id;
  const [pubId, setPubId] = useState(lockedPubId);
  const [range, setRange] = useState<DateRange>("last7");
  const [outerTab, setOuterTab] = useState("dashboard");
  const factor = RANGE_FACTOR[range];

  // Enforce locked pub for manager/staff
  const effectivePubId = (isManager || isStaff) ? lockedPubId : pubId;
  const pub = PUBS.find((p) => p.id === effectivePubId)!;
  const sales = SALES_BY_PUB[pub.id];

  // Compute gap to next rank
  const nextPub = PUBS.find((p) => p.rank === pub.rank - 1);
  const pointsToNext = nextPub ? nextPub.score - pub.score : 0;

  // Pub-specific feedback subset (fallback: subset by index if none match)
  const pubFeedback: FeedbackItem[] = useMemo(() => {
    const matches = FEEDBACK.filter((f) => f.pubId === pub.id);
    return matches.length > 0 ? matches : FEEDBACK.slice(0, 4);
  }, [pub.id]);

  const scoreColor =
    pub.score >= 85 ? "text-emerald-600"
    : pub.score >= 75 ? "text-foreground"
    : "text-amber-600";

  const lockSelector = isManager || isStaff;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">
                {isStaff ? t("pub.staffView") : t("pub.localView")}
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight truncate">
                {pub.name} · {rangeLabels[range]}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isStaff && (
              <Badge variant="secondary" className="hidden sm:inline-flex">{t("pub.staffBadge")}</Badge>
            )}
            {lockSelector ? (
              <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium truncate max-w-[180px]">{pub.name}</span>
              </div>
            ) : (
              <Select value={pubId} onValueChange={setPubId}>
                <SelectTrigger className="h-9 w-[200px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUBS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isStaff && <DateRangePicker value={range} onChange={setRange} />}
            {!isStaff && (
              <a href="/feedback" target="_blank" rel="noopener" className="hidden md:inline-flex">
                <Button variant="outline" size="sm">{t("common.guestView")}</Button>
              </a>
            )}
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={outerTab} onValueChange={setOuterTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto p-1">
            <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-1.5" />{tt("Dashboard", "Dashboard")}</TabsTrigger>
            <TabsTrigger value="news"><Newspaper className="h-4 w-4 mr-1.5" />{tt("HQ News & Briefings", "HQ News & Briefings")}</TabsTrigger>
            <TabsTrigger value="hq"><Ticket className="h-4 w-4 mr-1.5" />{tt("HQ Connect", "HQ Connect")}</TabsTrigger>
            <TabsTrigger value="academy"><GraduationCap className="h-4 w-4 mr-1.5" />{tt("Academy", "Academy")}</TabsTrigger>
            <TabsTrigger value="marketing"><Megaphone className="h-4 w-4 mr-1.5" />{tt("Marketing Hub", "Marketing Hub")}</TabsTrigger>
            <TabsTrigger value="werbemittel"><Package className="h-4 w-4 mr-1.5" />{tt("Werbemittel-Shop", "Promo Shop")}</TabsTrigger>
            <TabsTrigger value="hr"><Users className="h-4 w-4 mr-1.5" />{tt("Team & HR", "Team & HR")}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 mt-0">
        {isStaff ? (
          <>
            <section>
              <p className="text-sm text-muted-foreground">{t("pub.hi")}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
                <Trans i18nKey="pub.reviewsTitle" values={{ name: pub.name }} components={{ 1: <span className="text-primary" /> }}>
                  Gäste-Reviews · <span className="text-primary">{pub.name}</span>
                </Trans>
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3.5 w-3.5" />
                {pub.city}
              </div>
              <Card className="mt-4 border-amber-200 bg-amber-50/60">
                <CardContent className="p-4 text-sm text-amber-900">
                  <Trans i18nKey="pub.reviewNote" components={{ strong: <strong /> }} />
                </CardContent>
              </Card>
            </section>

            <section>
              <LocalFeedback items={pubFeedback} pubName={pub.name} />
            </section>
          </>
        ) : (
          <>
            {/* Welcome */}
            <section>
              <p className="text-sm text-muted-foreground">{t("pub.welcomeBack")}</p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                <Trans i18nKey="pub.welcomeTitle" values={{ name: pub.name }} components={{ 1: <span className="text-primary" /> }}>
                  Willkommen im <span className="text-primary">{pub.name}</span> Dashboard
                </Trans>
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3.5 w-3.5" />
                {pub.city} · {t("pub.managerLine", { name: pub.manager })}
              </div>
            </section>

            {/* Gamification hero */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Performance score (big) */}
              <Card className="lg:col-span-2 shadow-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                        <Gauge className="h-3.5 w-3.5" />
                        {t("pub.perfScore")}
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className={`text-6xl font-bold tabular-nums tracking-tight ${scoreColor}`}>
                          {pub.score}
                        </span>
                        <span className="text-2xl text-muted-foreground font-normal">/100</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-0 font-normal gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {t("pub.deltaWeek", { n: 3 })}
                        </Badge>
                        <span className="text-muted-foreground">{t("pub.strongestRise")}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
                      <Trophy className="h-7 w-7 text-primary" />
                    </div>
                  </div>

                  {/* Score history sparkline */}
                  <div className="h-24 -mx-2 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pub.scoreHistory}>
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
                        <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8, border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))", fontSize: 12,
                          }}
                          formatter={(v: number) => [`${v}`, "Score"]}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard rank */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {t("pub.leaderboardPos")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tabular-nums">#{pub.rank}</span>
                    <span className="text-sm text-muted-foreground">{t("pub.rankOf", { n: PUBS.length })}</span>
                  </div>

                  {pub.rank === 1 ? (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                        <Trophy className="h-4 w-4" />
                        {t("pub.topRank")}
                      </div>
                      <p className="text-xs text-amber-700/80 mt-1">
                        {t("pub.topRankHint", { name: PUBS[1].name, points: pub.score - PUBS[1].score })}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="text-sm font-semibold">
                        {t("pub.youAreRank", { rank: pub.rank })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Trans
                          i18nKey="pub.pointsToNext"
                          values={{ points: pointsToNext, rank: pub.rank - 1 }}
                          components={{ 1: <span className="font-semibold text-primary" /> }}
                        />
                        {nextPub && <> ({nextPub.name})</>}.
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (pub.score / (nextPub?.score ?? pub.score + 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="rounded-md border p-2">
                      <div className="text-muted-foreground">{t("pub.booking")}</div>
                      <div className="font-semibold tabular-nums">{pub.bookingRatio}%</div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3" /> {t("pub.feedback")}
                      </div>
                      <div className="font-semibold tabular-nums">{pub.feedback.toFixed(1)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Mini KPI strip — only this pub's numbers */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat label={t("pub.spendPerBooking")} value={`€${pub.spendPerBooking}`} delta="+€1.20" />
              <MiniStat label={t("pub.revenueTarget")} value={`${pub.revenueTarget}%`} delta={pub.revenueTarget >= 100 ? t("pub.aboveTarget") : t("pub.close")} positive={pub.revenueTarget >= 100} />
              <MiniStat label={t("pub.bookingRatio")} value={`${pub.bookingRatio}%`} delta="+1.4%" />
              <MiniStat label={<><Star className="h-3 w-3 inline -mt-0.5 mr-0.5" /> {t("pub.rating")}</>} value={pub.feedback.toFixed(1)} delta="+0.1" />
            </section>

            {/* Tabs: Sales + Feedback (this pub only) */}
            <Tabs defaultValue="sales" className="space-y-6">
              <TabsList>
                <TabsTrigger value="sales">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  {t("pub.tabSales")}
                </TabsTrigger>
                <TabsTrigger value="feedback">
                  <Star className="h-4 w-4 mr-1.5" />
                  {t("pub.tabFeedback")}
                  <span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                    {pubFeedback.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="mt-0">
                <SalesOps data={sales} factor={factor} />
              </TabsContent>

              <TabsContent value="feedback" className="mt-0">
                <LocalFeedback items={pubFeedback} pubName={pub.name} />
              </TabsContent>
            </Tabs>
          </>
        )}
          </TabsContent>

          <TabsContent value="news" className="mt-0"><HQNews pubId={effectivePubId} /></TabsContent>
          <TabsContent value="hq" className="mt-0"><HQConnect /></TabsContent>
          <TabsContent value="academy" className="mt-0"><Academy /></TabsContent>
          <TabsContent value="marketing" className="mt-0"><MarketingHub /></TabsContent>
          <TabsContent value="werbemittel" className="mt-0"><PromoShop pubId={effectivePubId} pubName={pub.name} /></TabsContent>
          <TabsContent value="hr" className="mt-0"><TeamHR /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MiniStat({
  label, value, delta, positive = true,
}: {
  label: React.ReactNode; value: string; delta: string; positive?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-xl font-semibold tabular-nums">{value}</div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            positive ? "text-emerald-600 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10"
          }`}>{delta}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function LocalFeedback({ items, pubName }: { items: FeedbackItem[]; pubName: string }) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          {t("pub.noReviews", { name: pubName })}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {t("pub.reviewsCount", { count: items.length })} <span className="font-medium text-foreground">{pubName}</span>
      </div>
      {items.map((f) => (
        <Card key={f.id} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                f.source === "google" ? "bg-blue-500/10 text-blue-600" : "bg-violet-500/10 text-violet-600"
              }`}>
                {f.source === "google" ? <Globe className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge variant="secondary" className="font-normal text-[10px] uppercase">
                    {f.source === "google" ? t("pub.google") : t("pub.internal")}
                  </Badge>
                  <Stars value={f.stars} />
                  {f.stars <= 2 && (
                    <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-0 font-normal">{t("pub.critical")}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{f.date}</span>
                </div>

                {f.categories && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORY_ORDER.map((k) => {
                      const r = f.categories![k];
                      const meta = CATEGORY_META[k];
                      const low = r.score <= 2;
                      return (
                        <div key={k} className={`rounded-md border p-2 ${low ? "border-red-200 bg-red-50/50" : "bg-muted/30"}`}>
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="flex items-center gap-1 truncate">
                              <span aria-hidden>{meta.icon}</span>
                              <span className="truncate">{meta.label}</span>
                            </span>
                            <span className={`tabular-nums font-semibold ${low ? "text-red-600" : "text-muted-foreground"}`}>
                              {r.score}/5
                            </span>
                          </div>
                          {r.tags && r.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.tags.slice(0, 2).map((t) => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-sm text-foreground/90 leading-relaxed">„{f.text}"</p>
                <div className="text-xs text-muted-foreground">— {f.author}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
