import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleEnum = z.enum(["admin", "editor", "reader"]);

async function ensureAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Forbidden");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] =
      await Promise.all([
        context.supabase
          .from("profiles")
          .select("id, display_name, created_at")
          .order("created_at", { ascending: false }),
        context.supabase.from("user_roles").select("user_id, role"),
      ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    const users = (profiles ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      created_at: p.created_at,
      roles: rolesByUser.get(p.id) ?? [],
    }));

    return { users };
  });

// Sets the user's role to exactly one of admin | editor | reader.
// Removes all other role rows for that user.
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), role: roleEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("Você não pode remover seu próprio acesso de administrador.");
    }

    const { error: delErr } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .neq("role", data.role);
    if (delErr) throw new Error(delErr.message);

    const { error: insErr } = await context.supabase
      .from("user_roles")
      .upsert(
        { user_id: data.userId, role: data.role },
        { onConflict: "user_id,role" },
      );
    if (insErr) throw new Error(insErr.message);

    return { ok: true };
  });