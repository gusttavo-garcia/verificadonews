import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles, ImageIcon, PlugZap, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAiSettings, updateAiSettings, testAiConnection } from "@/lib/ai.functions";
import { ApiKeysSection } from "@/components/site/api-keys-section";

const TEXT_MODELS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash — equilíbrio (recomendado)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro — textos mais elaborados" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite — mais rápido e econômico" },
  { value: "openai/gpt-5", label: "GPT-5 — raciocínio avançado" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini — rápido e econômico" },
];

const IMAGE_MODELS = [
  { value: "openai/gpt-image-2", label: "GPT Image 2 — fotos e capas (recomendado)" },
  { value: "google/gemini-3-pro-image", label: "Gemini 3 Pro Image — ilustrações" },
];

export function IntegrationsSection() {
  const qc = useQueryClient();
  const getFn = useServerFn(getAiSettings);
  const updateFn = useServerFn(updateAiSettings);
  const testFn = useServerFn(testAiConnection);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: () => getFn(),
  });

  const settings = data?.settings ?? null;
  const [style, setStyle] = useState("");
  useEffect(() => {
    if (settings) setStyle(settings.style_instructions ?? "");
  }, [settings?.id]);

  const mUpdate = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      updateFn({ data: { id: settings!.id, ...patch } as any }),
    onSuccess: () => {
      toast.success("Integração atualizada.");
      void qc.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const mTest = useMutation({
    mutationFn: () => testFn(),
    onSuccess: () => toast.success("Conexão com a IA funcionando!"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha no teste"),
  });

  if (isLoading || !settings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Integrações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte a inteligência artificial que ajuda a redação a escrever artigos e criar imagens.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <PlugZap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold">Assistente de IA (Lovable AI)</h3>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Já vem conectado ao projeto — não é necessário cadastrar chaves. Usado para gerar
                rascunhos, melhorar textos, sugerir títulos, criar resumos e gerar imagens.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {data?.hasKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-teal)]/15 px-2 py-1 font-medium text-[color:var(--brand-teal)]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 font-medium text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> Chave não encontrada
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="ai-enabled" className="text-sm">
              {settings.enabled ? "Ativa" : "Desativada"}
            </Label>
            <Switch
              id="ai-enabled"
              checked={settings.enabled}
              onCheckedChange={(v) => mUpdate.mutate({ enabled: v })}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Modelo de texto
            </Label>
            <Select
              value={settings.text_model}
              onValueChange={(v) => mUpdate.mutate({ text_model: v })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEXT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-primary" /> Modelo de imagem
            </Label>
            <Select
              value={settings.image_model}
              onValueChange={(v) => mUpdate.mutate({ image_model: v })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="ai-style" className="text-sm font-medium">
            Diretrizes de estilo da redação
          </Label>
          <Textarea
            id="ai-style"
            rows={4}
            className="mt-2"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Ex.: tom sóbrio, foco em golpes digitais, sempre citar fontes oficiais e evitar alarmismo."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => mUpdate.mutate({ style_instructions: style })}
              disabled={mUpdate.isPending}
            >
              Salvar diretrizes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => mTest.mutate()}
              disabled={mTest.isPending}
            >
              {mTest.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="mr-1 h-4 w-4" />
              )}
              Testar conexão
            </Button>
          </div>
        </div>
      </div>

      <ApiKeysSection />

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Como usar no editor de artigos</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Abra um rascunho e use o painel “Assistente de IA” para gerar ou melhorar o texto.</li>
          <li>Gere a imagem de destaque a partir do título com um clique.</li>
          <li>
            Dentro do conteúdo, use os botões de imagem para enviar do computador ou gerar por IA.
          </li>
        </ul>
      </div>
    </div>
  );
}
