/**
 * Bridge to the Windows Companion-App that talks to the SecuGen Hamster Pro 20
 * USB fingerprint reader. The companion app exposes a tiny HTTP server on
 * http://localhost:47000 with two endpoints:
 *
 *   GET  /health                            -> 200 { ok: true, version }
 *   POST /identify  { pub_id, candidate_ids[] }
 *        -> 200 { staff_id, confidence }    on match
 *        -> 404 { error: "no_match" }       on miss
 *        -> 408 { error: "timeout" }        on user inactivity
 *   POST /enroll    { staff_id, finger_index }
 *        -> 200 { template_encrypted }      after 3 captures
 *
 * The companion does 1:N matching locally and is responsible for AES-encrypting
 * templates before uploading them. The web app never sees raw biometric data.
 */

const BRIDGE_URL = "http://localhost:47000";

export type FingerprintHealth = {
  available: boolean;
  version?: string;
  reason?: string;
};

export async function pingFingerprintBridge(timeoutMs = 800): Promise<FingerprintHealth> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${BRIDGE_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return { available: false, reason: `HTTP ${res.status}` };
    const data = await res.json();
    return { available: true, version: data.version };
  } catch (e) {
    return { available: false, reason: e instanceof Error ? e.message : "unreachable" };
  }
}

export type IdentifyResult =
  | { ok: true; staffId: string; confidence: number }
  | { ok: false; reason: "no_match" | "timeout" | "bridge_unavailable" | "error"; message?: string };

export async function identifyFingerprint(params: {
  pubId: string;
  candidateIds: string[];
}): Promise<IdentifyResult> {
  try {
    const res = await fetch(`${BRIDGE_URL}/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pub_id: params.pubId, candidate_ids: params.candidateIds }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, staffId: data.staff_id, confidence: data.confidence ?? 0 };
    }
    if (res.status === 404) return { ok: false, reason: "no_match" };
    if (res.status === 408) return { ok: false, reason: "timeout" };
    return { ok: false, reason: "error", message: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reason: "bridge_unavailable", message: e instanceof Error ? e.message : "unreachable" };
  }
}

export async function enrollFingerprint(params: {
  staffId: string;
  fingerIndex: number;
}): Promise<{ ok: true; templateEncrypted: string } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${BRIDGE_URL}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: params.staffId, finger_index: params.fingerIndex }),
    });
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, templateEncrypted: data.template_encrypted };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Companion-App nicht erreichbar" };
  }
}
