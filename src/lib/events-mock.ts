// Event-Ergebnisse über alle Filialen aggregiert.
// Basis: 14-Tage-Programm aus der Pub & Go App (events-data.ts).
// Pro Pub stehen 18 Tische mit 6×2 + 8×4 + 4×6 = 68 Plätzen zur Verfügung.

import { PUBS } from "./pubs-mock";

export type EventTag = "Sport" | "Party" | "Chill" | "Themenabend" | "LiveAct";

export type EventResult = {
  id: string;
  title: string;
  emoji: string;
  tag: EventTag;
  date: string;             // YYYY-MM-DD (vergangener Lauf)
  seatsBooked: number;      // Gesamt-Buchungen über alle Filialen
  seatsAvailable: number;   // Plätze * Filialen
  bookingRatio: number;     // %
  revenue: number;          // € gesamt (Bons während des Events)
  spendPerSeat: number;     // € je Gast
  score: number;            // 0–100 — gewichtet aus Booking-Ratio und Umsatz
  recommendation: "wiederholen" | "optimieren" | "austauschen";
};

const SEATS_PER_PUB = 68;
const TOTAL_SEATS = SEATS_PER_PUB * PUBS.length; // 544

// 14 Events (Ruhetage ausgeklammert). Werte sind deterministische Mocks
// für den letzten 14-Tage-Zyklus — entsprechen "tatsächlich gelaufen".
type Seed = {
  id: string; title: string; emoji: string; tag: EventTag;
  daysAgo: number;
  fillRate: number;     // 0..1 — wie voll waren die Pubs
  spendPerSeat: number; // € je Gast
};

const SEEDS: Seed[] = [
  { id: "ev-malle",        title: "Malle-Party (Feiertag)",       emoji: "🌴", tag: "Party",       daysAgo: 1,  fillRate: 0.96, spendPerSeat: 28 },
  { id: "ev-bvb",          title: "BVB-Freitag & One-Hit-Wonder", emoji: "⚽", tag: "Sport",       daysAgo: 4,  fillRate: 0.92, spendPerSeat: 26 },
  { id: "ev-quiz",         title: "Pub Quiz – Ballermann",        emoji: "🎤", tag: "Themenabend", daysAgo: 2,  fillRate: 0.88, spendPerSeat: 24 },
  { id: "ev-bayern",       title: "FC Bayern-Tag & Trash-Pop",    emoji: "🏟️", tag: "Sport",       daysAgo: 3,  fillRate: 0.85, spendPerSeat: 25 },
  { id: "ev-retro",        title: "80s/90s Retro-Nacht",          emoji: "📼", tag: "Party",       daysAgo: 6,  fillRate: 0.83, spendPerSeat: 23 },
  { id: "ev-irish",        title: "Irish Pub Nacht",              emoji: "☘️", tag: "Party",       daysAgo: 8,  fillRate: 0.78, spendPerSeat: 24 },
  { id: "ev-darts",        title: "Darts Premier League",         emoji: "🎯", tag: "Sport",       daysAgo: 5,  fillRate: 0.74, spendPerSeat: 22 },
  { id: "ev-local-heroes", title: "Local Heroes Unplugged",       emoji: "🎸", tag: "LiveAct",     daysAgo: 9,  fillRate: 0.70, spendPerSeat: 21 },
  { id: "ev-rock",         title: "Rock am Tresen",               emoji: "🎸", tag: "Themenabend", daysAgo: 10, fillRate: 0.62, spendPerSeat: 19 },
  { id: "ev-tatort",       title: "Sunday Chill & Tatort",        emoji: "🕵️", tag: "Chill",       daysAgo: 7,  fillRate: 0.58, spendPerSeat: 17 },
  { id: "ev-premier",      title: "Premier League & Tatort",      emoji: "🏴", tag: "Sport",       daysAgo: 0,  fillRate: 0.55, spendPerSeat: 18 },
  { id: "ev-schlager",     title: "Schlager-Nacht",               emoji: "🎤", tag: "Party",       daysAgo: 11, fillRate: 0.52, spendPerSeat: 18 },
  { id: "ev-afterwork-1",  title: "After-Work Chill",             emoji: "🛋️", tag: "Chill",       daysAgo: 12, fillRate: 0.48, spendPerSeat: 15 },
  { id: "ev-afterwork-2",  title: "After-Work Chill (Wo. 2)",     emoji: "🛋️", tag: "Chill",       daysAgo: 13, fillRate: 0.41, spendPerSeat: 14 },
];

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildResults(): EventResult[] {
  const results: Omit<EventResult, "score" | "recommendation">[] = SEEDS.map((s) => {
    const seatsBooked = Math.round(TOTAL_SEATS * s.fillRate);
    const revenue = Math.round(seatsBooked * s.spendPerSeat);
    return {
      id: s.id, title: s.title, emoji: s.emoji, tag: s.tag,
      date: dateNDaysAgo(s.daysAgo),
      seatsBooked,
      seatsAvailable: TOTAL_SEATS,
      bookingRatio: Math.round((seatsBooked / TOTAL_SEATS) * 100),
      revenue,
      spendPerSeat: s.spendPerSeat,
    };
  });

  // Score: 50 % Booking-Ratio + 50 % Umsatz-Index (relativ zum Top-Event)
  const maxRevenue = Math.max(...results.map((r) => r.revenue));
  return results.map((r) => {
    const revenueIndex = Math.round((r.revenue / maxRevenue) * 100);
    const score = Math.round(r.bookingRatio * 0.5 + revenueIndex * 0.5);
    const recommendation: EventResult["recommendation"] =
      score >= 80 ? "wiederholen" : score >= 60 ? "optimieren" : "austauschen";
    return { ...r, score, recommendation };
  }).sort((a, b) => b.score - a.score);
}

export const EVENT_RESULTS: EventResult[] = buildResults();

export const EVENT_TOTALS = {
  events: EVENT_RESULTS.length,
  seatsAvailable: EVENT_RESULTS.reduce((s, e) => s + e.seatsAvailable, 0),
  seatsBooked: EVENT_RESULTS.reduce((s, e) => s + e.seatsBooked, 0),
  revenue: EVENT_RESULTS.reduce((s, e) => s + e.revenue, 0),
  get avgBookingRatio() {
    return Math.round((this.seatsBooked / this.seatsAvailable) * 100);
  },
  get avgScore() {
    return Math.round(EVENT_RESULTS.reduce((s, e) => s + e.score, 0) / EVENT_RESULTS.length);
  },
};

export const formatEventDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "short", day: "2-digit", month: "short",
  });
