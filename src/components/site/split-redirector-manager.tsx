import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Split,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
  DollarSign,
  Percent,
  Sparkles,
  Layers,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  listSplitFolders,
  upsertSplitFolder,
  deleteSplitFolder,
  syncGamEcpm,
  type SplitFolder,
  type SplitRoute,
} from "@/lib/splitter.functions";

const COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

export function SplitRedirectorManager() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSplitFolders);
  const upsertFn = useServerFn(upsertSplitFolder);
  const deleteFn = useServerFn(deleteSplitFolder);
  const syncGamFn = useServerFn(syncGamEcpm);

  const { data, isLoading } = useQuery({
    queryKey: ["split-folders"],
    queryFn: () => listFn(),
  });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<Partial<SplitFolder> | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["split-folders"] });

  const mUpsert = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => {
      toast.success("Redirecionador configurado com sucesso.");
      setEditingFolder(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Pasta de redirecionamento excluída.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao remover"),
  });

  const mSyncGam = useMutation({
    mutationFn: (folderId: string) => syncGamFn({ data: { folderId } }),
    onSuccess: (res) => {
      toast.success(`eCPM do GAM atualizado! Total acumulado: R$ ${res.totalEcpm?.toFixed(2)}`);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro na sincronização GAM"),
  });

  const startNewFolder = () => {
    setEditingFolder({
      name: "",
      slug: "",
      description: "",
      gam_network_code: "9757133296554737",
      auto_ecpm_balancing: true,
      routes: [
        { name: "Variante Golpes", slug: "golpes-a", path: "/golpes", weight: 50, ecpm: 12.50, gam_ad_unit_id: "ad_golpes_top" },
        { name: "Variante Fake News", slug: "fake-news-b", path: "/fake-news", weight: 50, ecpm: 8.20, gam_ad_unit_id: "ad_fake_top" },
      ],
    });
  };

  const handleCopyFolderLink = (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link probabilístico da pasta copiado!");
  };

  const handleCopyRouteLink = (folderSlug: string, routeSlug: string) => {
    const url = `${window.location.origin}/r/${folderSlug}/${routeSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link direto da rota copiado!");
  };

  const folders = data?.folders ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Split className="h-5 w-5 text-primary" /> Redirecionador Probabilístico (Split & GAM)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Divida o tráfego de entrada em porcentagens para diferentes rotas/páginas e otimize
            automaticamente com base no eCPM do Google Ad Manager.
          </p>
        </div>
        <Button onClick={startNewFolder}>
          <Plus className="mr-2 h-4 w-4" /> Nova Pasta Split
        </Button>
      </div>

      {editingFolder && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editingFolder.name || !editingFolder.slug) {
              toast.error("Preencha o nome e o slug da pasta.");
              return;
            }
            mUpsert.mutate(editingFolder);
          }}
          className="mb-8 space-y-6 rounded-2xl border border-primary/30 bg-card p-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-semibold text-foreground">
              {editingFolder.id ? "Editar Pasta Split" : "Criar Nova Pasta Split"}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingFolder(null)}
            >
              Cancelar
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Campanha Finanças 2026"
                value={editingFolder.name ?? ""}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  setEditingFolder({
                    ...editingFolder,
                    name,
                    slug: editingFolder.id ? editingFolder.slug : slug,
                  });
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="folder-slug">Slug do Link (/r/:slug)</Label>
              <Input
                id="folder-slug"
                placeholder="ex: financas"
                value={editingFolder.slug ?? ""}
                onChange={(e) => setEditingFolder({ ...editingFolder, slug: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="folder-desc">Descrição / Objetivo</Label>
              <Input
                id="folder-desc"
                placeholder="Descrição opcional para identificar este teste split"
                value={editingFolder.description ?? ""}
                onChange={(e) =>
                  setEditingFolder({ ...editingFolder, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="gam-network">Código de Rede do GAM (Google Ad Manager)</Label>
              <Input
                id="gam-network"
                placeholder="Ex: 9757133296554737"
                value={editingFolder.gam_network_code ?? ""}
                onChange={(e) =>
                  setEditingFolder({ ...editingFolder, gam_network_code: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
              <div>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Balanceamento Automático por eCPM
                </div>
                <div className="text-xs text-muted-foreground">
                  Ajusta as porcentagens das rotas proporcionalmente ao rendimento eCPM de cada página.
                </div>
              </div>
              <Switch
                checked={editingFolder.auto_ecpm_balancing ?? false}
                onCheckedChange={(v) =>
                  setEditingFolder({ ...editingFolder, auto_ecpm_balancing: v })
                }
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Rotas de Destino e Pesos %</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const routes = editingFolder.routes ?? [];
                  const newRoutes = [
                    ...routes,
                    { path: "/", weight: 25, ecpm: 5.0, gam_ad_unit_id: "" },
                  ];
                  setEditingFolder({ ...editingFolder, routes: newRoutes });
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar Rota
              </Button>
            </div>

            {(editingFolder.routes ?? []).map((route, idx) => (
              <div
                key={idx}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-3">
                  <Label className="text-xs">Nome da Rota</Label>
                  <Input
                    placeholder="Ex: Rota A - Golpes"
                    value={route.name ?? ""}
                    onChange={(e) => {
                      const updated = [...(editingFolder.routes ?? [])];
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");
                      updated[idx].name = name;
                      if (!updated[idx].slug) updated[idx].slug = slug;
                      setEditingFolder({ ...editingFolder, routes: updated });
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Slug da Rota</Label>
                  <Input
                    placeholder="ex: rota-a"
                    value={route.slug ?? ""}
                    onChange={(e) => {
                      const updated = [...(editingFolder.routes ?? [])];
                      updated[idx].slug = e.target.value;
                      setEditingFolder({ ...editingFolder, routes: updated });
                    }}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs">Caminho / URL de Destino</Label>
                  <Input
                    placeholder="/golpes ou https://..."
                    value={route.path}
                    onChange={(e) => {
                      const updated = [...(editingFolder.routes ?? [])];
                      updated[idx].path = e.target.value;
                      setEditingFolder({ ...editingFolder, routes: updated });
                    }}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Ad Unit GAM</Label>
                  <Input
                    placeholder="ex: ad_unit_top"
                    value={route.gam_ad_unit_id ?? ""}
                    onChange={(e) => {
                      const updated = [...(editingFolder.routes ?? [])];
                      updated[idx].gam_ad_unit_id = e.target.value;
                      setEditingFolder({ ...editingFolder, routes: updated });
                    }}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">% Peso</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={route.weight}
                    onChange={(e) => {
                      const updated = [...(editingFolder.routes ?? [])];
                      updated[idx].weight = parseFloat(e.target.value) || 0;
                      setEditingFolder({ ...editingFolder, routes: updated });
                    }}
                  />
                </div>
                <div className="flex justify-end sm:col-span-1 sm:pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (editingFolder.routes ?? []).filter((_, i) => i !== idx);
                      setEditingFolder({ ...editingFolder, routes: updated });
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    title="Remover Rota"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={mUpsert.isPending}>
              {mUpsert.isPending ? "Salvando…" : "Salvar Configuração Split"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingFolder(null)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando redirecionadores…</div>
      ) : folders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum redirecionador cadastrado ainda. Clique em "Nova Pasta Split" para começar.
        </div>
      ) : (
        <div className="space-y-6">
          {folders.map((folder) => {
            const routes = folder.routes ?? [];
            const totalWeight = routes.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
            const totalEcpm = routes.reduce((sum, r) => sum + (Number(r.ecpm) || 0), 0);

            return (
              <div
                key={folder.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/40 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="text-lg font-bold text-foreground">{folder.name}</h3>
                      {folder.auto_ecpm_balancing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Sparkles className="h-3 w-3" /> Auto eCPM GAM
                        </span>
                      )}
                    </div>
                    {folder.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{folder.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyFolderLink(folder.slug)}
                      title="Copiar link probabilístico da pasta"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Link Pasta (/r/{folder.slug})
                    </Button>
                    <a
                      href={`/r/${folder.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Testar Pasta
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mSyncGam.mutate(folder.id)}
                      disabled={mSyncGam.isPending}
                    >
                      <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${mSyncGam.isPending ? "animate-spin" : ""}`} />
                      Sincronizar GAM
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingFolder(folder)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Excluir pasta split "${folder.name}"?`)) {
                          mDelete.mutate(folder.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Distribuição Visual do Tráfego (%)</span>
                      <span>Total eCPM: R$ {totalEcpm.toFixed(2)}</span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      {routes.map((r, i) => {
                        const pct = totalWeight > 0 ? (Number(r.weight) / totalWeight) * 100 : 0;
                        return (
                          <div
                            key={i}
                            style={{ width: `${pct}%` }}
                            className={`${COLORS[i % COLORS.length]} transition-all`}
                            title={`${r.name || r.path}: ${pct.toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                          <th className="py-2">Nome & Slug da Rota</th>
                          <th className="py-2">Destino (URL)</th>
                          <th className="py-2">ID GAM Ad Unit</th>
                          <th className="py-2">eCPM (GAM)</th>
                          <th className="py-2">Divisão (%)</th>
                          <th className="py-2 text-right">Link Direto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {routes.map((route, i) => {
                          const pct =
                            totalWeight > 0
                              ? ((Number(route.weight) / totalWeight) * 100).toFixed(1)
                              : "0";
                          const routeSlug = route.slug || `rota-${i + 1}`;
                          return (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="py-2.5 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
                                  <div>
                                    <div className="font-semibold">{route.name || `Rota ${i + 1}`}</div>
                                    <div className="text-xs font-mono text-muted-foreground">/r/{folder.slug}/{routeSlug}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 text-xs text-foreground font-mono">
                                {route.path}
                              </td>
                              <td className="py-2.5 text-xs text-muted-foreground font-mono">
                                {route.gam_ad_unit_id || "—"}
                              </td>
                              <td className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                R$ {Number(route.ecpm || 0).toFixed(2)}
                              </td>
                              <td className="py-2.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                  <Percent className="h-3 w-3" /> {pct}%
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyRouteLink(folder.slug, routeSlug)}
                                  title="Copiar link direto para esta rota"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}