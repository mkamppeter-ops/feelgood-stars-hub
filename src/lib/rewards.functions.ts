// Mock backend stubs für Belohnungs-Workflow.
// TODO: später als createServerFn implementieren — Push via FCM/APNS,
// WhatsApp via Twilio Connector (Konfiguration siehe Twilio-Doku im Projekt).
// Google-Share benötigt kein Backend; der Link liegt am Pub.

export type ApologyRewardInput = {
  feedbackId: string;
  credits: number;
  channel: "push" | "whatsapp";
  message: string;
};

export type GoogleInviteInput = {
  feedbackId: string;
  bonusCredits: number;
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
