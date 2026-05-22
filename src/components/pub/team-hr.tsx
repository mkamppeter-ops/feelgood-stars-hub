import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Pause, LogOut, Clock, Thermometer, Plane, CalendarDays, Tablet, Smartphone, Delete } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";
import { supabase } from "@/integrations/supabase/client";

type ShiftState = "off" | "working" | "paused";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type StaffEntry = {
  id: string;
  name: string;
  initials: string;
  color: string;
  pin: string;
};

const COLORS = [
  "bg-rose-500/20 text-rose-700",
  "bg-amber-500/20 text-amber-700",
  "bg-emerald-500/20 text-emerald-700",
  "bg-blue-500/20 text-blue-700",
  "bg-violet-500/20 text-violet-700",
  "bg-cyan-500/20 text-cyan-700",
  "bg-fuchsia-500/20 text-fuchsia-700",
];

const MOCK_STAFF: StaffEntry[] = [
  { id: "u1", name: "Lisa M.",    initials: "LM", color: COLORS[0], pin: "1111" },
  { id: "u2", name: "Tom B.",     initials: "TB", color: COLORS[1], pin: "2222" },
  { id: "u3", name: "Sarah L.",   initials: "SL", color: COLORS[2], pin: "3333" },
  { id: "u4", name: "Markus K.",  initials: "MK", color: COLORS[3], pin: "4444" },
  { id: "u5", name: "Du",         initials: "ME", color: "bg-primary/20 text-primary", pin: "0000" },
];

function useStaff(pubId?: string): StaffEntry[] {
  const [list, setList] = useState<StaffEntry[]>(MOCK_STAFF);
  useEffect(() => {
    if (!pubId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("id, first_name, last_name, active")
        .eq("pub_id", pubId)
        .eq("active", true)
        .order("first_name");
      if (!active || error || !data || data.length === 0) return;
      const mapped: StaffEntry[] = data.map((row, i) => {
        const name = `${row.first_name} ${row.last_name.charAt(0)}.`;
        const initials = `${row.first_name.charAt(0)}${row.last_name.charAt(0)}`.toUpperCase();
        return {
          id: row.id,
          name,
          initials,
          color: COLORS[i % COLORS.length],
          // Demo-PIN: last 4 digits of the row id; in real flows you'd store hashed PINs server-side
          pin: row.id.replace(/\D/g, "").slice(-4).padStart(4, "0") || "0000",
        };
      });
      // Always include "Du" so the personal phone view still works
      const me = MOCK_STAFF.find((s) => s.id === "u5")!;
      setList([...mapped, me]);
    })();
    return () => { active = false; };
  }, [pubId]);
  return list;
}

const REQUESTS_INIT = [
  { id: "r1", typeDe: "Urlaub", typeEn: "Vacation", range: "12.06. – 18.06.", status: "pending" as const },
  { id: "r2", typeDe: "Krankmeldung", typeEn: "Sick leave", range: "02.05.", status: "approved" as const },
  { id: "r3", typeDe: "Urlaub", typeEn: "Vacation", range: "08.04. – 10.04.", status: "approved" as const },
];

interface TeamHRProps {
  /** Opening hour 0–23, default 17 (matches pub_settings default). */
  openingHour?: number;
  /** Closing hour, can exceed 24 (e.g. 26 = 02:00 next day), default 24. */
  closingHour?: number;
  /** Days the pub is closed. */
  closedDays?: DayKey[];
  /** Pub id used to load real staff_members. */
  pubId?: string;
}

const fmtHour = (h: number) => `${String(h % 24).padStart(2, "0")}`;

export function TeamHR({ openingHour = 17, closingHour = 24, closedDays = ["mon"], pubId }: TeamHRProps) {
  const staff = useStaff(pubId);
  const tt = useT();
  const [deviceMode, setDeviceMode] = useState<"phone" | "tablet">("phone");

  // Derive shifts from opening/closing hours
  const shifts = useMemo(() => {
    const total = closingHour - openingHour;
    if (total <= 0) return [];
    if (total <= 6) {
      return [{ key: "single", de: "Schicht", en: "Shift", time: `${fmtHour(openingHour)}–${fmtHour(closingHour)}` }];
    }
    const mid = openingHour + Math.ceil(total / 2);
    return [
      { key: "early", de: "Früh", en: "Early", time: `${fmtHour(openingHour)}–${fmtHour(mid)}` },
      { key: "late",  de: "Spät", en: "Late",  time: `${fmtHour(mid)}–${fmtHour(closingHour)}` },
    ];
  }, [openingHour, closingHour]);

  return (
    <div className="space-y-5">
      {/* Device mode toggle */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {deviceMode === "tablet" ? <Tablet className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          {deviceMode === "tablet"
            ? tt("Tablet-Modus · Mitarbeiter stempeln mit PIN", "Tablet mode · staff clock in via PIN")
            : tt("Handy-Modus · persönlich angemeldet", "Phone mode · personal login")}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="device-mode" className="text-xs">{tt("Tablet", "Tablet")}</Label>
          <Switch id="device-mode" checked={deviceMode === "tablet"} onCheckedChange={(v) => setDeviceMode(v ? "tablet" : "phone")} />
        </div>
      </div>

      {deviceMode === "tablet" ? (
        <TabletClockIn staff={staff} />
      ) : (
        <PhoneShiftWidget />
      )}

      {/* Roster */}
      <RosterTable shifts={shifts} closedDays={closedDays} staff={staff} />

      {/* Absences — only personal view in phone mode */}
      {deviceMode === "phone" && <AbsencesPanel />}
    </div>
  );
}

/* -------------------- Phone mode: personal shift -------------------- */

function PhoneShiftWidget() {
  const tt = useT();
  const [state, setState] = useState<ShiftState>("off");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const start = () => { setState("working"); setStartedAt(Date.now()); toast.success(tt("Schicht gestartet", "Shift started")); };
  const pause = () => { setState("paused"); toast.info(tt("Pause läuft", "Break running")); };
  const resume = () => { setState("working"); toast.success(tt("Weiter geht's", "Back to work")); };
  const stop = () => { setState("off"); setStartedAt(null); toast.success(tt("Ausgestempelt", "Clocked out")); };

  return (
    <Card className="overflow-hidden relative border-primary/20">
      <div className={`absolute inset-0 pointer-events-none ${
        state === "working" ? "bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"
        : state === "paused" ? "bg-gradient-to-br from-amber-500/10 via-transparent to-transparent"
        : "bg-gradient-to-br from-primary/5 via-transparent to-transparent"
      }`} />
      <CardContent className="p-5 relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
            state === "working" ? "bg-emerald-500/15" : state === "paused" ? "bg-amber-500/15" : "bg-primary/10"
          }`}>
            <Clock className={`h-7 w-7 ${state === "working" ? "text-emerald-600" : state === "paused" ? "text-amber-600" : "text-primary"}`} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {state === "off" ? tt("Bereit", "Ready")
                : state === "working" ? tt("Schicht läuft", "Shift running")
                : tt("Pause", "On break")}
            </div>
            <div className="text-3xl font-bold tabular-nums leading-tight">{hh}:{mm}:{ss}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {startedAt
                ? tt(`Eingestempelt um ${new Date(startedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`,
                     `Clocked in at ${new Date(startedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`)
                : tt("Heute noch nicht gestartet", "Not started yet today")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {state === "off" && (
            <Button size="lg" onClick={start}><Play className="h-4 w-4 mr-1.5" />{tt("Schicht starten", "Start shift")}</Button>
          )}
          {state === "working" && (
            <>
              <Button size="lg" variant="outline" onClick={pause}><Pause className="h-4 w-4 mr-1.5" />{tt("Pause", "Break")}</Button>
              <Button size="lg" variant="destructive" onClick={stop}><LogOut className="h-4 w-4 mr-1.5" />{tt("Ausstempeln", "Clock out")}</Button>
            </>
          )}
          {state === "paused" && (
            <>
              <Button size="lg" onClick={resume}><Play className="h-4 w-4 mr-1.5" />{tt("Weiter", "Resume")}</Button>
              <Button size="lg" variant="destructive" onClick={stop}><LogOut className="h-4 w-4 mr-1.5" />{tt("Ausstempeln", "Clock out")}</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Tablet mode: pick staff + PIN -------------------- */

function TabletClockIn({ staff }: { staff: StaffEntry[] }) {
  const tt = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [clockedIn, setClockedIn] = useState<Record<string, number>>({});

  const selectedStaff = staff.find((s) => s.id === selected);

  const submitPin = (next: string) => {
    if (!selectedStaff) return;
    if (next.length !== 4) { setPin(next); return; }
    if (next === selectedStaff.pin) {
      const isIn = !!clockedIn[selectedStaff.id];
      setClockedIn((prev) => {
        const copy = { ...prev };
        if (isIn) delete copy[selectedStaff.id];
        else copy[selectedStaff.id] = Date.now();
        return copy;
      });
      toast.success(isIn
        ? tt(`${selectedStaff.name} ausgestempelt`, `${selectedStaff.name} clocked out`)
        : tt(`${selectedStaff.name} eingestempelt`, `${selectedStaff.name} clocked in`));
      setSelected(null);
      setPin("");
    } else {
      toast.error(tt("Falsche PIN", "Wrong PIN"));
      setPin("");
    }
  };

  if (selectedStaff) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("PIN für", "PIN for")}</div>
            <div className="text-xl font-semibold">{selectedStaff.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {clockedIn[selectedStaff.id] ? tt("→ Ausstempeln", "→ Clock out") : tt("→ Einstempeln", "→ Clock in")}
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-12 w-10 rounded-md border-2 flex items-center justify-center text-2xl font-bold ${pin.length > i ? "border-primary bg-primary/5" : "border-border"}`}>
                {pin.length > i ? "●" : ""}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Button key={n} variant="outline" className="h-14 text-xl" onClick={() => submitPin((pin + n).slice(0, 4))}>{n}</Button>
            ))}
            <Button variant="ghost" className="h-14" onClick={() => { setSelected(null); setPin(""); }}>{tt("Zurück", "Back")}</Button>
            <Button variant="outline" className="h-14 text-xl" onClick={() => submitPin((pin + 0).slice(0, 4))}>0</Button>
            <Button variant="ghost" className="h-14" onClick={() => setPin(pin.slice(0, -1))}><Delete className="h-5 w-5" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Tablet className="h-4 w-4 text-primary" />
            {tt("Wer stempelt?", "Who's clocking in?")}
          </h3>
          <p className="text-xs text-muted-foreground">{tt("Tippe deinen Namen, dann PIN eingeben.", "Tap your name, then enter PIN.")}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {STAFF.map((s) => {
            const since = clockedIn[s.id];
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-center ${
                  since ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <span className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ${s.color}`}>{s.initials}</span>
                <span className="text-xs font-medium leading-tight">{s.name}</span>
                {since ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[10px]">
                    {tt("eingestempelt", "clocked in")}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{tt("ausgestempelt", "clocked out")}</span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Roster derived from opening hours -------------------- */

function RosterTable({ shifts, closedDays }: { shifts: { key: string; de: string; en: string; time: string }[]; closedDays: DayKey[] }) {
  const tt = useT();
  const days: { key: DayKey; deLabel: string; enLabel: string }[] = [
    { key: "mon", deLabel: "Mo", enLabel: "Mon" },
    { key: "tue", deLabel: "Di", enLabel: "Tue" },
    { key: "wed", deLabel: "Mi", enLabel: "Wed" },
    { key: "thu", deLabel: "Do", enLabel: "Thu" },
    { key: "fri", deLabel: "Fr", enLabel: "Fri" },
    { key: "sat", deLabel: "Sa", enLabel: "Sat" },
    { key: "sun", deLabel: "So", enLabel: "Sun" },
  ];

  // Pseudo-randomized but stable roster: hash day+shift -> pick 1-3 staff
  const pickStaff = (day: DayKey, shiftKey: string): string[] => {
    const seed = (day + shiftKey).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const count = (seed % 3) + 1;
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(STAFF[(seed + i * 3) % STAFF.length].id);
    }
    return [...new Set(ids)];
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {tt("Dienstplan diese Woche", "Roster this week")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {tt("Schichten orientieren sich an den Öffnungszeiten.", "Shifts follow the pub's opening hours.")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground p-2 w-24"></th>
                {days.map((d) => (
                  <th key={d.key} className="text-center font-medium text-muted-foreground p-2">{tt(d.deLabel, d.enLabel)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((sh) => (
                <tr key={sh.key} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">{tt(sh.de, sh.en)}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">{sh.time}</div>
                  </td>
                  {days.map((d) => {
                    const closed = closedDays.includes(d.key);
                    if (closed) {
                      return (
                        <td key={d.key} className="p-2 border-l align-middle text-center bg-muted/30">
                          <span className="text-[10px] text-muted-foreground italic">{tt("geschl.", "closed")}</span>
                        </td>
                      );
                    }
                    const ids = pickStaff(d.key, sh.key);
                    return (
                      <td key={d.key} className={`p-2 border-l align-top ${ids.includes("u5") ? "bg-primary/5" : ""}`}>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {ids.map((id) => {
                            const s = STAFF.find((x) => x.id === id)!;
                            return (
                              <span key={id} title={s.name} className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${s.color} ${id === "u5" ? "ring-2 ring-primary" : ""}`}>
                                {s.initials}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Absences (personal) -------------------- */

function AbsencesPanel() {
  const tt = useT();
  const [requests, setRequests] = useState(REQUESTS_INIT);

  const submitRequest = (kind: "sick" | "vacation", range: string) => {
    if (!range.trim()) return false;
    setRequests((prev) => [
      {
        id: `r${Math.floor(Math.random() * 1000)}`,
        typeDe: kind === "sick" ? "Krankmeldung" : "Urlaub",
        typeEn: kind === "sick" ? "Sick leave" : "Vacation",
        range,
        status: "pending" as const,
      },
      ...prev,
    ]);
    toast.success(tt("Antrag eingereicht", "Request submitted"));
    return true;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{tt("Abwesenheiten", "Absences")}</h2>
          <p className="text-xs text-muted-foreground">{tt("Schnell beantragen", "Submit quickly")}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <AbsenceDialog kind="sick" trigger={
            <Button variant="outline" className="justify-start h-12">
              <Thermometer className="h-4 w-4 mr-2 text-red-500" />{tt("Krankmeldung", "Sick leave")}
            </Button>
          } onSubmit={(r) => submitRequest("sick", r)} />
          <AbsenceDialog kind="vacation" trigger={
            <Button variant="outline" className="justify-start h-12">
              <Plane className="h-4 w-4 mr-2 text-blue-500" />{tt("Urlaub beantragen", "Request vacation")}
            </Button>
          } onSubmit={(r) => submitRequest("vacation", r)} />
        </div>
      </div>

      <Card className="lg:col-span-2 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Meine Anträge", "My requests")}</div>
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <div className="text-sm font-medium">{tt(r.typeDe, r.typeEn)}</div>
                <div className="text-xs text-muted-foreground">{r.range}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const tt = useT();
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-700 border-0">{tt("Genehmigt", "Approved")}</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/10 text-red-600 border-0">{tt("Abgelehnt", "Rejected")}</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-700 border-0">{tt("Beantragt", "Pending")}</Badge>;
}

function AbsenceDialog({
  kind, trigger, onSubmit,
}: {
  kind: "sick" | "vacation";
  trigger: React.ReactNode;
  onSubmit: (range: string, note: string) => boolean;
}) {
  const tt = useT();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState("");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind === "sick" ? tt("Krankmeldung einreichen", "Submit sick leave") : tt("Urlaub beantragen", "Request vacation")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{tt("Zeitraum", "Date range")}</label>
            <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder={tt("z. B. 12.06. – 18.06.", "e.g. Jun 12 – Jun 18")} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{tt("Notiz (optional)", "Note (optional)")}</label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{tt("Abbrechen", "Cancel")}</Button>
          <Button onClick={() => { if (onSubmit(range, note)) { setOpen(false); setRange(""); setNote(""); } }}>
            {tt("Einreichen", "Submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
