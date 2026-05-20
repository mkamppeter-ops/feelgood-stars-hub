import { PUBS } from "./pubs-mock";

export type FeedbackSource = "app" | "google";

// Reihenfolge & Keys exakt wie im Kunden-Formular (src/routes/index.tsx)
export type CategoryKey = "drinks" | "atmosphere" | "service" | "cleanliness";

export type CategoryRating = {
  score: number; // 1-5
  tags?: string[]; // nur wenn score <= 3, exakt aus TAGS-Liste
};

export type ApologyReward = {
  credits: number;
  channel: "push" | "whatsapp";
  message: string;
  sentAt: number;
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
  tags?: string[]; // aggregierte flat-Liste (für kompakte Ansicht)
  categories?: Record<CategoryKey, CategoryRating>; // nur "app"
  reward?: ApologyReward;        // gesetzt, sobald Wiedergutmachung verschickt wurde
  googleShareInvited?: boolean;  // wurde der Google-Share-CTA bereits ausgelöst
};

export const APOLOGY_CREDIT_STEPS = [100, 250, 500, 1000, 2500, 5000, 10000] as const;
export const GOOGLE_SHARE_BONUS_STEPS = [50, 100, 250] as const;

// Exakte Labels & Tags aus dem Kunden-Formular
export const CATEGORY_META: Record<CategoryKey, { label: string; icon: string; tags: string[] }> = {
  drinks: {
    label: "Getränke",
    icon: "🍺",
    tags: ["Zu warm", "Zu wenig Kohlensäure", "Falsches Glas", "Geschmacklich nicht gut"],
  },
  atmosphere: {
    label: "Atmosphäre",
    icon: "🎶",
    tags: ["Musik zu laut", "Raum zu kalt/warm", "Stickige Luft"],
  },
  service: {
    label: "Service",
    icon: "🤵",
    tags: ["Lange Wartezeit", "Unfreundlich", "Falsches Getränk"],
  },
  cleanliness: {
    label: "Sauberkeit",
    icon: "🧼",
    tags: ["Tisch klebrig", "Gläser schmutzig", "Toiletten ungepflegt"],
  },
};

export const CATEGORY_ORDER: CategoryKey[] = ["drinks", "atmosphere", "service", "cleanliness"];

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
      drinks: { score: 5 }, atmosphere: { score: 4 },
      service: { score: 5 }, cleanliness: { score: 5 },
    },
  },
  { source: "google", stars: 4, author: "Julia R.", text: "Schöner Abend, Cocktails on point. Kommen wieder." },
  {
    source: "app", stars: 2, author: "Daniel B.",
    text: "Über 20 Min auf das Bier gewartet — am Freitagabend nicht akzeptabel. Bier kam dann lauwarm.",
    categories: {
      drinks: { score: 2, tags: ["Zu warm"] },
      atmosphere: { score: 4 },
      service: { score: 1, tags: ["Lange Wartezeit", "Unfreundlich"] },
      cleanliness: { score: 4 },
    },
  },
  { source: "google", stars: 5, author: "Sophia K.", text: "Beste Atmosphäre der Stadt, Personal mit Herz." },
  {
    source: "app", stars: 1, author: "Anna S.",
    text: "Tisch war klebrig, Glas hatte Lippenstiftreste. Toiletten waren ein Albtraum.",
    categories: {
      drinks: { score: 2, tags: ["Falsches Glas"] },
      atmosphere: { score: 3, tags: ["Stickige Luft"] },
      service: { score: 2, tags: ["Lange Wartezeit"] },
      cleanliness: { score: 1, tags: ["Tisch klebrig", "Gläser schmutzig", "Toiletten ungepflegt"] },
    },
  },
  { source: "google", stars: 4, author: "Felix W.", text: "Solide Karte, lockere Stimmung. Burger könnte heißer kommen." },
  {
    source: "app", stars: 5, author: "Mira L.",
    text: "Marcus hat uns persönlich begrüßt — fühlt sich wie zuhause an.",
    categories: {
      drinks: { score: 4 }, atmosphere: { score: 5 },
      service: { score: 5 }, cleanliness: { score: 5 },
    },
  },
  { source: "google", stars: 3, author: "Tom G.", text: "Etwas laut, aber Essen war gut." },
  {
    source: "app", stars: 2, author: "Hendrik V.",
    text: "Mein IPA schmeckte abgestanden, dazu war es im Raum eiskalt.",
    categories: {
      drinks: { score: 2, tags: ["Zu wenig Kohlensäure", "Geschmacklich nicht gut"] },
      atmosphere: { score: 2, tags: ["Raum zu kalt/warm"] },
      service: { score: 3, tags: ["Lange Wartezeit"] },
      cleanliness: { score: 4 },
    },
  },
  { source: "google", stars: 5, author: "Lara P.", text: "Maritimes Flair, super Auswahl an Whiskeys." },
  {
    source: "app", stars: 4, author: "Nina H.",
    text: "Team war Spitze, besonders die Bedienung am Tisch 4. Musik war einen Tick zu laut.",
    categories: {
      drinks: { score: 4 }, atmosphere: { score: 3, tags: ["Musik zu laut"] },
      service: { score: 5 }, cleanliness: { score: 4 },
    },
  },
  { source: "google", stars: 2, author: "Jens M.", text: "Wartezeit beim Essen viel zu lang, Hauptgang erst nach 50 Min." },
  {
    source: "app", stars: 5, author: "Carla D.",
    text: "Allergien wurden top behandelt — Daumen hoch!",
    categories: {
      drinks: { score: 5 }, atmosphere: { score: 4 },
      service: { score: 5 }, cleanliness: { score: 5 },
    },
  },
  { source: "google", stars: 4, author: "Robin S.", text: "Karte könnte etwas vielfältiger sein, sonst gerne wieder." },
  {
    source: "app", stars: 1, author: "Stefan O.",
    text: "Bekamen ein Pils statt Weizen, danach 25 Min gewartet. Toiletten waren auch nicht ok.",
    categories: {
      drinks: { score: 2, tags: ["Falsches Glas"] },
      atmosphere: { score: 3 },
      service: { score: 1, tags: ["Falsches Getränk", "Lange Wartezeit"] },
      cleanliness: { score: 2, tags: ["Toiletten ungepflegt"] },
    },
  },
  { source: "google", stars: 5, author: "Yusuf E.", text: "Aylin und Team — einfach klasse." },
  {
    source: "app", stars: 3, author: "Pia N.",
    text: "Solide, aber Musik passt einfach nicht zur Zielgruppe. War zu laut zum Reden.",
    categories: {
      drinks: { score: 4 }, atmosphere: { score: 2, tags: ["Musik zu laut"] },
      service: { score: 3 }, cleanliness: { score: 4 },
    },
  },
  { source: "google", stars: 5, author: "Lukas F.", text: "Quiz-Abend war richtig gut organisiert." },
  {
    source: "app", stars: 4, author: "Mia H.",
    text: "Beste Pommes der Stadt! Service hätte etwas aufmerksamer sein können.",
    categories: {
      drinks: { score: 5 }, atmosphere: { score: 4 },
      service: { score: 3, tags: ["Lange Wartezeit"] }, cleanliness: { score: 4 },
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
    base.tags = Array.from(
      new Set(Object.values(s.categories).flatMap((c) => c.tags ?? [])),
    ).slice(0, 4);
  }
  return base;
}).sort((a, b) => b.timestamp - a.timestamp);
