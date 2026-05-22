## Ziel
Fingerprint-basierter Stempel-Login am Pub-PC mit **zentraler Template-Speicherung** in Pub Ops (Cloud-DB). Vorteile: MA einmal anlernen → funktioniert in jedem Pub, PC-Tausch unkritisch, HQ hat volle Übersicht.

## Architektur

```text
[USB Fingerprint Reader: SecuGen Hamster Pro 20]
            │ USB
[Windows Pub-PC]
  ├─ Pub Ops Web (Browser, /pub?mode=staff)
  └─ Companion-App (Tray, localhost:47000)
            │ HTTPS
[Pub Ops Backend (Lovable Cloud)]
  ├─ staff_biometrics (Templates, verschlüsselt)
  └─ stamp_events
```

## Ablauf

**Enrollment (HQ, einmalig pro MA):**
1. Admin öffnet Personalakte → "Fingerabdruck registrieren"
2. Companion liest Finger 3× → erzeugt Template (proprietäres SecuGen-Format, ~400 Byte)
3. Template wird **AES-verschlüsselt** → an Pub Ops gesendet → in `staff_biometrics` gespeichert (pro MA bis zu 2 Finger)

**Stempeln (täglich, in beliebigem Pub):**
1. MA tippt am Pub-PC im Browser auf "Stempeln"
2. Browser ruft `http://localhost:47000/identify` mit `pub_id`
3. Companion lädt alle Templates der MA dieses Pubs (gecached, alle 5 min refresh)
4. MA scannt Finger → 1:N Matching lokal in der Companion-App
5. Bei Match: Companion sendet `{staff_id, confidence}` an Pub Ops → `stamp_in/out`
6. Browser zeigt Bestätigung

## Sicherheit / DSGVO
- Templates sind **keine Bilder**, nur mathematische Hashes — biometrisch nicht rekonstruierbar
- AES-256 verschlüsselt at rest (Schlüssel in Lovable Cloud Secrets)
- Trotzdem: **biometrische Daten = Art. 9 DSGVO** → Auftragsverarbeitungsvertrag (AVV) mit Lovable nötig + explizite Einwilligung jedes MA (Formular in Personalakte)
- Audit-Log: jeder Match wird mit Confidence-Score geloggt
- Recht auf Löschung: 1-Klick "Biometrie löschen" in Personalakte

## Datenmodell (neu)

**Tabelle `staff_biometrics`:**
- staff_id (FK staff_members)
- finger_index (0–9, welcher Finger)
- template_encrypted (bytea, AES-verschlüsselt)
- consent_signed_at (timestamp)
- enrolled_at, enrolled_by

**Tabelle `stamp_events`** (falls noch nicht da):
- staff_id, pub_id, type (in/out), timestamp, method (fingerprint/pin/manual), confidence

## Companion-App (Windows)
- **Electron + Node** (Empfehlung: gleicher Web-Stack, schnellere Entwicklung)
- Bibliothek: `node-secugen` Wrapper für SecuGen FDx SDK Pro (kostenlos)
- Auto-Start, Tray-Icon, Auto-Update via electron-updater
- Lokaler HTTPS-Endpoint mit self-signed cert (oder HTTP nur localhost)
- Login mit Pub-API-Token (einmalig konfiguriert)

## Fallback
Empfehlung: **Finger + PIN-Fallback** (4-stellig, pro MA). Aktiviert nur bei:
- Sensor-Defekt
- Verletzung am Finger (Pflaster)
- Neue MA noch nicht enrolled

## Pub Ops Änderungen (Web)
1. **Personalakte**: neuer Tab "Biometrie" — Status, Enroll-Button, Löschen, PIN setzen
2. **Stempel-Screen** (`/pub?mode=staff`): aktueller Mitarbeiter-Picker wird ersetzt durch "Finger auflegen" Prompt + PIN-Fallback-Button
3. **HQ Dashboard**: Übersicht "MA mit Biometrie enrolled: X / Y"
4. **Server Functions**:
   - `enrollBiometric({staff_id, template})` — Admin-only
   - `identifyAndStamp({pub_id, template_candidate})` — vergleicht serverseitig nicht; bekommt fertige `staff_id` von Companion
   - `deleteBiometric({staff_id})` — Admin-only

## Aufwand
- DB-Migration + Server Functions: 1 Tag
- Personalakte Biometrie-Tab: 1 Tag
- Stempel-Screen Umbau + PIN-Fallback: 1 Tag
- Companion-App (Electron + SecuGen + Auto-Update + Installer): 3–4 Tage
- Tests, Rollout-Doku, Schulung: 1–2 Tage
- **Gesamt: ~1,5 Wochen**

## Offene Punkte vor Start
1. Hardware bestellen: 1× SecuGen Hamster Pro 20 zum Testen (~100 €)
2. AVV-Vorlage + MA-Einwilligungsformular vorbereiten (rechtlich)
3. Pilot-Pub festlegen (1 Standort, 2–3 Wochen Probebetrieb vor Rollout)

## Was ich JETZT umsetzen kann
Web-Seite (Pub Ops): DB-Schema + Personalakte-Tab + Stempel-Screen-Umbau + PIN-Fallback. **Companion-App ist Windows-Entwicklung außerhalb Lovable** — die müsste extern entwickelt werden (oder ich liefere ein Spec-Dokument für einen Windows-Dev).

Soll ich mit dem Web-Teil starten (DB + UI + Server Functions), sodass die Companion-App später nur noch andocken muss?
