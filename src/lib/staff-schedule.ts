import { supabase } from "@/integrations/supabase/client";

export type ShiftSlot = "early" | "late" | "night";

export const SHIFT_SLOT_META: Record<
  ShiftSlot,
  { label: string; defaultStart: string; defaultEnd: string; tone: string }
> = {
  early: { label: "Früh",  defaultStart: "10:00", defaultEnd: "17:00", tone: "bg-amber-500/15 text-amber-700 border-amber-300" },
  late:  { label: "Spät",  defaultStart: "17:00", defaultEnd: "24:00", tone: "bg-sky-500/15 text-sky-700 border-sky-300" },
  night: { label: "Nacht", defaultStart: "22:00", defaultEnd: "04:00", tone: "bg-violet-500/15 text-violet-700 border-violet-300" },
};

export const SHIFT_SLOTS: ShiftSlot[] = ["early", "late", "night"];

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
