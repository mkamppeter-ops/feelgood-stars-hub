import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileText, Calendar, Info, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportStammdaten, exportMonatsStunden } from "@/lib/payroll-export";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PayrollExport() {
  const [month, setMonth] = useState(currentMonth());
  const [busyStamm, setBusyStamm] = useState(false);
  const [busyStd, setBusyStd] = useState(false);
  const [lastStammResult, setLastStammResult] = useState<{ count: number; missingFields: string[] } | null>(null);
  const [lastStdResult, setLastStdResult] = useState<{ count: number; totalHours: number; missingPersonnelNumbers: string[] } | null>(null);

  const runStammdaten = async () => {
    setBusyStamm(true);
    try {
      const r = await exportStammdaten();
      setLastStammResult(r);
      toast.success(`${r.count} Mitarbeiter exportiert`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export fehlgeschlagen");
    } finally {
      setBusyStamm(false);
    }
  };

  const runStunden = async () => {
    setBusyStd(true);
    try {
      const r = await exportMonatsStunden(month);
      setLastStdResult(r);
      toast.success(`${r.count} Zeilen · ${r.totalHours} Std exportiert`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export fehlgeschlagen");
    } finally {
      setBusyStd(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs leading-relaxed">
          Pub Ops verwaltet alle Mitarbeiterstammdaten <strong>selbst</strong>. Die monatliche Lohnabrechnung läuft
          über die <strong>Supervista-Lohnbuchhaltung</strong> (P&amp;I LogaHR, Mandant Pub&amp;Go). Hier erzeugst du
          die CSV-Dateien für den Import. Format: CSV / Semikolon / UTF-8 mit BOM (öffnet sauber in dt. Excel & P&amp;I).
        </AlertDescription>
      </Alert>

      {/* Stammdaten */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Stammdaten-Export
            <Badge variant="outline" className="ml-auto">bei Neueinstellung / Änderung</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Eine Zeile pro aktivem Mitarbeiter mit allen lohnrelevanten Feldern: Personalnr., Adresse, IBAN,
            Steuer-ID, SV-Nr., Krankenkasse, Steuerklasse, Vertragsart, Stundenlohn, Eintritt/Austritt, Kostenstelle.
          </p>
          <Button onClick={runStammdaten} disabled={busyStamm}>
            {busyStamm ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            Stammdaten-CSV erzeugen
          </Button>
          {lastStammResult && (
            <div className="text-xs space-y-1.5 pt-2 border-t">
              <div className="text-muted-foreground">
                Zuletzt exportiert: <span className="font-medium text-foreground">{lastStammResult.count}</span> Mitarbeiter
              </div>
              {lastStammResult.missingFields.length > 0 && (
                <div className="flex items-start gap-1.5 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Fehlende Felder: {lastStammResult.missingFields.join(", ")}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stunden */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Monats-Stunden-Export
            <Badge variant="outline" className="ml-auto">zum Monatsende</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Aggregiert alle Schichten aus dem gewählten Monat. Eine Zeile pro Mitarbeiter × Tag mit Stunden,
            Lohnart-Schlüssel (100 = Normal, 110 = Nacht, 120 = Sonntag) und Kostenstelle.
          </p>
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Abrechnungsmonat</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
            </div>
            <Button onClick={runStunden} disabled={busyStd}>
              {busyStd ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
              Stunden-CSV erzeugen
            </Button>
          </div>
          {lastStdResult && (
            <div className="text-xs space-y-1.5 pt-2 border-t">
              <div className="text-muted-foreground">
                Zuletzt: <span className="font-medium text-foreground">{lastStdResult.count}</span> Zeilen ·{" "}
                <span className="font-medium text-foreground">{lastStdResult.totalHours}</span> Stunden gesamt
              </div>
              {lastStdResult.missingPersonnelNumbers.length > 0 && (
                <div className="flex items-start gap-1.5 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Übersprungen (keine Personalnummer):</div>
                    <div>{lastStdResult.missingPersonnelNumbers.join(", ")}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-dashed">
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground">Mit Supervista-Lohnbuchhaltung abstimmen:</div>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Genaues P&amp;I-Importformat (Spalten-Reihenfolge, Trennzeichen, Codepage)</li>
            <li>Lohnart-Schlüssel (Nacht-, Sonntags-, Feiertagszuschlag)</li>
            <li>Kostenstellen-Schema pro Pub (Pflege in Pub-Einstellungen)</li>
            <li>Personalnummernkreis für Pub&amp;Go</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
