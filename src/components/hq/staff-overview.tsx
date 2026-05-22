import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle, UserPlus, Pencil } from "lucide-react";
import { PersonalakteSheet } from "@/components/hq/staff-personalakte";
import { PUBS } from "@/lib/pubs-mock";
import { supabase } from "@/integrations/supabase/client";
import {
  addDaysISO, isoWeekNumber, listAllShifts, SHIFT_SLOT_TONE, SHIFT_SLOTS,
  shiftHours, toISODate, weekDays, weekStartISO,
  type ShiftAssignment, type ShiftSlot, type StaffMember,
} from "@/lib/staff-schedule";

const WEEKDAY_LABEL_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_LABEL_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StaffOverview() {
  const { t, i18n } = useTranslation();
  const isEN = (i18n.resolvedLanguage || "de").toLowerCase().startsWith("en");
  const weekdayLabels = isEN ? WEEKDAY_LABEL_EN : WEEKDAY_LABEL_DE;

  const [weekStart, setWeekStart] = useState(() => weekStartISO());
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember>>({});
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState<{ pubId: string; date: string } | null>(null);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openNew = () => { setEditStaffId(null); setSheetOpen(true); };
  const openEdit = (id: string) => { setEditStaffId(id); setSheetOpen(true); };

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const week = isoWeekNumber(weekStart);

  async function reload() {
    setLoading(true);
    try {
      const [sh, staffRes] = await Promise.all([
        listAllShifts(weekStart),
        supabase.from("staff_members").select("*"),
      ]);
      if (staffRes.error) throw staffRes.error;
      const map: Record<string, StaffMember> = {};
      for (const s of (staffRes.data ?? []) as StaffMember[]) map[s.id] = s;
      setStaffMap(map);
      setShifts(sh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("staff.editor.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [weekStart]);

  const totalShifts = shifts.length;
  const totalHours = useMemo(
    () => Math.round(shifts.reduce((s, x) => s + shiftHours(x.start_time, x.end_time), 0) * 10) / 10,
    [shifts],
  );
  const pubsWithoutPlan = useMemo(() => {
    const planned = new Set(shifts.map((s) => s.pub_id));
    return PUBS.filter((p) => !planned.has(p.id));
  }, [shifts]);

  function cell(pubId: string, date: string) {
    const list = shifts.filter((s) => s.pub_id === pubId && s.date === date);
    const hours = list.reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0);
    return { count: list.length, hours: Math.round(hours * 10) / 10, list };
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {t("staff.overviewTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {t("staff.weekShort")} {week} · {t("staff.overviewSub")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(weekStartISO())}>
                {t("staff.today")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label={t("staff.shiftsUnit", { count: totalShifts })} value={totalShifts.toString()} />
        <Kpi label={t("staff.hoursTotal")} value={`${totalHours.toFixed(1)} ${t("staff.hoursUnit")}`} />
        <Kpi label={t("staff.pubsPlanned")} value={`${PUBS.length - pubsWithoutPlan.length} / ${PUBS.length}`} />
        <Kpi
          label={t("staff.withoutPlan")}
          value={pubsWithoutPlan.length.toString()}
          tone={pubsWithoutPlan.length > 0 ? "amber" : undefined}
        />
      </div>

      {pubsWithoutPlan.length > 0 && (
        <Card className="border-amber-300/60 bg-amber-50/40">
          <CardContent className="p-3 flex items-start gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-amber-800">{t("staff.pubsWithoutPlanIn", { week })}</span>{" "}
              <span className="text-amber-900">{pubsWithoutPlan.map((p) => p.name).join(", ")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalakten */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Personalakten</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stammdaten, Vertrag, Steuer/Bank — Quelle für den P&amp;I-Lohnexport an Supervista.
            </p>
          </div>
          <Button size="sm" onClick={openNew}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Neuer Mitarbeiter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[280px] overflow-y-auto divide-y">
            {Object.values(staffMap).length === 0 && !loading && (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                Noch keine Mitarbeiter angelegt. Klicke auf „Neuer Mitarbeiter" um zu starten.
              </div>
            )}
            {Object.values(staffMap)
              .sort((a, b) => a.last_name.localeCompare(b.last_name))
              .map((s) => {
                const pub = PUBS.find((p) => p.id === s.pub_id);
                return (
                  <button
                    key={s.id}
                    onClick={() => openEdit(s.id)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/40 text-left text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {s.last_name}, {s.first_name}
                        {!s.active && (
                          <Badge variant="outline" className="ml-2 text-[10px]">inaktiv</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.role} · {pub?.name ?? s.pub_id}
                        {s.pi_external_id ? ` · #${s.pi_external_id}` : ""}
                      </div>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                );
              })}
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="text-left font-medium px-3 py-2 sticky left-0 bg-muted/40 min-w-[180px]">{t("staff.pub")}</th>
                  {days.map((d, i) => {
                    const date = new Date(d + "T00:00:00");
                    const isToday = d === toISODate(new Date());
                    return (
                      <th key={d} className={`text-left font-medium px-2 py-2 min-w-[100px] ${isToday ? "text-primary" : ""}`}>
                        <div>{weekdayLabels[i]}</div>
                        <div className="text-[10px] text-muted-foreground normal-case">
                          {date.getDate()}.{date.getMonth() + 1}.
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-right font-medium px-3 py-2">Σ</th>
                </tr>
              </thead>
              <tbody>
                {PUBS.map((p) => {
                  const cells = days.map((d) => cell(p.id, d));
                  const pubTotal = Math.round(cells.reduce((s, c) => s + c.hours, 0) * 10) / 10;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2 sticky left-0 bg-card">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.city}</div>
                      </td>
                      {days.map((d, i) => {
                        const c = cells[i];
                        const empty = c.count === 0;
                        return (
                          <td key={d} className="px-2 py-2 border-l">
                            <button
                              disabled={empty}
                              onClick={() => setDrilldown({ pubId: p.id, date: d })}
                              className={`w-full text-left rounded px-2 py-1 text-xs ${
                                empty
                                  ? "text-muted-foreground/40 cursor-default"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }`}
                            >
                              {empty ? "—" : (
                                <>
                                  <div className="font-semibold tabular-nums">{c.count} {t("staff.cellShifts")}</div>
                                  <div className="tabular-nums text-[10px] opacity-80">{c.hours.toFixed(1)} {t("staff.hoursUnit")}</div>
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right tabular-nums text-xs font-medium border-l">
                        {pubTotal.toFixed(1)} {t("staff.hoursUnit")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {drilldown && (
        <DrilldownDialog
          pubId={drilldown.pubId}
          date={drilldown.date}
          isEN={isEN}
          shifts={shifts.filter((s) => s.pub_id === drilldown.pubId && s.date === drilldown.date)}
          staffMap={staffMap}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}

function DrilldownDialog({
  pubId, date, isEN, shifts, staffMap, onClose,
}: {
  pubId: string;
  date: string;
  isEN: boolean;
  shifts: ShiftAssignment[];
  staffMap: Record<string, StaffMember>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const pub = PUBS.find((p) => p.id === pubId);
  const d = new Date(date + "T00:00:00");
  const grouped: Record<ShiftSlot, ShiftAssignment[]> = { early: [], late: [], night: [] };
  for (const s of shifts) grouped[s.slot].push(s);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pub?.name} · {d.toLocaleDateString(isEN ? "en-US" : "de-DE", { weekday: "long", day: "numeric", month: "long" })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {SHIFT_SLOTS.map((slot) => {
            const list = grouped[slot];
            if (list.length === 0) return null;
            return (
              <div key={slot} className="space-y-1">
                <Badge variant="outline" className={SHIFT_SLOT_TONE[slot]}>{t(`staff.slots.${slot}`)}</Badge>
                <div className="space-y-1 pl-1">
                  {list.map((s) => {
                    const m = staffMap[s.staff_id];
                    return (
                      <div key={s.id} className="flex justify-between text-sm border rounded px-2 py-1">
                        <div>
                          <span className="font-medium">{m ? `${m.first_name} ${m.last_name}` : "—"}</span>
                          {m && <span className="text-muted-foreground text-xs ml-2">{t(`staff.roles.${m.role}`, m.role)}</span>}
                        </div>
                        <div className="text-xs tabular-nums text-muted-foreground">
                          {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {shifts.length === 0 && (
            <div className="text-sm text-muted-foreground">{t("staff.noShifts")}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "amber" }) {
  return (
    <Card className={tone === "amber" ? "border-amber-300 bg-amber-50/40" : ""}>
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums mt-1 ${tone === "amber" ? "text-amber-700" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
