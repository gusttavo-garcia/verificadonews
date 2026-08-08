import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const UNCATEGORIZED_LABEL = "Sem categoria definida";

function serverClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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

async function ensureAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Apenas administradores podem gerenciar categorias.");
}

// Public list of categories (name ordered).
export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await serverClient()
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  return { categories: data ?? [] };
});

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ name: z.string().min(2).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const name = data.name.trim();
    const { error } = await context.supabase.from("categories").insert({ name });
    if (error) {
      throw new Error(
        error.code === "23505" ? "Essa categoria já existe." : error.message,
      );
    }
    return { ok: true };
  });

// Removing a category moves every article of that category back to draft
// and clears its category (shown as "Sem categoria definida").
export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const { data: cat, error: cErr } = await context.supabase
      .from("categories")
      .select("id, name")
      .eq("id", data.id)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!cat) throw new Error("Categoria não encontrada.");

    const { data: affected, error: uErr } = await context.supabase
      .from("articles")
      .update({ category: "", status: "draft" })
      .eq("category", cat.name)
      .select("id");
    if (uErr) throw new Error(uErr.message);

    const { error: dErr } = await context.supabase
      .from("categories")
      .delete()
      .eq("id", data.id);
    if (dErr) throw new Error(dErr.message);

    return { ok: true, affected: affected?.length ?? 0 };
  });
