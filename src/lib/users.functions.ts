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
    const [
      { data: profiles, error: pErr },
      { data: roles, error: rErr },
      { data: articles, error: aErr },
    ] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, display_name, email, created_at")
        .order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("user_id, role"),
      context.supabase.from("articles").select("author_id, status"),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);
    if (aErr) throw new Error(aErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    const statsByUser = new Map<
      string,
      { published: number; pending: number; draft: number }
    >();
    for (const a of articles ?? []) {
      if (!a.author_id) continue;
      const s =
        statsByUser.get(a.author_id) ?? { published: 0, pending: 0, draft: 0 };
      if (a.status === "published") s.published += 1;
      else if (a.status === "pending_review") s.pending += 1;
      else if (a.status === "draft") s.draft += 1;
      statsByUser.set(a.author_id, s);
    }

    const users = (profiles ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      email: p.email,
      created_at: p.created_at,
      roles: rolesByUser.get(p.id) ?? [],
      stats: statsByUser.get(p.id) ?? { published: 0, pending: 0, draft: 0 },
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

// Admin creates a new user (editor or admin) with email + password.
export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8, "Mínimo 8 caracteres"),
        displayName: z.string().min(1),
        role: z.enum(["editor", "admin"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (cErr || !created.user) {
      throw new Error(cErr?.message ?? "Não foi possível criar o usuário.");
    }

    const userId = created.user.id;

    // Ensure profile has the requested display name (trigger sets a default).
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, display_name: data.displayName }, { onConflict: "id" });

    // Replace default 'reader' role with the requested role.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { ok: true, userId };
  });

// Admin updates another user's profile fields (name, email, password, role).
export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        displayName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
        role: roleEnum.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authUpdate: { email?: string; password?: string; user_metadata?: any } = {};
    if (data.email) authUpdate.email = data.email;
    if (data.password) authUpdate.password = data.password;
    if (data.displayName) authUpdate.user_metadata = { display_name: data.displayName };

    if (Object.keys(authUpdate).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        data.userId,
        authUpdate,
      );
      if (error) throw new Error(error.message);
    }

    if (data.displayName || data.email) {
      const patch: any = { id: data.userId };
      if (data.displayName) patch.display_name = data.displayName;
      if (data.email) patch.email = data.email;
      const { error } = await supabaseAdmin
        .from("profiles")
        .upsert(patch, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }

    if (data.role) {
      if (data.userId === context.userId && data.role !== "admin") {
        throw new Error("Você não pode remover seu próprio acesso de administrador.");
      }
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .neq("role", data.role);
      await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: data.userId, role: data.role },
          { onConflict: "user_id,role" },
        );
    }

    return { ok: true };
  });