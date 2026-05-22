import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Megaphone, Pin, CheckCircle2, FileText, AlertTriangle, Clock, User,
} from "lucide-react";
import { useT } from "@/lib/use-t";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { HQ_NEWS, NEWS_CATEGORY_META, type HQNewsItem, type NewsCategory } from "@/lib/hq-news-mock";

const ACK_KEY = "pubgo.hq-news.ack.v1";
const READ_KEY = "pubgo.hq-news.read.v1";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function saveSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

export function HQNews() {
  const tt = useT();
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("de") ? deLocale : enUS;

  const [filter, setFilter] = useState<NewsCategory | "all">("all");
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const [read, setRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAcked(loadSet(ACK_KEY));
    setRead(loadSet(READ_KEY));
  }, []);

  const pinnedItem = useMemo(
    () => [...HQ_NEWS].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).find((n) => n.pinned),
    []
  );

  const feed = useMemo(() => {
    return HQ_NEWS
      .filter((n) => n.id !== pinnedItem?.id)
      .filter((n) => filter === "all" || n.category === filter)
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [filter, pinnedItem?.id]);

  const counts = useMemo(() => {
    const c: Record<NewsCategory | "all", number> = {
      all: HQ_NEWS.length,
      urgent: 0, marketing: 0, product: 0, event: 0, policy: 0, ops: 0,
    };
    HQ_NEWS.forEach((n) => { c[n.category] += 1; });
    return c;
  }, []);

  const ackPinned = () => {
    if (!pinnedItem) return;
    const next = new Set(acked);
    next.add(pinnedItem.id);
    setAcked(next);
    saveSet(ACK_KEY, next);
    const nr = new Set(read);
    nr.add(pinnedItem.id);
    setRead(nr);
    saveSet(READ_KEY, nr);
  };

  const markRead = (id: string) => {
    if (read.has(id)) return;
    const next = new Set(read);
    next.add(id);
    setRead(next);
    saveSet(READ_KEY, next);
  };

  const FILTERS: { key: NewsCategory | "all"; labelDe: string; labelEn: string }[] = [
    { key: "all", labelDe: "Alle", labelEn: "All" },
    { key: "urgent", labelDe: NEWS_CATEGORY_META.urgent.de, labelEn: NEWS_CATEGORY_META.urgent.en },
    { key: "marketing", labelDe: NEWS_CATEGORY_META.marketing.de, labelEn: NEWS_CATEGORY_META.marketing.en },
    { key: "product", labelDe: NEWS_CATEGORY_META.product.de, labelEn: NEWS_CATEGORY_META.product.en },
    { key: "event", labelDe: NEWS_CATEGORY_META.event.de, labelEn: NEWS_CATEGORY_META.event.en },
    { key: "policy", labelDe: NEWS_CATEGORY_META.policy.de, labelEn: NEWS_CATEGORY_META.policy.en },
    { key: "ops", labelDe: NEWS_CATEGORY_META.ops.de, labelEn: NEWS_CATEGORY_META.ops.en },
  ];

  const pinnedAcked = pinnedItem ? acked.has(pinnedItem.id) : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {tt("HQ News & Briefings", "HQ News & Briefings")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {tt(
              "Zentrale Updates, Aktionen und Briefings von der HQ an deine Filiale",
              "Central updates, campaigns and briefings from HQ to your branch"
            )}
          </p>
        </div>
      </div>

      {/* Pinned / top announcement */}
      {pinnedItem && (
        <Card
          className={cn(
            "shadow-sm border-2 overflow-hidden",
            pinnedAcked
              ? "border-emerald-200/70 bg-emerald-500/[0.03]"
              : "border-primary/40 bg-primary/[0.04]"
          )}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 bg-card">
                  <Pin className="h-3 w-3" /> {tt("Angepinnt", "Pinned")}
                </Badge>
                <CategoryBadge category={pinnedItem.category} />
                {pinnedItem.requiresAck && !pinnedAcked && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {tt("Bestätigung nötig", "Acknowledgement required")}
                  </Badge>
                )}
                {pinnedAcked && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {tt("Bestätigt", "Acknowledged")}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(pinnedItem.publishedAt), { addSuffix: true, locale })}
              </span>
            </div>
            <CardTitle className="text-lg sm:text-xl pt-2">
              {tt(pinnedItem.titleDe, pinnedItem.titleEn)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {tt(pinnedItem.excerptDe, pinnedItem.excerptEn)}
            </p>
            {(pinnedItem.bodyDe || pinnedItem.bodyEn) && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tt(pinnedItem.bodyDe ?? "", pinnedItem.bodyEn ?? "")}
              </p>
            )}
            {pinnedItem.attachments && pinnedItem.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pinnedItem.attachments.map((a) => (
                  <a
                    key={a.label}
                    href={a.url}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border bg-card hover:bg-muted transition-colors"
                  >
                    <FileText className="h-3 w-3" /> {a.label}
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-[11px] font-semibold">
                  {initials(pinnedItem.author)}
                </div>
                <div>
                  <div className="font-medium text-foreground text-[12px]">{pinnedItem.author}</div>
                  <div>{pinnedItem.authorRole}</div>
                </div>
              </div>
              {pinnedAcked ? (
                <Button size="sm" variant="outline" disabled className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {tt("Gelesen & verstanden", "Read & understood")}
                </Button>
              ) : (
                <Button size="sm" onClick={ackPinned} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {tt("Gelesen & Verstanden", "Read & Understood")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground hover:bg-muted border-border"
              )}
            >
              {tt(f.labelDe, f.labelEn)}
              <span
                className={cn(
                  "tabular-nums text-[10px] px-1.5 rounded-full",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {feed.length === 0 && (
          <Card className="md:col-span-2 shadow-sm">
            <CardContent className="text-center py-10 text-sm text-muted-foreground">
              {tt("Keine News in dieser Kategorie", "No news in this category")}
            </CardContent>
          </Card>
        )}
        {feed.map((n) => {
          const isRead = read.has(n.id);
          return (
            <Card
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                "shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                !isRead && "border-l-4 border-l-primary"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CategoryBadge category={n.category} />
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(n.publishedAt), { addSuffix: true, locale })}
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold leading-snug pt-1.5">
                  {tt(n.titleDe, n.titleEn)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {tt(n.excerptDe, n.excerptEn)}
                </p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">{n.author}</span>
                    <span className="opacity-60 shrink-0">·</span>
                    <span className="truncate">{n.authorRole}</span>
                  </div>
                  {n.requiresAck && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]">
                      {tt("Bestätigung", "Ack")}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: NewsCategory }) {
  const tt = useT();
  const meta = NEWS_CATEGORY_META[category];
  return (
    <Badge variant="outline" className={cn("font-medium text-[11px]", meta.cls)}>
      {tt(meta.de, meta.en)}
    </Badge>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
