# HR & Operations sauber trennen

## Ausgangslage
HR ist aktuell ein Ticket-Empfänger (Schürzen, Onboarding) und Reviews liegen unklar im Dashboard. Das passt nicht: Personalthemen sind etwas anderes als operative Probleme.

## Neue Rollen-Logik

| Rolle | Verantwortlich für |
|---|---|
| **ops_admin** | Alle Gäste-Reviews, operative Tickets (inkl. der bisherigen HR-Tickets), Logistik |
| **hr_admin** | Dienstplan-Übersicht aller Bars · Urlaubs- & Krankmeldungs-Verwaltung |
| **it_admin** | nur IT-Tickets |
| **facility_admin** | nur Facility-Tickets |
| **hq_admin** | sieht alles |

## Konkrete Änderungen

### 1. Ticket-System
- HR-Kategorie aus den Ticket-Filtern entfernen
- Bestehende HR-Tickets („Schürzen", „Onboarding neuer Aushilfskraft") wandern zu `logistics` bzw. werden zu Operations-Tickets
- Im „Neues Ticket"-Dialog im Pub-View: HR-Option raus, dafür „Operations" als klare Kategorie
- `ROLE_TICKET_CATEGORY`-Mapping: `hr_admin` bekommt keine Kategorie mehr, `ops_admin` deckt sowohl Logistik als auch operative HR-nahe Themen ab

### 2. Reviews & Feedback → klar an Operations
- Live-Feedback und Review-Übersicht zeigen ein „Zuständig: Operations"-Label
- ops_admin landet nach Login direkt auf dem Feedback-Tab
- Badge mit offenen Reviews erscheint im Sidebar-Menü von ops_admin

### 3. Neuer HR-Bereich im HQ
Ein eigener Tab/Sidebar-Eintrag „HR" mit drei Karten-Sektionen:

**a) Dienstplan-Übersicht (alle Bars)**
- Tabelle: Pub · Wochen-Sollstunden · Ist-Stunden · Auslastung
- Pro Bar aufklappbar: aktuelle Woche, Schichten pro Tag, wer arbeitet
- Quelle: aggregiert aus bestehender `TeamHR`-Komponente, plus `pub_settings.opening_hour`/`closing_hour`

**b) Urlaubsanträge**
- Liste aller offenen Anträge bar-übergreifend (Mitarbeiter, Pub, Zeitraum)
- Aktionen: Genehmigen / Ablehnen
- Filter: offen · genehmigt · abgelehnt

**c) Krankmeldungen**
- Aktuelle Krankmeldungen (heute, diese Woche)
- Monats-Statistik pro Bar: Krankheitstage, Quote
- Hinweisbadge wenn ein Pub auffällig hohe Quote hat

### 4. Sidebar-Navigation
- Neuer Eintrag „HR" mit `UserCog`-Icon
- Für `hr_admin` ist HR der Standard-Tab nach Login
- Für `hq_admin` sichtbar zwischen „Pubs" und „Active Ops"
- Andere Sub-Admins sehen den HR-Tab nicht

## Daten (vorerst Mock)
Da noch keine echten Schicht-/Urlaubs-Daten in der DB liegen, wird der HR-Bereich erst mit Mock-Daten in `src/lib/hr-mock.ts` aufgebaut (Dienstpläne, Urlaubsanträge, Krankmeldungen pro Pub). So sieht man das Konzept sofort und kann später auf echte Tabellen migrieren.

## Betroffene Dateien
- `src/lib/auth-mock.ts` – Mapping `hr_admin` entfernen, Default-Route auf `/hq?tab=hr` setzen
- `src/lib/tickets-store.ts` – HR-Seeds umkategorisieren
- `src/components/pub/hq-connect.tsx` – HR-Option im Dialog entfernen, Operations hinzu
- `src/components/hq/ticket-inbox.tsx` – HR-Filter raus
- `src/components/hq/hr-overview.tsx` (neu) – Dienstplan/Urlaub/Krank
- `src/lib/hr-mock.ts` (neu) – Mock-Daten
- `src/routes/hq.index.tsx` – neuer HR-Tab, Sidebar-Eintrag, ops_admin → feedback als Default
- `src/lib/i18n.ts` – Strings DE/EN

## Was NICHT Teil dieses Schritts ist
- Echte DB-Tabellen für Schichten/Urlaub/Krank (separater Schritt, sobald das UI-Konzept steht)
- Stundenexport für Lohnbuchhaltung
- Mitarbeiterstammdaten/Verträge
