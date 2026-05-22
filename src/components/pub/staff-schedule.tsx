import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Users } from "lucide-react";
import {
  STAFF_ROLES, SHIFT_SLOTS, SHIFT_SLOT_META, DEFAULT_PUB_HOURS,
  addDaysISO, formatPubHours, getPubHours, isoWeekNumber, isWithinPubHours,
  listShifts, listStaff, setStaffActive, shiftHours, slotDefaults,
  toISODate, upsertShift, upsertStaff, weekDays, weekStartISO,
  type PubHours, type ShiftAssignment, type ShiftSlot, type StaffMember,
} from "@/lib/staff-schedule";

const WEEKDAY_LABEL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function StaffSchedule({ pubId, pubName }: { pubId: string; pubName: string }) {
  const [weekStart, setWeekStart] = useState(() => weekStartISO());
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [hours, setHours] = useState<PubHours>(DEFAULT_PUB_HOURS);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<{
    staff: StaffMember; date: string; slot: ShiftSlot; existing?: ShiftAssignment;
  } | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const week = isoWeekNumber(weekStart);
  const weekEndDate = new Date(addDaysISO(weekStart, 6) + "T00:00:00");

  async function reload() {
    setLoading(true);
    try {
      const [s, sh, h] = await Promise.all([
        listStaff(pubId),
        listShifts(pubId, weekStart),
        getPubHours(pubId),
      ]);
      setStaff(s);
      setShifts(sh);
      setHours(h);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pubId, weekStart]);

  function getShift(staffId: string, date: string, slot: ShiftSlot): ShiftAssignment | undefined {
    return shifts.find((x) => x.staff_id === staffId && x.date === date && x.slot === slot);
  }

  const dailyHours = useMemo(() => {
    return days.map((d) => {
      const total = shifts
        .filter((s) => s.date === d)
        .reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0);
      return Math.round(total * 10) / 10;
    });
  }, [days, shifts]);

  const weekTotal = Math.round(dailyHours.reduce((a, b) => a + b, 0) * 10) / 10;

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Personalplan · {pubName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                KW {week} · {formatRange(weekStart, weekEndDate)} · {staff.length} aktive Mitarbeiter
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(weekStartISO())}>Heute</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setManageOpen(true)}>
                <Users className="h-4 w-4 mr-1.5" /> Mitarbeiter
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : staff.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Noch keine Mitarbeiter gepflegt. Über „Mitarbeiter" anlegen oder später aus P&I synchronisieren.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="text-left font-medium px-3 py-2 sticky left-0 bg-muted/40 min-w-[180px]">Mitarbeiter</th>
                  {days.map((d, i) => {
                    const date = new Date(d + "T00:00:00");
                    const isToday = d === toISODate(new Date());
                    return (
                      <th key={d} className={`text-left font-medium px-2 py-2 min-w-[140px] ${isToday ? "text-primary" : ""}`}>
                        <div>{WEEKDAY_LABEL[i]}</div>
                        <div className="text-[10px] text-muted-foreground normal-case">
                          {date.getDate()}.{date.getMonth() + 1}.
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2 sticky left-0 bg-card">
                      <div className="font-medium">{m.first_name} {m.last_name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.role}</div>
                    </td>
                    {days.map((d) => (
                      <td key={d} className="px-2 py-2 align-top border-l">
                        <div className="space-y-1">
                          {SHIFT_SLOTS.map((slot) => {
                            const existing = getShift(m.id, d, slot);
                            const meta = SHIFT_SLOT_META[slot];
                            if (!existing) {
                              return (
                                <button
                                  key={slot}
                                  onClick={() => setEditor({ staff: m, date: d, slot })}
                                  className="w-full text-left text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded px-1.5 py-1 flex items-center gap-1"
                                >
                                  <Plus className="h-2.5 w-2.5" /> {meta.label}
                                </button>
                              );
                            }
                            return (
                              <button
                                key={slot}
                                onClick={() => setEditor({ staff: m, date: d, slot, existing })}
                                className={`w-full text-left text-[11px] rounded border px-1.5 py-1 ${meta.tone} hover:opacity-80`}
                                title={existing.note ?? undefined}
                              >
                                <span className="font-semibold">{meta.label}</span>
                                <span className="ml-1">{fmtTime(existing.start_time)}–{fmtTime(existing.end_time)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t bg-muted/30 text-xs font-medium">
                  <td className="px-3 py-2 sticky left-0 bg-muted/30">Stunden gesamt</td>
                  {dailyHours.map((h, i) => (
                    <td key={i} className="px-2 py-2 border-l tabular-nums">{h.toFixed(1)} h</td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {staff.length > 0 && !loading && (
        <div className="text-xs text-muted-foreground text-right">
          Wochensumme: <span className="font-semibold text-foreground tabular-nums">{weekTotal.toFixed(1)} Std.</span>
        </div>
      )}

      {/* Shift editor */}
      {editor && (
        <ShiftEditorDialog
          editor={editor}
          pubId={pubId}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); void reload(); }}
        />
      )}

      {/* Staff manager */}
      <StaffManagerDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        pubId={pubId}
        onChanged={reload}
      />
    </div>
  );
}

// -------------------- Editor --------------------
function ShiftEditorDialog({
  editor, pubId, onClose, onSaved,
}: {
  editor: { staff: StaffMember; date: string; slot: ShiftSlot; existing?: ShiftAssignment };
  pubId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const meta = SHIFT_SLOT_META[editor.slot];
  const [slot, setSlot] = useState<ShiftSlot>(editor.slot);
  const [start, setStart] = useState(editor.existing ? fmtTime(editor.existing.start_time) : meta.defaultStart);
  const [end, setEnd] = useState(editor.existing ? fmtTime(editor.existing.end_time) : meta.defaultEnd);
  const [note, setNote] = useState(editor.existing?.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editor.existing) {
      const m = SHIFT_SLOT_META[slot];
      setStart(m.defaultStart);
      setEnd(m.defaultEnd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  async function save() {
    setSaving(true);
    try {
      await upsertShift({
        id: editor.existing?.id,
        pub_id: pubId,
        staff_id: editor.staff.id,
        date: editor.date,
        slot,
        start_time: start + ":00",
        end_time: end + ":00",
        note: note.trim() || null,
      });
      toast.success("Schicht gespeichert");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editor.existing) return;
    setSaving(true);
    try {
      const { deleteShift } = await import("@/lib/staff-schedule");
      await deleteShift(editor.existing.id);
      toast.success("Schicht entfernt");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Löschen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editor.existing ? "Schicht bearbeiten" : "Schicht hinzufügen"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm">
            <div className="font-medium">{editor.staff.first_name} {editor.staff.last_name}</div>
            <div className="text-muted-foreground text-xs">{editor.staff.role} · {formatDateLong(editor.date)}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <Label className="text-xs">Slot</Label>
              <Select value={slot} onValueChange={(v) => setSlot(v as ShiftSlot)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHIFT_SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>{SHIFT_SLOT_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Von</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Bis</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="flex items-end text-xs text-muted-foreground">
              ≈ {shiftHours(start + ":00", end + ":00").toFixed(1)} h
            </div>
          </div>
          <div>
            <Label className="text-xs">Notiz (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {editor.existing && (
            <Button variant="destructive" onClick={remove} disabled={saving} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-1.5" /> Löschen
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={saving}>Abbrechen</Button>
          <Button onClick={save} disabled={saving}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------- Staff manager --------------------
function StaffManagerDialog({
  open, onOpenChange, pubId, onChanged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pubId: string;
  onChanged: () => void;
}) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [role, setRole] = useState<string>("Bar");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const s = await listStaff(pubId, { includeInactive: true });
      setStaff(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, pubId]);

  async function add() {
    if (!first.trim() || !last.trim()) {
      toast.error("Bitte Vor- und Nachname angeben");
      return;
    }
    setSaving(true);
    try {
      await upsertStaff({ pub_id: pubId, first_name: first.trim(), last_name: last.trim(), role });
      setFirst(""); setLast(""); setRole("Bar");
      await reload();
      onChanged();
      toast.success("Mitarbeiter hinzugefügt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(m: StaffMember) {
    try {
      await setStaffActive(m.id, !m.active);
      await reload();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mitarbeiter verwalten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border p-3 bg-muted/30 text-xs text-muted-foreground">
            Mitarbeiterstammdaten werden später automatisch aus P&I LogaHR übernommen. Aktuell manuelle Pflege.
          </div>

          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <Label className="text-xs">Vorname</Label>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Lena" />
            </div>
            <div className="col-span-4">
              <Label className="text-xs">Nachname</Label>
              <Input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Hofbauer" />
            </div>
            <div className="col-span-3">
              <Label className="text-xs">Rolle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Button onClick={add} disabled={saving} className="w-full"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Lade…</div>
            ) : staff.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Noch keine Mitarbeiter.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {staff.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{m.first_name} {m.last_name}</div>
                        <div className="text-[11px] text-muted-foreground">{m.role}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {m.active ? (
                          <Badge variant="secondary">Aktiv</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Inaktiv</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggle(m)}>
                          {m.active ? "Deaktivieren" : "Aktivieren"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------- helpers --------------------
function fmtTime(t: string): string {
  return t.slice(0, 5);
}
function formatRange(startISO: string, endDate: Date): string {
  const s = new Date(startISO + "T00:00:00");
  return `${s.getDate()}.${s.getMonth() + 1}. – ${endDate.getDate()}.${endDate.getMonth() + 1}.${endDate.getFullYear()}`;
}
function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}
