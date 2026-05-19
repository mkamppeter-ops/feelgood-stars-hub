import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Star, Camera, X, Mail, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Wie war dein Besuch? | Feedback" },
      { name: "description", content: "Bewerte deinen Besuch in vier Kategorien und sende uns dein Feedback." },
    ],
  }),
});

const CATEGORIES = ["Getränke", "Atmosphäre", "Service", "Sauberkeit"] as const;
type Category = (typeof CATEGORIES)[number];

const TAGS: Record<Category, string[]> = {
  Getränke: ["Zu warm", "Zu wenig Kohlensäure", "Falsches Glas", "Geschmacklich nicht gut"],
  Atmosphäre: ["Musik zu laut", "Raum zu kalt/warm", "Stickige Luft"],
  Service: ["Lange Wartezeit", "Unfreundlich", "Falsches Getränk"],
  Sauberkeit: ["Tisch klebrig", "Gläser schmutzig", "Toiletten ungepflegt"],
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} Sterne`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-1 -m-1 transition-transform active:scale-90"
          >
            <Star
              className={cn(
                "h-9 w-9 transition-colors",
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground/40",
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
  const [view, setView] = useState<View>("form");
  const [ratings, setRatings] = useState<Record<Category, number>>({
    Getränke: 0,
    Atmosphäre: 0,
    Service: 0,
    Sauberkeit: 0,
  });
  const [selectedTags, setSelectedTags] = useState<Record<Category, string[]>>({
    Getränke: [],
    Atmosphäre: [],
    Service: [],
    Sauberkeit: [],
  });
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const complete = CATEGORIES.every((c) => ratings[c] > 0);
  const hasLowRating = CATEGORIES.some(
    (c) => ratings[c] > 0 && ratings[c] <= 3,
  );

  const toggleTag = (cat: Category, tag: string) => {
    setSelectedTags((s) => ({
      ...s,
      [cat]: s[cat].includes(tag)
        ? s[cat].filter((t) => t !== tag)
        : [...s[cat], tag],
    }));
  };

  const reset = () => {
    setRatings({ Getränke: 0, Atmosphäre: 0, Service: 0, Sauberkeit: 0 });
    setSelectedTags({ Getränke: [], Atmosphäre: [], Service: [], Sauberkeit: [] });
    setComment("");
    setPhoto(null);
    setView("form");
  };

  const handleSubmit = () => {
    if (!complete) return;
    setView(hasLowRating ? "success-critical" : "success-good");
  };

  if (view !== "form") {
    return (
      <ResultScreen
        variant={view}
        onReset={reset}
      />
    );
  }


  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col px-6 pt-12 pb-8 min-h-screen">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Wie war dein Besuch?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bewerte jede Kategorie mit 1 bis 5 Sternen.
          </p>
        </header>

        <section className="flex flex-col gap-4 flex-1">
          {CATEGORIES.map((cat) => {
            const showTags = ratings[cat] > 0 && ratings[cat] <= 3;
            return (
              <div
                key={cat}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-base font-semibold text-card-foreground mb-3">
                  {cat}
                </p>
                <StarRating
                  value={ratings[cat]}
                  onChange={(v) => setRatings((r) => ({ ...r, [cat]: v }))}
                />
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    showTags
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground pt-4">
                      Was war nicht in Ordnung?
                    </p>
                    <TagPills
                      tags={TAGS[cat]}
                      selected={selectedTags[cat]}
                      onToggle={(t) => toggleTag(cat, t)}
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
            hasLowRating
              ? "grid-rows-[1fr] opacity-100 mt-6"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="comment"
                  className="text-sm font-semibold text-card-foreground"
                >
                  Was ist genau passiert?
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Beschreibe es kurz…"
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
                      aria-label="Foto entfernen"
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
                    Foto hinzufügen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!complete}
          onClick={handleSubmit}
          className={cn(
            "mt-8 w-full rounded-2xl py-4 text-base font-semibold transition-all",
            complete
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          Feedback senden
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
  const isGood = variant === "success-good";
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col px-6 pt-16 pb-8 min-h-screen">
        <div className="flex flex-col items-center text-center flex-1">
          <div
            className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 fade-in duration-500",
              isGood
                ? "bg-yellow-400/15 text-yellow-500"
                : "bg-primary/10 text-primary",
            )}
          >
            {isGood ? (
              <Sparkles className="h-10 w-10" strokeWidth={1.75} />
            ) : (
              <Mail className="h-10 w-10" strokeWidth={1.75} />
            )}
          </div>

          {isGood ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Wow, danke!
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                Deine <span className="font-semibold text-foreground">500 Credits</span>{" "}
                sind bereits auf deinem Konto. Hilf uns zu wachsen und bewerte uns auf
                Google!
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Danke für deine ehrliche Kritik.
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                Das entspricht nicht unserem Standard. Unser Qualitäts-Team schaut sich
                das genau an und wird sich in Kürze bei dir melden.
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
              Zu Google Maps
            </a>
          )}
          <button
            type="button"
            onClick={onReset}
            className={cn(
              "w-full rounded-2xl py-4 text-base font-semibold transition-all active:scale-[0.98]",
              isGood
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90",
            )}
          >
            Zurück zum Start
          </button>
        </div>
      </div>
    </main>
  );
}

