export type Pub = {
  id: string;
  rank: number;
  name: string;
  city: string;
  manager: string;
  phone: string;
  whatsapp: string;
  score: number;
  bookingRatio: number;
  feedback: number;
  spendPerBooking: number;
  revenueTarget: number; // percentage achievement
  scoreHistory: { day: string; score: number }[];
  reviews: { author: string; date: string; stars: number; text: string }[];
};

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
    score: 94, bookingRatio: 88, feedback: 4.9, spendPerBooking: 38, revenueTarget: 112,
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
    score: 89, bookingRatio: 82, feedback: 4.7, spendPerBooking: 34, revenueTarget: 104,
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
    score: 86, bookingRatio: 79, feedback: 4.6, spendPerBooking: 31, revenueTarget: 98,
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
    score: 82, bookingRatio: 75, feedback: 4.5, spendPerBooking: 29, revenueTarget: 95,
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
    score: 78, bookingRatio: 71, feedback: 4.4, spendPerBooking: 27, revenueTarget: 91,
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
    score: 74, bookingRatio: 68, feedback: 4.3, spendPerBooking: 26, revenueTarget: 88,
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
    score: 71, bookingRatio: 64, feedback: 4.2, spendPerBooking: 24, revenueTarget: 84,
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
    score: 67, bookingRatio: 61, feedback: 4.0, spendPerBooking: 23, revenueTarget: 79,
    scoreHistory: history(66),
    reviews: [
      { author: "Greta W.", date: "vor 3 Std.", stars: 4, text: "Gemütlich, aber etwas in die Jahre gekommen." },
      { author: "Ben I.", date: "gestern", stars: 3, text: "Karte ist okay, könnte aber mehr vegetarische Optionen brauchen." },
      { author: "Sara M.", date: "vor 2 Tagen", stars: 5, text: "Paul ist ein toller Gastgeber!" },
    ],
  },
];

export const getPub = (id: string) => PUBS.find((p) => p.id === id);
