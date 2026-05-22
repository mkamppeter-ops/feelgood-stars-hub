# Personalplan / Schichten

Einfache Wochenplanung für jede Bar, plus HQ-Übersicht über alle Bars. Lead: Felix&Paul.

## Datenmodell (Supabase)

Neue Tabellen:

- `staff_members` – Mitarbeiter pro Pub
  - `pub_id` (text), `first_name`, `last_name`, `role` (z.B. „Bar", „Service", „Küche"), `active` (bool), `pi_external_id` (text, nullable – später für P&I-Sync)
- `shift_assignments` – konkrete Schicht eines Mitarbeiters
  - `pub_id`, `staff_id` (uuid), `date` (date), `slot` (text: `early` | `late` | `night`), `start_time` (time), `end_time` (time), `note` (text, optional)
  - Unique: (`staff_id`, `date`, `slot`)

RLS: Public read/insert/update/delete – konsistent mit den anderen Tabellen in diesem Mock-Setup.

Stammdaten kommen später aus P&I (Integration steht schon in Data Settings). Vorerst: manuelle Pflege + Seed-Daten.

## Service-Layer

`src/lib/staff-schedule.ts` mit Funktionen:
- `listStaff(pubId)`, `upsertStaff(...)`, `deactivateStaff(id)`
- `listShifts(pubId, weekStart)` → liefert alle Assignments einer Woche
- `upsertShift(...)`, `deleteShift(id)`
- `listAllShifts(weekStart)` für HQ-Übersicht

## Pub-Ansicht: neuer Tab „Personalplan"

`src/components/pub/staff-schedule.tsx`, eingehängt in `src/routes/pub.tsx` (Icon `CalendarDays` oder `Users`).

UI:
- Wochen-Navigator (KW vor/zurück, „Heute"-Button)
- Tabellen-Grid: Zeilen = Mitarbeiter, Spalten = Mo–So
- Pro Zelle bis zu 3 Slots (Früh / Spät / Nacht) als kleine Chips mit Uhrzeit
- Klick auf Zelle → Dialog: Slot wählen, Start/Ende, Notiz, Speichern/Löschen
- Button „Mitarbeiter verwalten" → kleine Liste zum Hinzufügen/Deaktivieren (bis P&I-Sync läuft)
- Summenzeile unten: geplante Stunden je Tag

## HQ-Ansicht: neuer Tab „Personalplan"

`src/components/hq/staff-overview.tsx`, eingehängt in `src/routes/hq.index.tsx` (Icon `CalendarDays`).

UI:
- Wochen-Navigator
- Tabelle: Zeile = Pub, Spalten = Mo–So, Zelle zeigt Anzahl geplanter Schichten + Gesamtstunden
- Klick auf Zelle → Drilldown-Dialog mit der Namensliste je Slot
- KPI-Leiste oben: gesamte Schichten / Stunden / unbesetzte Slots (Pubs ohne Plan diese Woche)
- Read-only aus HQ-Sicht (HQ plant nicht für die Bars)

## Rollen / Lead

`src/lib/auth-mock.ts`:
- Eintrag `staff: "felix_paul"` in `TAB_OWNER` (analog zu den anderen Tabs)
- Topbar im HQ zeigt entsprechend „Lead: Felix&Paul" für diesen Tab

## P&I-Hook (Vorbereitung, kein echter Sync)

In `staff-schedule.ts` einen Stub `syncStaffFromPI(pubId)` anlegen, der heute nichts tut, aber an die bestehende `PIHRIntegration`-Komponente angebunden werden kann. So bleibt der spätere echte Sync ein kleiner Schritt.

## Nicht enthalten (bewusst out of scope)

- Tausch-Anfragen, Krankmeldungen, Pausen, Überstundenkonten
- Mitarbeiter-Login / „Wann arbeite ich?"-View
- Echte Rückspielung an P&I
- Kostenrechnung gegen `staff_costs_monthly`

Können wir nachziehen, sobald die Basis steht.
