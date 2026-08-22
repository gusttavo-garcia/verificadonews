import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const verdictEnum = z.enum(["verificado", "falso", "enganoso", "parcial", "apuracao"]);
const typeEnum = z.enum(["noticia", "golpe", "empresa", "site", "video", "fake"]);

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  return data === true;
}

async function isEditor(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "editor",
  });
  return data === true;
}

// List articles the current user can see in the panel:
// admins see all, editors see their own.
export const listMyArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context);
    let query = context.supabase
      .from("articles")
      .select("id, slug, title, excerpt, body, type, status, category, verdict, author_name, author_id, created_at, updated_at, published_at, views, image_url")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (admin) {
      // Admins veem tudo, exceto rascunhos nunca enviados/publicados de outros autores
      query = query.or(
        `status.neq.draft,author_id.eq.${context.userId},published_at.not.is.null`,
      );
    } else {
      query = query.eq("author_id", context.userId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { articles: data ?? [], isAdmin: admin };
  });

// Loads a single article for the editor page (RLS: own article or admin)
export const getArticleById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("articles")
      .select(
        "id, slug, title, excerpt, body, type, status, category, verdict, author_name, author_id, created_at, updated_at, published_at, views, image_url",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Artigo não encontrado.");
    return { article: row, isAdmin: await isAdmin(context) };
  });

// Creates an empty draft immediately when the editor page opens
export const createEmptyDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context);
    const editor = await isEditor(context);
    if (!admin && !editor) throw new Error("Forbidden");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: cat } = await context.supabase
      .from("categories")
      .select("name")
      .order("name")
      .limit(1)
      .maybeSingle();

    const slug = `rascunho-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: row, error } = await context.supabase
      .from("articles")
      .insert({
        title: "Rascunho sem título",
        excerpt: "",
        body: "",
        category: cat?.name ?? "Geral",
        verdict: "apuracao",
        type: "noticia",
        slug,
        author_id: context.userId,
        author_name: profile?.display_name ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });


export const createArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        title: z.string().min(3),
        excerpt: z.string().default(""),
        body: z.string().default(""),
        category: z.string().min(1),
        verdict: verdictEnum,
        type: typeEnum.default("noticia"),
        image_url: z
          .string()
          .optional()
          .transform((v) => (v && v.length > 0 ? v : undefined)),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await isAdmin(context);
    const editor = await isEditor(context);
    if (!admin && !editor) throw new Error("Forbidden");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const baseSlug = slugify(data.title) || `artigo-${Date.now()}`;
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: row, error } = await context.supabase
      .from("articles")
      .insert({
        ...data,
        slug,
        author_id: context.userId,
        author_name: profile?.display_name ?? null,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { article: row };
  });

export const updateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(3).optional(),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        category: z.string().optional(),
        verdict: verdictEnum.optional(),
        type: typeEnum.optional(),
        image_url: z.string().nullable().optional(),
        author_id: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, author_id, ...updates } = data;
    let author_name: string | null | undefined;
    if (author_id !== undefined) {
      const admin = await isAdmin(context);
      if (!admin) throw new Error("Apenas administradores podem mudar a autoria.");
      const { data: prof } = await context.supabase
        .from("profiles")
        .select("display_name")
        .eq("id", author_id)
        .maybeSingle();
      author_name = prof?.display_name ?? null;
    }
    const { error } = await context.supabase
      .from("articles")
      .update({
        ...updates,
        ...(author_id !== undefined ? { author_id, author_name } : {}),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Editor requests review — moves draft -> pending_review
export const requestReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("articles")
      .update({ status: "pending_review" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin publishes
export const publishArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("articles")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin unpublishes
export const unpublishArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin deletes (soft delete -> lixeira)
export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("articles")
      .update({ deleted_at: new Date().toISOString(), status: "draft" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Lixeira: lista artigos excluídos (somente admin)
export const listTrashedArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context))) return { articles: [] };
    const { data, error } = await context.supabase
      .from("articles")
      .select("id, slug, title, category, verdict, author_name, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { articles: data ?? [] };
  });

// Restaura da lixeira
export const restoreArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("articles")
      .update({ deleted_at: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Exclusão definitiva
export const purgeArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });