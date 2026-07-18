import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Send, CheckCircle2, Trash2, ArrowLeft, EyeOff } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useIsStaff } from "@/hooks/use-auth";
import { categories } from "@/lib/mock-data";
import {
  createArticle,
  deleteArticle,
  listMyArticles,
  publishArticle,
  requestReview,
  unpublishArticle,
} from "@/lib/articles.functions";

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelPage,
  head: () => ({ meta: [{ title: "Painel — Verificado News" }] }),
});

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em revisão",
  published: "Publicado",
};

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-foreground/70",
  pending_review: "bg-[color:var(--brand-yellow)]/40 text-[oklch(0.35_0.08_60)]",
  published: "bg-[color:var(--brand-teal)]/20 text-[color:var(--brand-teal)]",
};

function PainelPage() {
  const navigate = useNavigate();
  const { roles, displayName, loading } = useAuth();
  const isStaff = useIsStaff();
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!loading && !isStaff) {
      toast.error("Acesso restrito a editores e administradores.");
      navigate({ to: "/" });
    }
  }, [isStaff, loading, navigate]);

  const qc = useQueryClient();
  const list = useServerFn(listMyArticles);
  const createFn = useServerFn(createArticle);
  const reviewFn = useServerFn(requestReview);
  const publishFn = useServerFn(publishArticle);
  const unpublishFn = useServerFn(unpublishArticle);
  const deleteFn = useServerFn(deleteArticle);

  const { data, isLoading } = useQuery({
    queryKey: ["panel-articles"],
    queryFn: () => list(),
    enabled: isStaff,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["panel-articles"] });

  const mReview = useMutation({
    mutationFn: (id: string) => reviewFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Revisão solicitada.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const mPublish = useMutation({
    mutationFn: (id: string) => publishFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Artigo publicado.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const mUnpublish = useMutation({
    mutationFn: (id: string) => unpublishFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Despublicado.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const mDelete = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Artigo excluído.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    body: "",
    category: categories[0],
    verdict: "verificado" as
      | "verificado"
      | "falso"
      | "enganoso"
      | "parcial"
      | "apuracao",
    type: "noticia" as "noticia" | "golpe" | "empresa" | "site" | "video" | "fake",
  });

  const mCreate = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Rascunho criado.");
      setShowForm(false);
      setForm({
        title: "",
        excerpt: "",
        body: "",
        category: categories[0],
        verdict: "verificado",
        type: "noticia",
      });
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (!isStaff) return null;

  return (
    <PageShell>
      <PageHero
        title={`Painel — ${isAdmin ? "Administrador" : "Editor"}`}
        subtitle={
          isAdmin
            ? "Publique, despublique ou remova artigos enviados pelos editores."
            : `Olá${displayName ? `, ${displayName}` : ""}. Crie rascunhos e envie para revisão dos administradores.`
        }
      />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Meus artigos</h2>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Novo rascunho
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mCreate.mutate();
            }}
            className="mb-10 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div>
              <Label htmlFor="excerpt">Resumo</Label>
              <Textarea
                id="excerpt"
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="body">Conteúdo</Label>
              <Textarea
                id="body"
                rows={8}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Veredito</Label>
                <Select
                  value={form.verdict}
                  onValueChange={(v) => setForm({ ...form, verdict: v as typeof form.verdict })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verificado">Verificado</SelectItem>
                    <SelectItem value="falso">Falso</SelectItem>
                    <SelectItem value="enganoso">Enganoso</SelectItem>
                    <SelectItem value="parcial">Parcialmente Verdade</SelectItem>
                    <SelectItem value="apuracao">Em Apuração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noticia">Notícia</SelectItem>
                    <SelectItem value="golpe">Golpe</SelectItem>
                    <SelectItem value="fake">Fake News</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={mCreate.isPending}>
              Salvar rascunho
            </Button>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando…</div>
          ) : !data?.articles.length ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum artigo ainda. Crie um novo rascunho.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  {isAdmin && <th className="px-4 py-3">Autor</th>}
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.articles.map((a: any) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{a.title}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.author_name ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">{a.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[a.status] ?? ""}`}
                      >
                        {statusLabel[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {a.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => mReview.mutate(a.id)}
                            disabled={mReview.isPending}
                          >
                            <Send className="mr-1 h-3.5 w-3.5" /> Enviar para revisão
                          </Button>
                        )}
                        {isAdmin && a.status !== "published" && (
                          <Button
                            size="sm"
                            onClick={() => mPublish.mutate(a.id)}
                            disabled={mPublish.isPending}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Publicar
                          </Button>
                        )}
                        {isAdmin && a.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => mUnpublish.mutate(a.id)}
                            disabled={mUnpublish.isPending}
                          >
                            <EyeOff className="mr-1 h-3.5 w-3.5" /> Despublicar
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Excluir "${a.title}"?`)) mDelete.mutate(a.id);
                            }}
                            disabled={mDelete.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </PageShell>
  );
}