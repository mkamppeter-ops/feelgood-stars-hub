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
import { Play, Pause, LogOut, Clock, Thermometer, Plane, CalendarDays, Tablet, Smartphone, Delete, Fingerprint, KeyRound, CheckCircle2, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";
import { supabase } from "@/integrations/supabase/client";
import { pingFingerprintBridge, identifyFingerprint, enrollFingerprint, type FingerprintHealth } from "@/lib/fingerprint-bridge";

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
        <TabletClockIn staff={staff} pubId={pubId} />
      ) : (
        <PhoneShiftWidget />
      )}

      {/* Biometrie-Verwaltung (nur Tablet-Modus) */}
      {deviceMode === "tablet" && <BiometricsManager staff={staff} />}

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

function TabletClockIn({ staff, pubId }: { staff: StaffEntry[]; pubId?: string }) {
  const tt = useT();
  const [bridge, setBridge] = useState<FingerprintHealth | null>(null);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "matched" | "no_match" | "timeout">("idle");
  const [matched, setMatched] = useState<{ id: string; confidence: number } | null>(null);
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pinSelected, setPinSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [clockedIn, setClockedIn] = useState<Record<string, number>>({});
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  // Ping Companion-App on mount + every 30s
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const h = await pingFingerprintBridge();
      if (alive) setBridge(h);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Load enrolled staff (those with at least one biometric template)
  useEffect(() => {
    if (staff.length === 0) return;
    let alive = true;
    (async () => {
      const ids = staff.map((s) => s.id);
      const { data } = await supabase
        .from("staff_biometrics")
        .select("staff_id")
        .in("staff_id", ids);
      if (!alive || !data) return;
      setEnrolledIds(new Set(data.map((r) => r.staff_id)));
    })();
    return () => { alive = false; };
  }, [staff]);

  const recordStamp = async (staffId: string, method: "fingerprint" | "pin" | "manual", confidence?: number) => {
    const isIn = !!clockedIn[staffId];
    const evType = isIn ? "out" : "in";
    setClockedIn((prev) => {
      const copy = { ...prev };
      if (isIn) delete copy[staffId];
      else copy[staffId] = Date.now();
      return copy;
    });
    if (pubId) {
      const { error } = await supabase.from("stamp_events").insert({
        pub_id: pubId,
        staff_id: staffId,
        event_type: evType,
        method,
        confidence: confidence ?? null,
      });
      if (error) console.error("stamp_events insert failed", error);
    }
    const s = staff.find((x) => x.id === staffId);
    toast.success(isIn
      ? tt(`${s?.name ?? "MA"} ausgestempelt`, `${s?.name ?? "Staff"} clocked out`)
      : tt(`${s?.name ?? "MA"} eingestempelt`, `${s?.name ?? "Staff"} clocked in`));
  };

  const startScan = async () => {
    if (!bridge?.available) {
      toast.error(tt("Fingerprint-Reader nicht verbunden", "Fingerprint reader not connected"));
      return;
    }
    if (!pubId) return;
    setScanState("scanning");
    const candidateIds = staff.filter((s) => enrolledIds.has(s.id)).map((s) => s.id);
    const res = await identifyFingerprint({ pubId, candidateIds });
    if (res.ok) {
      setMatched({ id: res.staffId, confidence: res.confidence });
      setScanState("matched");
      await recordStamp(res.staffId, "fingerprint", res.confidence);
      setTimeout(() => { setScanState("idle"); setMatched(null); }, 2200);
    } else if (res.reason === "no_match") {
      setScanState("no_match");
      setTimeout(() => setScanState("idle"), 2000);
    } else if (res.reason === "timeout") {
      setScanState("timeout");
      setTimeout(() => setScanState("idle"), 2000);
    } else {
      toast.error(tt("Reader-Fehler — bitte PIN nutzen", "Reader error — please use PIN"));
      setScanState("idle");
      setShowPinFallback(true);
    }
  };

  const submitPin = (next: string) => {
    const sel = staff.find((s) => s.id === pinSelected);
    if (!sel) return;
    if (next.length !== 4) { setPin(next); return; }
    if (next === sel.pin) {
      recordStamp(sel.id, "pin");
      setPinSelected(null);
      setPin("");
      setShowPinFallback(false);
    } else {
      toast.error(tt("Falsche PIN", "Wrong PIN"));
      setPin("");
    }
  };

  // PIN-Pad view (fallback path)
  if (showPinFallback && pinSelected) {
    const sel = staff.find((s) => s.id === pinSelected)!;
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("PIN für", "PIN for")}</div>
            <div className="text-xl font-semibold">{sel.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {clockedIn[sel.id] ? tt("→ Ausstempeln", "→ Clock out") : tt("→ Einstempeln", "→ Clock in")}
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
            <Button variant="ghost" className="h-14" onClick={() => { setPinSelected(null); setPin(""); }}>{tt("Zurück", "Back")}</Button>
            <Button variant="outline" className="h-14 text-xl" onClick={() => submitPin((pin + 0).slice(0, 4))}>0</Button>
            <Button variant="ghost" className="h-14" onClick={() => setPin(pin.slice(0, -1))}><Delete className="h-5 w-5" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PIN fallback staff picker
  if (showPinFallback) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                {tt("PIN-Fallback · Wer stempelt?", "PIN fallback · Who's clocking in?")}
              </h3>
              <p className="text-xs text-muted-foreground">{tt("Nur wenn der Finger nicht erkannt wird.", "Only when the finger isn't recognised.")}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowPinFallback(false)}>{tt("Zurück", "Back")}</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {staff.map((s) => {
              const since = clockedIn[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => setPinSelected(s.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-center ${
                    since ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ${s.color}`}>{s.initials}</span>
                  <span className="text-xs font-medium leading-tight">{s.name}</span>
                  {since ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[10px]">{tt("eingestempelt", "clocked in")}</Badge>
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

  // Default: Fingerprint prompt
  const matchedStaff = matched ? staff.find((s) => s.id === matched.id) : null;

  return (
    <Card className="border-primary/20 overflow-hidden relative">
      <div className={`absolute inset-0 pointer-events-none transition-colors ${
        scanState === "matched" ? "bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"
        : scanState === "no_match" || scanState === "timeout" ? "bg-gradient-to-br from-red-500/10 via-transparent to-transparent"
        : scanState === "scanning" ? "bg-gradient-to-br from-primary/10 via-transparent to-transparent"
        : "bg-gradient-to-br from-primary/5 via-transparent to-transparent"
      }`} />
      <CardContent className="p-6 relative flex flex-col items-center gap-4 text-center">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary" />
            {tt("Fingerabdruck stempeln", "Stamp with fingerprint")}
          </h3>
          <BridgeStatusBadge health={bridge} />
        </div>

        <button
          onClick={startScan}
          disabled={scanState === "scanning" || scanState === "matched" || !bridge?.available}
          className={`group h-36 w-36 rounded-full border-4 flex items-center justify-center transition-all disabled:cursor-not-allowed ${
            scanState === "matched" ? "border-emerald-500 bg-emerald-500/10"
            : scanState === "no_match" || scanState === "timeout" ? "border-red-500 bg-red-500/10"
            : scanState === "scanning" ? "border-primary bg-primary/10 animate-pulse"
            : bridge?.available ? "border-primary/40 hover:border-primary hover:bg-primary/5"
            : "border-muted bg-muted/30 opacity-60"
          }`}
        >
          {scanState === "matched" ? <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            : scanState === "no_match" || scanState === "timeout" ? <XCircle className="h-16 w-16 text-red-600" />
            : <Fingerprint className={`h-20 w-20 ${scanState === "scanning" ? "text-primary" : bridge?.available ? "text-primary/70 group-hover:text-primary" : "text-muted-foreground"}`} />}
        </button>

        <div className="min-h-[2.5rem]">
          {scanState === "idle" && bridge?.available && (
            <div className="text-sm text-muted-foreground">{tt("Finger auflegen zum Ein-/Ausstempeln", "Place finger to clock in/out")}</div>
          )}
          {scanState === "idle" && !bridge?.available && (
            <div className="text-sm text-red-600">{tt("Companion-App nicht erreichbar — PIN-Fallback nutzen", "Companion app unreachable — use PIN fallback")}</div>
          )}
          {scanState === "scanning" && <div className="text-sm font-medium text-primary">{tt("Lese Fingerabdruck …", "Reading fingerprint …")}</div>}
          {scanState === "matched" && matchedStaff && (
            <div>
              <div className="text-base font-semibold text-emerald-700">
                {clockedIn[matched!.id] === undefined
                  ? tt(`${matchedStaff.name} ausgestempelt`, `${matchedStaff.name} clocked out`)
                  : tt(`${matchedStaff.name} eingestempelt`, `${matchedStaff.name} clocked in`)}
              </div>
              <div className="text-[10px] text-muted-foreground">{tt("Konfidenz", "Confidence")}: {matched!.confidence}%</div>
            </div>
          )}
          {scanState === "no_match" && <div className="text-sm font-medium text-red-600">{tt("Nicht erkannt — bitte erneut", "Not recognised — please try again")}</div>}
          {scanState === "timeout" && <div className="text-sm font-medium text-red-600">{tt("Zeitüberschreitung", "Timed out")}</div>}
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowPinFallback(true)}>
          <KeyRound className="h-3.5 w-3.5 mr-1.5" />
          {tt("PIN-Fallback", "PIN fallback")}
        </Button>
      </CardContent>
    </Card>
  );
}

function BridgeStatusBadge({ health }: { health: FingerprintHealth | null }) {
  const tt = useT();
  if (health === null) return <Badge variant="secondary" className="text-[10px]">{tt("Reader-Status …", "Reader status …")}</Badge>;
  if (health.available) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[10px] gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {tt("Reader verbunden", "Reader connected")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/10 text-red-600 border-0 text-[10px] gap-1">
      <AlertCircle className="h-3 w-3" />
      {tt("Reader offline", "Reader offline")}
    </Badge>
  );
}

/* -------------------- Biometrics manager (enrollment list) -------------------- */

type BiometricRow = { staff_id: string; finger_index: number; enrolled_at: string; consent_signed_at: string | null };

function BiometricsManager({ staff }: { staff: StaffEntry[] }) {
  const tt = useT();
  const [rows, setRows] = useState<BiometricRow[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const refresh = async () => {
    if (staff.length === 0) return;
    const ids = staff.map((s) => s.id);
    const { data } = await supabase
      .from("staff_biometrics")
      .select("staff_id, finger_index, enrolled_at, consent_signed_at")
      .in("staff_id", ids);
    setRows(data ?? []);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [staff]);

  const byStaff = useMemo(() => {
    const m = new Map<string, BiometricRow[]>();
    for (const r of rows) {
      const arr = m.get(r.staff_id) ?? [];
      arr.push(r);
      m.set(r.staff_id, arr);
    }
    return m;
  }, [rows]);

  const startEnroll = async (staffId: string) => {
    setEnrolling(staffId);
    try {
      const consent = window.confirm(tt(
        "Hat der Mitarbeiter die Einwilligung zur Speicherung biometrischer Daten (Art. 9 DSGVO) schriftlich erteilt?",
        "Did the employee provide written consent to store biometric data (GDPR Art. 9)?"
      ));
      if (!consent) return;
      const fingerIndex = (byStaff.get(staffId)?.length ?? 0) + 1;
      const res = await enrollFingerprint({ staffId, fingerIndex });
      if (!res.ok) {
        toast.error(tt(`Enrollment fehlgeschlagen: ${res.message}`, `Enrollment failed: ${res.message}`));
        return;
      }
      const { error } = await supabase.from("staff_biometrics").insert({
        staff_id: staffId,
        finger_index: fingerIndex,
        template_encrypted: res.templateEncrypted,
        consent_signed_at: new Date().toISOString(),
        enrolled_by: "tablet",
      });
      if (error) {
        toast.error(tt(`DB-Fehler: ${error.message}`, `DB error: ${error.message}`));
        return;
      }
      toast.success(tt("Fingerabdruck gespeichert", "Fingerprint stored"));
      refresh();
    } finally {
      setEnrolling(null);
    }
  };

  const deleteAll = async (staffId: string) => {
    if (!window.confirm(tt("Alle Fingerabdrücke dieses MA löschen?", "Delete all fingerprints for this employee?"))) return;
    const { error } = await supabase.from("staff_biometrics").delete().eq("staff_id", staffId);
    if (error) { toast.error(error.message); return; }
    toast.success(tt("Biometrie gelöscht", "Biometrics deleted"));
    refresh();
  };

  const enrolledCount = byStaff.size;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
              {tt("Biometrie-Verwaltung", "Biometrics management")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {tt(`${enrolledCount} von ${staff.length} Mitarbeitern enrolled`, `${enrolledCount} of ${staff.length} staff enrolled`)}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          {staff.map((s) => {
            const fingers = byStaff.get(s.id) ?? [];
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${s.color}`}>{s.initials}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {fingers.length === 0
                        ? tt("nicht enrolled", "not enrolled")
                        : tt(`${fingers.length} Finger gespeichert`, `${fingers.length} finger(s) stored`)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {fingers.length === 0 ? (
                    <Badge variant="outline" className="text-[10px]">{tt("offen", "pending")}</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[10px]">{tt("OK", "OK")}</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={enrolling === s.id || fingers.length >= 2}
                    onClick={() => startEnroll(s.id)}
                  >
                    <Fingerprint className="h-3.5 w-3.5 mr-1.5" />
                    {enrolling === s.id ? tt("Lese …", "Reading …") : tt("Enrollen", "Enroll")}
                  </Button>
                  {fingers.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => deleteAll(s.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


/* -------------------- Roster derived from opening hours -------------------- */

function RosterTable({ shifts, closedDays, staff }: { shifts: { key: string; de: string; en: string; time: string }[]; closedDays: DayKey[]; staff: StaffEntry[] }) {
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
    if (staff.length === 0) return [];
    const seed = (day + shiftKey).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const count = Math.min(staff.length, (seed % 3) + 1);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(staff[(seed + i * 3) % staff.length].id);
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
                            const s = staff.find((x) => x.id === id)!;
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
