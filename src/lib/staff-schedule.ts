import { supabase } from "@/integrations/supabase/client";

export type ShiftSlot = "early" | "late" | "night";

export const SHIFT_SLOT_TONE: Record<ShiftSlot, string> = {
  early: "bg-amber-500/15 text-amber-700 border-amber-300",
  late:  "bg-sky-500/15 text-sky-700 border-sky-300",
  night: "bg-violet-500/15 text-violet-700 border-violet-300",
};

/** @deprecated Use SHIFT_SLOT_TONE + t("staff.slots.<slot>") instead. */
export const SHIFT_SLOT_META: Record<ShiftSlot, { label: string; tone: string }> = {
  early: { label: "Früh",  tone: SHIFT_SLOT_TONE.early },
  late:  { label: "Spät",  tone: SHIFT_SLOT_TONE.late  },
  night: { label: "Nacht", tone: SHIFT_SLOT_TONE.night },
};

export const SHIFT_SLOTS: ShiftSlot[] = ["early", "late", "night"];


// ---------- Pub opening hours → slot defaults ----------
export type PubHours = { opening: number; closing: number };

export const DEFAULT_PUB_HOURS: PubHours = { opening: 17, closing: 24 };

export async function getPubHours(pubId: string): Promise<PubHours> {
  const { data, error } = await supabase
    .from("pub_settings")
    .select("opening_hour, closing_hour, month")
    .eq("pub_id", pubId)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_PUB_HOURS;
  return { opening: data.opening_hour ?? 17, closing: data.closing_hour ?? 24 };
}

const fmtHour = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;

/** Compute per-slot default start/end times from the pub's opening hours. */
export function slotDefaults(hours: PubHours): Record<ShiftSlot, { start: string; end: string }> {
  const open = hours.opening;
  const closeRaw = hours.closing;
  // Normalize: if closing <= opening, treat as next day (e.g. open 17, close 4 → 28)
  const close = closeRaw <= open ? closeRaw + 24 : closeRaw;
  const dur = close - open;
  const mid = open + Math.ceil(dur / 2);
  return {
    early: { start: fmtHour(open), end: fmtHour(mid) },
    late:  { start: fmtHour(mid),  end: fmtHour(close) },
    night: dur > 6
      ? { start: fmtHour(Math.max(open, close - 4)), end: fmtHour(close) }
      : { start: fmtHour(open), end: fmtHour(close) },
  };
}

export function formatPubHours(hours: PubHours): string {
  return `${fmtHour(hours.opening)} – ${fmtHour(hours.closing)} Uhr`;
}

/** Returns true if start/end fall within (or exactly match) the pub's opening window. */
export function isWithinPubHours(start: string, end: string, hours: PubHours): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const openMin = hours.opening * 60;
  const closeMin = (hours.closing <= hours.opening ? hours.closing + 24 : hours.closing) * 60;
  let s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 24 * 60; // overnight shift
  return s >= openMin && e <= closeMin;
}

export const STAFF_ROLES = ["Bar", "Service", "Küche", "Floor"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffMember = {
  id: string;
  pub_id: string;
  first_name: string;
  last_name: string;
  role: string;
  active: boolean;
  pi_external_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ShiftAssignment = {
  id: string;
  pub_id: string;
  staff_id: string;
  date: string;       // YYYY-MM-DD
  slot: ShiftSlot;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  note: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- Week helpers ----------
/** Monday of the ISO week containing `d`, as YYYY-MM-DD. */
export function weekStartISO(d: Date = new Date()): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
}

export function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isoWeekNumber(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

export function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // overnight (e.g. night shift)
  return Math.round((mins / 60) * 10) / 10;
}

// ---------- Staff ----------
export async function listStaff(pubId: string, opts: { includeInactive?: boolean } = {}): Promise<StaffMember[]> {
  let q = supabase.from("staff_members").select("*").eq("pub_id", pubId).order("first_name");
  if (!opts.includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as StaffMember[];
}

export async function upsertStaff(s: Partial<StaffMember> & { pub_id: string }): Promise<StaffMember> {
  const payload = {
    pub_id: s.pub_id,
    first_name: s.first_name ?? "",
    last_name: s.last_name ?? "",
    role: s.role ?? "Bar",
    active: s.active ?? true,
    pi_external_id: s.pi_external_id ?? null,
  };
  if (s.id) {
    const { data, error } = await supabase.from("staff_members").update(payload).eq("id", s.id).select().single();
    if (error) throw error;
    return data as StaffMember;
  }
  const { data, error } = await supabase.from("staff_members").insert(payload).select().single();
  if (error) throw error;
  return data as StaffMember;
}

export async function setStaffActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("staff_members").update({ active }).eq("id", id);
  if (error) throw error;
}

// ---------- Shifts ----------
export async function listShifts(pubId: string, weekStart: string): Promise<ShiftAssignment[]> {
  const weekEnd = addDaysISO(weekStart, 6);
  const { data, error } = await supabase
    .from("shift_assignments")
    .select("*")
    .eq("pub_id", pubId)
    .gte("date", weekStart)
    .lte("date", weekEnd);
  if (error) throw error;
  return (data ?? []) as ShiftAssignment[];
}

export async function listAllShifts(weekStart: string): Promise<ShiftAssignment[]> {
  const weekEnd = addDaysISO(weekStart, 6);
  const { data, error } = await supabase
    .from("shift_assignments")
    .select("*")
    .gte("date", weekStart)
    .lte("date", weekEnd);
  if (error) throw error;
  return (data ?? []) as ShiftAssignment[];
}

export async function upsertShift(s: {
  id?: string;
  pub_id: string;
  staff_id: string;
  date: string;
  slot: ShiftSlot;
  start_time: string;
  end_time: string;
  note?: string | null;
}): Promise<ShiftAssignment> {
  const payload = {
    pub_id: s.pub_id,
    staff_id: s.staff_id,
    date: s.date,
    slot: s.slot,
    start_time: s.start_time,
    end_time: s.end_time,
    note: s.note ?? null,
  };
  if (s.id) {
    const { data, error } = await supabase.from("shift_assignments").update(payload).eq("id", s.id).select().single();
    if (error) throw error;
    return data as ShiftAssignment;
  }
  const { data, error } = await supabase
    .from("shift_assignments")
    .upsert(payload, { onConflict: "staff_id,date,slot" })
    .select()
    .single();
  if (error) throw error;
  return data as ShiftAssignment;
}

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase.from("shift_assignments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- P&I sync stub ----------
/** Placeholder: später echte Mitarbeiter-Synchronisierung aus P&I LogaHR. */
export async function syncStaffFromPI(_pubId: string): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "P&I-Sync ist noch nicht aktiv. Bitte Mitarbeiter manuell pflegen." };
}
