import { useState, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Activity, Zap, Beer, Gift, Percent, Gem, Music, Pencil,
  ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PUBS, type Pub } from "@/lib/pubs-mock";
import {
  LIVE_OPS, getStatus, tickLive, PUSH_COOLDOWN_MIN, type LiveOps,
} from "@/lib/active-ops-mock";
import { APOLOGY_CREDIT_STEPS } from "@/lib/feedback-mock";
import {
  sendPushCampaign,
  type PushCampaignPreset,
  type PushCampaignAudience,
} from "@/lib/rewards.functions";

type Preset = {
  id: PushCampaignPreset;
  label: string;
  icon: typeof Beer;
  message: string;
  needsCredits?: boolean;
};

const PRESETS: Preset[] = [
  { id: "happy_hour",  label: "Happy Hour",     icon: Beer,    message: "🍻 Happy Hour! Nächste 2 Std. alle Drinks −30%. Komm vorbei!" },
  { id: "free_drink",  label: "Freibier",       icon: Gift,    message: "🎁 Heute Abend ein Freibier auf uns — bis 22 Uhr." },
  { id: "discount_50", label: "50% Rabatt",     icon: Percent, message: "💸 50% auf deine erste Runde, nur heute Abend." },
  { id: "credits",     label: "Credit-Boost",   icon: Gem,     message: "💎 1.000 Credits geschenkt — nur heute, auch für deine Freunde.", needsCredits: true },
  { id: "live_event",  label: "Live-Event",     icon: Music,   message: "🎤 Live-Musik startet gleich — letzte Plätze sichern!" },
  { id: "custom",      label: "Eigene",         icon: Pencil,  message: "" },
];

const AUDIENCE_LABELS: Record<PushCampaignAudience, string> = {
  regulars: "Stammgäste dieser Filiale",
  catchment: "Alle App-Nutzer im Einzugsgebiet (~5 km)",
  checked_in_today: "Gäste, die heute schon eingecheckt waren",
};

function audienceSize(pub: Pub, ops: LiveOps, a: PushCampaignAudience): number {
  if (a === "regulars") return Math.round(ops.pushReachable * 0.45);
  if (a === "catchment") return pub.activeAppUsers;
  return Math.round(ops.liveGuests * 1.2);
}

function fmtTimeAgo(ts: number | null): string | null {
  if (!ts) return null;
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  const h = Math.floor(mins / 60);
  return `vor ${h} Std`;
}

export function ActiveOps() {
  const [live, setLive] = useState<LiveOps[]>(LIVE_OPS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogPub, setDialogPub] = useState<Pub | null>(null);
  const [now, setNow] = useState(new Date());

  // Auto-Refresh: kleine Live-Schwankungen alle 30s
  useEffect(() => {
    const id = setInterval(() => {
      setLive((prev) => prev.map(tickLive));
      setNow(new Date());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const liveByPub = useMemo(
    () => new Map(live.map((l) => [l.pubId, l])),
    [live],
  );

  const summary = useMemo(() => {
    let underCount = 0;
    let utilSum = 0;
    let utilN = 0;
    for (const ops of live) {
      const { status } = getStatus(ops);
      if (status === "under") underCount += 1;
      utilSum += ops.liveGuests / ops.capacity;
      utilN += 1;
    }
    return {
      underCount,
      avgUtil: Math.round((utilSum / Math.max(1, utilN)) * 100),
      totalLive: live.reduce((s, l) => s + l.liveGuests, 0),
    };
  }, [live]);

  const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const handleCampaignSent = (pubId: string) => {
    setLive((prev) =>
      prev.map((l) => (l.pubId === pubId ? { ...l, lastCampaignAt: Date.now() } : l)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header / KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiTile
          icon={Clock}
          label="Live um"
          value={timeStr}
          hint={`${summary.totalLive} Gäste online`}
        />
        <KpiTile
          icon={Activity}
          label="Ø Auslastung"
          value={`${summary.avgUtil}%`}
          tone={summary.avgUtil >= 70 ? "emerald" : summary.avgUtil >= 50 ? "amber" : "rose"}
        />
        <KpiTile
          icon={AlertTriangle}
          label="Pubs unter Ziel"
          value={`${summary.underCount}`}
          suffix={` / ${live.length}`}
          tone={summary.underCount > 0 ? "rose" : "emerald"}
        />
        <KpiTile
          icon={TrendingUp}
          label="Refresh"
          value="alle 30s"
          hint="Live · Mock-Daten"
        />
      </section>

      {/* Tabelle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Live-Status pro Filiale
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Zeile aufklappen für 24-h-Verlauf und Push-Kampagne starten.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Filiale</TableHead>
                <TableHead className="text-right">Live</TableHead>
                <TableHead className="text-right">Ziel</TableHead>
                <TableHead className="text-right">Δ</TableHead>
                <TableHead className="text-right">Auslastung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PUBS.map((pub) => {
                const ops = liveByPub.get(pub.id);
                if (!ops) return null;
                const { status, delta, target } = getStatus(ops);
                const util = Math.round((ops.liveGuests / ops.capacity) * 100);
                const isOpen = expanded === pub.id;
                return (
                  <ExpandableRow
                    key={pub.id}
                    pub={pub}
                    ops={ops}
                    status={status}
                    delta={delta}
                    target={target}
                    util={util}
                    isOpen={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : pub.id)}
                    onOpenCampaign={() => setDialogPub(pub)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {dialogPub && (
        <CampaignDialog
          pub={dialogPub}
          ops={liveByPub.get(dialogPub.id)!}
          onClose={() => setDialogPub(null)}
          onSent={() => {
            handleCampaignSent(dialogPub.id);
            setDialogPub(null);
          }}
        />
      )}
    </div>
  );
}

// --- Sub-Komponenten ---

function KpiTile({
  icon: Icon, label, value, suffix, hint, tone = "default",
}: {
  icon: typeof Activity; label: string; value: string; suffix?: string; hint?: string;
  tone?: "default" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald" ? "text-emerald-600"
    : tone === "amber" ? "text-amber-600"
    : tone === "rose"  ? "text-rose-600"
    : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneClass}`} />
        </div>
        <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>
          {value}{suffix && <span className="text-base text-muted-foreground font-normal">{suffix}</span>}
        </div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, delta }: { status: ReturnType<typeof getStatus>["status"]; delta: number }) {
  if (status === "over") {
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 border-emerald-500/30">Über Ziel · +{delta}</Badge>;
  }
  if (status === "under") {
    return <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15 border-rose-500/30">Unter Ziel · {delta}</Badge>;
  }
  return <Badge variant="secondary">Im Plan</Badge>;
}

function ExpandableRow({
  pub, ops, status, delta, target, util, isOpen, onToggle, onOpenCampaign,
}: {
  pub: Pub; ops: LiveOps;
  status: ReturnType<typeof getStatus>["status"];
  delta: number; target: number; util: number;
  isOpen: boolean; onToggle: () => void; onOpenCampaign: () => void;
}) {
  const cooldown = fmtTimeAgo(ops.lastCampaignAt);
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/40" onClick={onToggle}>
        <TableCell>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell>
          <div className="font-medium">{pub.name}</div>
          <div className="text-xs text-muted-foreground">{pub.city}</div>
        </TableCell>
        <TableCell className="text-right font-semibold">{ops.liveGuests}</TableCell>
        <TableCell className="text-right text-muted-foreground">{target}</TableCell>
        <TableCell className={`text-right font-medium ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-muted-foreground"}`}>
          {delta > 0 ? `+${delta}` : delta}
        </TableCell>
        <TableCell className="text-right">
          <div className="inline-flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${util >= 85 ? "bg-rose-500" : util >= 60 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(100, util)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums w-10 text-right">{util}%</span>
          </div>
        </TableCell>
        <TableCell><StatusBadge status={status} delta={delta} /></TableCell>
        <TableCell className="text-right">
          <Button
            size="sm"
            variant={status === "under" ? "default" : "outline"}
            onClick={(e) => { e.stopPropagation(); onOpenCampaign(); }}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            Push
          </Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={8} className="py-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  24-h Verlauf · Ist (gefüllt) vs. Ziel (Linie)
                </div>
                <HourlyMiniChart ops={ops} />
              </div>
              <div className="text-sm space-y-2 lg:min-w-[220px]">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Kapazität</span>
                  <span className="font-medium">{ops.capacity}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Push erreichbar</span>
                  <span className="font-medium">{ops.pushReachable.toLocaleString("de-DE")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Letzte Kampagne</span>
                  <span className="font-medium">{cooldown ?? "—"}</span>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function HourlyMiniChart({ ops }: { ops: LiveOps }) {
  const hour = new Date().getHours();
  const max = Math.max(ops.capacity, ...ops.hourlyTarget);
  const W = 480, H = 80, pad = 4;
  const barW = (W - pad * 2) / 24;

  // Ist-Punkt nur für aktuelle Stunde, sonst Ziel als "erreicht" simulieren
  const targetPath = ops.hourlyTarget
    .map((v, i) => {
      const x = pad + i * barW + barW / 2;
      const y = H - pad - ((v / max) * (H - pad * 2));
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" role="img" aria-label="Stundenverlauf">
      {ops.hourlyTarget.map((t, i) => {
        const isNow = i === hour;
        const ist = isNow ? ops.liveGuests : Math.round(t * (0.7 + ((i * 13) % 60) / 100));
        const h = (ist / max) * (H - pad * 2);
        const x = pad + i * barW;
        const y = H - pad - h;
        return (
          <rect
            key={i}
            x={x + 1} y={y} width={barW - 2} height={h}
            className={isNow ? "fill-primary" : "fill-muted-foreground/25"}
            rx={1}
          />
        );
      })}
      <path d={targetPath} className="stroke-primary/70 fill-none" strokeWidth={1.5} strokeDasharray="3 3" />
    </svg>
  );
}

function CampaignDialog({
  pub, ops, onClose, onSent,
}: {
  pub: Pub; ops: LiveOps; onClose: () => void; onSent: () => void;
}) {
  const [presetId, setPresetId] = useState<PushCampaignPreset>("happy_hour");
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const [message, setMessage] = useState(preset.message);
  const [audience, setAudience] = useState<PushCampaignAudience>("regulars");
  const [validHours, setValidHours] = useState(2);
  const [credits, setCredits] = useState<number>(1000);
  const [sending, setSending] = useState(false);

  const cooldownMin = ops.lastCampaignAt
    ? Math.round((Date.now() - ops.lastCampaignAt) / 60000)
    : null;
  const inCooldown = cooldownMin !== null && cooldownMin < PUSH_COOLDOWN_MIN;

  const handlePreset = (id: PushCampaignPreset) => {
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id)!;
    if (id !== "custom") setMessage(p.message);
  };

  const reach = audienceSize(pub, ops, audience);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendPushCampaign({
        pubId: pub.id,
        preset: presetId,
        message,
        audience,
        validHours,
        credits: preset.needsCredits ? credits : undefined,
      });
      toast.success(`Push gesendet · ${pub.name}`, {
        description: `${reach.toLocaleString("de-DE")} Empfänger · gültig ${validHours}h`,
      });
      onSent();
    } catch {
      toast.error("Versand fehlgeschlagen");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Push-Kampagne · {pub.name}
          </DialogTitle>
          <DialogDescription>
            Live: {ops.liveGuests} Gäste · {pub.city}
          </DialogDescription>
        </DialogHeader>

        {inCooldown && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-amber-700">Kunden nicht ermüden</div>
              <div className="text-amber-700/80">
                Letzte Kampagne vor {cooldownMin} Min. Empfohlen: mind. {PUSH_COOLDOWN_MIN} Min Pause.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Vorlage</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const active = p.id === presetId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePreset(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition ${
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {preset.needsCredits && (
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Credits</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {APOLOGY_CREDIT_STEPS.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={credits === c ? "default" : "outline"}
                    onClick={() => {
                      setCredits(c);
                      setMessage(`💎 ${c.toLocaleString("de-DE")} Credits geschenkt — nur heute, auch für deine Freunde.`);
                    }}
                  >
                    {c.toLocaleString("de-DE")}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="msg" className="text-xs uppercase tracking-wide text-muted-foreground">
              Push-Nachricht
            </Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-2"
              placeholder="Was möchtest du den Gästen sagen?"
            />
            <div className="text-xs text-muted-foreground mt-1">{message.length} Zeichen</div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Reichweite</Label>
            <RadioGroup
              value={audience}
              onValueChange={(v) => setAudience(v as PushCampaignAudience)}
              className="mt-2 space-y-1"
            >
              {(Object.keys(AUDIENCE_LABELS) as PushCampaignAudience[]).map((a) => (
                <label key={a} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted/40">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={a} id={`a-${a}`} />
                    <span className="text-sm">{AUDIENCE_LABELS[a]}</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ~{audienceSize(pub, ops, a).toLocaleString("de-DE")}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Gültigkeit</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 4].map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={validHours === h ? "default" : "outline"}
                  onClick={() => setValidHours(h)}
                >
                  {h}h
                </Button>
              ))}
              <Button
                size="sm"
                variant={validHours === 99 ? "default" : "outline"}
                onClick={() => setValidHours(99)}
              >
                bis Ladenschluss
              </Button>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Vorschau</div>
            <div className="text-sm font-medium">{pub.name}</div>
            <div className="text-sm text-muted-foreground">{message || "—"}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Abbrechen</Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            <Zap className="h-4 w-4 mr-1" />
            {sending ? "Sende…" : `An ${reach.toLocaleString("de-DE")} senden`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
