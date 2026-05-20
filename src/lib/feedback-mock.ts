import { PUBS } from "./pubs-mock";

export type FeedbackSource = "app" | "google";

export type FeedbackItem = {
  id: string;
  pubId: string;
  source: FeedbackSource;
  stars: number;
  author: string;
  date: string; // display
  timestamp: number; // for sorting
  text: string;
  tags?: string[];
};

const TAGS_POOL = ["Service", "Wartezeit", "Sauberkeit", "Essen", "Lautstärke", "Preis", "Atmosphäre", "Personal"];

const SAMPLES: Array<Omit<FeedbackItem, "id" | "pubId" | "timestamp" | "date">> = [
  { source: "app", stars: 5, author: "Markus T.", text: "Außergewöhnlicher Service, das Team war super aufmerksam.", tags: ["Service", "Personal"] },
  { source: "google", stars: 4, author: "Julia R.", text: "Schöner Abend, Cocktails on point. Kommen wieder." },
  { source: "app", stars: 2, author: "Daniel B.", text: "Über 20 Min auf das Bier gewartet — am Freitagabend nicht akzeptabel.", tags: ["Wartezeit", "Service"] },
  { source: "google", stars: 5, author: "Sophia K.", text: "Beste Atmosphäre der Stadt, Personal mit Herz." },
  { source: "app", stars: 1, author: "Anna S.", text: "Tisch war nicht sauber, mussten zweimal nachfragen. Sehr enttäuschend.", tags: ["Sauberkeit", "Service"] },
  { source: "google", stars: 4, author: "Felix W.", text: "Solide Karte, lockere Stimmung. Burger könnte heißer kommen." },
  { source: "app", stars: 5, author: "Mira L.", text: "Marcus hat uns persönlich begrüßt — fühlt sich wie zuhause an.", tags: ["Personal", "Atmosphäre"] },
  { source: "google", stars: 3, author: "Tom G.", text: "Etwas laut, aber Essen war gut." },
  { source: "app", stars: 2, author: "Hendrik V.", text: "Preise sind in den letzten Monaten deutlich gestiegen.", tags: ["Preis"] },
  { source: "google", stars: 5, author: "Lara P.", text: "Maritimes Flair, super Auswahl an Whiskeys." },
  { source: "app", stars: 4, author: "Nina H.", text: "Team war Spitze, besonders die Bedienung am Tisch 4.", tags: ["Personal"] },
  { source: "google", stars: 2, author: "Jens M.", text: "Wartezeit beim Essen viel zu lang, Hauptgang erst nach 50 Min." },
  { source: "app", stars: 5, author: "Carla D.", text: "Allergien wurden top behandelt — Daumen hoch!", tags: ["Service"] },
  { source: "google", stars: 4, author: "Robin S.", text: "Karte könnte etwas vielfältiger sein, sonst gerne wieder." },
  { source: "app", stars: 1, author: "Stefan O.", text: "Toilette war in einem unhaltbaren Zustand.", tags: ["Sauberkeit"] },
  { source: "google", stars: 5, author: "Yusuf E.", text: "Aylin und Team — einfach klasse." },
  { source: "app", stars: 3, author: "Pia N.", text: "Solide, aber nichts Besonderes.", tags: ["Atmosphäre"] },
  { source: "google", stars: 5, author: "Lukas F.", text: "Quiz-Abend war richtig gut organisiert." },
  { source: "app", stars: 4, author: "Mia H.", text: "Beste Pommes der Stadt!", tags: ["Essen"] },
  { source: "google", stars: 2, author: "Erik B.", text: "Service war überfordert am Samstagabend." },
];

const RELATIVE = ["vor 12 Min.", "vor 1 Std.", "vor 3 Std.", "vor 5 Std.", "gestern, 22:14", "gestern, 18:02", "vor 2 Tagen", "vor 3 Tagen"];

export const FEEDBACK: FeedbackItem[] = SAMPLES.map((s, i) => {
  const pub = PUBS[i % PUBS.length];
  return {
    ...s,
    id: `f-${i}`,
    pubId: pub.id,
    date: RELATIVE[i % RELATIVE.length],
    timestamp: Date.now() - i * 1000 * 60 * 47,
    tags: s.source === "app" ? (s.tags ?? [TAGS_POOL[i % TAGS_POOL.length]]) : undefined,
  };
}).sort((a, b) => b.timestamp - a.timestamp);
