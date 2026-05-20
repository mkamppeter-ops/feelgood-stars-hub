import { useState, useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Phone, Gauge, TrendingUp, Target, Star, MapPin, Trophy,
} from "lucide-react";
import { getPub, type Pub } from "@/lib/pubs-mock";
import { SALES_BY_PUB } from "@/lib/sales-mock";
import { DateRangePicker, RANGE_FACTOR, RANGE_LABELS, type DateRange } from "@/components/date-range-picker";
import { SalesOps } from "@/components/sales-ops";
import { Sortiment } from "@/components/sortiment";
import { LiveFeedback } from "@/components/live-feedback";

export const Route = createFileRoute("/hq/$pubId")({
  loader: ({ params }) => {
    const pub = getPub(params.pubId);
    if (!pub) throw notFound();
    return { pub };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.pub.name} — Pub Ops Navigator` : "Pub Detail" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Pub nicht gefunden</h1>
        <Link to="/hq"><Button variant="outline"><ArrowLeft className="h-4 w-4" /> Zurück zum HQ</Button></Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <p className="text-destructive">{error.message}</p>
        <Link to="/hq"><Button variant="outline">Zurück</Button></Link>
      </div>
    </div>
  ),
  component: PubDetailPage,
});

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
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

function PubDetailPage() {
  const { pub } = Route.useLoaderData() as { pub: Pub };
  const [range, setRange] = useState<DateRange>("last7");
  const [pulseKey, setPulseKey] = useState(0);
  const factor = RANGE_FACTOR[range];

  const kpis = useMemo(() => ({
    score: Math.max(0, Math.min(100, Math.round(pub.score * factor))),
    booking: Math.max(0, Math.min(100, Math.round(pub.bookingRatio * factor))),
    revenue: Math.round(pub.revenueTarget * factor),
    feedback: Math.min(5, +(pub.feedback * (0.96 + factor * 0.04)).toFixed(1)),
  }), [factor, pub]);

  const handleRange = (v: DateRange) => {
    setRange(v);
    setPulseKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky breadcrumb bar */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/hq" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Zurück zum HQ
          </Link>
          <div className="flex items-center gap-3">
            <DateRangePicker value={range} onChange={handleRange} />
            <div className="hidden md:block text-xs text-muted-foreground">
              <Link to="/hq" className="hover:text-foreground">HQ</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">{pub.name}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero header */}
        <Card className="shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {pub.rank === 1 && (
                    <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 border-0">
                      <Trophy className="h-3 w-3" /> Platz 1
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-normal">Rank #{pub.rank}</Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {pub.city}
                  </span>
                  <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wide">
                    {RANGE_LABELS[range]}
                  </Badge>
                </div>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{pub.name}</h1>
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {pub.manager.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Filialleiter:in</div>
                    <div className="text-sm font-medium">{pub.manager}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`https://wa.me/${pub.whatsapp}`} target="_blank" rel="noreferrer">
                  <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                    <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
                <a href={`tel:${pub.phone}`}>
                  <Button className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                    <Phone className="h-4 w-4" /> Anrufen
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <section key={pulseKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
          <PubKpi icon={Gauge} label="Performance Score" value={`${kpis.score}`} suffix="/100" tone="primary" />
          <PubKpi icon={TrendingUp} label="Booking Ratio" value={`${kpis.booking}`} suffix="%" tone="emerald" />
          <PubKpi icon={Target} label="Umsatz-Ziel" value={`${kpis.revenue}`} suffix="%" tone={kpis.revenue >= 100 ? "emerald" : "amber"} />
          <PubKpi icon={Star} label="Gäste-Feedback" value={kpis.feedback.toFixed(1)} suffix=" ⭐" tone="violet" />
        </section>


        {/* Sales & Operations — auf Filial-Ebene */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Sales &amp; Operations</h2>
            <p className="text-xs text-muted-foreground">Umsatz, Bons und Top-Seller dieser Filiale</p>
          </div>
          <SalesOps data={SALES_BY_PUB[pub.id]} factor={factor} />
        </section>

        {/* Score history chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Score-Verlauf · letzte 7 Tage</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Tagesentwicklung des Performance Scores</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pub.scoreHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[40, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Feedback — auf Filial-Ebene, mit Detail-Aufschlüsselung & Aktionen */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Live Feedback</h2>
            <p className="text-xs text-muted-foreground">
              Alle Bewertungen dieser Filiale — Klick auf eine Karte zeigt die Kategorie-Aufschlüsselung.
              Erledigt markieren oder direkt kontaktieren.
            </p>
          </div>
          <LiveFeedback lockedPubId={pub.id} />
        </section>
      </main>
    </div>
  );
}

function PubKpi({
  icon: Icon, label, value, suffix, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; suffix?: string;
  tone: "primary" | "emerald" | "amber" | "violet";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
  } as const;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
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
