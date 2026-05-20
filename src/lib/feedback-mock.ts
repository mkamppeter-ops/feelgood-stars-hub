import { PUBS } from "./pubs-mock";

export type FeedbackSource = "app" | "google";

export type CategoryKey = "cleanliness" | "service" | "drinks" | "atmosphere";

export type CategoryRating = {
  score: number; // 1-5
  tags?: string[]; // problem tags (only when score is low)
};

export type FeedbackItem = {
  id: string;
  pubId: string;
  source: FeedbackSource;
  stars: number;
  author: string;
  date: string;
  timestamp: number;
  text: string;
  tags?: string[]; // legacy aggregate tags (used for App badge row)
  categories?: Record<CategoryKey, CategoryRating>; // only for "app" source
};

export const CATEGORY_META: Record<CategoryKey, { label: string; icon: string }> = {
  cleanliness: { label: "Sauberkeit", icon: "🧼" },
  service:     { label: "Service",    icon: "🤵" },
  drinks:      { label: "Getränke",   icon: "🍺" },
  atmosphere:  { label: "Atmosphäre", icon: "🎶" },
};

type AppSample = {
  source: "app";
  stars: number;
  author: string;
  text: string;
  categories: Record<CategoryKey, CategoryRating>;
};
type GoogleSample = {
  source: "google";
  stars: number;
  author: string;
  text: string;
};

const SAMPLES: Array<AppSample | GoogleSample> = [
  {
    source: "app", stars: 5, author: "Markus T.",
    text: "Außergewöhnlicher Service, das Team war super aufmerksam.",
    categories: {
      cleanliness: { score: 5 }, service: { score: 5 },
      drinks: { score: 5 }, atmosphere: { score: 4 },
    },
  },
  { source: "google", stars: 4, author: "Julia R.", text: "Schöner Abend, Cocktails on point. Kommen wieder." },
  {
    source: "app", stars: 2, author: "Daniel B.",
    text: "Über 20 Min auf das Bier gewartet — am Freitagabend nicht akzeptabel. Personal wirkte überfordert.",
    categories: {
      cleanliness: { score: 4 },
      service: { score: 1, tags: ["Wartezeit", "Personal überfordert"] },
      drinks: { score: 2, tags: ["Bier warm"] },
      atmosphere: { score: 3 },
    },
  },
  { source: "google", stars: 5, author: "Sophia K.", text: "Beste Atmosphäre der Stadt, Personal mit Herz." },
  {
    source: "app", stars: 1, author: "Anna S.",
    text: "Tisch war klebrig, Toiletten katastrophal. Mussten zweimal nachfragen bis jemand kam.",
    categories: {
      cleanliness: { score: 1, tags: ["Tisch klebrig", "Toiletten", "Boden schmutzig"] },
      service: { score: 2, tags: ["Reaktionszeit"] },
      drinks: { score: 3 },
      atmosphere: { score: 2, tags: ["Geruch"] },
    },
  },
  { source: "google", stars: 4, author: "Felix W.", text: "Solide Karte, lockere Stimmung. Burger könnte heißer kommen." },
  {
    source: "app", stars: 5, author: "Mira L.",
    text: "Marcus hat uns persönlich begrüßt — fühlt sich wie zuhause an.",
    categories: {
      cleanliness: { score: 5 }, service: { score: 5 },
      drinks: { score: 4 }, atmosphere: { score: 5 },
    },
  },
  { source: "google", stars: 3, author: "Tom G.", text: "Etwas laut, aber Essen war gut." },
  {
    source: "app", stars: 2, author: "Hendrik V.",
    text: "Preise sind in den letzten Monaten deutlich gestiegen, dafür weniger Auswahl.",
    categories: {
      cleanliness: { score: 4 },
      service: { score: 3 },
      drinks: { score: 2, tags: ["Preis", "Auswahl reduziert"] },
      atmosphere: { score: 3 },
    },
  },
  { source: "google", stars: 5, author: "Lara P.", text: "Maritimes Flair, super Auswahl an Whiskeys." },
  {
    source: "app", stars: 4, author: "Nina H.",
    text: "Team war Spitze, besonders die Bedienung am Tisch 4. Musik war einen Tick zu laut.",
    categories: {
      cleanliness: { score: 4 }, service: { score: 5 },
      drinks: { score: 4 }, atmosphere: { score: 3, tags: ["Lautstärke"] },
    },
  },
  { source: "google", stars: 2, author: "Jens M.", text: "Wartezeit beim Essen viel zu lang, Hauptgang erst nach 50 Min." },
  {
    source: "app", stars: 5, author: "Carla D.",
    text: "Allergien wurden top behandelt — Daumen hoch!",
    categories: {
      cleanliness: { score: 5 }, service: { score: 5 },
      drinks: { score: 5 }, atmosphere: { score: 4 },
    },
  },
  { source: "google", stars: 4, author: "Robin S.", text: "Karte könnte etwas vielfältiger sein, sonst gerne wieder." },
  {
    source: "app", stars: 1, author: "Stefan O.",
    text: "Toilette war in einem unhaltbaren Zustand. Seife leer, Boden nass.",
    categories: {
      cleanliness: { score: 1, tags: ["Toiletten", "Seife leer", "Boden nass"] },
      service: { score: 3 },
      drinks: { score: 3 },
      atmosphere: { score: 2 },
    },
  },
  { source: "google", stars: 5, author: "Yusuf E.", text: "Aylin und Team — einfach klasse." },
  {
    source: "app", stars: 3, author: "Pia N.",
    text: "Solide, aber nichts Besonderes. Musik passte nicht zur Zielgruppe.",
    categories: {
      cleanliness: { score: 4 }, service: { score: 3 },
      drinks: { score: 3 }, atmosphere: { score: 2, tags: ["Musikauswahl"] },
    },
  },
  { source: "google", stars: 5, author: "Lukas F.", text: "Quiz-Abend war richtig gut organisiert." },
  {
    source: "app", stars: 4, author: "Mia H.",
    text: "Beste Pommes der Stadt! Service hätte etwas aufmerksamer sein können.",
    categories: {
      cleanliness: { score: 4 }, service: { score: 3, tags: ["Aufmerksamkeit"] },
      drinks: { score: 5 }, atmosphere: { score: 4 },
    },
  },
  { source: "google", stars: 2, author: "Erik B.", text: "Service war überfordert am Samstagabend." },
];

const RELATIVE = ["vor 12 Min.", "vor 1 Std.", "vor 3 Std.", "vor 5 Std.", "gestern, 22:14", "gestern, 18:02", "vor 2 Tagen", "vor 3 Tagen"];

export const FEEDBACK: FeedbackItem[] = SAMPLES.map((s, i) => {
  const pub = PUBS[i % PUBS.length];
  const base: FeedbackItem = {
    id: `f-${i}`,
    pubId: pub.id,
    source: s.source,
    stars: s.stars,
    author: s.author,
    text: s.text,
    date: RELATIVE[i % RELATIVE.length],
    timestamp: Date.now() - i * 1000 * 60 * 47,
  };
  if (s.source === "app") {
    base.categories = s.categories;
    // aggregate flat tags for compact view
    base.tags = Array.from(
      new Set(Object.values(s.categories).flatMap((c) => c.tags ?? [])),
    ).slice(0, 4);
  }
  return base;
}).sort((a, b) => b.timestamp - a.timestamp);
