import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Save, RotateCcw, Loader2, Euro, Users as UsersIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PUBS } from "@/lib/pubs-mock";
import { supabase } from "@/integrations/supabase/client";

type PubSettings = {
  pub_id: string;
  month: string;
  staff_costs_monthly: number;
  rent_monthly: number;
  revenue_target_monthly: number;
  active_users_target: number;
  seats: number;
  opening_hour: number;
  closing_hour: number;
  occupancy_targets: Record<string, number>;
};

const DEFAULTS: Omit<PubSettings, "pub_id" | "month"> = {
  staff_costs_monthly: 18000,
  rent_monthly: 4500,
  revenue_target_monthly: 45000,
  active_users_target: 500,
  seats: 60,
  opening_hour: 17,
  closing_hour: 24,
  occupancy_targets: { "17": 30, "18": 50, "19": 70, "20": 85, "21": 90, "22": 80, "23": 60 },
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthOptions(): string[] {
  const out: string[] = [];
  const now = new Date();
  // 12 past, current, 3 future
  for (let i = -12; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function monthLabel(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}


function buildHours(open: number, close: number): number[] {
  const hours: number[] = [];
  // close exclusive (24 = midnight). If close <= open we wrap not needed for pubs (17–24).
  const end = close <= open ? open + 1 : close;
  for (let h = open; h < end; h++) hours.push(h % 24);
  return hours;
}

function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function DataSettings() {
  const [selectedPubId, setSelectedPubId] = useState(PUBS[0].id);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [allSettings, setAllSettings] = useState<Record<string, PubSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  type FormState = Omit<PubSettings, "pub_id" | "month">;

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [initial, setInitial] = useState<FormState>(DEFAULTS);

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const key = (pubId: string, month: string) => `${pubId}__${month}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("pub_settings").select("*");
      if (cancelled) return;
      if (error) {
        toast.error("Settings konnten nicht geladen werden", { description: error.message });
      } else if (data) {
        const map: Record<string, PubSettings> = {};
        for (const row of data) {
          const r = row as any;
          map[key(r.pub_id, r.month)] = {
            ...r,
            occupancy_targets: (r.occupancy_targets as Record<string, number>) ?? {},
          } as PubSettings;
        }
        setAllSettings(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const existing = allSettings[key(selectedPubId, selectedMonth)];
    const next: FormState = existing
      ? {
          staff_costs_monthly: Number(existing.staff_costs_monthly),
          rent_monthly: Number(existing.rent_monthly),
          revenue_target_monthly: Number(existing.revenue_target_monthly ?? 0),
          active_users_target: Number(existing.active_users_target ?? 0),
          seats: existing.seats,
          opening_hour: existing.opening_hour,
          closing_hour: existing.closing_hour,
          occupancy_targets: existing.occupancy_targets ?? {},
        }
      : { ...DEFAULTS };
    setForm(next);
    setInitial(next);
  }, [selectedPubId, selectedMonth, allSettings]);

  const hours = useMemo(() => buildHours(form.opening_hour, form.closing_hour), [form.opening_hour, form.closing_hour]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  function updateOccupancy(hour: number, value: number) {
    setForm((f) => ({
      ...f,
      occupancy_targets: { ...f.occupancy_targets, [String(hour)]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    const trimmed: Record<string, number> = {};
    for (const h of hours) {
      trimmed[String(h)] = form.occupancy_targets[String(h)] ?? 60;
    }
    const payload = {
      pub_id: selectedPubId,
      month: selectedMonth,
      staff_costs_monthly: form.staff_costs_monthly,
      rent_monthly: form.rent_monthly,
      revenue_target_monthly: form.revenue_target_monthly,
      active_users_target: form.active_users_target,
      seats: form.seats,
      opening_hour: form.opening_hour,
      closing_hour: form.closing_hour,
      occupancy_targets: trimmed,
    };
    const { error } = await supabase
      .from("pub_settings")
      .upsert(payload, { onConflict: "pub_id,month" });
    setSaving(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen", { description: error.message });
      return;
    }
    toast.success("Settings gespeichert");
    setAllSettings((prev) => ({
      ...prev,
      [key(selectedPubId, selectedMonth)]: { ...payload, occupancy_targets: trimmed } as PubSettings,
    }));
  }

  function handleReset() {
    setForm(initial);
  }

  const selectedPub = PUBS.find((p) => p.id === selectedPubId)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Pub list */}
      <Card className="shadow-sm h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Pubs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            {PUBS.map((p) => {
              const active = p.id === selectedPubId;
              const hasData = Object.keys(allSettings).some((k) => k.startsWith(`${p.id}__`));
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPubId(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    {hasData && <span className="text-[10px] text-emerald-600 shrink-0">●</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.city}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{selectedPub.name}</h2>
            <p className="text-xs text-muted-foreground">
              Stammdaten für Kalkulationen — überschreibt Mock-Werte, sobald gespeichert.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty || saving}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Zurücksetzen
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving || loading}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Speichern
            </Button>
          </div>
        </div>

        {loading ? (
          <Card><CardContent className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>
        ) : (
          <>
            {/* Kosten */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Euro className="h-4 w-4 text-amber-600" />
                  Kosten
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="revenue">Umsatzziel / Monat</Label>
                  <div className="relative">
                    <Input
                      id="revenue"
                      type="number"
                      min={0}
                      step={500}
                      value={form.revenue_target_monthly}
                      onChange={(e) => setForm((f) => ({ ...f, revenue_target_monthly: Number(e.target.value) || 0 }))}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">EUR</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff">Personalkosten / Monat</Label>
                  <div className="relative">
                    <Input
                      id="staff"
                      type="number"
                      min={0}
                      step={100}
                      value={form.staff_costs_monthly}
                      onChange={(e) => setForm((f) => ({ ...f, staff_costs_monthly: Number(e.target.value) || 0 }))}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">EUR</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rent">Miete / Monat</Label>
                  <div className="relative">
                    <Input
                      id="rent"
                      type="number"
                      min={0}
                      step={100}
                      value={form.rent_monthly}
                      onChange={(e) => setForm((f) => ({ ...f, rent_monthly: Number(e.target.value) || 0 }))}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">EUR</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kapazität */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-primary" />
                  Kapazität & Öffnungszeit
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="seats">Sitzplätze gesamt</Label>
                  <Input
                    id="seats"
                    type="number"
                    min={0}
                    step={1}
                    value={form.seats}
                    onChange={(e) => setForm((f) => ({ ...f, seats: Math.max(0, parseInt(e.target.value) || 0) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Öffnung</Label>
                  <Select
                    value={String(form.opening_hour)}
                    onValueChange={(v) => setForm((f) => ({ ...f, opening_hour: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem key={h} value={String(h)}>{hourLabel(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Schließung</Label>
                  <Select
                    value={String(form.closing_hour)}
                    onValueChange={(v) => setForm((f) => ({ ...f, closing_hour: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                        <SelectItem key={h} value={String(h)}>{h === 24 ? "24:00" : hourLabel(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ziel-Auslastung */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Ziel-Auslastung pro Stunde
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Wunsch-Auslastung in % je Öffnungsstunde — Basis für spätere Performance-Berechnungen.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {hours.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bitte Öffnungs- und Schließzeit setzen.</p>
                ) : (
                  hours.map((h) => {
                    const val = form.occupancy_targets[String(h)] ?? 60;
                    return (
                      <div key={h} className="grid grid-cols-[80px_1fr_60px] items-center gap-4">
                        <span className="text-sm font-mono tabular-nums text-muted-foreground">
                          {hourLabel(h)}
                        </span>
                        <Slider
                          value={[val]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(v) => updateOccupancy(h, v[0])}
                        />
                        <span className={`text-sm font-semibold tabular-nums text-right ${
                          val >= 80 ? "text-emerald-600" : val >= 50 ? "text-foreground" : "text-amber-600"
                        }`}>
                          {val}%
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
