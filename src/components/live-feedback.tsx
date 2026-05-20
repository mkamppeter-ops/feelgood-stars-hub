import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Check, Phone, Star, Globe, Smartphone, ChevronDown } from "lucide-react";
import { FEEDBACK, CATEGORY_META, CATEGORY_ORDER, type FeedbackItem, type CategoryKey, type CategoryRating } from "@/lib/feedback-mock";
import { PUBS } from "@/lib/pubs-mock";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${cls} ${i <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export function LiveFeedback() {
  const [source, setSource] = useState<"all" | "app" | "google">("all");
  const [rating, setRating] = useState<"all" | "low" | "high">("all");
  const [pubId, setPubId] = useState<string>("all");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return FEEDBACK.filter((f) => {
      if (source !== "all" && f.source !== source) return false;
      if (rating === "low" && f.stars > 2) return false;
      if (rating === "high" && f.stars < 4) return false;
      if (pubId !== "all" && f.pubId !== pubId) return false;
      return true;
    });
  }, [source, rating, pubId]);

  const toggleDone = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Quelle</span>
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger className="h-8 w-[130px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="app">App</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Bewertung</span>
            <Select value={rating} onValueChange={(v) => setRating(v as typeof rating)}>
              <SelectTrigger className="h-8 w-[140px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="low">1–2 Sterne</SelectItem>
                <SelectItem value="high">4–5 Sterne</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filiale</span>
            <Select value={pubId} onValueChange={setPubId}>
              <SelectTrigger className="h-8 w-[200px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Pubs</SelectItem>
                {PUBS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} Bewertungen · {done.size} erledigt
          </div>
        </CardContent>
      </Card>

      {/* Review cards */}
      <div className="space-y-3">
        {filtered.map((f) => (
          <ReviewCard
            key={f.id}
            item={f}
            done={done.has(f.id)}
            expanded={expanded.has(f.id)}
            onToggleDone={() => toggleDone(f.id)}
            onToggleExpand={() => toggleExpanded(f.id)}
          />
        ))}
        {filtered.length === 0 && (
          <Card className="shadow-sm"><CardContent className="p-10 text-center text-sm text-muted-foreground">
            Keine Bewertungen für diese Filter.
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

function CategoryRow({ k, rating }: { k: CategoryKey; rating: CategoryRating }) {
  const meta = CATEGORY_META[k];
  const isLow = rating.score <= 2;
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
        isLow ? "border-red-200 bg-red-50/50" : "bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none" aria-hidden>{meta.icon}</span>
          <span className="text-sm font-medium truncate">{meta.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Stars value={rating.score} />
          <span className={`text-xs tabular-nums ${isLow ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
            {rating.score}/5
          </span>
        </div>
      </div>
      {rating.tags && rating.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rating.tags.map((t) => (
            <Badge
              key={t}
              className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-0 font-normal text-[10px] px-1.5 py-0"
            >
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  item, done, expanded, onToggleDone, onToggleExpand,
}: {
  item: FeedbackItem;
  done: boolean;
  expanded: boolean;
  onToggleDone: () => void;
  onToggleExpand: () => void;
}) {
  const pub = PUBS.find((p) => p.id === item.pubId)!;
  const isLow = item.stars <= 2;
  const isApp = item.source === "app";
  const canExpand = isApp && !!item.categories;

  return (
    <Card className={`shadow-sm transition-opacity ${done ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Source icon */}
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            item.source === "google" ? "bg-blue-500/10 text-blue-600" : "bg-violet-500/10 text-violet-600"
          }`}>
            {item.source === "google" ? <Globe className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold">{pub.name}</span>
              <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wide">
                {isApp ? "Internes Feedback" : "Google"}
              </Badge>
              <Stars value={item.stars} />
              {isLow && (
                <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-0 font-normal">Kritisch</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
            </div>

            {/* App-only: Category breakdown */}
            {canExpand && expanded && (
              <div className="pt-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                  Kategorie-Check
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORY_ORDER.map((k) => (
                    <CategoryRow key={k} k={k} rating={item.categories![k]} />
                  ))}
                </div>
              </div>
            )}

            {/* Comment block — clearly separated when categories are shown */}
            <div className={canExpand && expanded ? "pt-2 border-t" : ""}>
              {canExpand && expanded && (
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                  Kommentar des Gastes
                </div>
              )}
              <p className="text-sm text-foreground/90 leading-relaxed">„{item.text}"</p>
            </div>

            {/* Footer: author, tags (compact only), expand & actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{item.author}</span>
                {/* Compact tag row only when collapsed (app reviews) */}
                {isApp && !expanded && item.tags?.map((t) => (
                  <Badge key={t} variant="outline" className="font-normal text-[10px]">{t}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canExpand && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs"
                    onClick={onToggleExpand}
                  >
                    {expanded ? "Weniger" : "Details"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </Button>
                )}
                <a href={`https://wa.me/${pub.whatsapp}`} target="_blank" rel="noreferrer">
                  <Button size="icon" variant="outline" className="h-8 w-8 hover:bg-emerald-500 hover:text-white hover:border-emerald-500">
                    <WhatsAppIcon className="h-4 w-4" />
                  </Button>
                </a>
                <a href={`tel:${pub.phone}`}>
                  <Button size="icon" variant="outline" className="h-8 w-8 hover:bg-blue-500 hover:text-white hover:border-blue-500">
                    <Phone className="h-4 w-4" />
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant={done ? "default" : "outline"}
                  className={`h-8 gap-1.5 ${done ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                  onClick={onToggleDone}
                >
                  <Check className="h-3.5 w-3.5" />
                  {done ? "Erledigt" : "Erledigen"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
