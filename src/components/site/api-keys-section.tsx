import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, Plus, Trash2, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listIntegrationKeys,
  saveIntegrationKey,
  deleteIntegrationKey,
  testIntegrationKey,
} from "@/lib/integrations.functions";

const PRESETS = [
  { value: "pexels", label: "Pexels — imagens gratuitas", hint: "Chave em pexels.com/api" },
  { value: "openai", label: "OpenAI (ChatGPT)", hint: "sk-..." },
  { value: "anthropic", label: "Anthropic (Claude)", hint: "sk-ant-..." },
  { value: "outro", label: "Outra integração", hint: "Cole a chave do serviço" },
];

export function ApiKeysSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listIntegrationKeys);
  const saveFn = useServerFn(saveIntegrationKey);
  const delFn = useServerFn(deleteIntegrationKey);
  const testFn = useServerFn(testIntegrationKey);

  const { data, isLoading } = useQuery({
    queryKey: ["integration-keys"],
    queryFn: () => listFn(),
  });

  const [preset, setPreset] = useState("pexels");
  const [custom, setCustom] = useState("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["integration-keys"] });

  const mSave = useMutation({
    mutationFn: (vars: { provider: string; label: string; api_key?: string; enabled?: boolean }) =>
      saveFn({ data: vars }),
    onSuccess: () => {
      toast.success("Chave salva com segurança.");
      setApiKey("");
      setCustom("");
      setLabel("");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Chave removida.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao remover"),
  });

  const mTest = useMutation({
    mutationFn: (provider: string) => testFn({ data: { provider } }),
    onSuccess: (r) => toast.success(r.message ?? "Conexão funcionando."),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha no teste"),
  });

  const providerId = preset === "outro" ? custom.trim().toLowerCase() : preset;

  const submit = () => {
    if (!providerId || providerId.length < 2) return toast.error("Informe o nome da integração.");
    if (apiKey.trim().length < 8) return toast.error("Cole uma chave válida.");
    mSave.mutate({ provider: providerId, label: label.trim() || providerId, api_key: apiKey.trim() });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-primary/10 p-2 text-primary">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">Chaves de API</h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Cadastre chaves de serviços externos (Pexels, ChatGPT, Claude e outros). As chaves ficam
            guardadas no backend e nunca aparecem completas na tela.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-1">
          <Label className="text-sm font-medium">Integração</Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "outro" && (
          <div>
            <Label className="text-sm font-medium">Identificador</Label>
            <Input
              className="mt-2"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="ex.: unsplash"
            />
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">Apelido (opcional)</Label>
          <Input
            className="mt-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Conta da redação"
          />
        </div>

        <div className={preset === "outro" ? "md:col-span-1" : "md:col-span-2"}>
          <Label className="text-sm font-medium">Chave de API</Label>
          <Input
            className="mt-2"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={PRESETS.find((p) => p.value === preset)?.hint}
          />
        </div>
      </div>

      <div className="mt-4">
        <Button size="sm" onClick={submit} disabled={mSave.isPending}>
          {mSave.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          Salvar chave
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (data?.keys ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma chave cadastrada ainda.</p>
        ) : (
          (data?.keys ?? []).map((k) => (
            <div
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{k.label || k.provider}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {k.provider} · {k.masked}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={k.enabled}
                  onCheckedChange={(v) =>
                    mSave.mutate({ provider: k.provider, label: k.label, enabled: v })
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mTest.mutate(k.provider)}
                  disabled={mTest.isPending}
                >
                  <PlugZap className="mr-1 h-4 w-4" /> Testar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => mDelete.mutate(k.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Com a chave do Pexels ativa, o editor de artigos ganha o botão “Buscar imagem gratuita”.
      </p>
    </div>
  );
}
