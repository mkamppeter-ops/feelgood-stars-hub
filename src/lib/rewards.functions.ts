// Mock backend stubs für Belohnungs-Workflow.
// TODO: später als createServerFn implementieren — Push via FCM/APNS,
// WhatsApp via Twilio Connector (Konfiguration siehe Twilio-Doku im Projekt).
//
// Google-Share läuft AUTOMATISCH und OHNE Anreiz (Google-Richtlinien
// verbieten incentivierte Bewertungen). Wir senden lediglich eine
// freundliche Push-Einladung mit dem Direktlink — keine Bonus-Credits.
//
// Status-Lifecycle: invited → clicked → reviewed (sticky, Einmal-Sperre).
// "reviewed" wird NIE optimistisch gesetzt — nur durch:
//   1. Kunden-Bestätigung in der App (Push-Followup "Hast du bewertet?")
//   2. Manuelles Abhaken durch den Pub-Betreiber im HQ.

export type ApologyRewardInput = {
  feedbackId: string;
  credits: number;
  channel: "push" | "whatsapp";
  message: string;
};

export type GoogleInviteInput = {
  feedbackId: string;
  googleReviewUrl: string;
};

export type GoogleClickInput = {
  feedbackId: string;
};

export type GoogleConfirmInput = {
  feedbackId: string;
  source: "customer" | "manual";
};

export async function sendApologyReward(input: ApologyRewardInput) {
  // Mock: simuliert Versand (Push oder WhatsApp) inkl. Credit-Gutschrift.
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true as const, sentAt: Date.now(), ...input };
}

export async function inviteGoogleReview(input: GoogleInviteInput) {
  // Mock: simuliert Push-Einladung mit Direktlink zur Google-Bewertung.
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true as const, sentAt: Date.now(), ...input };
}

export async function markGoogleReviewClicked(input: GoogleClickInput) {
  // Mock: Kunde hat den Push-Link geöffnet. Bedeutet NICHT bewertet.
  await new Promise((r) => setTimeout(r, 120));
  return { ok: true as const, clickedAt: Date.now(), ...input };
}

export async function confirmGoogleReview(input: GoogleConfirmInput) {
  // Mock: Kunde hat in der App bestätigt — oder Betreiber hat manuell
  // abgehakt nachdem die Bewertung bei Google sichtbar wurde.
  // Setzt die globale Einmal-Sperre für diesen Kunden.
  await new Promise((r) => setTimeout(r, 150));
  return { ok: true as const, reviewedAt: Date.now(), ...input };
}
