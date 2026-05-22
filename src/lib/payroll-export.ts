/**
 * P&I LogaHR Export
 * ------------------
 * Erzeugt CSVs, die die Supervista-Lohnbuchhaltung in P&I LogaHR
 * (Mandant Pub&Go) importieren kann.
 *
 * Wir liefern das **gängige P&I-LogaHR-Standardlayout**:
 *   - CSV mit Semikolon-Trenner
 *   - Windows-1252 (kompatibel mit deutschem Excel)
 *   - Deutsches Zahlenformat (Komma als Dezimaltrenner)
 *   - Datum: TT.MM.JJJJ
 *
 * Das **exakte Spalten-Mapping** muss in einem 15-Min-Termin mit der
 * Lohnbuchhaltung abgestimmt werden (jeder P&I-Mandant hat oft eine
 * eigene Import-Maske). Bis dahin dient diese Datei als technischer
 * Stub mit allen lohnrelevanten Feldern.
 */

import { supabase } from "@/integrations/supabase/client";

// ---------- Helpers ----------

const fmtDateDE = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}.${m}.${y}`;
};

const fmtNumDE = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  return n.toFixed(2).replace(".", ",");
};

const csvEscape = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const toCsv = (rows: (string | number | null | undefined)[][]): string => {
  return rows.map((r) => r.map(csvEscape).join(";")).join("\r\n") + "\r\n";
};

/** UTF-8 → Windows-1252-näherung: BOM + ersetze nicht-darstellbare Zeichen. */
const toCp1252Blob = (csv: string): Blob => {
  // Pragmatisch: UTF-8 mit BOM. Deutsches Excel öffnet das korrekt;
  // P&I akzeptiert i. d. R. auch UTF-8. Wenn die Lohnbuchhaltung CP1252
  // zwingend braucht, hier auf TextEncoder/iconv umstellen.
  const BOM = "\uFEFF";
  return new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---------- Stammdaten-Export ----------

export type StaffMasterRow = {
  id: string;
  personnel_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  address_street: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string | null;
  iban: string | null;
  bic: string | null;
  tax_id: string | null;
  social_security_number: string | null;
  health_insurance: string | null;
  tax_class: number | null;
  children_allowance: number | null;
  religion: string | null;
  contract_type: string | null;
  weekly_hours: number | null;
  hourly_wage: number | null;
  start_date: string | null;
  end_date: string | null;
  pub_id: string;
};

export const STAMMDATEN_HEADER = [
  "Personalnr",
  "Nachname",
  "Vorname",
  "Email",
  "Telefon",
  "Geburtsdatum",
  "Geburtsort",
  "Staatsangeh",
  "Strasse",
  "PLZ",
  "Ort",
  "Land",
  "IBAN",
  "BIC",
  "SteuerID",
  "SVNummer",
  "Krankenkasse",
  "Steuerklasse",
  "Kinderfreibetraege",
  "Konfession",
  "Vertragsart",
  "WochenStd",
  "Stundenlohn",
  "Eintritt",
  "Austritt",
  "Kostenstelle",
];

export function buildStammdatenCsv(
  rows: StaffMasterRow[],
  costCenterByPub: Record<string, string>,
): string {
  return toCsv([
    STAMMDATEN_HEADER,
    ...rows.map((r) => [
      r.personnel_number ?? "",
      r.last_name,
      r.first_name,
      r.email ?? "",
      r.phone ?? "",
      fmtDateDE(r.birth_date),
      r.birth_place ?? "",
      r.nationality ?? "",
      r.address_street ?? "",
      r.address_zip ?? "",
      r.address_city ?? "",
      r.address_country ?? "",
      r.iban ?? "",
      r.bic ?? "",
      r.tax_id ?? "",
      r.social_security_number ?? "",
      r.health_insurance ?? "",
      r.tax_class ?? "",
      fmtNumDE(r.children_allowance ?? 0),
      r.religion ?? "",
      r.contract_type ?? "",
      fmtNumDE(r.weekly_hours),
      fmtNumDE(r.hourly_wage),
      fmtDateDE(r.start_date),
      fmtDateDE(r.end_date),
      costCenterByPub[r.pub_id] ?? "",
    ]),
  ]);
}

export async function exportStammdaten(): Promise<{ count: number; missingFields: string[] }> {
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("active", true)
    .order("last_name");
  if (error) throw error;

  const { data: settings } = await supabase
    .from("pub_settings")
    .select("pub_id, cost_center_code");
  const costCenterByPub: Record<string, string> = {};
  for (const s of settings ?? []) {
    if (s.cost_center_code) costCenterByPub[s.pub_id] = s.cost_center_code;
  }

  const rows = (staff ?? []) as StaffMasterRow[];

  // Quick-Check: welche Felder fehlen flächendeckend?
  const missingFields: string[] = [];
  const check: (keyof StaffMasterRow)[] = [
    "personnel_number", "iban", "tax_id", "social_security_number",
    "health_insurance", "tax_class", "contract_type", "start_date",
  ];
  for (const f of check) {
    const missing = rows.filter((r) => !r[f]).length;
    if (missing > 0) missingFields.push(`${f} (${missing}/${rows.length})`);
  }

  const csv = buildStammdatenCsv(rows, costCenterByPub);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  triggerDownload(toCp1252Blob(csv), `PI_Stammdaten_PubGo_${today}.csv`);

  return { count: rows.length, missingFields };
}

// ---------- Monats-Stunden-Export ----------

export const STUNDEN_HEADER = [
  "Personalnr",
  "Datum",
  "Stunden",
  "Lohnart",
  "Kostenstelle",
];

/** Mapping shift-slot → Lohnart-Schlüssel (P&I-LogaHR Standard, anpassbar). */
const LOHNART_BY_SLOT: Record<string, string> = {
  early: "100", // Normalstunden
  late: "100",
  night: "110", // Nachtzuschlag
};
const LOHNART_SUNDAY = "120";
const LOHNART_HOLIDAY = "130";

function diffHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // overnight
  return Math.round((mins / 60) * 100) / 100;
}

export async function exportMonatsStunden(
  yearMonth: string, // "2026-05"
): Promise<{ count: number; totalHours: number; missingPersonnelNumbers: string[] }> {
  const [y, m] = yearMonth.split("-").map(Number);
  const from = `${yearMonth}-01`;
  const to = new Date(y, m, 0).toISOString().slice(0, 10); // last day

  const { data: shifts, error } = await supabase
    .from("shift_assignments")
    .select("staff_id, pub_id, date, slot, start_time, end_time")
    .gte("date", from)
    .lte("date", to)
    .order("date");
  if (error) throw error;

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, personnel_number, first_name, last_name");
  const staffMap: Record<string, { pn: string | null; name: string }> = {};
  for (const s of staff ?? []) {
    staffMap[s.id] = { pn: s.personnel_number, name: `${s.first_name} ${s.last_name}` };
  }

  const { data: settings } = await supabase
    .from("pub_settings")
    .select("pub_id, cost_center_code");
  const costCenterByPub: Record<string, string> = {};
  for (const s of settings ?? []) {
    if (s.cost_center_code) costCenterByPub[s.pub_id] = s.cost_center_code;
  }

  const missing = new Set<string>();
  const rows: (string | number)[][] = [STUNDEN_HEADER];
  let total = 0;

  for (const sh of shifts ?? []) {
    const info = staffMap[sh.staff_id];
    const pn = info?.pn;
    if (!pn) {
      if (info) missing.add(info.name);
      continue;
    }
    const hours = diffHours(sh.start_time, sh.end_time);
    total += hours;
    const dt = new Date(sh.date + "T00:00:00");
    const wd = dt.getDay(); // 0 = Sun
    const lohnart = wd === 0
      ? LOHNART_SUNDAY
      : LOHNART_BY_SLOT[sh.slot] ?? "100";
    rows.push([
      pn,
      fmtDateDE(sh.date),
      fmtNumDE(hours),
      lohnart,
      costCenterByPub[sh.pub_id] ?? "",
    ]);
    // (Feiertags-Erkennung optional in v2 – Lohnbuchhaltung kennzeichnet diese
    // meist selbst nach DE-Feiertagskalender.)
  }
  void LOHNART_HOLIDAY;

  const csv = toCsv(rows);
  triggerDownload(toCp1252Blob(csv), `PI_Stunden_PubGo_${yearMonth}.csv`);

  return {
    count: rows.length - 1,
    totalHours: Math.round(total * 10) / 10,
    missingPersonnelNumbers: [...missing],
  };
}
