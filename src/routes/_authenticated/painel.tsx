import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Send, CheckCircle2, Trash2, ArrowLeft, EyeOff, Link as LinkIcon, Pencil, Upload, X } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
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
import { supabase } from "@/integrations/supabase/client";
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
import { listUsers, setUserRole, createUser, updateUser } from "@/lib/users.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { listNewsletterSubscribers } from "@/lib/comments.functions";
import { SplitRedirectorManager } from "@/components/site/split-redirector-manager";
import type { AppRole } from "@/hooks/use-auth";

function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5 MB).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("article-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("article-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 anos
      if (sErr || !signed) throw sErr ?? new Error("URL falhou");
      onChange(signed.signedUrl);
      toast.success("Imagem enviada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1 space-y-2">
      {value ? (
        <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt="Prévia" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow hover:bg-background"
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
        <Upload className="h-4 w-4" />
        {uploading ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

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

  const articles = data?.articles ?? [];
  const stats = {
    published: articles.filter((a: any) => a.status === "published").length,
    pending: articles.filter((a: any) => a.status === "pending_review").length,
    draft: articles.filter((a: any) => a.status === "draft").length,
  };
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (displayName ?? user?.email ?? "").split(" ")[0] || "";

  return (
    <PageShell>
      <section className="border-b border-border bg-[color:var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Publicados
              </div>
              <div className="mt-1 text-2xl font-semibold text-[color:var(--brand-teal)]">
                {stats.published}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Pendentes
              </div>
              <div className="mt-1 text-2xl font-semibold text-[oklch(0.55_0.15_60)]">
                {stats.pending}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Rascunhos
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {stats.draft}
              </div>
            </div>
          </div>
        </div>
      </section>
      {isAdmin && (
        <PendingReviewSection
          articles={articles}
          onPublish={(id) => mPublish.mutate(id)}
          onUnpublish={(id) => mUnpublish.mutate(id)}
          publishPending={mPublish.isPending}
          unpublishPending={mUnpublish.isPending}
        />
      )}
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
              <Label>Imagem de destaque</Label>
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
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
                        {(isAdmin || a.status !== "published") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(a)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                          </Button>
                        )}
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
      {isAdmin && <SplitRedirectorManager />}
      {isAdmin && <UsersSection currentUserId={user?.id ?? null} />}
      {isAdmin && <NewsletterSection />}
    </PageShell>
  );
}

function PendingReviewSection({
  articles,
  onPublish,
  onUnpublish,
  publishPending,
  unpublishPending,
}: {
  articles: any[];
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  publishPending: boolean;
  unpublishPending: boolean;
}) {
  const pending = articles.filter((a) => a.status === "pending_review");
  if (pending.length === 0) return null;
  const groups = pending.reduce<Record<string, { name: string; items: any[] }>>(
    (acc, a) => {
      const key = a.author_id ?? "sem-autor";
      const name = a.author_name ?? "Sem autor";
      if (!acc[key]) acc[key] = { name, items: [] };
      acc[key].items.push(a);
      return acc;
    },
    {},
  );
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold">Enviados para revisão</h2>
        <span className="rounded-full bg-[color:var(--brand-yellow)]/50 px-2 py-0.5 text-xs font-medium text-[oklch(0.35_0.08_60)]">
          {pending.length}
        </span>
      </div>
      <div className="space-y-4">
        {Object.entries(groups).map(([key, group]) => (
          <div
            key={key}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
              <div className="text-sm font-semibold text-foreground">
                {group.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {group.items.length}{" "}
                {group.items.length === 1 ? "artigo" : "artigos"}
              </div>
            </div>
            <ul className="divide-y divide-border">
              {group.items.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.category} ·{" "}
                      {new Date(a.updated_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUnpublish(a.id)}
                      disabled={unpublishPending}
                    >
                      <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Devolver
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onPublish(a.id)}
                      disabled={publishPending}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Publicar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
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
  const createFn = useServerFn(createUser);
  const updateFn = useServerFn(updateUser);

  const { data, isLoading } = useQuery({
    queryKey: ["panel-users"],
    queryFn: () => list(),
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

  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "reader" as AppRole,
  });

  const openEdit = (u: any) => {
    const currentRole: AppRole = u.roles.includes("admin")
      ? "admin"
      : u.roles.includes("editor")
        ? "editor"
        : "reader";
    setEditForm({
      displayName: u.display_name ?? "",
      email: u.email ?? "",
      password: "",
      role: currentRole,
    });
    setEditUser(u);
  };

  const mUpdate = useMutation({
    mutationFn: () => {
      if (!editUser) throw new Error("Sem usuário");
      const payload: any = { userId: editUser.id };
      if (editForm.displayName && editForm.displayName !== editUser.display_name)
        payload.displayName = editForm.displayName;
      if (editForm.email && editForm.email !== editUser.email)
        payload.email = editForm.email;
      if (editForm.password) payload.password = editForm.password;
      const currentRole: AppRole = editUser.roles.includes("admin")
        ? "admin"
        : editUser.roles.includes("editor")
          ? "editor"
          : "reader";
      if (editForm.role !== currentRole) payload.role = editForm.role;
      return updateFn({ data: payload });
    },
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      setEditUser(null);
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
            Edite nome, e-mail, senha ou função dos usuários cadastrados.
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
                  <SelectItem value="editor">Redator</SelectItem>
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
          <ul className="divide-y divide-border">
            {data.users.map((u: any) => {
              const currentRole: AppRole = u.roles.includes("admin")
                ? "admin"
                : u.roles.includes("editor")
                  ? "editor"
                  : "reader";
              const isSelf = u.id === currentUserId;
              const stats = u.stats ?? { published: 0, pending: 0, draft: 0 };
              return (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {u.display_name ?? "—"}
                      </h3>
                      {isSelf && (
                        <span className="text-xs text-muted-foreground">(você)</span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {currentRole === "admin"
                          ? "Administrador"
                          : currentRole === "editor"
                            ? "Redator"
                            : "Leitor"}
                      </span>
                    </div>
                    {u.email && (
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{stats.published}</strong> publicados
                      </span>
                      <span>
                        <strong className="text-foreground">{stats.pending}</strong> pendentes
                      </span>
                      <span>
                        <strong className="text-foreground">{stats.draft}</strong> em rascunho
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mUpdate.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Nova senha</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Deixe em branco para manter"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                minLength={8}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v as AppRole })}
                disabled={editUser?.id === currentUserId}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reader">Leitor</SelectItem>
                  <SelectItem value="editor">Redator</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mUpdate.isPending}>
                {mUpdate.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}