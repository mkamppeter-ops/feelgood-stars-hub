## Ziel

Im Feedback-Workflow zwei neue Belohnungs- und Wiedergutmachungs-Mechaniken einbauen, die im HQ-Dashboard sichtbar/steuerbar sind:

1. **Positive Bewertungen (4–5 ⭐):** Auto-Credits laufen wie bisher. Zusätzlich CTA „Auch auf Google teilen" — pro Filiale hinterlegter Google-Review-Link, optional Bonus-Credits beim Teilen.
2. **Negative Bewertungen (1–2 ⭐):** Nach Sichtung im HQ kann der Manager dem Kunden „Entschuldigungs-Credits" zuweisen (100 / 250 / 500 / 1.000 / 2.500 / 5.000 / 10.000) + persönliche Nachricht via **Push** (default) oder **WhatsApp** (Fallback).

Beides bleibt zunächst Frontend-Mock (kein echter Push/WhatsApp-Versand), aber sauber strukturiert, damit später eine echte Server-Function angedockt werden kann.

---

## 1. Datenmodell

**`src/lib/pubs-mock.ts`** — `Pub`-Type erweitern:
- `googleReviewUrl: string` (z. B. `https://g.page/r/.../review`)

**`src/lib/feedback-mock.ts`** — `FeedbackItem` erweitern:
- `customerId?: string` (Mock — nur App-Feedback)
- `customerName?: string`
- `reward?: { credits: number; channel: "push" | "whatsapp"; message: string; sentAt: number }` — gesetzt, sobald ein Apology-Reward ausgelöst wurde
- `googleShareInvited?: boolean` (für positive Reviews — wurde der CTA bereits getriggert)

**Neue Konstante:** `APOLOGY_CREDIT_STEPS = [100, 250, 500, 1000, 2500, 5000, 10000]`

---

## 2. UI im HQ — `src/components/live-feedback.tsx`

Im `ReviewCard` zwei kontextabhängige Aktionen ergänzen, basierend auf `item.stars`:

### A) Positive Reviews (Stars ≥ 4, Quelle = App)
- Neuer Button **„Google-Review anstoßen"** (Globe-Icon) neben WhatsApp/Phone.
- Click → öffnet ein kleines Popover mit:
  - vorformulierter Push-Text („Danke für deine Bewertung — teilst du sie auch auf Google? Dafür gibt's 250 Bonus-Credits 🎁")
  - Auswahl Bonus-Credits (50 / 100 / 250)
  - Button „Einladung senden" → markiert `googleShareInvited = true`, Toast „Einladung an {Kunde} gesendet".
- Direktlink-Vorschau: `pub.googleReviewUrl` (read-only, kopierbar).

### B) Negative Reviews (Stars ≤ 2)
- Neuer prominenter Button **„Entschuldigen + Credits"** (Gift-Icon, amber/red Akzent) — erscheint statt/zusätzlich zu „Erledigen".
- Click → Dialog (shadcn `Dialog`) mit:
  1. **Schritt 1 – Prüfung bestätigen:** Checkbox „Ich habe die negative Bewertung geprüft und die Ursache verstanden."
  2. **Schritt 2 – Credit-Stufe wählen:** RadioGroup mit den 7 Stufen, default `500`. Anzeige der Filial-Empfehlung („Empfohlen ab 1⭐: 1.000 Credits").
  3. **Schritt 3 – Kanal:** RadioGroup `Push` (default) / `WhatsApp`. Hinweis: WhatsApp nur möglich, wenn Telefonnr. hinterlegt.
  4. **Schritt 4 – Nachricht:** Textarea mit vorbefülltem Entschuldigungstext, inkl. Platzhalter `{credits}` und `{pub}`. Editierbar.
  5. **Senden** → setzt `reward` auf dem `FeedbackItem`, schließt Dialog, Toast „Entschuldigung + {credits} Credits an {Kunde} gesendet (via {channel})". Card markiert mit grünem Badge „Wiedergutmachung +{credits} Cr.".

Bereits vergebene Rewards werden in der Card als Info-Zeile angezeigt (statt erneutem Button).

---

## 3. HQ-Sichtbarkeit / Reporting (klein, am Ende)

In `src/routes/hq.index.tsx` im bestehenden Header-KPI-Bereich **eine** weitere Mini-KPI ergänzen, damit der Aufwand sichtbar wird:
- „Wiedergutmachungs-Credits (7 Tage)" — Summe aller `reward.credits` der letzten 7 Tage über alle Filialen.

Kein neuer Tab, kein neuer Routen-Eintrag.

---

## 4. Backend-Vorbereitung (nur Stubs, kein echter Versand)

Damit später Push/WhatsApp echt verschickt werden kann, eine **leere** Server-Function-Datei anlegen mit klarer Signatur — aber noch Mock-Return:

`src/lib/rewards.functions.ts`:
```ts
sendApologyReward({ feedbackId, credits, channel, message }) → { ok: true, sentAt }
inviteGoogleReview({ feedbackId, bonusCredits }) → { ok: true, link }
```
Beide noch ohne `requireSupabaseAuth` und ohne echte DB / WhatsApp / Push — nur damit das Frontend bereits gegen die richtige API ruft. Hinweis im Code, dass für den echten Versand später:
- Push → eigene Server-Function + FCM/APNS
- WhatsApp → Twilio Connector (siehe vorhandene Twilio-Doku)
- Google-Link → `pub.googleReviewUrl` reicht, kein Backend nötig

---

## Offene Frage (vor Umsetzung kurz klären)

**Soll der echte Versand (Push / WhatsApp via Twilio) jetzt schon mit angebunden werden, oder reicht erstmal der UI-Flow mit Mock-Backend?**

Ich würde Stufe 1 (UI + Mock) jetzt bauen und den echten Versand als Folge-Schritt machen, sobald Push-Infrastruktur / Twilio-Connection bestätigt ist. So bekommst du das Konzept sofort klickbar im Dashboard.

---

## Dateien

- `src/lib/pubs-mock.ts` (Feld `googleReviewUrl`)
- `src/lib/feedback-mock.ts` (Felder `customerName`, `reward`, `googleShareInvited`; Konstante `APOLOGY_CREDIT_STEPS`)
- `src/components/live-feedback.tsx` (zwei neue Actions + Dialog + Popover)
- `src/routes/hq.index.tsx` (eine Mini-KPI ergänzen)
- `src/lib/rewards.functions.ts` (neu, Mock-Stubs)
