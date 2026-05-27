import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SITE_ID = "pubandgo.de";
const GOAL_NAME = "Download Click";

const InputSchema = z.object({
  period: z.enum(["7d", "30d", "month"]).default("30d"),
  pubId: z.string().optional(),
});

type ChannelMap = Record<string, number>;

export const getPlausibleRegistrations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.PLAUSIBLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "PLAUSIBLE_API_KEY missing", byChannel: {} as ChannelMap, total: 0 };
    }

    const date_range =
      data.period === "7d" ? "7d" : data.period === "month" ? "month" : "30d";

    const filters: unknown[] = [["is", "event:goal", [GOAL_NAME]]];
    if (data.pubId) {
      filters.push(["contains", "visit:utm_campaign", [data.pubId]]);
    }

    try {
      const res = await fetch("https://plausible.io/api/v2/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site_id: SITE_ID,
          metrics: ["events"],
          date_range,
          filters,
          dimensions: ["visit:utm_source"],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          ok: false as const,
          error: `Plausible ${res.status}: ${text.slice(0, 200)}`,
          byChannel: {} as ChannelMap,
          total: 0,
        };
      }

      const json = (await res.json()) as {
        results?: Array<{ metrics: number[]; dimensions: string[] }>;
      };

      const byChannel: ChannelMap = {};
      let total = 0;
      for (const row of json.results ?? []) {
        const src = (row.dimensions[0] || "direct").toLowerCase().trim();
        const count = Number(row.metrics[0]) || 0;
        byChannel[src] = (byChannel[src] || 0) + count;
        total += count;
      }

      return { ok: true as const, byChannel, total, period: date_range };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Unknown error",
        byChannel: {} as ChannelMap,
        total: 0,
      };
    }
  });
