import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plug, RefreshCw, CheckCircle2, AlertCircle, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";

/**
 * P&I LogaHR Integration (Mock).
 * Reine UI/Konfigurations-Oberfläche — der tatsächliche Connector wird später angebunden.
 * Speichert Status in localStorage, damit der "verbunden"-Zustand zwischen Sessions hält.
 */
const STORAGE_KEY = "pubgo.pi-hr.config";

type PIConfig = {
  connected: boolean;
  baseUrl: string;
  tenant: string;
  autoSync: boolean;
  lastSyncAt: string | null;
  syncedEmployees: number;
};

const DEFAULT: PIConfig = {
  connected: false,
  baseUrl: "https://api.pi-loga.de/v1",
  tenant: "",
  autoSync: true,
  lastSyncAt: null,
  syncedEmployees: 0,
};

function load(): PIConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}
function save(c: PIConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function PIHRIntegration() {
  const tt = useT();
  const [cfg, setCfg] = useState<PIConfig>(() => load());
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<PIConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    save(next);
  };

  const connect = async () => {
    if (!cfg.tenant || !apiKey) {
      toast.error(tt("Bitte Tenant-ID & API-Key eingeben", "Please enter tenant ID & API key"));
      return;
    }
    setBusy(true);
    // Mock-Latenz — später echter Handshake
    await new Promise((r) => setTimeout(r, 800));
    update({ connected: true, lastSyncAt: new Date().toISOString(), syncedEmployees: 47 });
    setApiKey("");
    setBusy(false);
    toast.success(tt("Mit P&I LogaHR verbunden", "Connected to P&I LogaHR"));
  };

  const disconnect = () => {
    update({ connected: false, lastSyncAt: null, syncedEmployees: 0 });
    toast.success(tt("Verbindung getrennt", "Disconnected"));
  };

  const sync = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    update({ lastSyncAt: new Date().toISOString(), syncedEmployees: 47 + Math.floor(Math.random() * 5) });
    setBusy(false);
    toast.success(tt("Mitarbeiterdaten synchronisiert", "Employee data synced"));
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" />
            {tt("HR-System: P&I LogaHR", "HR system: P&I LogaHR")}
            {cfg.connected ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />{tt("Verbunden", "Connected")}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300">
                <AlertCircle className="h-3 w-3 mr-1" />{tt("Nicht verbunden", "Not connected")}
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {tt(
              "Importiert alle Mitarbeiterstammdaten (Name, Rolle, Vertrag, Pub-Zuordnung) aus P&I in Pub Ops.",
              "Pulls all employee master data (name, role, contract, pub assignment) from P&I into Pub Ops.",
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pi-base">{tt("API Base URL", "API base URL")}</Label>
              <Input id="pi-base" value={cfg.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })} disabled={cfg.connected} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pi-tenant">{tt("Tenant-ID / Mandant", "Tenant ID")}</Label>
              <Input id="pi-tenant" placeholder="z. B. pubops-prod" value={cfg.tenant} onChange={(e) => update({ tenant: e.target.value })} disabled={cfg.connected} />
            </div>
          </div>

          {!cfg.connected && (
            <div className="space-y-1.5">
              <Label htmlFor="pi-key">{tt("API-Key", "API key")}</Label>
              <Input id="pi-key" type="password" placeholder="••••••••" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">
                {tt("Wird nach der Verbindung verschlüsselt im Backend gespeichert.", "Stored encrypted in the backend after connecting.")}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <div className="text-sm font-medium">{tt("Automatische Synchronisation", "Auto sync")}</div>
              <div className="text-[11px] text-muted-foreground">{tt("Täglich um 03:00 Uhr Mitarbeiterstammdaten abgleichen.", "Sync employee data daily at 03:00.")}</div>
            </div>
            <Switch checked={cfg.autoSync} onCheckedChange={(v) => update({ autoSync: v })} />
          </div>

          <div className="flex flex-wrap gap-2">
            {cfg.connected ? (
              <>
                <Button size="sm" onClick={sync} disabled={busy}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${busy ? "animate-spin" : ""}`} />
                  {tt("Jetzt synchronisieren", "Sync now")}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={disconnect}>
                  {tt("Verbindung trennen", "Disconnect")}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={connect} disabled={busy}>
                <Plug className="h-3.5 w-3.5 mr-1.5" />
                {tt("Verbinden", "Connect")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {cfg.connected && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tt("Sync-Status", "Sync status")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{tt("Mitarbeiter", "Employees")}</div>
              <div className="text-lg font-semibold tabular-nums mt-1">{cfg.syncedEmployees}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{tt("Pubs zugeordnet", "Pubs mapped")}</div>
              <div className="text-lg font-semibold tabular-nums mt-1">12</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3" />{tt("Letzter Sync", "Last sync")}</div>
              <div className="text-sm font-medium mt-1">{cfg.lastSyncAt ? new Date(cfg.lastSyncAt).toLocaleString() : "—"}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
