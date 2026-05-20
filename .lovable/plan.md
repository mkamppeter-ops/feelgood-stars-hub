## Ziel

Ein neuer Tab **„Active Ops"** im HQ-Dashboard, in dem du auf einen Blick siehst:
- wie viele eingeloggte App-Nutzer gerade **im** jedem Pub sind,
- wie das gegen den **Ziel-Wert für die aktuelle Uhrzeit** abschneidet,
- und in **Pubs mit zu wenig Gästen** sofort eine **Push-Kampagne** abfeuern kannst (Happy Hour, Freibier, 50% Rabatt, Credit-Geschenk, freier Text).

## Wo es lebt

Neuer Tab in `src/routes/hq.index.tsx` zwischen „Overview" und „Sales & Operations":

```
Overview | Active Ops | Sales & Operations | Sortiment | Events | Feedback
```

Implementierung als neue Komponente `src/components/active-ops.tsx`, plus Mock-Daten in `src/lib/active-ops-mock.ts`.

## Datenmodell (Mock)

Erweiterung pro Pub um Live- & Ziel-Daten:

```text
liveGuests        — aktuell eingecheckte App-Nutzer im Pub
capacity          — max. Kapazität (für Auslastung in %)
hourlyTarget[24]  — Ziel-Gästezahl je Stunde (Wochentag-aware, Mock-Kurve)
pushReachable     — App-Nutzer im Einzugsgebiet, die jetzt erreichbar sind
lastCampaignAt    — Cooldown-Anker (kein Spam)
```

Stunden-Ziel-Kurve: typisches Pub-Profil (Mittag flach, Peak 19–22 Uhr, Wochenende verschoben).

## UI / Layout

```text
┌─ Active Ops ─────────────────────────────────────────────┐
│  Live um 19:42 · Ø Auslastung 64% · 3 Pubs unter Ziel    │
│  [ Stundenziel-Kurve aller Pubs · Sparkline ]            │
├──────────────────────────────────────────────────────────┤
│  Filiale          Live   Ziel   Δ     Auslastung  Status │
│  Crown & Anchor    78     70   +8     87%        Über    │
│  Red Lion          42     60  −18     53%        Unter ▾ │
│    └ [Happy Hour] [Freibier] [50% Rabatt] [Credits] […]  │
│  Foggy Dog         55     55    0     69%        Im Plan │
│  …                                                       │
└──────────────────────────────────────────────────────────┘
```

- Zeile **klickbar/aufklappbar**: zeigt 24-h-Mini-Kurve (Ist vs. Ziel) plus Push-Aktionsleiste.
- **Status-Badges**: `Über Ziel` (grün), `Im Plan` (neutral), `Unter Ziel` (rot, mit Δ).
- **Header-KPIs**: aktuelle Uhrzeit, Ø Auslastung, Anzahl Pubs unter Ziel, geplante Kampagnen heute.
- Auto-Refresh-Indikator („Live · alle 30s") — im Mock per Interval simuliert.

## Push-Kampagnen-Flow

Aus der aufgeklappten Pub-Zeile öffnet sich ein Dialog mit Presets + freiem Feld:

**Presets** (Buttons mit Icon, eine Spalte mit Vorschau):
1. 🍻 **Happy Hour** — „Nächste 2 Std. alle Drinks −30%."
2. 🎁 **Freibier** — „Heute Abend ein Freibier auf uns — bis 22 Uhr."
3. 💸 **50% Rabatt** — „50% auf deine erste Runde, nur heute."
4. 💎 **Credit-Boost** — „1.000 Credits geschenkt — nur für heute, auch für deine Freunde."
5. 🎤 **Live-Event** — „Live-Musik startet gleich — letzte Plätze."
6. ✍️ **Eigene Nachricht** — Freitext.

**Dialog-Felder:**
- Preset-Auswahl (oder Freitext)
- **Reichweite** (Slider/Radio):
  - „Stammgäste dieser Filiale" (Default — höchste Konversion)
  - „Alle App-Nutzer im Einzugsgebiet (~5 km)"
  - „Nur Gäste, die heute schon eingecheckt waren"
- **Gültigkeitsdauer**: 1h / 2h / bis Ladenschluss
- Bei „Credit-Boost": **Credit-Stufe** wiederverwenden (100…10.000) aus `APOLOGY_CREDIT_STEPS`
- **Cooldown-Check**: Wenn dieser Pub in den letzten 90 Min schon eine Push abgefeuert hat → Warnhinweis („Kunden nicht ermüden — letzte Kampagne vor 38 Min").
- **Vorschau** der Push-Nachricht inkl. Pub-Name und CTA.
- Bestätigen sendet via neuer Mock-Funktion `sendPushCampaign(...)` in `src/lib/rewards.functions.ts`.

## Backend-Stubs (Mock, Pattern wie bestehende `rewards.functions.ts`)

```ts
// src/lib/rewards.functions.ts (erweitern)
export type PushCampaignInput = {
  pubId: string;
  preset: "happy_hour" | "free_drink" | "discount_50" | "credits" | "live_event" | "custom";
  message: string;
  audience: "regulars" | "catchment" | "checked_in_today";
  validHours: number;
  credits?: number; // nur bei preset=credits
};
export async function sendPushCampaign(input: PushCampaignInput) { /* mock */ }
```

Später als `createServerFn` mit FCM/APNS-Versand realisierbar — heute Mock + Toast-Bestätigung wie beim Apology-Flow.

## Technische Details

- Neue Datei: `src/lib/active-ops-mock.ts` — exportiert `LIVE_OPS` (pro Pub: liveGuests, capacity, hourlyTarget, pushReachable, lastCampaignAt) plus `getCurrentHourTarget(pub)` und `getStatus(pub)`.
- Neue Datei: `src/components/active-ops.tsx` — Hauptkomponente mit Header-KPIs, Tabelle, expandable Rows, Dialog.
- Optional Sub-Komponenten: `LiveStatusBadge`, `HourlyMiniChart` (24 SVG-Bars, Ist vs. Ziel), `PushCampaignDialog`.
- `src/routes/hq.index.tsx`: neuen `TabsTrigger` + `TabsContent value="active-ops"` einfügen, Icon `Activity` oder `Zap` aus lucide-react.
- Auto-Refresh: `useEffect` mit `setInterval(30_000)` → mockt kleine Live-Schwankungen (±5%).
- State lokal in der Komponente — Kampagnen-Verlauf in einem `Map<pubId, lastCampaignAt>`.
- Design-Tokens aus `src/styles.css` verwenden, keine Hex-Werte hardcoden.

## Was bleibt unverändert

- Bestehende Tabs, Komponenten und Routen.
- Bestehender Apology- und Google-Review-Flow.
- `src/lib/pubs-mock.ts` wird **nicht** geändert — Live-Daten kommen aus der neuen Mock-Datei und werden per `pubId` gejoint.
