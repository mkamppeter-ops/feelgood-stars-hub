import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Star, Camera, X, Mail, Gift, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageSwitcher } from "@/components/language-switcher";

const LOCATIONS = ["Pub Berlin", "Pub München", "Pub Hamburg"] as const;

export const Route = createFileRoute("/feedback")({
  component: Index,
  head: () => ({
    meta: [
      { title: "How was your visit? | Feedback" },
      { name: "description", content: "Rate your visit in four categories and send us your feedback." },
    ],
  }),
});

const CATEGORIES = ["drinks", "atmosphere", "service", "cleanliness"] as const;
type Category = (typeof CATEGORIES)[number];

// Localized problem tags
const TAGS_DE: Record<Category, string[]> = {
  drinks: ["Zu warm", "Zu wenig Kohlensäure", "Falsches Glas", "Geschmacklich nicht gut"],
  atmosphere: ["Musik zu laut", "Raum zu kalt/warm", "Stickige Luft"],
  service: ["Lange Wartezeit", "Unfreundlich", "Falsches Getränk"],
  cleanliness: ["Tisch klebrig", "Gläser schmutzig", "Toiletten ungepflegt"],
};
const TAGS_EN: Record<Category, string[]> = {
  drinks: ["Too warm", "Too flat", "Wrong glass", "Bad taste"],
  atmosphere: ["Music too loud", "Too cold/hot", "Stuffy air"],
  service: ["Long wait", "Unfriendly", "Wrong drink"],
  cleanliness: ["Sticky table", "Dirty glasses", "Untidy toilets"],
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            aria-label={t("feedback.starsAria", { n })}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-1 -m-1 transition-transform active:scale-90"
          >
            <Star
              className={cn(
                "h-9 w-9 transition-colors",
                active ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/40",
              )}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

function TagPills({
  tags,
  selected,
  onToggle,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-4">
      {tags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-foreground/40",
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

type View = "form" | "success-good" | "success-critical";

function Index() {
  const { t, i18n } = useTranslation();
  const TAGS = (i18n.resolvedLanguage ?? "de").startsWith("en") ? TAGS_EN : TAGS_DE;
  const [view, setView] = useState<View>("form");
  const [ratings, setRatings] = useState<Record<Category, number>>({
    drinks: 0, atmosphere: 0, service: 0, cleanliness: 0,
  });
  const [selectedTags, setSelectedTags] = useState<Record<Category, string[]>>({
    drinks: [], atmosphere: [], service: [], cleanliness: [],
  });
  const [location, setLocation] = useState<string>("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const complete = CATEGORIES.every((c) => ratings[c] > 0) && location !== "";
  const hasLowRating = CATEGORIES.some((c) => ratings[c] > 0 && ratings[c] <= 3);

  const toggleTag = (cat: Category, tag: string) => {
    setSelectedTags((s) => ({
      ...s,
      [cat]: s[cat].includes(tag) ? s[cat].filter((x) => x !== tag) : [...s[cat], tag],
    }));
  };

  const reset = () => {
    setRatings({ drinks: 0, atmosphere: 0, service: 0, cleanliness: 0 });
    setSelectedTags({ drinks: [], atmosphere: [], service: [], cleanliness: [] });
    setLocation("");
    setComment("");
    setPhoto(null);
    setSubmitError(null);
    setView("form");
  };

  const handleSubmit = async () => {
    if (!complete || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const allTags = CATEGORIES.flatMap((c) => selectedTags[c]);

    const feedbackPayload = {
      rating_drinks: ratings.drinks,
      rating_atmosphere: ratings.atmosphere,
      rating_service: ratings.service,
      rating_cleanliness: ratings.cleanliness,
      problem_tags: allTags,
      free_text: comment.trim() || null,
      photo_url: null,
      location,
    };

    try {
      const { error } = await supabase.from("feedbacks").insert(feedbackPayload);

      if (error) {
        console.error("Feedback insert failed:", { error, payload: feedbackPayload });
        setSubmitError(t("feedback.errorRetry"));
        toast.error(t("feedback.saveErrorTitle"), { description: error.message });
        return;
      }

      try {
        await fetch("https://hook.eu1.make.com/trijhyazoxfafqi84irbsk89eo5taph5", {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            ratings: {
              drinks: ratings.drinks,
              atmosphere: ratings.atmosphere,
              service: ratings.service,
              cleanliness: ratings.cleanliness,
            },
            problem_tags: allTags,
            free_text: comment.trim() || null,
          }),
        });
      } catch (webhookError) {
        console.error("Make.com webhook failed:", webhookError);
      }

      setView(hasLowRating ? "success-critical" : "success-good");
    } catch (error) {
      console.error("Unexpected feedback error:", { error, payload: feedbackPayload });
      const message = error instanceof Error ? error.message : "Unknown error";
      setSubmitError(t("feedback.errorRetry"));
      toast.error(t("feedback.saveErrorTitle"), { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (view !== "form") {
    return <ResultScreen variant={view} onReset={reset} />;
  }

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col px-6 pt-6 pb-8 min-h-screen">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <header className="mb-10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("feedback.title")}
            </h1>
            <Link
              to="/hq"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              HQ Dashboard →
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("feedback.subtitle")}</p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm mb-4">
          <label className="text-base font-semibold text-card-foreground mb-3 block">
            {t("feedback.locationLabel")}
          </label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder={t("feedback.locationPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section className="flex flex-col gap-4 flex-1">
          {CATEGORIES.map((cat) => {
            const showTags = ratings[cat] > 0 && ratings[cat] <= 3;
            return (
              <div key={cat} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-base font-semibold text-card-foreground mb-3">
                  {t(`feedback.categories.${cat}`)}
                </p>
                <StarRating
                  value={ratings[cat]}
                  onChange={(v) => setRatings((r) => ({ ...r, [cat]: v }))}
                />
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    showTags ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground pt-4">{t("feedback.whatHappened")}</p>
                    <TagPills
                      tags={TAGS[cat]}
                      selected={selectedTags[cat]}
                      onToggle={(x) => toggleTag(cat, x)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            hasLowRating ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div>
                <label htmlFor="comment" className="text-sm font-semibold text-card-foreground">
                  {t("feedback.detailLabel")}
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder={t("feedback.detailPlaceholder")}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40"
                />
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
                {photo ? (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                    <span className="truncate text-foreground">{photo.name}</span>
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      aria-label={t("feedback.removePhoto")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-sm font-medium text-foreground hover:border-foreground/40"
                  >
                    <Camera className="h-4 w-4" />
                    {t("feedback.addPhoto")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {submitError && (
          <p className="mt-4 text-sm text-destructive text-center" role="alert">{submitError}</p>
        )}

        <button
          type="button"
          disabled={!complete || submitting}
          onClick={handleSubmit}
          className={cn(
            "mt-6 w-full rounded-2xl py-4 text-base font-semibold transition-all flex items-center justify-center gap-2",
            complete && !submitting
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? t("feedback.submitting") : t("feedback.submit")}
        </button>
      </div>
    </main>
  );
}

function ResultScreen({
  variant,
  onReset,
}: {
  variant: "success-good" | "success-critical";
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const isGood = variant === "success-good";
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col px-6 pt-16 pb-8 min-h-screen">
        <div className="flex flex-col items-center text-center flex-1">
          <div
            className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 fade-in duration-500",
              isGood ? "bg-yellow-400/15 text-yellow-500" : "bg-primary/10 text-primary",
            )}
          >
            {isGood ? <Gift className="h-10 w-10" strokeWidth={1.75} /> : <Mail className="h-10 w-10" strokeWidth={1.75} />}
          </div>

          {isGood ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("feedback.success.goodTitle")}
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                <Trans
                  i18nKey="feedback.success.goodBody"
                  components={{ 1: <span className="font-semibold text-foreground" /> }}
                />
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("feedback.success.criticalTitle")}
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                {t("feedback.success.criticalBody")}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {isGood && (
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <MapPin className="h-5 w-5" />
              {t("feedback.success.goToMaps")}
            </a>
          )}
          <button
            type="button"
            onClick={onReset}
            className={cn(
              "w-full rounded-2xl py-4 text-base font-semibold transition-all active:scale-[0.98]",
              isGood ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90",
            )}
          >
            {t("common.backToHome")}
          </button>
        </div>
      </div>
    </main>
  );
}
