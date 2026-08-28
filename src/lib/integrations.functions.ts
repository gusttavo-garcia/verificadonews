import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IntegrationKey = {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
  masked: string;
  updated_at: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}

function mask(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(8)}${key.slice(-4)}`;
}

const providerSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9_-]+$/, "Use apenas letras minúsculas, números, hífen ou _");

export const listIntegrationKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("integration_keys")
      .select("id, provider, label, enabled, api_key, updated_at")
      .order("provider", { ascending: true });
    if (error) throw new Error(error.message);
    const keys: IntegrationKey[] = (data ?? []).map((row: any) => ({
      id: row.id,
      provider: row.provider,
      label: row.label,
      enabled: row.enabled,
      masked: mask(row.api_key ?? ""),
      updated_at: row.updated_at,
    }));
    return { keys };
  });

export const saveIntegrationKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        provider: providerSchema,
        label: z.string().trim().max(80).default(""),
        api_key: z.string().trim().min(8).max(500).optional(),
        enabled: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = {
      provider: data.provider,
      label: data.label || data.provider,
    };
    if (data.api_key) patch["api_key"] = data.api_key;
    if (typeof data.enabled === "boolean") patch["enabled"] = data.enabled;

    const { error } = await (context.supabase as any)
      .from("integration_keys")
      .upsert(patch, { onConflict: "provider" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteIntegrationKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await (context.supabase as any)
      .from("integration_keys")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function loadKey(context: { supabase: any }, provider: string) {
  const { data } = await (context.supabase as any)
    .from("integration_keys")
    .select("api_key, enabled")
    .eq("provider", provider)
    .maybeSingle();
  if (!data?.api_key || data.enabled === false) return null;
  return String(data.api_key);
}

export const testIntegrationKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ provider: providerSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const key = await loadKey(context, data.provider);
    if (!key) throw new Error("Chave não cadastrada ou desativada.");

    const endpoints: Record<string, { url: string; headers: Record<string, string> }> = {
      pexels: {
        url: "https://api.pexels.com/v1/search?query=news&per_page=1",
        headers: { Authorization: key },
      },
      openai: {
        url: "https://api.openai.com/v1/models?limit=1",
        headers: { Authorization: `Bearer ${key}` },
      },
      anthropic: {
        url: "https://api.anthropic.com/v1/models?limit=1",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      },
    };

    const target = endpoints[data.provider];
    if (!target) return { ok: true, message: "Chave salva. Teste automático indisponível para este provedor." };

    const res = await fetch(target.url, { headers: target.headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Falha na conexão (${res.status}): ${text.slice(0, 200)}`);
    }
    return { ok: true, message: "Conexão funcionando." };
  });

export type PexelsPhoto = {
  id: number;
  alt: string;
  thumb: string;
  full: string;
  photographer: string;
  photographerUrl: string;
};

export const searchPexelsPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        query: z.string().trim().min(2).max(120),
        page: z.number().int().min(1).max(20).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = await loadKey(context, "pexels");
    if (!key) throw new Error("Cadastre a chave do Pexels em Integrações para buscar imagens.");

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      data.query,
    )}&per_page=24&page=${data.page}&locale=pt-BR`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Limite do Pexels atingido. Tente novamente em instantes.");
      throw new Error(`Falha ao buscar no Pexels (${res.status}).`);
    }
    const json: any = await res.json();
    const photos: PexelsPhoto[] = (json?.photos ?? []).map((p: any) => ({
      id: p.id,
      alt: String(p.alt ?? data.query),
      thumb: p.src?.medium ?? p.src?.small ?? "",
      full: p.src?.large2x ?? p.src?.large ?? p.src?.original ?? "",
      photographer: String(p.photographer ?? ""),
      photographerUrl: String(p.photographer_url ?? ""),
    }));
    return { photos };
  });
