import { supabase } from "@/integrations/supabase/client";

/** Gera uma imagem via IA e salva no storage, retornando a URL pública/assinada. */
export async function generateAndUploadImage(prompt: string, model?: string) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text?.slice(0, 200) || `Falha ao gerar imagem (${res.status})`);
  }
  const { dataUrl } = (await res.json()) as { dataUrl: string };

  const blob = await (await fetch(dataUrl)).blob();
  const path = `ia/${crypto.randomUUID()}.png`;
  const { error: upErr } = await supabase.storage
    .from("article-images")
    .upload(path, blob, { contentType: blob.type || "image/png", cacheControl: "31536000" });
  if (upErr) throw upErr;

  const { data: signed, error: sErr } = await supabase.storage
    .from("article-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (sErr || !signed) throw sErr ?? new Error("Não foi possível gerar a URL da imagem.");
  return signed.signedUrl;
}
