import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiSettings = {
  id: string;
  enabled: boolean;
  text_model: string;
  image_model: string;
  style_instructions: string;
  language: string;
  updated_at: string;
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("ai_settings")
      .select("id, enabled, text_model, image_model, style_instructions, language, updated_at")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      settings: (data ?? null) as AiSettings | null,
      hasKey: Boolean(process.env["LOVABLE_API_KEY"]),
    };
  });

export const updateAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        enabled: z.boolean().optional(),
        text_model: z.string().min(3).max(120).optional(),
        image_model: z.string().min(3).max(120).optional(),
        style_instructions: z.string().max(4000).optional(),
        language: z.string().min(2).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await (context.supabase as any)
      .from("ai_settings")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function loadSettings(context: { supabase: any }) {
  const { data } = await (context.supabase as any)
    .from("ai_settings")
    .select("enabled, text_model, image_model, style_instructions, language")
    .limit(1)
    .maybeSingle();
  return {
    enabled: data?.enabled ?? true,
    text_model: data?.text_model ?? "google/gemini-2.5-flash",
    image_model: data?.image_model ?? "openai/gpt-image-2",
    style_instructions: data?.style_instructions ?? "",
    language: data?.language ?? "pt-BR",
  };
}

async function callGateway(model: string, messages: any[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("A chave da IA não está configurada no projeto.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Muitas requisições à IA. Tente novamente em instantes.");
    if (res.status === 402)
      throw new Error("Créditos de IA esgotados. Adicione créditos para continuar usando a IA.");
    if (res.status === 403) throw new Error("A IA está bloqueada pelas configurações do workspace.");
    throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 300)}`);
  }
  const json: any = await res.json();
  return String(json?.choices?.[0]?.message?.content ?? "").trim();
}

const modes = z.enum(["draft", "improve", "excerpt", "title", "headline_ideas", "custom"]);

export const aiAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        mode: modes,
        title: z.string().max(300).optional().default(""),
        content: z.string().max(30000).optional().default(""),
        instruction: z.string().max(2000).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const settings = await loadSettings(context);
    if (!settings.enabled) throw new Error("As integrações de IA estão desativadas no painel.");

    const base = [
      `Você é assistente de redação do Verificado News, um site brasileiro de checagem de fatos.`,
      `Escreva em ${settings.language}, com linguagem clara, jornalística, imparcial e sem sensacionalismo.`,
      `Nunca invente fatos, datas, números ou fontes: quando não houver dado, indique que precisa de apuração.`,
      settings.style_instructions ? `Diretrizes da redação: ${settings.style_instructions}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const prompts: Record<string, string> = {
      draft: `Escreva um artigo completo em HTML simples (use apenas <h2>, <h3>, <p>, <ul>, <li>, <strong>) sobre o tema: "${data.title}". Estruture com abertura, contexto, o que se sabe, o que ainda precisa de checagem e conclusão. Não inclua <h1>. Contexto extra do redator: ${data.instruction || "nenhum"}.`,
      improve: `Reescreva e melhore o texto abaixo mantendo os fatos, melhorando clareza, gramática e fluidez. Devolva HTML simples (<h2>, <h3>, <p>, <ul>, <li>, <strong>), sem comentários extras.\n\n${data.content}`,
      excerpt: `Escreva um resumo de 1 a 2 frases (máx. 280 caracteres) para o artigo abaixo. Devolva só o texto puro.\n\nTítulo: ${data.title}\n\n${data.content}`,
      title: `Sugira o melhor título único (máx. 90 caracteres) para o artigo abaixo. Devolva só o título, sem aspas.\n\n${data.content || data.title}`,
      headline_ideas: `Liste 5 sugestões de título para o tema "${data.title}". Devolva uma por linha, sem numeração.`,
      custom: `${data.instruction}\n\nTexto de referência:\n${data.content}`,
    };

    const output = await callGateway(settings.text_model, [
      { role: "system", content: base },
      { role: "user", content: prompts[data.mode] ?? prompts["custom"] },
    ]);
    return { output, model: settings.text_model };
  });

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const settings = await loadSettings(context);
    const output = await callGateway(settings.text_model, [
      { role: "user", content: "Responda apenas: ok" },
    ]);
    return { ok: true, output, model: settings.text_model };
  });
