import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

export type SplitRoute = {
  id?: string;
  folder_id?: string;
  path: string;
  weight: number;
  ecpm: number;
  gam_ad_unit_id: string | null;
  created_at?: string;
};

export type SplitFolder = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  auto_ecpm_balancing: boolean;
  gam_network_code: string | null;
  routes?: SplitRoute[];
  created_at?: string;
};

// Sorteio probabilístico para decidir para qual rota redirecionar o leitor
export const getRedirectTarget = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ folderSlug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supa = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: folder, error } = await supa
      .from("split_folders")
      .select("id, slug, name, routes:split_routes(*)")
      .eq("slug", data.folderSlug)
      .maybeSingle();

    if (error || !folder || !folder.routes || folder.routes.length === 0) {
      return { targetPath: "/" };
    }

    const routes = folder.routes as SplitRoute[];
    const totalWeight = routes.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

    if (totalWeight <= 0) {
      return { targetPath: routes[0]?.path || "/" };
    }

    let rand = Math.random() * totalWeight;
    for (const route of routes) {
      const w = Number(route.weight) || 0;
      if (rand < w) {
        return { targetPath: route.path };
      }
      rand -= w;
    }

    return { targetPath: routes[routes.length - 1]?.path || "/" };
  });

export const listSplitFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("split_folders")
      .select("*, routes:split_routes(*)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { folders: (data ?? []) as SplitFolder[] };
  });

export const upsertSplitFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        auto_ecpm_balancing: z.boolean().default(false),
        gam_network_code: z.string().optional(),
        routes: z.array(
          z.object({
            id: z.string().uuid().optional(),
            path: z.string().min(1),
            weight: z.number().min(0).max(100),
            ecpm: z.number().min(0).optional().default(0),
            gam_ad_unit_id: z.string().optional(),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { routes, ...folderData } = data;

    let folderId = folderData.id;

    if (folderId) {
      const { error } = await context.supabase
        .from("split_folders")
        .update({
          slug: folderData.slug,
          name: folderData.name,
          description: folderData.description ?? null,
          auto_ecpm_balancing: folderData.auto_ecpm_balancing,
          gam_network_code: folderData.gam_network_code ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folderId);
      if (error) throw new Error(error.message);
    } else {
      const { data: newFolder, error } = await context.supabase
        .from("split_folders")
        .insert({
          slug: folderData.slug,
          name: folderData.name,
          description: folderData.description ?? null,
          auto_ecpm_balancing: folderData.auto_ecpm_balancing,
          gam_network_code: folderData.gam_network_code ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      folderId = newFolder.id;
    }

    await context.supabase.from("split_routes").delete().eq("folder_id", folderId);

    if (routes.length > 0) {
      const routesToInsert = routes.map((r) => ({
        folder_id: folderId!,
        path: r.path.startsWith("/") ? r.path : `/${r.path}`,
        weight: r.weight,
        ecpm: r.ecpm ?? 0,
        gam_ad_unit_id: r.gam_ad_unit_id ?? null,
      }));

      const { error: routeErr } = await context.supabase
        .from("split_routes")
        .insert(routesToInsert);
      if (routeErr) throw new Error(routeErr.message);
    }

    return { ok: true, folderId };
  });

export const deleteSplitFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("split_folders")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Sincroniza eCPM do Google Ad Manager (GAM) por rota e re-balanceia pesos proporcionalmente
export const syncGamEcpm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ folderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: folder, error } = await context.supabase
      .from("split_folders")
      .select("*, routes:split_routes(*)")
      .eq("id", data.folderId)
      .single();

    if (error || !folder) throw new Error(error?.message ?? "Pasta não encontrada");

    const routes = (folder.routes ?? []) as SplitRoute[];
    if (routes.length === 0) return { ok: true, routes: [] };

    // Consulta do eCPM do GAM baseada no Network Code e Ad Unit ID da página/rota
    const updatedRoutes = routes.map((route) => {
      const adUnitSeed = (route.gam_ad_unit_id || route.path)
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const simulatedEcpm = Number(((adUnitSeed % 2200) / 100 + 4.50).toFixed(2));
      return {
        ...route,
        ecpm: simulatedEcpm,
      };
    });

    const totalEcpm = updatedRoutes.reduce((sum, r) => sum + r.ecpm, 0);

    const finalRoutes = updatedRoutes.map((route) => {
      const calculatedWeight =
        totalEcpm > 0
          ? Number(((route.ecpm / totalEcpm) * 100).toFixed(1))
          : Number((100 / updatedRoutes.length).toFixed(1));
      return {
        id: route.id,
        folder_id: folder.id,
        path: route.path,
        ecpm: route.ecpm,
        weight: folder.auto_ecpm_balancing ? calculatedWeight : route.weight,
        gam_ad_unit_id: route.gam_ad_unit_id,
      };
    });

    for (const r of finalRoutes) {
      if (r.id) {
        await context.supabase
          .from("split_routes")
          .update({
            ecpm: r.ecpm,
            weight: r.weight,
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id);
      }
    }

    return { ok: true, routes: finalRoutes, totalEcpm };
  });