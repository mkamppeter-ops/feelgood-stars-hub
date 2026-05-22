import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, Phone, Star, Globe, Smartphone, ChevronDown, Gift, BellRing, Sparkles, ShieldCheck, Clock, ExternalLink, MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";
import {
  FEEDBACK, CATEGORY_META, CATEGORY_ORDER, APOLOGY_CREDIT_STEPS,
  GOOGLE_INVITE_COOLDOWN_DAYS, GOOGLE_CLICKED_COOLDOWN_DAYS,
  type FeedbackItem, type CategoryKey, type CategoryRating, type ApologyReward, type GoogleStatus,
} from "@/lib/feedback-mock";
import { PUBS, type Pub } from "@/lib/pubs-mock";
import {
  sendApologyReward, inviteGoogleReview, markGoogleReviewClicked, confirmGoogleReview,
} from "@/lib/rewards.functions";
import { useT } from "@/lib/use-t";
import { supabase } from "@/integrations/supabase/client";

type DbFeedbackRow = {
  id: string;
  created_at: string;
  rating_drinks: number | null;
  rating_atmosphere: number | null;
  rating_service: number | null;
  rating_cleanliness: number | null;
  problem_tags: string[];
  free_text: string | null;
  location: string | null;
};

function relativeDate(iso: string, lang: "de" | "en"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return lang === "de" ? "gerade eben" : "just now";
  if (mins < 60) return lang === "de" ? `vor ${mins} Min.` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "de" ? `vor ${hours} Std.` : `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return lang === "de" ? `vor ${days} Tagen` : `${days} d ago`;
  return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : "en-US");
}

function dbRowToFeedbackItem(row: DbFeedbackRow, lang: "de" | "en"): FeedbackItem | null {
  const ratings = {
    drinks: row.rating_drinks ?? 0,
    atmosphere: row.rating_atmosphere ?? 0,
    service: row.rating_service ?? 0,
    cleanliness: row.rating_cleanliness ?? 0,
  };
  const scores = Object.values(ratings).filter((v) => v > 0);
  if (scores.length === 0) return null;
  const stars = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // location stored as pub.id; fall back to first pub if unknown
  const pub = PUBS.find((p) => p.id === row.location) ?? PUBS[0];

  const tagsByCategory: Record<CategoryKey, string[]> = {
    drinks: [], atmosphere: [], service: [], cleanliness: [],
  };
  for (const t of row.problem_tags ?? []) {
    for (const k of CATEGORY_ORDER) {
      if (CATEGORY_META[k].tags.includes(t)) tagsByCategory[k].push(t);
    }
  }
  const categories: Record<CategoryKey, CategoryRating> = {
    drinks:      { score: ratings.drinks,      tags: tagsByCategory.drinks.length      ? tagsByCategory.drinks      : undefined },
    atmosphere:  { score: ratings.atmosphere,  tags: tagsByCategory.atmosphere.length  ? tagsByCategory.atmosphere  : undefined },
    service:     { score: ratings.service,     tags: tagsByCategory.service.length     ? tagsByCategory.service     : undefined },
    cleanliness: { score: ratings.cleanliness, tags: tagsByCategory.cleanliness.length ? tagsByCategory.cleanliness : undefined },
  };

  return {
    id: `db-${row.id}`,
    pubId: pub.id,
    source: "app",
    stars,
    author: lang === "de" ? "Gast (live)" : "Guest (live)",
    customerId: `live-${row.id}`,
    text: row.free_text ?? (lang === "de" ? "(kein Kommentar)" : "(no comment)"),
    date: relativeDate(row.created_at, lang),
    timestamp: new Date(row.created_at).getTime(),
    categories,
    tags: (row.problem_tags ?? []).slice(0, 4),
    googleStatus: "none",
  };
}


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
// Status, der Top-Priorität hat: "reviewed" sperrt einen Kunden überall;
// "clicked" überschreibt nur "invited"/"cooldown"/"none" desselben Kunden.
const STATUS_RANK: Record<GoogleStatus, number> = {
  none: 0, cooldown: 1, invited: 2, clicked: 3, reviewed: 4,
};
function resolveGoogleStatus(item: FeedbackItem, customerLatest: Map<string, GoogleStatus>) {
  const own = item.googleStatus ?? "none";
  const latest = customerLatest.get(item.customerId) ?? "none";
  return STATUS_RANK[latest] > STATUS_RANK[own] ? latest : own;
}

export function LiveFeedback({ lockedPubId }: { lockedPubId?: string } = {}) {
  const tt = useT();
  const lang: "de" | "en" = tt("de", "en") as "de" | "en";
  const [source, setSource] = useState<"all" | "app" | "google">("all");
  const [rating, setRating] = useState<"all" | "low" | "high">("all");
  const [pubId, setPubId] = useState<string>(lockedPubId ?? "all");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [liveItems, setLiveItems] = useState<FeedbackItem[]>([]);

  // Local state für Reward-Flows
  const [rewards, setRewards] = useState<Record<string, ApologyReward>>({});
  // Pro Feedback: aktueller Google-Status (überschreibt mock-default)
  const [googleStatus, setGoogleStatus] = useState<Record<string, GoogleStatus>>({});

  // Pull real customer-submitted feedbacks + subscribe to new ones
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("id, created_at, rating_drinks, rating_atmosphere, rating_service, rating_cleanliness, problem_tags, free_text, location")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!active || error || !data) return;
      const mapped = (data as DbFeedbackRow[])
        .map((row) => dbRowToFeedbackItem(row, lang))
        .filter((x): x is FeedbackItem => x !== null);
      setLiveItems(mapped);
    })();

    const channel = supabase
      .channel("feedbacks-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedbacks" },
        (payload) => {
          const item = dbRowToFeedbackItem(payload.new as DbFeedbackRow, lang);
          if (!item) return;
          setLiveItems((prev) => [item, ...prev]);
          toast.info(tt("Neues Gäste-Feedback eingegangen", "New guest feedback received"), {
            description: PUBS.find((p) => p.id === item.pubId)?.name ?? "",
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [lang, tt]);

  const allFeedback = useMemo<FeedbackItem[]>(
    () => [...liveItems, ...FEEDBACK],
    [liveItems],
  );

  const effectivePubId = lockedPubId ?? pubId;

  // Globale Sicht pro Kunde — höchster Status gewinnt (siehe STATUS_RANK).
  const customerLatest = useMemo(() => {
    const map = new Map<string, GoogleStatus>();
    for (const f of allFeedback) {
      const current = (googleStatus[f.id] ?? f.googleStatus ?? "none") as GoogleStatus;
      const prev = map.get(f.customerId) ?? "none";
      if (STATUS_RANK[current] > STATUS_RANK[prev]) map.set(f.customerId, current);
    }
    return map;
  }, [googleStatus, allFeedback]);

  // Auto-Trigger: 4–5⭐ App-Reviews automatisch zur Google-Einladung anstoßen
  useEffect(() => {
    const candidates = FEEDBACK.filter((f) => {
      if (f.source !== "app" || f.stars < 4) return false;
      const status = resolveGoogleStatus(f, customerLatest);
      return status === "none";
    });
    if (candidates.length === 0) return;

    (async () => {
      const now = Date.now();
      for (const item of candidates) {
        const pub = PUBS.find((p) => p.id === item.pubId);
        if (!pub) continue;
        await inviteGoogleReview({
          feedbackId: item.id,
          googleReviewUrl: pub.googleReviewUrl,
        });
        setGoogleStatus((prev) => ({ ...prev, [item.id]: "invited" }));
        item.googleInvitedAt = now;
      }
      toast.success(tt(`${candidates.length} Google-Einladungen automatisch verschickt`, `${candidates.length} Google invites sent automatically`), {
        description: tt("Push mit Direktlink an alle Gäste mit 4–5⭐ ohne Cooldown", "Push with direct link to all 4–5⭐ guests without cooldown"),
      });
    })();
    // Wir wollen das genau einmal pro Komponenten-Lifetime laufen lassen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return allFeedback.filter((f) => {
      if (source !== "all" && f.source !== source) return false;
      if (rating === "low" && f.stars > 2) return false;
      if (rating === "high" && f.stars < 4) return false;
      if (effectivePubId !== "all" && f.pubId !== effectivePubId) return false;
      return true;
    });
  }, [source, rating, effectivePubId, allFeedback]);

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

  const handleApology = async (item: FeedbackItem, reward: ApologyReward) => {
    await sendApologyReward({
      feedbackId: item.id,
      credits: reward.credits,
      channel: reward.channel,
      message: reward.message,
    });
    setRewards((prev) => ({ ...prev, [item.id]: reward }));
    toast.success(
      tt(
        `Entschuldigung + ${reward.credits.toLocaleString()} Credits gesendet`,
        `Apology + ${reward.credits.toLocaleString()} credits sent`,
      ),
      { description: tt(
        `Kanal: ${reward.channel === "push" ? "Push-Notification" : "WhatsApp"} · ${item.author}`,
        `Channel: ${reward.channel === "push" ? "Push notification" : "WhatsApp"} · ${item.author}`,
      ) },
    );
  };

  const handleGoogleClick = async (item: FeedbackItem, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    await markGoogleReviewClicked({ feedbackId: item.id });
    setGoogleStatus((prev) => ({ ...prev, [item.id]: "clicked" }));
    item.googleClickedAt = Date.now();
    toast.info(tt("Als 'Link geöffnet' markiert", "Marked as 'link opened'"), {
      description: tt(
        "Bestätigung folgt entweder per Kunden-Rückfrage oder manuell hier im HQ.",
        "Confirmation will follow either via customer follow-up or manually here in HQ.",
      ),
    });
  };

  const handleConfirmReviewed = async (item: FeedbackItem) => {
    await confirmGoogleReview({ feedbackId: item.id, source: "manual" });
    setGoogleStatus((prev) => ({ ...prev, [item.id]: "reviewed" }));
    item.googleReviewedAt = Date.now();
    item.googleReviewedSource = "manual";
    toast.success(tt(`${item.author} als bewertet markiert`, `${item.author} marked as reviewed`), {
      description: tt(
        "Einmal-Sperre aktiv — Kunde erhält nie wieder eine Google-Einladung.",
        "One-time lock active — customer will never receive a Google invite again.",
      ),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tt("Quelle", "Source")}</span>
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger className="h-8 w-[130px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tt("Alle", "All")}</SelectItem>
                <SelectItem value="app">App</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tt("Bewertung", "Rating")}</span>
            <Select value={rating} onValueChange={(v) => setRating(v as typeof rating)}>
              <SelectTrigger className="h-8 w-[140px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tt("Alle", "All")}</SelectItem>
                <SelectItem value="low">1–2 {tt("Sterne", "stars")}</SelectItem>
                <SelectItem value="high">4–5 {tt("Sterne", "stars")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!lockedPubId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{tt("Filiale", "Branch")}</span>
              <Select value={pubId} onValueChange={setPubId}>
                <SelectTrigger className="h-8 w-[200px] text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tt("Alle Pubs", "All pubs")}</SelectItem>
                  {PUBS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} {tt("Bewertungen", "reviews")} · {done.size} {tt("erledigt", "done")}
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
            reward={rewards[f.id] ?? f.reward}
            googleStatus={resolveGoogleStatus({ ...f, googleStatus: googleStatus[f.id] ?? f.googleStatus }, customerLatest)}
            onToggleDone={() => toggleDone(f.id)}
            onToggleExpand={() => toggleExpanded(f.id)}
            onApology={handleApology}
            onGoogleClick={handleGoogleClick}
            onConfirmReviewed={handleConfirmReviewed}
          />
        ))}
        {filtered.length === 0 && (
          <Card className="shadow-sm"><CardContent className="p-10 text-center text-sm text-muted-foreground">
            {tt("Keine Bewertungen für diese Filter.", "No reviews for these filters.")}
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

function GoogleStatusBadge({
  status, invitedAt, clickedAt,
}: { status: GoogleStatus; invitedAt?: number; clickedAt?: number }) {
  const tt = useT();
  if (status === "reviewed") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-0 font-normal gap-1">
        <ShieldCheck className="h-3 w-3" />
        {tt("Google-Bewertung bestätigt", "Google review confirmed")}
      </Badge>
    );
  }
  if (status === "clicked") {
    return (
      <Badge className="bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/10 border-0 font-normal gap-1">
        <MousePointerClick className="h-3 w-3" />
        {tt("Link geöffnet · noch nicht bestätigt", "Link opened · not yet confirmed")}
      </Badge>
    );
  }
  if (status === "invited") {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-0 font-normal gap-1">
        <Sparkles className="h-3 w-3" />
        {tt("Einladung gesendet (auto)", "Invite sent (auto)")}
      </Badge>
    );
  }
  if (status === "cooldown") {
    const cooldownDays = clickedAt ? GOOGLE_CLICKED_COOLDOWN_DAYS : GOOGLE_INVITE_COOLDOWN_DAYS;
    const ref = clickedAt ?? invitedAt;
    const days = ref ? Math.max(0, cooldownDays - Math.floor((Date.now() - ref) / (1000 * 60 * 60 * 24))) : cooldownDays;
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted border-0 font-normal gap-1">
        <Clock className="h-3 w-3" />
        Cooldown · {days} {tt("Tage", "days")}
      </Badge>
    );
  }
  return null;
}

function ReviewCard({
  item, done, expanded, reward, googleStatus,
  onToggleDone, onToggleExpand, onApology, onGoogleClick, onConfirmReviewed,
}: {
  item: FeedbackItem;
  done: boolean;
  expanded: boolean;
  reward?: ApologyReward;
  googleStatus: GoogleStatus;
  onToggleDone: () => void;
  onToggleExpand: () => void;
  onApology: (item: FeedbackItem, reward: ApologyReward) => void | Promise<void>;
  onGoogleClick: (item: FeedbackItem, url: string) => void | Promise<void>;
  onConfirmReviewed: (item: FeedbackItem) => void | Promise<void>;
}) {
  const tt = useT();
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
                {isApp ? tt("Internes Feedback", "Internal feedback") : "Google"}
              </Badge>
              <Stars value={item.stars} />
              {isLow && (
                <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-0 font-normal">{tt("Kritisch", "Critical")}</Badge>
              )}
              {reward && (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-0 font-normal gap-1">
                  <Gift className="h-3 w-3" />
                  +{reward.credits.toLocaleString("de-DE")} Cr.
                </Badge>
              )}
              {isApp && item.stars >= 4 && (
                <GoogleStatusBadge
                  status={googleStatus}
                  invitedAt={item.googleInvitedAt}
                  clickedAt={item.googleClickedAt}
                />
              )}
              <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
            </div>

            {/* App-only: Category breakdown */}
            {canExpand && expanded && (
              <div className="pt-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                  {tt("Kategorie-Check", "Category check")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORY_ORDER.map((k) => (
                    <CategoryRow key={k} k={k} rating={item.categories![k]} />
                  ))}
                </div>
              </div>
            )}

            {/* Comment block */}
            <div className={canExpand && expanded ? "pt-2 border-t" : ""}>
              {canExpand && expanded && (
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                  {tt("Kommentar des Gastes", "Guest comment")}
                </div>
              )}
              <p className="text-sm text-foreground/90 leading-relaxed">„{item.text}"</p>
            </div>

            {/* Reward info bar */}
            {reward && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
                <span className="font-medium">{tt("Wiedergutmachung verschickt", "Apology sent")}</span> · {reward.credits.toLocaleString()} {tt("Credits via", "credits via")} {reward.channel === "push" ? "Push" : "WhatsApp"}
                <div className="text-emerald-700/80 mt-0.5 italic line-clamp-1">„{reward.message}"</div>
              </div>
            )}

            {isApp && item.stars >= 4 && googleStatus !== "reviewed" && (googleStatus === "invited" || googleStatus === "clicked") && (
              <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-blue-900 flex flex-wrap items-center gap-2">
                <span className="flex-1 min-w-0">
                  {googleStatus === "clicked"
                    ? tt(
                        "Kunde hat den Link geöffnet — sobald die Bewertung bei Google sichtbar ist, hier bestätigen.",
                        "Customer opened the link — confirm here once the review is visible on Google.",
                      )
                    : tt(
                        "Auto-Einladung verschickt. Status wird per Kunden-Rückfrage in der App aktualisiert.",
                        "Auto invite sent. Status will be updated via customer follow-up in the app.",
                      )}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs bg-white"
                  onClick={() => onGoogleClick(item, pub.googleReviewUrl)}
                >
                  <ExternalLink className="h-3 w-3" />
                  {tt("Link öffnen (Simulation)", "Open link (simulation)")}
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => onConfirmReviewed(item)}
                >
                  <ShieldCheck className="h-3 w-3" />
                  {tt("Als bewertet bestätigen", "Confirm as reviewed")}
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{item.author}</span>
                {isApp && !expanded && item.tags?.map((t) => (
                  <Badge key={t} variant="outline" className="font-normal text-[10px]">{t}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {canExpand && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs"
                    onClick={onToggleExpand}
                  >
                    {expanded ? tt("Weniger", "Less") : tt("Details", "Details")}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </Button>
                )}

                {/* Negative: Apology dialog */}
                {isLow && isApp && !reward && (
                  <ApologyDialog item={item} pub={pub} onConfirm={onApology} />
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
                  {done ? tt("Erledigt", "Done") : tt("Erledigen", "Mark done")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



// ---------- Apology Dialog (negative Reviews) ----------

function ApologyDialog({
  item, pub, onConfirm,
}: {
  item: FeedbackItem;
  pub: Pub;
  onConfirm: (item: FeedbackItem, reward: ApologyReward) => void | Promise<void>;
}) {
  const tt = useT();
  const [open, setOpen] = useState(false);
  const recommended = item.stars <= 1 ? 1000 : 500;
  const [acknowledged, setAcknowledged] = useState(false);
  const [credits, setCredits] = useState<number>(recommended);
  const [channel, setChannel] = useState<"push" | "whatsapp">("push");
  const [message, setMessage] = useState<string>(
    tt(
      `Hallo ${item.author.split(" ")[0]}, dein Feedback aus dem ${pub.name} hat uns sehr leid getan. Als kleine Entschuldigung schreiben wir dir {credits} Credits gut — wir freuen uns, dich beim nächsten Besuch zu überzeugen.`,
      `Hi ${item.author.split(" ")[0]}, we're truly sorry about your experience at ${pub.name}. As a small apology we're crediting you {credits} credits — we'd love to win you over on your next visit.`,
    ),
  );
  const [submitting, setSubmitting] = useState(false);

  const finalMessage = message.replace("{credits}", credits.toLocaleString()).replace("{pub}", pub.name);

  const reset = () => {
    setAcknowledged(false);
    setCredits(recommended);
    setChannel("push");
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
          <Gift className="h-3.5 w-3.5" />
          {tt("Entschuldigen + Credits", "Apologize + credits")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tt(`Wiedergutmachung an ${item.author}`, `Apology to ${item.author}`)}</DialogTitle>
          <DialogDescription>
            {pub.name} · {item.stars}⭐ — {tt("sende Entschuldigung + Credits direkt an den Gast.", "send apology + credits directly to the guest.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border p-3 bg-muted/30">
            <Checkbox id="ack" checked={acknowledged} onCheckedChange={(v) => setAcknowledged(!!v)} className="mt-0.5" />
            <Label htmlFor="ack" className="text-sm font-normal leading-snug cursor-pointer">
              {tt(
                "Ich habe die negative Bewertung geprüft und die Ursache mit dem Filialteam besprochen.",
                "I've reviewed the negative rating and discussed the root cause with the branch team.",
              )}
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {tt("Credit-Stufe · Empfehlung", "Credit tier · recommended")} {recommended.toLocaleString()}
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {APOLOGY_CREDIT_STEPS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={credits === c ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setCredits(c)}
                >
                  {c.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Versand-Kanal", "Delivery channel")}</Label>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as "push" | "whatsapp")} className="grid grid-cols-2 gap-2">
              <Label className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer text-sm ${channel === "push" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="push" />
                <BellRing className="h-4 w-4" />
                {tt("Push-Notification", "Push notification")}
              </Label>
              <Label className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer text-sm ${channel === "whatsapp" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="whatsapp" />
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg" className="text-xs uppercase tracking-wide text-muted-foreground">
              {tt("Nachricht · Platzhalter", "Message · placeholders")} {"{credits}"} / {"{pub}"}
            </Label>
            <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="text-sm" />
            <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{tt("Vorschau:", "Preview:")}</span> {finalMessage}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{tt("Abbrechen", "Cancel")}</Button>
          <Button
            disabled={!acknowledged || submitting}
            className="gap-1.5"
            onClick={async () => {
              setSubmitting(true);
              await onConfirm(item, {
                credits,
                channel,
                message: finalMessage,
                sentAt: Date.now(),
              });
              setOpen(false);
              reset();
            }}
          >
            <Gift className="h-4 w-4" />
            {credits.toLocaleString()} {tt("Credits senden", "Send credits")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
