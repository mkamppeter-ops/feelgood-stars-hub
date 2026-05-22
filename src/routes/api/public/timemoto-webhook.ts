import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

/**
 * TimeMoto Webhook / CSV Import Endpoint
 *
 * Accepts stamp events from:
 *  - TimeMoto Cloud webhook (JSON push)
 *  - TimeMoto PC software CSV export (manual upload, fallback)
 *
 * Security: requires header `x-timemoto-secret` matching env TIMEMOTO_WEBHOOK_SECRET.
 *
 * Mapping: TimeMoto user_id (or badge/PIN) ↔ staff_members.personnel_number
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-timemoto-secret",
  "Access-Control-Max-Age": "86400",
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

// Single event schema — flexible to fit TimeMoto Cloud and CSV imports
const EventSchema = z.object({
  pub_id: z.string().min(1).max(100),
  personnel_number: z.string().min(1).max(50), // TimeMoto user id
  event_type: z.enum(["in", "out", "break_start", "break_end"]),
  occurred_at: z.string().datetime(), // ISO timestamp
  method: z.enum(["fingerprint", "rfid", "pin", "face", "manual"]).default("fingerprint"),
  confidence: z.number().int().min(0).max(100).optional(),
  note: z.string().max(500).optional(),
});

const PayloadSchema = z.object({
  events: z.array(EventSchema).min(1).max(500),
});

export const Route = createFileRoute("/api/public/timemoto-webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        // 1. Verify shared secret
        const secret = request.headers.get("x-timemoto-secret");
        const expected = process.env.TIMEMOTO_WEBHOOK_SECRET;
        if (!expected) {
          return json({ error: "Server misconfigured: missing secret" }, 500);
        }
        if (!secret || secret !== expected) {
          return json({ error: "Unauthorized" }, 401);
        }

        // 2. Parse and validate body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return json({ error: "Invalid payload", details: parsed.error.issues }, 400);
        }

        // 3. Resolve personnel_number → staff_id per pub
        const pubIds = [...new Set(parsed.data.events.map((e) => e.pub_id))];
        const personnelNumbers = [...new Set(parsed.data.events.map((e) => e.personnel_number))];

        const { data: staff, error: staffErr } = await supabaseAdmin
          .from("staff_members")
          .select("id, pub_id, personnel_number")
          .in("pub_id", pubIds)
          .in("personnel_number", personnelNumbers);

        if (staffErr) {
          return json({ error: "Staff lookup failed", details: staffErr.message }, 500);
        }

        const staffMap = new Map<string, string>(); // `${pub_id}::${personnel_number}` → staff_id
        for (const s of staff ?? []) {
          if (s.personnel_number) {
            staffMap.set(`${s.pub_id}::${s.personnel_number}`, s.id);
          }
        }

        // 4. Build inserts; collect unmapped
        const rows: Array<{
          pub_id: string;
          staff_id: string;
          event_type: string;
          occurred_at: string;
          method: string;
          confidence: number | null;
          note: string | null;
        }> = [];
        const unmapped: Array<{ pub_id: string; personnel_number: string }> = [];

        for (const e of parsed.data.events) {
          const staffId = staffMap.get(`${e.pub_id}::${e.personnel_number}`);
          if (!staffId) {
            unmapped.push({ pub_id: e.pub_id, personnel_number: e.personnel_number });
            continue;
          }
          rows.push({
            pub_id: e.pub_id,
            staff_id: staffId,
            event_type: e.event_type,
            occurred_at: e.occurred_at,
            method: e.method,
            confidence: e.confidence ?? null,
            note: e.note ?? null,
          });
        }

        // 5. Insert valid rows
        let inserted = 0;
        if (rows.length > 0) {
          const { error: insErr, count } = await supabaseAdmin
            .from("stamp_events")
            .insert(rows, { count: "exact" });
          if (insErr) {
            return json({ error: "Insert failed", details: insErr.message }, 500);
          }
          inserted = count ?? rows.length;
        }

        return json({
          success: true,
          received: parsed.data.events.length,
          inserted,
          unmapped_count: unmapped.length,
          unmapped: unmapped.slice(0, 20), // cap response size
        });
      },
    },
  },
});
