// Mock backend stubs für Belohnungs-Workflow.
// TODO: später als createServerFn implementieren — Push via FCM/APNS,
// WhatsApp via Twilio Connector (Konfiguration siehe Twilio-Doku im Projekt).
//
// Google-Share läuft AUTOMATISCH und OHNE Anreiz (Google-Richtlinien
// verbieten incentivierte Bewertungen). Wir senden lediglich eine
// freundliche Push-Einladung mit dem Direktlink — keine Bonus-Credits.

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
