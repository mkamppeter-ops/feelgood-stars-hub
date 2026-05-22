export type NewsCategory = "urgent" | "marketing" | "product" | "event" | "policy" | "ops";

export interface HQNewsItem {
  id: string;
  category: NewsCategory;
  titleDe: string;
  titleEn: string;
  excerptDe: string;
  excerptEn: string;
  bodyDe?: string;
  bodyEn?: string;
  author: string;
  authorRole: string;
  publishedAt: string; // ISO
  pinned?: boolean;
  requiresAck?: boolean;
  attachments?: { label: string; url: string }[];
  /** Empfänger-Filialen. undefined oder leeres Array = an alle Filialen. */
  pubIds?: string[];
}

export const NEWS_CATEGORY_META: Record<
  NewsCategory,
  { de: string; en: string; cls: string }
> = {
  urgent: {
    de: "Dringend",
    en: "Urgent",
    cls: "bg-red-500/10 text-red-600 border-red-200",
  },
  marketing: {
    de: "Marketing-Aktion",
    en: "Marketing",
    cls: "bg-violet-500/10 text-violet-600 border-violet-200",
  },
  product: {
    de: "Neues Produkt",
    en: "New product",
    cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  event: {
    de: "Event",
    en: "Event",
    cls: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  policy: {
    de: "Richtlinie",
    en: "Policy",
    cls: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  ops: {
    de: "Betrieb",
    en: "Operations",
    cls: "bg-slate-500/10 text-slate-600 border-slate-200",
  },
};

const dayAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const HQ_NEWS: HQNewsItem[] = [
  {
    id: "n1",
    category: "urgent",
    titleDe: "Neues Happy Hour Konzept ab Freitag",
    titleEn: "New happy hour concept starting Friday",
    excerptDe:
      "Ab Freitag 17:00 gilt das neue HH-Konzept mit 2-für-1 auf alle Signature Cocktails. Bitte Personal briefen und Tafel-Aufsteller austauschen.",
    excerptEn:
      "From Friday 5pm the new HH concept applies with 2-for-1 on all signature cocktails. Brief staff and replace chalkboard stands.",
    bodyDe:
      "Alle Tafeln und QR-Codes liegen in der Lieferung an. Ablauf: Kunde bestellt, Bestätigung am POS via Button 'HH-2for1'. Kein Rabatt auf Spirituosen pur.",
    author: "Louis Kamppeter",
    authorRole: "Marketing & Active Ops",
    publishedAt: dayAgo(0),
    pinned: true,
    requiresAck: true,
    attachments: [
      { label: "HH-Briefing.pdf", url: "#" },
      { label: "Aufsteller-Druckdatei.pdf", url: "#" },
    ],
  },
  {
    id: "n2",
    category: "product",
    titleDe: "Sortiment: Neuer alkoholfreier Aperitif 'Bittero 0.0'",
    titleEn: "Range: new non-alcoholic aperitif 'Bittero 0.0'",
    excerptDe:
      "Ab nächster Lieferung im Sortiment. UVP 5,90 €. Rezeptkarten für Spritz-Variante folgen.",
    excerptEn:
      "Available with the next delivery. RRP €5.90. Recipe cards for the spritz variant follow.",
    author: "Felix Hartmann",
    authorRole: "Operations",
    publishedAt: dayAgo(1),
  },
  {
    id: "n3",
    category: "marketing",
    titleDe: "Instagram-Kampagne 'Cheers After 5'",
    titleEn: "Instagram campaign 'Cheers After 5'",
    excerptDe:
      "Reels-Vorlagen im Marketing Hub. Bitte 1× pro Woche posten und HQ verlinken.",
    excerptEn: "Reels templates in the Marketing Hub. Post once per week and tag HQ.",
    author: "Louis Kamppeter",
    authorRole: "Marketing & Active Ops",
    publishedAt: dayAgo(2),
  },
  {
    id: "n4",
    category: "event",
    titleDe: "Pub Quiz Finale am 28. — Anmeldung schließt heute",
    titleEn: "Pub quiz final on the 28th — sign-ups close today",
    excerptDe:
      "Filialen ohne Anmeldung verlieren ihren Slot. Bitte bis 18:00 im Event-Tool bestätigen.",
    excerptEn:
      "Branches without sign-up lose their slot. Confirm in the event tool by 6pm.",
    author: "Paul Karwinkel",
    authorRole: "Operations",
    publishedAt: dayAgo(2),
  },
  {
    id: "n5",
    category: "policy",
    titleDe: "Aktualisierte Hygienechecklisten (Q3)",
    titleEn: "Updated hygiene checklists (Q3)",
    excerptDe:
      "Neue Version 3.2 in der Academy. Bitte vor Freitag durchgehen und unterschreiben.",
    excerptEn:
      "New version 3.2 in the Academy. Review and sign before Friday.",
    author: "Tomasz Kaplanski",
    authorRole: "Facility",
    publishedAt: dayAgo(4),
    requiresAck: true,
  },
  {
    id: "n6",
    category: "ops",
    titleDe: "Lieferengpass Tonic Water — Alternative verfügbar",
    titleEn: "Tonic water shortage — alternative available",
    excerptDe:
      "Bis Ende des Monats bitte 'Crisp Mediterranean' als Standard verwenden. Preisbindung bleibt gleich.",
    excerptEn:
      "Until end of month please use 'Crisp Mediterranean' as default. Pricing unchanged.",
    author: "Paul Karwinkel",
    authorRole: "Operations",
    publishedAt: dayAgo(5),
  },
  {
    id: "n7",
    category: "marketing",
    titleDe: "Bierdeckel-Promo 'Bring a Friend'",
    titleEn: "Coaster promo 'Bring a Friend'",
    excerptDe:
      "Druckdateien & Briefing im Marketing Hub. Auslieferung kommende Woche.",
    excerptEn: "Print files and briefing in the Marketing Hub. Delivery next week.",
    author: "Louis Kamppeter",
    authorRole: "Marketing & Active Ops",
    publishedAt: dayAgo(7),
  },
  {
    id: "n8",
    category: "event",
    titleDe: "Live-Musik Lizenz für Außenflächen verlängert",
    titleEn: "Live music license for outdoor areas extended",
    excerptDe:
      "Akustische Acts bis 22:00 ohne Sondergenehmigung möglich. Beschallung bis 78 dB.",
    excerptEn:
      "Acoustic acts allowed until 10pm without special permit. Max 78 dB.",
    author: "Tomasz Kaplanski",
    authorRole: "Facility",
    publishedAt: dayAgo(9),
  },
];
