import { createFileRoute } from "@tanstack/react-router";

type Body = { prompt?: string; model?: string; size?: string };

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, model, size } = (await request.json()) as Body;
        if (!prompt || prompt.trim().length < 3) {
          return new Response("Prompt inválido", { status: 400 });
        }
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const chosen = model && model.trim() ? model.trim() : "openai/gpt-image-2";
        const isGemini = chosen.startsWith("google/");

        const body = isGemini
          ? {
              model: chosen,
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }
          : {
              model: chosen,
              prompt,
              quality: "low",
              ...(size ? { size } : {}),
            };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Falha na geração da imagem", { status: upstream.status });
        }

        const json: any = await upstream.json();
        const b64 =
          json?.data?.[0]?.b64_json ??
          json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
          null;
        if (!b64) return new Response("A IA não retornou imagem.", { status: 502 });

        const dataUrl = String(b64).startsWith("data:") ? String(b64) : `data:image/png;base64,${b64}`;
        return new Response(JSON.stringify({ dataUrl }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
