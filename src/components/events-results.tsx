import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PartyPopper, TrendingUp, Trophy, Users, RefreshCw, Repeat, AlertTriangle } from "lucide-react";
import { EVENT_RESULTS, EVENT_TOTALS, formatEventDate, type EventResult } from "@/lib/events-mock";
import { formatEUR } from "@/lib/sales-mock";

type SortKey = "score" | "booking" | "revenue" | "date";

const tagStyles: Record<EventResult["tag"], string> = {
  Sport:       "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Party:       "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  Chill:       "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Themenabend: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  LiveAct:     "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

function RecommendationBadge({ rec }: { rec: EventResult["recommendation"] }) {
  if (rec === "wiederholen") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 border-0 gap-1 font-normal">
        <Repeat className="h-3 w-3" /> Wiederholen
      </Badge>
    );
  }
  if (rec === "optimieren") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 border-0 gap-1 font-normal">
        <RefreshCw className="h-3 w-3" /> Optimieren
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/15 border-0 gap-1 font-normal">
      <AlertTriangle className="h-3 w-3" /> Austauschen
    </Badge>
  );
}

export function EventsResults() {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [tagFilter, setTagFilter] = useState<EventResult["tag"] | "all">("all");

  const events = useMemo(() => {
    const filtered = tagFilter === "all"
      ? EVENT_RESULTS
      : EVENT_RESULTS.filter((e) => e.tag === tagFilter);
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "booking": return b.bookingRatio - a.bookingRatio;
        case "revenue": return b.revenue - a.revenue;
        case "date":    return b.date.localeCompare(a.date);
        default:        return b.score - a.score;
      }
    });
    return sorted;
  }, [sortKey, tagFilter]);

  const top = EVENT_RESULTS[0];
  const worst = EVENT_RESULTS[EVENT_RESULTS.length - 1];
  const tags: (EventResult["tag"] | "all")[] = ["all", "Party", "Sport", "Themenabend", "Chill", "LiveAct"];

  return (
    <div className="space-y-6">
      {/* KPI-Reihe */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          icon={PartyPopper}
          tone="primary"
          label="Events ausgewertet"
          value={`${EVENT_TOTALS.events}`}
          sub="letzte 14 Tage · alle Filialen"
        />
        <SummaryCard
          icon={Users}
          tone={EVENT_TOTALS.avgBookingRatio >= 75 ? "emerald" : "amber"}
          label="Ø Booking Ratio"
          value={`${EVENT_TOTALS.avgBookingRatio}%`}
          sub={`${EVENT_TOTALS.seatsBooked.toLocaleString("de-DE")} / ${EVENT_TOTALS.seatsAvailable.toLocaleString("de-DE")} Plätze`}
        />
        <SummaryCard
          icon={TrendingUp}
          tone="violet"
          label="Event-Umsatz gesamt"
          value={formatEUR(EVENT_TOTALS.revenue)}
          sub={`Ø ${formatEUR(Math.round(EVENT_TOTALS.revenue / EVENT_TOTALS.events))} pro Event`}
        />
        <SummaryCard
          icon={Trophy}
          tone="amber"
          label="Top-Event"
          value={`${top.score}`}
          suffix="/100"
          sub={`${top.emoji} ${top.title}`}
        />
      </section>

      {/* Bewertungs-Tabelle */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Event-Scoring</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Score = 50 % Booking-Ratio + 50 % Umsatz-Index. Empfehlung zum Wiederholen oder Austauschen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={tagFilter === t ? "default" : "outline"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setTagFilter(t)}
                >
                  {t === "all" ? "Alle" : t}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["score", "booking", "revenue", "date"] as SortKey[]).map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={sortKey === k ? "secondary" : "ghost"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setSortKey(k)}
                >
                  {k === "score" ? "Score" : k === "booking" ? "Booking" : k === "revenue" ? "Umsatz" : "Datum"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="hidden md:table-cell">Datum</TableHead>
                <TableHead className="text-right">Booking Ratio</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Umsatz</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Ø Gast</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Empfehlung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e, idx) => (
                <TableRow key={e.id} className={idx === 0 && sortKey === "score" ? "bg-amber-50/50 dark:bg-amber-500/5" : ""}>
                  <TableCell>
                    {idx === 0 && sortKey === "score" ? (
                      <Trophy className="h-4 w-4 text-amber-500" />
                    ) : (
                      <span className="text-muted-foreground font-mono text-xs">{idx + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{e.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{e.title}</div>
                        <Badge variant="outline" className={`mt-1 font-normal text-[10px] ${tagStyles[e.tag]}`}>
                          {e.tag}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {formatEventDate(e.date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`font-semibold tabular-nums ${e.bookingRatio >= 80 ? "text-emerald-600" : e.bookingRatio >= 60 ? "text-foreground" : "text-amber-600"}`}>
                      {e.bookingRatio}%
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden w-20 ml-auto">
                      <div
                        className={`h-full rounded-full ${e.bookingRatio >= 80 ? "bg-emerald-500" : e.bookingRatio >= 60 ? "bg-primary" : "bg-amber-500"}`}
                        style={{ width: `${e.bookingRatio}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                      {e.seatsBooked.toLocaleString("de-DE")} / {e.seatsAvailable.toLocaleString("de-DE")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatEUR(e.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground hidden lg:table-cell">{formatEUR(e.spendPerSeat)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-base font-semibold tabular-nums ${
                      e.score >= 80 ? "text-emerald-600" : e.score >= 60 ? "text-foreground" : "text-amber-600"
                    }`}>{e.score}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <RecommendationBadge rec={e.recommendation} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-emerald-500/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 uppercase tracking-wide">
              <Repeat className="h-3.5 w-3.5" /> Wiederholen
            </div>
            <div className="mt-2 text-lg font-semibold">{top.emoji} {top.title}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {top.bookingRatio} % Auslastung · {formatEUR(top.revenue)} Umsatz · Score {top.score}/100. Höchste
              Conversion im Programm — wöchentlich einplanen.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-500/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-red-700 uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" /> Austauschen
            </div>
            <div className="mt-2 text-lg font-semibold">{worst.emoji} {worst.title}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nur {worst.bookingRatio} % Auslastung bei {formatEUR(worst.spendPerSeat)} Ø-Gast — Score {worst.score}/100.
              Konzept ersetzen oder Marketing-Push testen.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, suffix, sub, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; suffix?: string; sub?: string;
  tone: "primary" | "emerald" | "amber" | "violet";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber:   "bg-amber-500/10 text-amber-600",
    violet:  "bg-violet-500/10 text-violet-600",
  } as const;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {value}{suffix && <span className="text-base text-muted-foreground font-normal">{suffix}</span>}
          </div>
          {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
