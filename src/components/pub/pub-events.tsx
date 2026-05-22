import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { useT } from "@/lib/use-t";

type EventTag = "Sport" | "Party" | "Chill" | "Themenabend" | "LiveAct";
type UpcomingEvent = {
  id: string;
  title: { de: string; en: string };
  emoji: string;
  tag: EventTag;
  daysAhead: number;
  startTime: string; // HH:MM
};

// Next 14 days programme (deterministic mock)
const PROGRAMME: UpcomingEvent[] = [
  { id: "u-premier",   title: { de: "Premier League & Tatort",      en: "Premier League & Tatort" },     emoji: "🏴",  tag: "Sport",       daysAhead: 0,  startTime: "20:15" },
  { id: "u-quiz",      title: { de: "Pub Quiz – Ballermann",        en: "Pub Quiz – Ballermann" },       emoji: "🎤",  tag: "Themenabend", daysAhead: 1,  startTime: "19:30" },
  { id: "u-bvb",       title: { de: "BVB-Freitag & One-Hit-Wonder", en: "BVB Friday & One-Hit-Wonder" }, emoji: "⚽",  tag: "Sport",       daysAhead: 2,  startTime: "20:30" },
  { id: "u-malle",     title: { de: "Malle-Party",                  en: "Mallorca Party" },              emoji: "🌴",  tag: "Party",       daysAhead: 3,  startTime: "21:00" },
  { id: "u-tatort",    title: { de: "Sunday Chill & Tatort",        en: "Sunday Chill & Tatort" },       emoji: "🕵️", tag: "Chill",       daysAhead: 4,  startTime: "20:15" },
  { id: "u-darts",     title: { de: "Darts Premier League",         en: "Darts Premier League" },        emoji: "🎯",  tag: "Sport",       daysAhead: 6,  startTime: "20:00" },
  { id: "u-retro",     title: { de: "80s/90s Retro-Nacht",          en: "80s/90s Retro Night" },         emoji: "📼",  tag: "Party",       daysAhead: 7,  startTime: "21:00" },
  { id: "u-local",     title: { de: "Local Heroes Unplugged",       en: "Local Heroes Unplugged" },      emoji: "🎸",  tag: "LiveAct",     daysAhead: 8,  startTime: "20:30" },
  { id: "u-bayern",    title: { de: "FC Bayern-Tag & Trash-Pop",    en: "FC Bayern Day & Trash-Pop" },   emoji: "🏟️", tag: "Sport",       daysAhead: 9,  startTime: "18:30" },
  { id: "u-irish",     title: { de: "Irish Pub Nacht",              en: "Irish Pub Night" },             emoji: "☘️", tag: "Party",       daysAhead: 10, startTime: "20:00" },
  { id: "u-rock",      title: { de: "Rock am Tresen",               en: "Rock at the Bar" },             emoji: "🎸",  tag: "Themenabend", daysAhead: 11, startTime: "20:30" },
  { id: "u-afterwork", title: { de: "After-Work Chill",             en: "After-Work Chill" },            emoji: "🛋️", tag: "Chill",       daysAhead: 13, startTime: "18:00" },
];

const TAG_TONE: Record<EventTag, string> = {
  Sport:       "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  Party:       "bg-pink-500/15 text-pink-700 border-pink-300",
  Chill:       "bg-sky-500/15 text-sky-700 border-sky-300",
  Themenabend: "bg-violet-500/15 text-violet-700 border-violet-300",
  LiveAct:     "bg-amber-500/15 text-amber-700 border-amber-300",
};

function addDays(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d: Date, lang: "de" | "en"): string {
  return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
    weekday: "short", day: "2-digit", month: "short",
  });
}

function relativeLabel(n: number, tt: (de: string, en: string) => string): string | null {
  if (n === 0) return tt("Heute", "Today");
  if (n === 1) return tt("Morgen", "Tomorrow");
  return null;
}

export function PubEvents({ pubName }: { pubName: string }) {
  const tt = useT();
  const lang: "de" | "en" = tt("de", "en") as "de" | "en";

  // Group by week
  const thisWeek = PROGRAMME.filter((e) => e.daysAhead <= 6);
  const nextWeek = PROGRAMME.filter((e) => e.daysAhead > 6);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden relative border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <CardContent className="p-5 relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Eventplan · nächste 14 Tage", "Event schedule · next 14 days")}</div>
            <div className="text-2xl font-bold tracking-tight leading-tight">{pubName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {tt("Programm wird zentral von Louis (HQ) geplant", "Programme centrally planned by Louis (HQ)")}
            </div>
          </div>
        </CardContent>
      </Card>

      <EventGroup title={tt("Diese Woche", "This week")} events={thisWeek} lang={lang} tt={tt} />
      <EventGroup title={tt("Nächste Woche", "Next week")} events={nextWeek} lang={lang} tt={tt} />
    </div>
  );
}

function EventGroup({
  title, events, lang, tt,
}: {
  title: string;
  events: UpcomingEvent[];
  lang: "de" | "en";
  tt: (de: string, en: string) => string;
}) {
  if (events.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-2">
        {events.map((e) => {
          const d = addDays(e.daysAhead);
          const rel = relativeLabel(e.daysAhead, tt);
          const isToday = e.daysAhead === 0;
          return (
            <Card key={e.id} className={`shadow-sm ${isToday ? "border-primary/40 bg-primary/5" : ""}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-md shrink-0 ${
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <div className="text-[10px] uppercase tracking-wider leading-none opacity-80">
                    {d.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", { month: "short" })}
                  </div>
                  <div className="text-xl font-bold tabular-nums leading-tight mt-0.5">
                    {String(d.getDate()).padStart(2, "0")}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-md bg-muted/50 flex items-center justify-center text-2xl shrink-0">
                  {e.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{e.title[lang]}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                    <span>{formatDate(d, lang)}</span>
                    <span>·</span>
                    <span className="tabular-nums">{e.startTime}</span>
                    {rel && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-medium border-primary/30 text-primary bg-primary/10">
                        {rel}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={`${TAG_TONE[e.tag]} hidden sm:inline-flex`}>{e.tag}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
