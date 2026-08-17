import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdSlot = {
  id: string;
  position: string;
  label: string;
  enabled: boolean;
  code: string;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listAdSlots = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await (publicClient() as any)
    .from("ad_slots")
    .select("id, position, label, enabled, code")
    .order("created_at", { ascending: true });
  return { slots: (data ?? []) as AdSlot[] };
});

export const updateAdSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        enabled: z.boolean(),
        code: z.string().max(8000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("ad_slots")
      .update({ enabled: data.enabled, code: data.code })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
