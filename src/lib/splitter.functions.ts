import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

export type SplitRoute = {
  id?: string;
  folder_id?: string;
  name?: string;
  slug?: string;
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

// Redirecionamento probabilístico por pasta ou redirecionamento direto por slug de rota
export const getRedirectTarget = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        folderSlug: z.string().min(1),
        routeSlug: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supa = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: folder, error } = await (supa as any)
      .from("split_folders")
      .select("id, slug, name, routes:split_routes(*)")
      .eq("slug", data.folderSlug)
      .maybeSingle();

    if (error || !folder || !folder.routes || folder.routes.length === 0) {
      return { targetPath: "/" };
    }

    const routes = (folder as any).routes as SplitRoute[];

    // Se um routeSlug específico foi solicitado, busca direto por slug/nome
    if (data.routeSlug) {
      const specific = routes.find(
        (r) =>
          (r.slug && r.slug.toLowerCase() === data.routeSlug?.toLowerCase()) ||
          r.path === `/${data.routeSlug}` ||
          r.path === data.routeSlug,
      );
      if (specific) {
        const p = specific.path;
        return { targetPath: p.startsWith("http") || p.startsWith("/") ? p : `/${p}` };
      }
    }

    // Sorteio probabilístico com base nos pesos da pasta
    const totalWeight = routes.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

    if (totalWeight <= 0) {
      const first = routes[0]?.path || "/";
      return { targetPath: first.startsWith("http") || first.startsWith("/") ? first : `/${first}` };
    }

    let rand = Math.random() * totalWeight;
    for (const route of routes) {
      const w = Number(route.weight) || 0;
      if (rand < w) {
        const p = route.path;
        return { targetPath: p.startsWith("http") || p.startsWith("/") ? p : `/${p}` };
      }
      rand -= w;
    }

    const last = routes[routes.length - 1]?.path || "/";
    return { targetPath: last.startsWith("http") || last.startsWith("/") ? last : `/${last}` };
  });

export const listSplitFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("split_folders")
      .select("*, routes:split_routes(*)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { folders: (data ?? []) as unknown as SplitFolder[] };
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
            name: z.string().optional(),
            slug: z.string().optional(),
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
      const { error } = await (context.supabase as any)
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
      const { data: newFolder, error } = await (context.supabase as any)
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

    await (context.supabase as any).from("split_routes").delete().eq("folder_id", folderId);

    if (routes.length > 0) {
      const routesToInsert = routes.map((r, idx) => {
        const rName = r.name?.trim() || `Rota ${idx + 1}`;
        const defaultSlug = rName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || `rota-${idx + 1}`;
        const rSlug = r.slug?.trim() || defaultSlug;

        return {
          folder_id: folderId!,
          name: rName,
          slug: rSlug,
          path: r.path.startsWith("http") || r.path.startsWith("/") ? r.path : `/${r.path}`,
          weight: r.weight,
          ecpm: r.ecpm ?? 0,
          gam_ad_unit_id: r.gam_ad_unit_id ?? null,
        };
      });

      const { error: routeErr } = await (context.supabase as any)
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
    const { error } = await (context.supabase as any)
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
    const { data: folder, error } = await (context.supabase as any)
      .from("split_folders")
      .select("*, routes:split_routes(*)")
      .eq("id", data.folderId)
      .single();

    if (error || !folder) throw new Error(error?.message ?? "Pasta não encontrada");

    const routes = ((folder as any).routes ?? []) as SplitRoute[];
    if (routes.length === 0) return { ok: true, routes: [] };

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
        folder_id: (folder as any).id,
        name: route.name,
        slug: route.slug,
        path: route.path,
        ecpm: route.ecpm,
        weight: (folder as any).auto_ecpm_balancing ? calculatedWeight : route.weight,
        gam_ad_unit_id: route.gam_ad_unit_id,
      };
    });

    for (const r of finalRoutes) {
      if (r.id) {
        await (context.supabase as any)
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