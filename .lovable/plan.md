## Ziel

Neuer HQ-Bereich **„Data Settings“**, in dem pro Pub geschäftsrelevante Stammdaten gepflegt werden (Personalkosten, Mietkosten, Sitzplätze, gewünschte Auslastung je Öffnungsstunde). Persistiert in Lovable Cloud, damit später echte Berechnungen darauf aufbauen können.

## Datenmodell (Lovable Cloud)

Neue Tabelle `pub_settings`:
- `pub_id` (text, PK) — referenziert die IDs aus `PUBS` (`crown-anchor`, `red-lion`, …)
- `staff_costs_monthly` (numeric) — Personalkosten in EUR / Monat
- `rent_monthly` (numeric) — Mietkosten in EUR / Monat
- `seats` (integer) — Sitzplätze gesamt
- `opening_hour` (integer 0–23) — Start Öffnungszeit
- `closing_hour` (integer 1–24) — Ende Öffnungszeit
- `occupancy_targets` (jsonb) — `{ "17": 40, "18": 60, "19": 80, ... }` — Ziel-Auslastung in % je Stunde
- `created_at`, `updated_at`

RLS:
- Demo-Modus, kein Auth → öffentliche `SELECT`/`INSERT`/`UPDATE` Policies (konsistent zur bestehenden `feedbacks`-Tabelle).
- Kein `DELETE`.

## Server Functions (`src/lib/pub-settings.functions.ts`)

- `getPubSettings(pubId)` — liest die Settings eines Pubs; gibt `null` zurück wenn noch nicht angelegt.
- `getAllPubSettings()` — alle Settings auf einmal (für Übersicht / Default-Werte).
- `upsertPubSettings({ pubId, ... })` — Upsert mit Zod-Validierung (Beträge ≥ 0, Stunden 0–24, Auslastungs-% 0–100).

Verwendet `supabaseAdmin` (Demo, keine Auth) — gleicher Pattern wie woanders im Projekt.

## UI

### Sidebar (`src/routes/hq.index.tsx`)
- Neuer Eintrag **„Data Settings“** ganz unten (Icon `Settings`, vor dem Admin-Link), gekoppelt an `tab: "settings"`.

### Tab-Leiste
- Neuer `TabsTrigger value="settings"` mit Settings-Icon.

### Neue Komponente `src/components/data-settings.tsx`
Layout:
- Links: schlanke Pub-Auswahl-Liste (alle Pubs aus `PUBS`, aktiver Pub hervorgehoben).
- Rechts: Formular mit drei Sektionen:
  1. **Kosten** — Personalkosten / Monat, Miete / Monat (Number-Inputs mit EUR-Suffix).
  2. **Kapazität** — Sitzplätze, Öffnungs- und Schließstunde (Selects 0–24).
  3. **Ziel-Auslastung pro Stunde** — dynamisch aus Öffnung→Schließung generiert, je Stunde ein Slider 0–100 % mit aktuellem Wert daneben.
- Footer: „Speichern“-Button (deaktiviert wenn nichts geändert), „Zurücksetzen“-Button, Toast bei Erfolg.

Datenfluss:
- `useQuery` lädt `getAllPubSettings()` einmal.
- Beim Pub-Wechsel: Formular-State aus Cache befüllen, fehlende Werte mit sinnvollen Defaults (z. B. 50 Sitzplätze, 17–24 Uhr, 60 % Ziel pro Stunde).
- Beim Speichern: `upsertPubSettings` + Query invalidieren.

### Auth-Wiring
- `attachSupabaseAuth` in `src/start.ts` prüfen/ergänzen (für später, schadet jetzt nicht).

## Nicht im Scope
- Keine Anbindung an bestehende KPI-Karten (Score etc. bleiben Mock-basiert) — das passiert in einem späteren Schritt, wenn echte Verbrauchsdaten verdrahtet werden.
- Keine globalen Defaults / Override-Mechanik (User-Wahl: nur pro Pub).
- Keine Historie/Versionierung der Settings.
