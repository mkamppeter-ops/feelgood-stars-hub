import { PUBS } from "./pubs-mock";

export type VacationStatus = "pending" | "approved" | "rejected";

export interface ShiftSummary {
  pubId: string;
  weekTargetHours: number;
  weekActualHours: number;
  staffCount: number;
  openShifts: number; // unbesetzte Schichten in dieser Woche
}

export interface VacationRequest {
  id: string;
  pubId: string;
  employee: string;
  from: string; // dd.mm.
  to: string;   // dd.mm.
  days: number;
  status: VacationStatus;
  reasonDe?: string;
  reasonEn?: string;
}

export interface SickLeave {
  id: string;
  pubId: string;
  employee: string;
  from: string;
  days: number;
  active: boolean; // ob heute noch krank
}

export interface PubSickStats {
  pubId: string;
  sickDaysMonth: number;
  staffCount: number;
  /** Anteil Krankheitstage im Monat (0–100) */
  ratePct: number;
}

// Crewmeister-Style Mitarbeiter-Stammdaten
export type EmploymentType = "fulltime" | "parttime" | "minijob" | "student";
export interface Employee {
  id: string;
  pubId: string;
  name: string;
  role: string; // Bartender, Kellner, Shift Lead, Küche
  employment: EmploymentType;
  contractHoursWeek: number; // Sollstunden pro Woche
  /** Vertragsstundensaldo in h, positiv = Überstunden, negativ = Minus */
  balanceHours: number;
  vacationTotalDays: number;
  vacationUsedDays: number;
  sickDaysYear: number;
  avgWorkedHoursWeek: number; // tatsächlich gearbeitet im Schnitt / Woche
  /** E.164 phone number for call / WhatsApp deep links */
  phone: string;
  /** true if this employee is the bar manager of the pub */
  isManager?: boolean;
}

// Schicht-Übersicht je Pub
export const SHIFT_SUMMARY: ShiftSummary[] = PUBS.map((p, i) => {
  const staff = 6 + (i % 4);
  const target = staff * 32; // 32h pro Mitarbeiter / Woche im Schnitt
  const variance = [0.96, 1.02, 0.91, 1.0, 0.88, 0.97, 1.05, 0.93][i] ?? 1;
  return {
    pubId: p.id,
    weekTargetHours: target,
    weekActualHours: Math.round(target * variance),
    staffCount: staff,
    openShifts: [0, 1, 3, 0, 2, 1, 4, 2][i] ?? 0,
  };
});

const FIRSTS = ["Lisa", "Tom", "Sarah", "Markus", "Jana", "Felix", "Mira", "Paul", "Nora", "Jonas"];
const LASTS = ["M.", "B.", "L.", "K.", "W.", "S.", "T.", "H.", "F.", "R."];
const name = (n: number) => `${FIRSTS[n % FIRSTS.length]} ${LASTS[(n * 3) % LASTS.length]}`;

export const VACATION_REQUESTS: VacationRequest[] = [
  { id: "v1", pubId: PUBS[0].id, employee: name(0), from: "12.06.", to: "18.06.", days: 7, status: "pending", reasonDe: "Familienurlaub", reasonEn: "Family vacation" },
  { id: "v2", pubId: PUBS[1].id, employee: name(1), from: "20.06.", to: "27.06.", days: 8, status: "pending" },
  { id: "v3", pubId: PUBS[2].id, employee: name(2), from: "05.07.", to: "12.07.", days: 8, status: "pending", reasonDe: "Hochzeit", reasonEn: "Wedding" },
  { id: "v4", pubId: PUBS[0].id, employee: name(3), from: "01.08.", to: "14.08.", days: 14, status: "pending" },
  { id: "v5", pubId: PUBS[4].id, employee: name(4), from: "10.06.", to: "13.06.", days: 4, status: "pending" },
  { id: "v6", pubId: PUBS[1].id, employee: name(5), from: "02.05.", to: "05.05.", days: 4, status: "approved" },
  { id: "v7", pubId: PUBS[3].id, employee: name(6), from: "15.04.", to: "22.04.", days: 8, status: "approved" },
  { id: "v8", pubId: PUBS[5].id, employee: name(7), from: "28.03.", to: "01.04.", days: 5, status: "rejected", reasonDe: "Saisonale Spitze", reasonEn: "Seasonal peak" },
];

export const SICK_LEAVES: SickLeave[] = [
  { id: "s1", pubId: PUBS[0].id, employee: name(8), from: "heute", days: 1, active: true },
  { id: "s2", pubId: PUBS[2].id, employee: name(9), from: "gestern", days: 2, active: true },
  { id: "s3", pubId: PUBS[6].id, employee: name(1), from: "heute", days: 1, active: true },
  { id: "s4", pubId: PUBS[1].id, employee: name(4), from: "vor 3 Tagen", days: 3, active: false },
  { id: "s5", pubId: PUBS[4].id, employee: name(7), from: "vor 4 Tagen", days: 2, active: false },
  { id: "s6", pubId: PUBS[0].id, employee: name(2), from: "vor 6 Tagen", days: 1, active: false },
];

export const SICK_STATS: PubSickStats[] = PUBS.map((p, i) => {
  const staff = SHIFT_SUMMARY[i].staffCount;
  const sickDays = [4, 9, 6, 3, 18, 5, 11, 7][i] ?? 4;
  const monthWorkdays = staff * 22;
  return {
    pubId: p.id,
    staffCount: staff,
    sickDaysMonth: sickDays,
    ratePct: +((sickDays / monthWorkdays) * 100).toFixed(1),
  };
});

// Synthetic employee roster across all pubs
const ROLES = ["Bartender", "Kellner:in", "Shift Lead", "Küche", "Barista"];
const EMPLOYMENTS: EmploymentType[] = ["fulltime", "parttime", "minijob", "student"];

export const EMPLOYEES: Employee[] = (() => {
  const list: Employee[] = [];
  let idx = 0;
  PUBS.forEach((pub, pi) => {
    const count = SHIFT_SUMMARY[pi].staffCount;
    for (let i = 0; i < count; i++) {
      const seed = pi * 13 + i * 7 + 3;
      const emp = EMPLOYMENTS[seed % EMPLOYMENTS.length];
      const contract =
        emp === "fulltime" ? 40 : emp === "parttime" ? 25 : emp === "minijob" ? 10 : 16;
      // deterministic pseudo random
      const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
      const balance = +(r(1) * 30 - 8).toFixed(1); // -8h ... +22h
      const vacationTotal = emp === "fulltime" ? 28 : emp === "parttime" ? 24 : 20;
      const vacationUsed = Math.round(r(2) * vacationTotal * 0.7);
      const sickDays = Math.round(r(3) * 9);
      const avgWorked = +(contract + (balance / 4)).toFixed(1);
      list.push({
        id: `emp-${pi}-${i}`,
        pubId: pub.id,
        name: name(idx++),
        role: ROLES[seed % ROLES.length],
        employment: emp,
        contractHoursWeek: contract,
        balanceHours: balance,
        vacationTotalDays: vacationTotal,
        vacationUsedDays: vacationUsed,
        sickDaysYear: sickDays,
        avgWorkedHoursWeek: avgWorked,
      });
    }
  });
  return list;
})();


export function getPubName(pubId: string): string {
  return PUBS.find((p) => p.id === pubId)?.name ?? pubId;
}
