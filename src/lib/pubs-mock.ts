export type Pub = {
  id: string;
  rank: number;
  name: string;
  city: string;
  manager: string;
  phone: string;
  whatsapp: string;
  score: number;          // derived — see computeScore()
  bookingRatio: number;   // % der Tische, die reserviert sind
  walkInRatio: number;    // % der Gäste, die als Walk-in kommen
  feedback: number;       // ⭐ 0–5
  spendPerBooking: number;
  revenueTarget: number;  // % Zielerreichung
  activeAppUsers: number;   // 7-Tage-aktive App-Nutzer im Einzugsgebiet
  appUsersTarget: number;   // Zielwert, der für 100% Umsatzziel nötig ist
  googleReviewUrl: string;  // Direkt-Link zur Google-Bewertung
  scoreHistory: { day: string; score: number }[];
  reviews: { author: string; date: string; stars: number; text: string }[];
};

// Score = Mittel aus Umsatz-Ziel, Walk-In Ratio und Gäste-Feedback
// Ziel walk-in = 30%, Ziel revenueTarget = 100%, Feedback skaliert /5
export function computeScore(p: Pick<Pub, "revenueTarget" | "walkInRatio" | "feedback">): number {
  const revenueScore = Math.min(100, p.revenueTarget);
  const walkInScore  = Math.min(100, (p.walkInRatio / 30) * 100);
  const feedbackScore = (p.feedback / 5) * 100;
  return Math.round((revenueScore + walkInScore + feedbackScore) / 3);
}

// App-Reach = wie nah ist der Pub am benötigten Nutzer-Pool für 100% Umsatzziel
export function getAppReach(p: Pick<Pub, "activeAppUsers" | "appUsersTarget">): number {
  if (!p.appUsersTarget) return 0;
  return Math.round((p.activeAppUsers / p.appUsersTarget) * 100);
}

const history = (base: number): { day: string; score: number }[] => {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return days.map((d, i) => ({
    day: d,
    score: Math.max(40, Math.min(100, base + Math.round(Math.sin(i * 1.3) * 4 + (i - 3)))),
  }));
};

export const PUBS: Pub[] = [
  {
    id: "crown-anchor", rank: 1, name: "The Crown & Anchor", city: "München",
    manager: "Lena Hofbauer", phone: "+4915112345678", whatsapp: "4915112345678",
    score: 94, bookingRatio: 88, walkInRatio: 32, feedback: 4.9, spendPerBooking: 38, revenueTarget: 112,
    activeAppUsers: 2300, appUsersTarget: 2000,
    googleReviewUrl: "https://g.page/r/crown-anchor/review",
    scoreHistory: history(92),
    reviews: [
      { author: "Markus T.", date: "vor 2 Std.", stars: 5, text: "Beste Atmosphäre der Stadt — Service war außergewöhnlich aufmerksam." },
      { author: "Julia R.", date: "gestern", stars: 5, text: "Tolles Bierangebot und super freundliches Team. Komme wieder!" },
      { author: "Daniel B.", date: "vor 2 Tagen", stars: 4, text: "Sehr schön, nur die Wartezeit am Tresen war etwas lang." },
      { author: "Sophia K.", date: "vor 3 Tagen", stars: 5, text: "Lena führt den Laden mit so viel Herz. Absolute Empfehlung." },
    ],
  },
  {
    id: "red-lion", rank: 2, name: "Red Lion Tavern", city: "Berlin",
    manager: "Marcus Weber", phone: "+4915223456789", whatsapp: "4915223456789",
    score: 89, bookingRatio: 82, walkInRatio: 29, feedback: 4.7, spendPerBooking: 34, revenueTarget: 104,
    activeAppUsers: 2050, appUsersTarget: 1900,
    googleReviewUrl: "https://g.page/r/red-lion/review",
    scoreHistory: history(87),
    reviews: [
      { author: "Anna S.", date: "vor 4 Std.", stars: 5, text: "Live-Musik am Freitag war ein Highlight. Cocktails on point." },
      { author: "Felix W.", date: "gestern", stars: 4, text: "Solide Karte, lockere Stimmung. Gerne wieder." },
      { author: "Mira L.", date: "vor 2 Tagen", stars: 5, text: "Marcus hat uns persönlich begrüßt — fühlt sich wie zuhause an." },
      { author: "Tom G.", date: "vor 4 Tagen", stars: 4, text: "Burger hätte etwas heißer kommen können, sonst top." },
    ],
  },
  {
    id: "foggy-dog", rank: 3, name: "The Foggy Dog", city: "Hamburg",
    manager: "Sophie Brandt", phone: "+4915334567890", whatsapp: "4915334567890",
    score: 86, bookingRatio: 79, walkInRatio: 27, feedback: 4.6, spendPerBooking: 31, revenueTarget: 98,
    activeAppUsers: 1800, appUsersTarget: 1800,
    googleReviewUrl: "https://g.page/r/foggy-dog/review",
    scoreHistory: history(84),
    reviews: [
      { author: "Hendrik V.", date: "vor 1 Std.", stars: 5, text: "Maritimes Flair, super Auswahl an Whiskeys." },
      { author: "Lara P.", date: "gestern", stars: 4, text: "Schöner Abend, etwas voll am Wochenende." },
      { author: "Nina H.", date: "vor 3 Tagen", stars: 5, text: "Team war Spitze, besonders die Bedienung am Tisch 4." },
    ],
  },
  {
    id: "old-oak", rank: 4, name: "Old Oak House", city: "Köln",
    manager: "Tobias Richter", phone: "+4915445678901", whatsapp: "4915445678901",
    score: 82, bookingRatio: 75, walkInRatio: 25, feedback: 4.5, spendPerBooking: 29, revenueTarget: 95,
    activeAppUsers: 1550, appUsersTarget: 1700,
    googleReviewUrl: "https://g.page/r/old-oak/review",
    scoreHistory: history(80),
    reviews: [
      { author: "Jens M.", date: "vor 3 Std.", stars: 4, text: "Holzige Atmosphäre, sehr gemütlich für After-Work." },
      { author: "Carla D.", date: "gestern", stars: 5, text: "Personal hat mitgedacht — Allergien wurden top behandelt." },
      { author: "Robin S.", date: "vor 2 Tagen", stars: 4, text: "Karte könnte etwas vielfältiger sein." },
    ],
  },
  {
    id: "iron-barrel", rank: 5, name: "The Iron Barrel", city: "Frankfurt",
    manager: "Aylin Demir", phone: "+4915556789012", whatsapp: "4915556789012",
    score: 78, bookingRatio: 71, walkInRatio: 23, feedback: 4.4, spendPerBooking: 27, revenueTarget: 91,
    activeAppUsers: 1380, appUsersTarget: 1600,
    googleReviewUrl: "https://g.page/r/iron-barrel/review",
    scoreHistory: history(76),
    reviews: [
      { author: "Stefan O.", date: "vor 5 Std.", stars: 4, text: "Industrial-Look, gute Craft-Beer-Auswahl." },
      { author: "Yusuf E.", date: "gestern", stars: 5, text: "Aylin und Team — einfach klasse." },
      { author: "Ines K.", date: "vor 4 Tagen", stars: 4, text: "Etwas laut, aber Essen war gut." },
    ],
  },
  {
    id: "black-sheep", rank: 6, name: "Black Sheep Inn", city: "Stuttgart",
    manager: "Jonas Keller", phone: "+4915667890123", whatsapp: "4915667890123",
    score: 74, bookingRatio: 68, walkInRatio: 21, feedback: 4.3, spendPerBooking: 26, revenueTarget: 88,
    activeAppUsers: 1200, appUsersTarget: 1500,
    googleReviewUrl: "https://g.page/r/black-sheep/review",
    scoreHistory: history(73),
    reviews: [
      { author: "Pia N.", date: "vor 6 Std.", stars: 4, text: "Solides Pub, freundliches Personal." },
      { author: "Lukas F.", date: "gestern", stars: 4, text: "Quiz-Abend war richtig gut organisiert." },
      { author: "Mia H.", date: "vor 3 Tagen", stars: 5, text: "Beste Pommes der Stadt!" },
    ],
  },
  {
    id: "tipsy-fox", rank: 7, name: "The Tipsy Fox", city: "Leipzig",
    manager: "Mira Sokolov", phone: "+4915778901234", whatsapp: "4915778901234",
    score: 71, bookingRatio: 64, walkInRatio: 19, feedback: 4.2, spendPerBooking: 24, revenueTarget: 84,
    activeAppUsers: 1050, appUsersTarget: 1400,
    googleReviewUrl: "https://g.page/r/tipsy-fox/review",
    scoreHistory: history(70),
    reviews: [
      { author: "Erik B.", date: "vor 2 Std.", stars: 4, text: "Charmantes kleines Pub im Süden Leipzigs." },
      { author: "Hanna J.", date: "gestern", stars: 3, text: "Service war etwas überfordert am Samstagabend." },
      { author: "Ole T.", date: "vor 4 Tagen", stars: 5, text: "Mira sorgt immer für gute Stimmung." },
    ],
  },
  {
    id: "whistling-kettle", rank: 8, name: "Whistling Kettle", city: "Düsseldorf",
    manager: "Paul Lehmann", phone: "+4915889012345", whatsapp: "4915889012345",
    score: 67, bookingRatio: 61, walkInRatio: 17, feedback: 4.0, spendPerBooking: 23, revenueTarget: 79,
    activeAppUsers: 880, appUsersTarget: 1300,
    googleReviewUrl: "https://g.page/r/whistling-kettle/review",
    scoreHistory: history(66),
    reviews: [
      { author: "Greta W.", date: "vor 3 Std.", stars: 4, text: "Gemütlich, aber etwas in die Jahre gekommen." },
      { author: "Ben I.", date: "gestern", stars: 3, text: "Karte ist okay, könnte aber mehr vegetarische Optionen brauchen." },
      { author: "Sara M.", date: "vor 2 Tagen", stars: 5, text: "Paul ist ein toller Gastgeber!" },
    ],
  },
];

export const getPub = (id: string) => PUBS.find((p) => p.id === id);
