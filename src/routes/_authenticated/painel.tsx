import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Send, CheckCircle2, Trash2, ArrowLeft, EyeOff, Link as LinkIcon, Pencil } from "lucide-react";
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
  updateArticle,
} from "@/lib/articles.functions";
import { listUsers, setUserRole } from "@/lib/users.functions";
import { createUser } from "@/lib/users.functions";
import { listNewsletterSubscribers } from "@/lib/comments.functions";
import type { AppRole } from "@/hooks/use-auth";

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
  const { roles, displayName, loading, user } = useAuth();
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
  const updateFn = useServerFn(updateArticle);
  const reviewFn = useServerFn(requestReview);
  const publishFn = useServerFn(publishArticle);
  const unpublishFn = useServerFn(unpublishArticle);
  const deleteFn = useServerFn(deleteArticle);
  const listUsersFn = useServerFn(listUsers);

  const { data: usersData } = useQuery({
    queryKey: ["panel-users"],
    queryFn: () => listUsersFn(),
    enabled: isStaff && isAdmin,
  });

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
  const [editingId, setEditingId] = useState<string | null>(null);
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
    image_url: "",
    author_id: "" as string,
  });

  const resetForm = () => {
    setForm({
      title: "",
      excerpt: "",
      body: "",
      category: categories[0],
      verdict: "verificado",
      type: "noticia",
      image_url: "",
      author_id: "",
    });
    setEditingId(null);
  };

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      title: a.title ?? "",
      excerpt: a.excerpt ?? "",
      body: a.body ?? "",
      category: a.category ?? categories[0],
      verdict: a.verdict ?? "verificado",
      type: a.type ?? "noticia",
      image_url: a.image_url ?? "",
      author_id: a.author_id ?? "",
    });
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mCreate = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Rascunho criado.");
      setShowForm(false);
      resetForm();
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const mUpdate = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("Sem artigo em edição");
      const payload: any = {
        id: editingId,
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        category: form.category,
        verdict: form.verdict,
        type: form.type,
        image_url: form.image_url ? form.image_url : null,
      };
      if (isAdmin && form.author_id) payload.author_id = form.author_id;
      return updateFn({ data: payload });
    },
    onSuccess: () => {
      toast.success("Artigo atualizado.");
      setShowForm(false);
      resetForm();
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
          <Button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
          >
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
              if (editingId) mUpdate.mutate();
              else mCreate.mutate();
            }}
            className="mb-10 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="text-sm font-medium text-muted-foreground">
              {editingId ? "Editando artigo" : "Novo rascunho"}
            </div>
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
              <Label htmlFor="image_url">Imagem de destaque (URL)</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              {form.image_url && (
                <div className="mt-2 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={form.image_url} alt="Prévia" className="h-full w-full object-cover" />
                </div>
              )}
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
            {isAdmin && editingId && (
              <div>
                <Label>Autor</Label>
                <Select
                  value={form.author_id}
                  onValueChange={(v) => setForm({ ...form, author_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecionar autor" /></SelectTrigger>
                  <SelectContent>
                    {(usersData?.users ?? []).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name ?? u.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={mCreate.isPending || mUpdate.isPending}>
                {editingId ? "Salvar alterações" : "Salvar rascunho"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
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
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>{a.title}</div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/${a.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copiado!");
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-primary"
                        title="Clique para copiar"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate">/{a.slug}</span>
                      </button>
                    </td>
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
      {isAdmin && <UsersSection currentUserId={user?.id ?? null} />}
      {isAdmin && <NewsletterSection />}
    </PageShell>
  );
}

function NewsletterSection() {
  const listFn = useServerFn(listNewsletterSubscribers);
  const { data, isLoading } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: () => listFn(),
  });
  const subs = data?.subscribers ?? [];
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Inscritos na newsletter</h2>
        <p className="text-sm text-muted-foreground">
          Usuários que aceitaram receber notícias por email.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando…</div>
        ) : subs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum usuário inscrito ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Inscrito em</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {s.display_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function UsersSection({ currentUserId }: { currentUserId: string | null }) {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const setRole = useServerFn(setUserRole);
  const createFn = useServerFn(createUser);

  const { data, isLoading } = useQuery({
    queryKey: ["panel-users"],
    queryFn: () => list(),
  });

  const mSetRole = useMutation({
    mutationFn: (input: { userId: string; role: AppRole }) =>
      setRole({ data: input }),
    onSuccess: () => {
      toast.success("Função atualizada.");
      qc.invalidateQueries({ queryKey: ["panel-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "editor" as "editor" | "admin",
  });

  const mCreate = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Usuário criado.");
      setShowForm(false);
      setForm({ email: "", password: "", displayName: "", role: "editor" });
      qc.invalidateQueries({ queryKey: ["panel-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Promova leitores a editores ou administradores. A mudança é imediata.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Novo usuário
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
          className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-user-name">Nome</Label>
              <Input
                id="new-user-name"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
                minLength={1}
              />
            </div>
            <div>
              <Label htmlFor="new-user-email">E-mail</Label>
              <Input
                id="new-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-user-password">Senha provisória</Label>
              <Input
                id="new-user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={mCreate.isPending}>
            {mCreate.isPending ? "Criando…" : "Criar usuário"}
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando…</div>
        ) : !data?.users.length ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cadastrado em</th>
                <th className="px-4 py-3">Função atual</th>
                <th className="px-4 py-3 text-right">Alterar função</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u: any) => {
                const currentRole: AppRole = u.roles.includes("admin")
                  ? "admin"
                  : u.roles.includes("editor")
                    ? "editor"
                    : "reader";
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.display_name ?? "—"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                        {currentRole === "admin"
                          ? "Administrador"
                          : currentRole === "editor"
                            ? "Editor"
                            : "Leitor"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Select
                          value={currentRole}
                          onValueChange={(v) =>
                            mSetRole.mutate({ userId: u.id, role: v as AppRole })
                          }
                          disabled={mSetRole.isPending || isSelf}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reader">Leitor</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}