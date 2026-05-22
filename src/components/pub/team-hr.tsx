import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Pause, LogOut, Clock, Thermometer, Plane, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";

type ShiftState = "off" | "working" | "paused";

const STAFF = [
  { id: "u1", name: "Lisa M.", initials: "LM", color: "bg-rose-500/20 text-rose-700" },
  { id: "u2", name: "Tom B.", initials: "TB", color: "bg-amber-500/20 text-amber-700" },
  { id: "u3", name: "Sarah L.", initials: "SL", color: "bg-emerald-500/20 text-emerald-700" },
  { id: "u4", name: "Markus K.", initials: "MK", color: "bg-blue-500/20 text-blue-700" },
  { id: "u5", name: "Du", initials: "ME", color: "bg-primary/20 text-primary" },
];

// Roster: day x shift -> staff ids
const ROSTER: Record<string, Record<string, string[]>> = {
  mon: { early: ["u1", "u2"], late: ["u3", "u5"], night: ["u4"] },
  tue: { early: ["u2", "u3"], late: ["u1", "u4"], night: ["u5"] },
  wed: { early: ["u5", "u4"], late: ["u2"], night: ["u1", "u3"] },
  thu: { early: ["u3"], late: ["u5", "u2"], night: ["u4"] },
  fri: { early: ["u1", "u5"], late: ["u3", "u4", "u2"], night: ["u1"] },
  sat: { early: ["u2"], late: ["u1", "u3", "u5"], night: ["u4", "u2"] },
  sun: { early: ["u4"], late: ["u1", "u2"], night: ["u5"] },
};

const REQUESTS_INIT = [
  { id: "r1", typeDe: "Urlaub", typeEn: "Vacation", range: "12.06. – 18.06.", status: "pending" as const },
  { id: "r2", typeDe: "Krankmeldung", typeEn: "Sick leave", range: "02.05.", status: "approved" as const },
  { id: "r3", typeDe: "Urlaub", typeEn: "Vacation", range: "08.04. – 10.04.", status: "approved" as const },
];

export function TeamHR() {
  const tt = useT();
  const [state, setState] = useState<ShiftState>("off");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [requests, setRequests] = useState(REQUESTS_INIT);

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

  const days: { key: keyof typeof ROSTER | string; deLabel: string; enLabel: string }[] = [
    { key: "mon", deLabel: "Mo", enLabel: "Mon" },
    { key: "tue", deLabel: "Di", enLabel: "Tue" },
    { key: "wed", deLabel: "Mi", enLabel: "Wed" },
    { key: "thu", deLabel: "Do", enLabel: "Thu" },
    { key: "fri", deLabel: "Fr", enLabel: "Fri" },
    { key: "sat", deLabel: "Sa", enLabel: "Sat" },
    { key: "sun", deLabel: "So", enLabel: "Sun" },
  ];
  const shifts = [
    { key: "early", de: "Früh", en: "Early", time: "08–14" },
    { key: "late", de: "Spät", en: "Late", time: "14–22" },
    { key: "night", de: "Nacht", en: "Night", time: "22–02" },
  ];

  const submitRequest = (kind: "sick" | "vacation", range: string, note: string) => {
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
    <div className="space-y-5">
      {/* Time tracking widget */}
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
              <Clock className={`h-7 w-7 ${
                state === "working" ? "text-emerald-600" : state === "paused" ? "text-amber-600" : "text-primary"
              }`} />
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
          <div className="flex items-center gap-2">
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

      {/* Roster */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {tt("Dienstplan diese Woche", "Roster this week")}
              </h2>
              <p className="text-xs text-muted-foreground">{tt("Deine Schichten sind hervorgehoben", "Your shifts are highlighted")}</p>
            </div>
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
                      const ids = ROSTER[d.key]?.[sh.key] ?? [];
                      const mine = ids.includes("u5");
                      return (
                        <td key={d.key} className={`p-2 border-l align-top ${mine ? "bg-primary/5" : ""}`}>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {ids.map((id) => {
                              const s = STAFF.find((x) => x.id === id)!;
                              return (
                                <span key={id} title={s.name} className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${s.color} ${id === "u5" ? "ring-2 ring-primary" : ""}`}>
                                  {s.initials}
                                </span>
                              );
                            })}
                            {ids.length === 0 && <span className="text-muted-foreground/40">·</span>}
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

      {/* Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{tt("Abwesenheiten", "Absences")}</h2>
            <p className="text-xs text-muted-foreground">{tt("Schnell beantragen", "Submit quickly")}</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <AbsenceDialog
              kind="sick"
              trigger={
                <Button variant="outline" className="justify-start h-12">
                  <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                  {tt("Krankmeldung", "Sick leave")}
                </Button>
              }
              onSubmit={(r, n) => submitRequest("sick", r, n)}
            />
            <AbsenceDialog
              kind="vacation"
              trigger={
                <Button variant="outline" className="justify-start h-12">
                  <Plane className="h-4 w-4 mr-2 text-blue-500" />
                  {tt("Urlaub beantragen", "Request vacation")}
                </Button>
              }
              onSubmit={(r, n) => submitRequest("vacation", r, n)}
            />
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
            <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder={kind === "sick" ? "z. B. 22.05." : "z. B. 01.07. – 14.07."} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{tt("Notiz (optional)", "Note (optional)")}</label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{tt("Abbrechen", "Cancel")}</Button>
          <Button onClick={() => { if (onSubmit(range, note)) { setRange(""); setNote(""); setOpen(false); } }}>
            {tt("Einreichen", "Submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
