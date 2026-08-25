import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { marked } from "marked";
import {
  ArrowLeft,
  Check,
  Loader2,
  Send,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUploader } from "@/components/site/image-uploader";
import { RichTextEditor } from "@/components/site/rich-text-editor";
import { EditorSidebar } from "@/components/site/editor-sidebar";
import { useAuth, useIsStaff } from "@/hooks/use-auth";
import { listCategories } from "@/lib/categories.functions";
import { listUsers } from "@/lib/users.functions";
import {
  getArticleById,
  updateArticle,
  requestReview,
  publishArticle,
  deleteArticle,
} from "@/lib/articles.functions";

export const Route = createFileRoute("/_authenticated/painel/editar/$id")({
  component: EditorArtigoPage,
  head: () => ({ meta: [{ title: "Editor de artigo — Painel" }] }),
});

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em revisão",
  published: "Publicado",
};

type FormState = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  verdict: "verificado" | "falso" | "enganoso" | "parcial" | "apuracao";
  type: "noticia" | "golpe" | "empresa" | "site" | "video" | "fake";
  image_url: string;
  author_id: string;
};

function toHtml(body: string) {
  const trimmed = (body ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<")) return trimmed;
  return marked.parse(trimmed, { async: false }) as string;
}

function EditorArtigoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { roles, loading, user, displayName } = useAuth();
  const isStaff = useIsStaff();
  const isAdmin = roles.includes("admin");

  const getArticle = useServerFn(getArticleById);
  const updateFn = useServerFn(updateArticle);
  const reviewFn = useServerFn(requestReview);
  const publishFn = useServerFn(publishArticle);
  const deleteFn = useServerFn(deleteArticle);
  const listCategoriesFn = useServerFn(listCategories);
  const listUsersFn = useServerFn(listUsers);

  useEffect(() => {
    if (!loading && !isStaff) {
      toast.error("Acesso restrito a redatores e administradores.");
      navigate({ to: "/" });
    }
  }, [isStaff, loading, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["panel-article", id],
    queryFn: () => getArticle({ data: { id } }),
    enabled: isStaff,
  });

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategoriesFn(),
    enabled: isStaff,
  });
  const categories = (catData?.categories ?? []).map((c) => c.name);

  const { data: usersData } = useQuery({
    queryKey: ["panel-users"],
    queryFn: () => listUsersFn(),
    enabled: isStaff && isAdmin,
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirm, setConfirm] = useState<null | "review" | "publish" | "delete">(null);
  const loadedFor = useRef<string | null>(null);

  const article = data?.article as any;
  const status = article?.status ?? "draft";

  useEffect(() => {
    if (!article || loadedFor.current === article.id) return;
    loadedFor.current = article.id;
    setForm({
      title: article.title === "Rascunho sem título" ? "" : (article.title ?? ""),
      excerpt: article.excerpt ?? "",
      body: toHtml(article.body ?? ""),
      category: article.category ?? "",
      verdict: article.verdict ?? "verificado",
      type: article.type ?? "noticia",
      image_url: article.image_url ?? "",
      author_id: article.author_id ?? "",
    });
  }, [article]);

  const patch = (values: Partial<FormState>) => {
    setForm((prev) => (prev ? { ...prev, ...values } : prev));
    setDirty(true);
  };

  const save = async (silent = true) => {
    if (!form) return;
    const payload: any = {
      id,
      title: form.title.trim().length >= 3 ? form.title.trim() : "Rascunho sem título",
      excerpt: form.excerpt,
      body: form.body,
      category: form.category || undefined,
      verdict: form.verdict,
      type: form.type,
      image_url: form.image_url ? form.image_url : null,
    };
    if (isAdmin && form.author_id) payload.author_id = form.author_id;
    await updateFn({ data: payload });
    setSavedAt(new Date());
    setDirty(false);
    void qc.invalidateQueries({ queryKey: ["panel-articles"] });
    if (!silent) toast.success("Alterações salvas.");
  };

  const mSave = useMutation({
    mutationFn: (silent: boolean) => save(silent),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  // Autosave: salva 2,5s depois da última alteração
  useEffect(() => {
    if (!dirty || !form) return;
    const t = setTimeout(() => {
      if (!mSave.isPending) mSave.mutate(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [dirty, form]);

  const runAction = async (action: "review" | "publish" | "delete") => {
    try {
      if (dirty) await save(true);
      if (action === "review") {
        await reviewFn({ data: { id } });
        toast.success("Enviado para revisão.");
      } else if (action === "publish") {
        await publishFn({ data: { id } });
        toast.success("Artigo publicado.");
      } else {
        await deleteFn({ data: { id } });
        toast.success("Artigo movido para a lixeira.");
      }
      void qc.invalidateQueries({ queryKey: ["panel-articles"] });
      void qc.invalidateQueries({ queryKey: ["panel-article", id] });
      if (action === "delete") navigate({ to: "/painel" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na ação");
    }
  };

  if (!isStaff) return null;

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Carregando artigo…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="text-muted-foreground">Não foi possível carregar este artigo.</p>
        <Button asChild className="mt-4">
          <Link to="/painel">Voltar ao painel</Link>
        </Button>
      </div>
    );
  }

  const confirmCopy = {
    review: {
      title: "Enviar para revisão?",
      description: "O artigo ficará visível para os administradores aprovarem.",
      label: "Enviar",
    },
    publish: {
      title: "Publicar artigo?",
      description: "Ele ficará visível publicamente no site.",
      label: "Publicar",
    },
    delete: {
      title: "Mover para a lixeira?",
      description: "Você poderá restaurá-lo depois na Lixeira.",
      label: "Mover para lixeira",
    },
  } as const;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/painel">
              <ArrowLeft className="mr-1 h-4 w-4" /> Painel
            </Link>
          </Button>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium whitespace-nowrap">
            {statusLabel[status] ?? status}
          </span>
          <span className="text-xs text-muted-foreground">
            {mSave.isPending
              ? "Salvando…"
              : dirty
                ? "Alterações não salvas"
                : savedAt
                  ? `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Rascunho salvo automaticamente"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "published" && article?.slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/${article.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" /> Ver no site
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => mSave.mutate(false)}
            disabled={mSave.isPending}
          >
            <Check className="mr-1 h-4 w-4" /> Salvar
          </Button>
          {status === "draft" && !isAdmin && (
            <Button size="sm" onClick={() => setConfirm("review")}>
              <Send className="mr-1 h-4 w-4" /> Pedir revisão
            </Button>
          )}
          {isAdmin && status !== "published" && (
            <Button size="sm" onClick={() => setConfirm("publish")}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Publicar
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setConfirm("delete")}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div>
            <Label htmlFor="title" className="text-base font-medium">
              Título
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Digite o título do artigo"
              className="mt-2 text-lg font-semibold"
            />
          </div>

          <div>
            <Label htmlFor="excerpt" className="text-base font-medium">
              Resumo
            </Label>
            <Textarea
              id="excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => patch({ excerpt: e.target.value })}
              placeholder="Escreva um breve resumo do conteúdo"
              className="mt-2 resize-none"
            />
          </div>

          <div>
            <Label className="text-base font-medium">Conteúdo</Label>
            <p className="mb-2 mt-1 text-xs text-muted-foreground">
              Selecione o texto e use a barra de ferramentas para aplicar títulos, negrito,
              itálico, grifado e mais.
            </p>
            <RichTextEditor
              value={form.body}
              onChange={(html) => patch({ body: html })}
              placeholder="Escreva o conteúdo completo do artigo aqui..."
            />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-border bg-muted/30 p-5">
          <div>
            <Label className="text-base font-medium">Imagem de destaque</Label>
            <div className="mt-2">
              <ImageUploader
                value={form.image_url}
                onChange={(url) => patch({ image_url: url })}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Categoria</Label>
            <Select value={form.category} onValueChange={(v) => patch({ category: v })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-medium">Veredito</Label>
            <Select
              value={form.verdict}
              onValueChange={(v) => patch({ verdict: v as FormState["verdict"] })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
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
            <Label className="text-base font-medium">Tipo</Label>
            <Select
              value={form.type}
              onValueChange={(v) => patch({ type: v as FormState["type"] })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
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

          {isAdmin && (
            <div>
              <Label className="text-base font-medium">Autor</Label>
              <Select value={form.author_id} onValueChange={(v) => patch({ author_id: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecionar autor" />
                </SelectTrigger>
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
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmCopy[confirm].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmCopy[confirm].description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const action = confirm;
                    setConfirm(null);
                    void runAction(action);
                  }}
                >
                  {confirmCopy[confirm].label}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </div>
  );
}
