# Operatives Intranet für /pub

Erweiterung der bestehenden `/pub`-Route um vier neue Bereiche per Tab-Navigation. **Keine Änderungen** an Login, `/hq` oder bestehenden Umsatz-Dashboards. Sichtbar für alle /pub-Nutzer (Manager + Staff). Vollständig bilingual (DE/EN) über den bestehenden `useT()`-Helper.

## Tab-Struktur in /pub

Die aktuelle innere `Tabs`-Komponente (Sales / Feedback) wird in eine übergeordnete Top-Level-Tableiste eingebettet:

```text
[ Dashboard ] [ HQ Connect ] [ Academy ] [ Marketing Hub ] [ Team & HR ]
```

- "Dashboard" enthält den heutigen Inhalt unverändert (Gamification-Hero, Mini-KPIs, Sales/Feedback-Sub-Tabs).
- Im Staff-Modus bleibt der bisherige Reviews-Only-View als Default, die 4 neuen Tabs sind zusätzlich erreichbar.
- Tab-State über URL-Search-Param `tab=` (deep-linkbar), Default `dashboard`.

## 1. HQ Connect — Support & Tickets

- Header: Titel + Button **„Neues Ticket"** (öffnet Dialog mit Kategorie-Select: IT / HR / Facility / Logistik, Titel, Beschreibung, Priorität).
- Kanban-Board mit 3 Spalten: **Offen**, **In Bearbeitung**, **Gelöst** (Status-Badges in den bekannten Ampelfarben des Designsystems).
- Ticket-Karten zeigen: Kategorie-Icon, Titel, Kurzbeschreibung, Ersteller, Zeitstempel, Priority-Dot.
- Mock-Daten: ~8 Tickets über die Spalten verteilt. State lokal in React (kein Backend), Karten per simplem Status-Wechsel-Menü verschiebbar.

## 2. Pub&Go Academy — Training & Rewards

- Gamification-Banner oben: **„Dein Punktestand: 450 🪙"** + Button **„Belohnungen"** (öffnet Dialog mit Mock-Reward-Liste: Gutscheine, Merch, freie Schicht).
- Grid (3-spaltig auf Desktop, 1 auf Mobile) mit Trainings-Karten:
  - Cover-Thumbnail, Titel (z. B. *Kassensystem 101*, *Perfekt Zapfen*, *Hygiene-Basics*, *Cocktail-Grundlagen*, *Gästekommunikation*, *Inventur*), Dauer, Punktwert.
  - **Progress Bar** unten (Mix aus 0% / 30% / 70% / 100%).
  - „Weiterlernen"-Button bzw. „Abgeschlossen"-Badge.

## 3. Marketing Hub — Werbematerial

- Highlight-Banner oben: **„Aktuelle Kampagne: Happy Hour"** mit Zeitraum + CTA „Material ansehen".
- Zwei-Spalten-Layout:
  - **Digitale Vorlagen**: Liste/Grid von Social-Media-Templates (Instagram Story, Post, Reel-Cover) mit Vorschau-Thumbnail und Download-Icon.
  - **Print bestellen**: Bierdeckel, Tischaufsteller, Plakat A3, Flyer mit Mengenangabe und **„Nachbestellen"**-Button (Toast-Feedback).

## 4. Team & HR — Personalwesen (Mock im eigenen Design)

- **Zeiterfassung-Widget** (oben, markant): großer Status-Block mit Live-Uhr; primärer Button wechselt zustandsabhängig zwischen **„Schicht starten"** → **„Pause"** / **„Ausstempeln"**. Anzeige aktueller Schichtdauer, letzte Stempelung.
- **Dienstplan (Roster)**: Wochentabelle Mo–So × Schichten (Früh/Spät/Nacht), Zellen zeigen Initialen-Avatare der eingeteilten Mitarbeiter. Eigene Schichten visuell hervorgehoben.
- **Abwesenheiten**: Zwei Action-Buttons **„Krankmeldung"** und **„Urlaub beantragen"** (öffnen je einen kleinen Dialog mit Datums-/Zeitraumauswahl + Toast-Bestätigung). Darunter Status-Liste eigener Anträge (Beantragt / Genehmigt / Abgelehnt).
- Hinweis: rein UI-Mock, später gegen Crewmeister/Personio-API austauschbar — Struktur ist bereits darauf vorbereitet (Datenobjekte zentral in einer Mock-Datei).

## Technische Details

**Neue Dateien:**
- `src/components/pub/hq-connect.tsx`
- `src/components/pub/academy.tsx`
- `src/components/pub/marketing-hub.tsx`
- `src/components/pub/team-hr.tsx`
- `src/lib/pub-intranet-mock.ts` (zentrale Mock-Daten: Tickets, Trainings, Materialien, Roster, Anträge)

**Geänderte Dateien:**
- `src/routes/pub.tsx`: äußere Tabs ergänzen (`tab` Search-Param), bestehende Sections unter dem `dashboard`-Tab gruppieren. Staff-Branch behält den Reviews-Default, bekommt aber dieselbe Tab-Leiste.

**Design-Konsistenz:**
- Nutzt ausschließlich vorhandene shadcn-Komponenten (`Tabs`, `Card`, `Badge`, `Button`, `Dialog`, `Progress`, `Select`, `Avatar`, `Table`).
- Farben über semantische Tokens (`bg-card`, `text-muted-foreground`, `bg-primary/10` etc.) — keine Hardcoded-Hex-Werte.
- Icons aus `lucide-react` (Ticket, GraduationCap, Megaphone, Users, Clock, etc.).
- Alle Strings über `useT()` bilingual.

**Out of scope (explizit nicht angefasst):**
- Login, `/hq`, `/admin`, `/feedback`, Marketing-Sektion im Admin, bestehende Sales/Feedback-Komponenten, Supabase-Schema, Auth-Logik.
