import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdSlot = {
  id: string;
  block_no: number;
  position: string;
  label: string;
  enabled: boolean;
  code: string;
  paragraph_no: number;
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
    .select("id, block_no, position, label, enabled, code, paragraph_no")
    .order("block_no", { ascending: true });
  return { slots: (data ?? []) as AdSlot[] };
});

export const updateAdSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        enabled: z.boolean(),
        label: z.string().max(120).optional(),
        position: z
          .enum([
            "",
            "top",
            "after_intro",
            "after_paragraph",
            "mid_content",
            "after_content",
            "before_comments",
            "sidebar_bottom",
          ])
          .optional(),
        paragraph_no: z.number().int().min(1).max(50).optional(),
        code: z.string().max(8000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("ad_slots")
      .update({
        enabled: data.enabled,
        code: data.code,
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
        ...(data.paragraph_no !== undefined ? { paragraph_no: data.paragraph_no } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
