## Ziel

Pub&Go verwaltet alle Mitarbeiterstammdaten **selbst in Pub Ops**. Einmal im Monat (und bei Neueinstellungen/Änderungen) erzeugen wir einen **P&I-kompatiblen Export**, den die Supervista-Lohnbuchhaltung direkt einliest. Keine dritte HR-Software, keine Doppelpflege.

## Architektur

```text
   ┌──────────────────────────────────────────┐
   │   Pub Ops (Single Source of Truth)      │
   │   • Personalakte (Stammdaten + Vertrag) │
   │   • Dokumente (Vertrag, Bescheinigungen)│
   │   • Schichten + Ist-Stunden             │
   └──────────────┬───────────────────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
  Stammdaten-Export     Monats-Stunden-Export
  (bei Neueinst./       (zum Monatsende,
   Änderung)             P&I-Format)
       │                     │
       ▼                     ▼
   ┌──────────────────────────────┐
   │ Supervista Lohnbuchhaltung   │
   │ (P&I LogaHR, Mandant Pub&Go) │
   └──────────────────────────────┘
```

## Was zu bauen ist

### 1. DB-Erweiterung `staff_members`
Neue Felder für die Personalakte (Pflicht für P&I-Export):
`personnel_number`, `email`, `phone`, `birth_date`, `address_street/zip/city/country`, `iban`, `bic`, `tax_id`, `social_security_number`, `health_insurance`, `tax_class`, `children_allowance`, `religion`, `contract_type` (Vollzeit/Teilzeit/Minijob/Werkstudent/Aushilfe), `weekly_hours`, `hourly_wage`, `start_date`, `end_date`, `notes`.

### 2. Neue Tabelle `staff_documents` + Storage-Bucket
Für Vertrags-PDFs, Gesundheitszeugnis (§43 IfSG), Belehrungen. Privater Bucket, nur HR-Rolle liest.

### 3. Auth + Rollen (DSGVO-Pflicht)
- Login-Seite (E-Mail + Passwort)
- Tabelle `user_roles` (`hr_admin`, `pub_manager`, `viewer`) + `has_role`-Funktion
- Pub-Manager sieht nur Name/Telefon/Schicht — **keine** IBAN, Steuerklasse, Religion
- HR-Admin (1–2 Personen): Vollzugriff

### 4. UI-Erweiterung im HR-Tab
- **Personalakte-Drawer** pro MA: alle Stammdatenfelder + Dokumenten-Upload
- **Neueinstellungs-Wizard**: Pflichtfelder-Formular, erzeugt am Ende den Stammdaten-Export für P&I
- **"Lohn-Export Supervista"** (ersetzt P&I-Connector-Tab): Monatsauswahl → Vorschau-Tabelle → CSV-Download im P&I-Format

### 5. P&I-Exporte (zwei Formate)

**A) Stammdaten-Export** (bei Neueinstellung/Änderung)
Eine Zeile pro Mitarbeiter mit allen abrechnungsrelevanten Feldern (Personalnr., Name, Adresse, Geburtsdatum, IBAN, Steuer-ID, SV-Nr, KK, Steuerklasse, Kinder, Religion, Vertragsart, Std/Woche, Stundenlohn, Eintritt/Austritt).

**B) Monats-Stunden-Export** (zum Monatsende)
Eine Zeile pro MA × Tag × Schichtart mit: Personalnr., Datum, Std, Zuschlagsschlüssel (Nacht/Sonntag/Feiertag), Kostenstelle (Pub).

**Format**: CSV (Semikolon, Windows-1252, deutsches Zahlenformat) — Standard für P&I-Imports. Das **genaue Spalten-Layout** muss in einem 15-Min-Termin mit Supervistas Lohnbuchhaltung abgestimmt werden (jeder P&I-Mandant hat oft eine eigene Import-Maske). Bis dahin bauen wir das **gängige P&I-LogaHR-Standardformat**; Anpassung später per Mapping-Config ohne Code-Änderung.

### 6. Migration der 20 bestehenden MA
Import-Maske: CSV aus P&I exportieren → in Pub Ops hochladen → Felder mappen → bestätigen.

## Zugriff & DSGVO

- Personalakten enthalten besondere Daten (IBAN, Religion, Gesundheitszeugnis) → Rollen-Trennung Pflicht
- Audit-Log: wer hat wann welches Feld geändert (kleine `staff_audit_log`-Tabelle)
- Aufbewahrung: lohnrelevante Daten 10 Jahre, sonst 3 Jahre nach Austritt (Archiv-Flag, nicht in Phase 1)
- AV-Vertrag mit Supervista intern klären (zwischen den Konzern-Töchtern; meist via Konzern-Rahmenvertrag abgedeckt)

## Reihenfolge der Umsetzung

1. **DB-Migration** (staff_members-Felder, staff_documents, user_roles, has_role, Storage-Bucket, RLS) — Grundlage
2. **Auth + Login + Rollen-UI** — Pflicht bevor echte Personaldaten rein dürfen
3. **Personalakte-UI + Dokumenten-Upload** — Pflege wird möglich
4. **Neueinstellungs-Wizard + Stammdaten-Export (P&I-Format)**
5. **Monats-Stunden-Export (P&I-Format)** — ersetzt alten Mock-Tab
6. **Import-Maske für die 20 Bestands-MA**
7. **Audit-Log + Feinschliff Rollen-Sichtbarkeit**

Schritte 1+2 müssen zusammen produktiv gehen. Danach kann jede Stufe einzeln getestet und mit Supervista abgestimmt werden.

## Offen / vor Schritt 4 zu klären mit Supervista-Lohnbuchhaltung

- **Genaues P&I-Importformat**: gibt es eine vorhandene Import-Vorlage (Spalten, Trennzeichen, Codepage)?
- **Zuschlagsschlüssel**: welche Kennziffern nutzt Supervista für Nacht-/Sonntags-/Feiertagszuschlag?
- **Kostenstellen-Schema**: pro Pub eine eigene Kostenstelle? Welche Nummernlogik?
- **Personalnummern-Vergabe**: vergibt Supervista zentral, oder dürfen wir einen Pub&Go-Nummernkreis nutzen?

Diese vier Antworten brauchen wir, **bevor** der echte Export scharf geschaltet wird. UI und Datenmodell können wir aber sofort starten.

## Bestätigung von dir

- Reihenfolge 1–7 ok, oder willst du eine Stufe vorziehen?
- Soll ich vor Schritt 1 ein kurzes **Fragen-Sheet für die Lohnbuchhaltung** vorbereiten (die 4 offenen Punkte oben als 1-Seiter), damit du es ihnen weiterleiten kannst?