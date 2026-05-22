import { useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertTriangle, CalendarRange, Users, Phone, MessageCircle, Crown } from "lucide-react";
import { useT } from "@/lib/use-t";
import { EMPLOYEES, SHIFT_SUMMARY, getPubName, getBarManager, waLink, telLink } from "@/lib/hr-mock";

type ShiftBlock = {
  start: string; // HH:MM
  end: string;
  label: string; // role
  tone: "primary" | "emerald";
};

type OpenSlot = {
  day: number; // 0..6
  start: string;
  end: string;
  role: string;
};

// Deterministic pseudo-random based on string seed
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const SHIFT_TEMPLATES: { start: string; end: string; tone: "primary" | "emerald" }[] = [
  { start: "11:00", end: "19:00", tone: "emerald" }, // Tag
  { start: "16:00", end: "00:00", tone: "primary" }, // Abend
  { start: "18:00", end: "02:00", tone: "primary" }, // Spät
  { start: "20:00", end: "04:00", tone: "primary" }, // Nacht
];

export function PubScheduleDialog({
  pubId,
  open,
  onOpenChange,
}: {
  pubId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const tt = useT();

  const data = useMemo(() => {
    if (!pubId) return null;
    const employees = EMPLOYEES.filter((e) => e.pubId === pubId);
    const summary = SHIFT_SUMMARY.find((s) => s.pubId === pubId);
    const openCount = summary?.openShifts ?? 0;

    // Build a 7-day grid per employee
    const grid: Record<string, (ShiftBlock | null)[]> = {};
    employees.forEach((emp) => {
      const rand = seeded(emp.id);
      // Target shifts per week based on contract hours (~7-8h per shift)
      const shiftsPerWeek = Math.max(
        2,
        Math.min(6, Math.round(emp.contractHoursWeek / 7.5))
      );
      const days: (ShiftBlock | null)[] = Array(7).fill(null);
      const chosen = new Set<number>();
      let guard = 0;
      while (chosen.size < shiftsPerWeek && guard++ < 50) {
        const d = Math.floor(rand() * 7);
        chosen.add(d);
      }
      chosen.forEach((d) => {
        const tIdx = Math.floor(rand() * SHIFT_TEMPLATES.length);
        const tpl = SHIFT_TEMPLATES[tIdx];
        days[d] = {
          start: tpl.start,
          end: tpl.end,
          label: emp.role,
          tone: tpl.tone,
        };
      });
      grid[emp.id] = days;
    });

    // Generate open shifts on weekend / busy days
    const openRoles = ["Bartender", "Kellner:in", "Shift Lead", "Barista", "Küche"];
    const opens: OpenSlot[] = [];
    const rand = seeded(pubId + "-open");
    // Skew toward Thu(3)–Sat(5)
    const dayPool = [3, 4, 5, 5, 4, 6, 2];
    for (let i = 0; i < openCount; i++) {
      const d = dayPool[Math.floor(rand() * dayPool.length)];
      const tpl = SHIFT_TEMPLATES[2 + (i % 2)]; // Spät / Nacht
      opens.push({
        day: d,
        start: tpl.start,
        end: tpl.end,
        role: openRoles[Math.floor(rand() * openRoles.length)],
      });
    }

    return { employees, grid, opens, openCount };
  }, [pubId]);

  const DAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = tt(DAYS_DE.join("|"), DAYS_EN.join("|")).split("|");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base">
                {tt("Wochen-Dienstplan", "Weekly schedule")} ·{" "}
                <span className="text-primary">{pubId ? getPubName(pubId) : ""}</span>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {tt(
                  "Mitarbeiter × Wochentage. Rote Blöcke zeigen unbesetzte Schichten.",
                  "Employees × weekdays. Red blocks mark open shifts."
                )}
              </DialogDescription>
            </div>
            {data && (
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {data.employees.length}
                </Badge>
                {data.openCount > 0 ? (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {data.openCount} {tt("offen", "open")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    {tt("vollständig besetzt", "fully staffed")}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {data && (
              <div className="min-w-[820px]">
                {/* Header row */}
                <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-1 mb-1">
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-2 py-1.5">
                    {tt("Mitarbeiter", "Employee")}
                  </div>
                  {days.map((d, i) => (
                    <div
                      key={d}
                      className={`text-[11px] font-medium uppercase tracking-wide text-center py-1.5 rounded ${
                        i >= 5 ? "bg-muted/50 text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Open shifts row */}
                {data.opens.length > 0 && (
                  <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-1 mb-2">
                    <div className="px-2 py-2 text-xs font-semibold text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {tt("Offene Schichten", "Open shifts")}
                    </div>
                    {Array.from({ length: 7 }).map((_, d) => {
                      const slots = data.opens.filter((o) => o.day === d);
                      return (
                        <div key={d} className="space-y-1 min-h-[42px]">
                          {slots.map((s, i) => (
                            <div
                              key={i}
                              className="rounded-md border border-red-300 bg-red-500/10 text-red-700 dark:text-red-300 px-2 py-1 text-[11px] leading-tight"
                            >
                              <div className="font-semibold truncate">{s.role} {tt("gesucht", "needed")}</div>
                              <div className="tabular-nums opacity-80">{s.start}–{s.end}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Employee rows */}
                <div className="space-y-1">
                  {data.employees.map((emp) => {
                    const row = data.grid[emp.id];
                    return (
                      <div
                        key={emp.id}
                        className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-1 border-t border-border/60 pt-1"
                      >
                        <div className="px-2 py-2 min-w-0">
                          <div className="text-sm font-medium truncate">{emp.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {emp.role} · {emp.contractHoursWeek}h
                          </div>
                        </div>
                        {row.map((cell, d) => (
                          <div key={d} className="min-h-[42px]">
                            {cell ? (
                              <div
                                className={`rounded-md px-2 py-1 text-[11px] leading-tight border ${
                                  cell.tone === "primary"
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                <div className="font-semibold truncate">{emp.name.split(" ")[0]}</div>
                                <div className="tabular-nums opacity-80">{cell.start}–{cell.end}</div>
                              </div>
                            ) : (
                              <div className="h-full rounded-md border border-dashed border-border/50" />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-300" />
                    {tt("Tagschicht", "Day shift")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/30" />
                    {tt("Abend / Nacht", "Evening / Night")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-red-500/15 border border-red-300" />
                    {tt("Unbesetzt", "Open")}
                  </div>
                </div>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
