import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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

function Index() {
  const [ratings, setRatings] = useState<Record<Category, number>>({
    Getränke: 0,
    Atmosphäre: 0,
    Service: 0,
    Sauberkeit: 0,
  });

  const complete = CATEGORIES.every((c) => ratings[c] > 0);

  const handleSubmit = () => {
    if (!complete) return;
    toast.success("Danke für dein Feedback!");
  };

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <Toaster position="top-center" />
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
          {CATEGORIES.map((cat) => (
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
            </div>
          ))}
        </section>

        <button
          type="button"
          disabled={!complete}
          onClick={handleSubmit}
          className={cn(
            "mt-10 w-full rounded-2xl py-4 text-base font-semibold transition-all",
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
