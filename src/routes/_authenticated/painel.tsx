import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import logo from "@/assets/logo.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Send,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  EyeOff,
  Link as LinkIcon,
  Pencil,
  Upload,
  X,
  RotateCcw,
  Filter,
  LayoutDashboard,
  FileText,
  FolderTree,
  Mail,
  Users,
  UserCircle,
  Menu,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import {
  listCategories,
  createCategory,
  deleteCategory,
  updateCategoryDescription,
} from "@/lib/categories.functions";
import {
  createArticle,
  deleteArticle,
  listMyArticles,
  publishArticle,
  requestReview,
  unpublishArticle,
  updateArticle,
  listTrashedArticles,
  restoreArticle,
  purgeArticle,
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
import { listAdSlots, updateAdSlot } from "@/lib/ads.functions";
import { Switch } from "@/components/ui/switch";
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
    <div className="space-y-3">
      {value ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt="Prévia" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background"
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-muted-foreground">
          <Upload className="mb-2 h-8 w-8 opacity-50" />
          <span className="text-xs">Nenhuma imagem selecionada</span>
        </div>
      )}
      <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
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

const verdictLabel: Record<string, string> = {
  verificado: "Verificado",
  falso: "Falso",
  enganoso: "Enganoso",
  parcial: "Parcialmente Verdade",
  apuracao: "Em Apuração",
};

type PendingAction = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  run: () => void;
};

type PanelSection =
  | "dashboard"
  | "artigos"
  | "categorias"
  | "newsletter"
  | "anuncios"
  | "usuarios"
  | "lixeira"
  | "perfil";

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
  const listCategoriesFn = useServerFn(listCategories);

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategoriesFn(),
    enabled: isStaff,
  });
  const categories = (catData?.categories ?? []).map((c) => c.name);

  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [section, setSection] = useState<PanelSection>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "views" | "title">("recent");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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
    category: "",
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
      category: "",
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
      category: a.category ?? "",
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
  const filteredArticles = articles.filter(
    (a: any) =>
      (filterCategory === "all" || a.category === filterCategory) &&
      (filterVerdict === "all" || a.verdict === filterVerdict) &&
      (filterStatus === "all" || a.status === filterStatus),
  );
  const hasFilters =
    filterCategory !== "all" || filterVerdict !== "all" || filterStatus !== "all";
  const articleCategories = Array.from(
    new Set(articles.map((a: any) => a.category).filter(Boolean)),
  ).sort() as string[];
  const stats = {
    published: articles.filter((a: any) => a.status === "published").length,
    pending: articles.filter((a: any) => a.status === "pending_review").length,
    draft: articles.filter((a: any) => a.status === "draft").length,
  };
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (displayName ?? user?.email ?? "").split(" ")[0] || "";

  const totalViews = articles.reduce((s: number, a: any) => s + (a.views ?? 0), 0);
  const totalUsers = usersData?.users?.length ?? 0;

  const searched = filteredArticles.filter((a: any) =>
    search.trim()
      ? `${a.title} ${a.slug} ${a.author_name ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      : true,
  );
  const sorted = [...searched].sort((a: any, b: any) => {
    if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0);
    if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
    if (sortBy === "oldest")
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const navItems = (
    isAdmin
      ? [
          { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { key: "artigos", label: "Artigos", icon: FileText },
          { key: "categorias", label: "Categorias", icon: FolderTree },
          { key: "newsletter", label: "Inscritos na Newsletter", icon: Mail },
          { key: "anuncios", label: "Anúncios", icon: Megaphone },
          { key: "usuarios", label: "Usuários", icon: Users },
          { key: "lixeira", label: "Lixeira", icon: Trash2 },
          { key: "perfil", label: "Perfil", icon: UserCircle },
        ]
      : [
          { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { key: "artigos", label: "Artigos", icon: FileText },
          { key: "lixeira", label: "Lixeira", icon: Trash2 },
          { key: "perfil", label: "Perfil", icon: UserCircle },
        ]
  ) as { key: PanelSection; label: string; icon: any }[];

  const openNewDraft = () => {
    resetForm();
    setShowForm(true);
    setSection("artigos");
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" className="flex items-center gap-2 px-2">
        <img
          src={logo}
          alt="Verificado News"
          className="h-8 w-auto object-contain"
        />
      </Link>
      <Button className="w-full justify-start" onClick={openNewDraft}>
        <Plus className="mr-2 h-4 w-4" /> Novo rascunho
      </Button>
      <nav className="flex flex-1 flex-col gap-1">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = section === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setSection(item.key);
                setMobileNav(false);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="truncate font-medium text-foreground">{displayName ?? user?.email}</div>
        {isAdmin ? "Administrador" : "Redator"}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[color:var(--surface)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card md:block">
        {sidebar}
      </aside>
      {mobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileNav(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold capitalize">
            {navItems.find((n) => n.key === section)?.label ?? "Painel"}
          </h1>
          <Link to="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Ver site
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
          {section === "dashboard" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {greeting}
                  {firstName ? `, ${firstName}` : ""}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Resumo {isAdmin ? "geral da redação" : "dos seus conteúdos"}.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <StatCard label="Publicados" value={stats.published} icon={CheckCircle2} />
                <StatCard label="Pendentes" value={stats.pending} icon={Send} />
                <StatCard label="Rascunhos" value={stats.draft} icon={FileText} />
                <StatCard label="Visualizações" value={totalViews} icon={Eye} />
                {isAdmin && <StatCard label="Usuários" value={totalUsers} icon={Users} />}
              </div>
              <AuthorPerformance articles={articles} isAdmin={isAdmin} />
              {isAdmin && (
                <PendingReviewSection
                  articles={articles}
                  onPublish={(id) => {
                    const a = articles.find((x: any) => x.id === id);
                    setConfirmAction({
                      title: "Publicar artigo?",
                      description: `"${a?.title ?? "Este artigo"}" ficará visível publicamente no site.`,
                      confirmLabel: "Publicar",
                      run: () => mPublish.mutate(id),
                    });
                  }}
                  onUnpublish={(id) => {
                    const a = articles.find((x: any) => x.id === id);
                    setConfirmAction({
                      title: "Voltar para rascunho?",
                      description: `"${a?.title ?? "Este artigo"}" voltará para rascunho.`,
                      confirmLabel: "Voltar para rascunho",
                      run: () => mUnpublish.mutate(id),
                    });
                  }}
                  publishPending={mPublish.isPending}
                  unpublishPending={mUnpublish.isPending}
                />
              )}
            </div>
          )}

          {section === "artigos" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Artigos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">{articles.length}</strong> ·{" "}
                    <strong className="text-foreground">{stats.published}</strong> publicados ·{" "}
                    <strong className="text-foreground">{stats.pending}</strong> pendentes
                  </p>
                </div>
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
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {editingId ? "Editando artigo" : "Novo rascunho"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {editingId
                          ? "Revise os campos e salve as alterações."
                          : "Preencha as informações para criar um novo rascunho."}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                      <Button type="submit" disabled={mCreate.isPending || mUpdate.isPending}>
                        {editingId ? "Salvar alterações" : "Salvar rascunho"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-base font-medium">
                          Título
                        </Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          required
                          minLength={3}
                          placeholder="Digite o título do artigo"
                          className="mt-2"
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
                          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                          placeholder="Escreva um breve resumo do conteúdo"
                          className="mt-2 resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="body" className="text-base font-medium">
                            Conteúdo
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {form.body.length.toLocaleString()} caracteres
                          </span>
                        </div>
                        <Textarea
                          id="body"
                          value={form.body}
                          onChange={(e) => setForm({ ...form, body: e.target.value })}
                          placeholder="Escreva o conteúdo completo do artigo aqui..."
                          className="mt-2 min-h-[420px] resize-y font-normal leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="space-y-6 rounded-xl border border-border bg-muted/30 p-5">
                      <div>
                        <Label className="text-base font-medium">Imagem de destaque</Label>
                        <div className="mt-2">
                          <ImageUploader
                            value={form.image_url}
                            onChange={(url) => setForm({ ...form, image_url: url })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">Categoria</Label>
                          <Select
                            value={form.category}
                            onValueChange={(v) =>
                              setForm({ ...form, category: v as typeof form.category })
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-base font-medium">Veredito</Label>
                          <Select
                            value={form.verdict}
                            onValueChange={(v) =>
                              setForm({ ...form, verdict: v as typeof form.verdict })
                            }
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
                            onValueChange={(v) =>
                              setForm({ ...form, type: v as typeof form.type })
                            }
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

                        {isAdmin && editingId && (
                          <div>
                            <Label className="text-base font-medium">Autor</Label>
                            <Select
                              value={form.author_id}
                              onValueChange={(v) => setForm({ ...form, author_id: v })}
                            >
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
                  </div>
                </form>
              )}

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Filter className="h-4 w-4" /> Filtros
                </div>
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por título, slug ou autor"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filterCategory}
                  onValueChange={(v) => {
                    setFilterCategory(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {articleCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterVerdict}
                  onValueChange={(v) => {
                    setFilterVerdict(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Veredito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os vereditos</SelectItem>
                    {Object.entries(verdictLabel).map(([v, label]) => (
                      <SelectItem key={v} value={v}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(v) => {
                    setFilterStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="pending_review">Em revisão</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigos</SelectItem>
                    <SelectItem value="views">Mais vistos</SelectItem>
                    <SelectItem value="title">Título (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
                {(hasFilters || search) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterCategory("all");
                      setFilterVerdict("all");
                      setFilterStatus("all");
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Limpar
                  </Button>
                )}
                <span className="ml-auto text-sm text-muted-foreground">
                  {sorted.length} de {articles.length}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Carregando…</div>
                ) : !articles.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum artigo ainda. Crie um novo rascunho.
                  </div>
                ) : !sorted.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum artigo corresponde aos filtros selecionados.
                  </div>
                ) : (
                  <div>
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Título</th>
                          {isAdmin && <th className="hidden w-[12%] px-4 py-3 lg:table-cell">Autor</th>}
                          <th className="hidden w-[12%] px-4 py-3 md:table-cell">Categoria</th>
                          <th className="hidden w-[12%] px-4 py-3 lg:table-cell">Veredito</th>
                          <th className="w-[14%] px-4 py-3">Status</th>
                          <th className="w-[16%] px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((a: any) => (
                          <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium text-foreground">
                              <div className="break-words">{a.title}</div>
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
                              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                                {a.author_name ?? "—"}
                              </td>
                            )}
                            <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                              {a.category ? (
                                a.category
                              ) : (
                                <span className="inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                  Sem categoria definida
                                </span>
                              )}
                            </td>
                            <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                              {verdictLabel[a.verdict] ?? a.verdict}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[a.status] ?? ""}`}
                              >
                                {statusLabel[a.status] ?? a.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                {(isAdmin || a.status !== "published") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={() => startEdit(a)}
                                  >
                                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 shrink-0 p-0"
                                      aria-label="Mais ações"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    {a.status === "draft" && (
                                      <DropdownMenuItem
                                        onSelect={() => mReview.mutate(a.id)}
                                        disabled={mReview.isPending}
                                      >
                                        <Send className="mr-2 h-4 w-4" /> Enviar para revisão
                                      </DropdownMenuItem>
                                    )}
                                    {isAdmin && a.status !== "published" && (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          setConfirmAction({
                                            title: "Publicar artigo?",
                                            description: `"${a.title}" ficará visível publicamente no site.`,
                                            confirmLabel: "Publicar",
                                            run: () => mPublish.mutate(a.id),
                                          })
                                        }
                                        disabled={mPublish.isPending}
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Publicar
                                      </DropdownMenuItem>
                                    )}
                                    {isAdmin && a.status === "published" && (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          setConfirmAction({
                                            title: "Voltar para rascunho?",
                                            description: `"${a.title}" deixará de aparecer no site e voltará como rascunho.`,
                                            confirmLabel: "Despublicar",
                                            run: () => mUnpublish.mutate(a.id),
                                          })
                                        }
                                        disabled={mUnpublish.isPending}
                                      >
                                        <EyeOff className="mr-2 h-4 w-4" /> Despublicar
                                      </DropdownMenuItem>
                                    )}
                                    {isAdmin && (
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onSelect={() =>
                                          setConfirmAction({
                                            title: "Mover para a lixeira?",
                                            description: `"${a.title}" será movido para a lixeira e poderá ser restaurado depois.`,
                                            confirmLabel: "Mover para lixeira",
                                            destructive: true,
                                            run: () => mDelete.mutate(a.id),
                                          })
                                        }
                                        disabled={mDelete.isPending}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Mover para lixeira
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {sorted.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Mostrar</span>
                      <Select
                        value={String(perPage)}
                        onValueChange={(v) => {
                          setPerPage(Number(v));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>por página</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {isAdmin && <SplitRedirectorManager />}
            </div>
          )}

          {section === "categorias" && isAdmin && (
            <CategoriesSection onConfirm={setConfirmAction} />
          )}
          {section === "newsletter" && isAdmin && <NewsletterSection />}
          {section === "anuncios" && isAdmin && <AdsSection />}
          {section === "usuarios" && isAdmin && (
            <UsersSection currentUserId={user?.id ?? null} />
          )}
          {section === "lixeira" && <TrashSection onConfirm={setConfirmAction} />}
          {section === "perfil" && <ProfileSection />}
        </main>
      </div>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              onClick={() => {
                confirmAction?.run();
                setConfirmAction(null);
              }}
            >
              {confirmAction?.confirmLabel ?? "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TrashSection({
  onConfirm,
}: {
  onConfirm: (action: PendingAction) => void;
}) {
  return <TrashSectionInner onConfirm={onConfirm} />;
}

function AdsSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdSlots);
  const updateFn = useServerFn(updateAdSlot);
  const [active, setActive] = useState(1);
  const [drafts, setDrafts] = useState<
    Record<
      string,
      { code: string; label: string; position: string; enabled: boolean; paragraph_no: number }
    >
  >({});

  const { data, isLoading } = useQuery({ queryKey: ["ad-slots"], queryFn: () => listFn() });
  const slots = data?.slots ?? [];

  const mUpdate = useMutation({
    mutationFn: (v: {
      id: string;
      enabled: boolean;
      code: string;
      label: string;
      position: string;
      paragraph_no: number;
    }) => updateFn({ data: v as never }),
    onSuccess: () => {
      toast.success("Configurações do bloco salvas.");
      qc.invalidateQueries({ queryKey: ["ad-slots"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const positions: { value: string; label: string }[] = [
    { value: "", label: "Desativado" },
    { value: "top", label: "Topo do artigo (acima do título)" },
    { value: "after_intro", label: "Após o resumo / resposta rápida" },
    { value: "after_paragraph", label: "Após o parágrafo" },
    { value: "mid_content", label: "No meio do conteúdo" },
    { value: "after_content", label: "Após o conteúdo" },
    { value: "before_comments", label: "Antes dos comentários" },
    { value: "sidebar_bottom", label: "Abaixo da coluna lateral" },
  ];

  const slot = slots.find((s) => s.block_no === active) ?? slots[0];
  const draft = slot
    ? (drafts[slot.id] ?? {
        code: slot.code,
        label: slot.label,
        position: slot.position,
        enabled: slot.enabled,
        paragraph_no: slot.paragraph_no ?? 1,
      })
    : null;
  const dirty =
    !!slot &&
    !!draft &&
    (draft.code !== slot.code ||
      draft.label !== slot.label ||
      draft.position !== slot.position ||
      draft.paragraph_no !== (slot.paragraph_no ?? 1) ||
      draft.enabled !== slot.enabled);

  const patch = (v: Partial<NonNullable<typeof draft>>) => {
    if (!slot || !draft) return;
    setDrafts((d) => ({ ...d, [slot.id]: { ...draft, ...v } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Gerenciador de blocos de anúncios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um bloco numerado, cole o código (AdSense, Ad Manager ou HTML) e defina em qual
          posição do artigo ele será inserido. Blocos desativados ou sem código não aparecem no site.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {slot && draft && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          {/* Abas numeradas */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-2">
            {slots.map((s) => {
              const isActive = s.block_no === (slot?.block_no ?? 0);
              const configured = !!s.code.trim() && s.enabled && s.position !== "";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.block_no)}
                  title={s.label}
                  className={`relative h-9 w-10 rounded-md border text-sm font-medium transition ${
                    isActive
                      ? "border-primary bg-background text-primary shadow-sm"
                      : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.block_no}
                  {configured && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Cabeçalho do bloco */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Bloco {slot.block_no}</span>
              <Input
                value={draft.label}
                onChange={(e) => patch({ label: e.target.value })}
                placeholder="Nome do bloco"
                className="h-8 w-56"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked) => patch({ enabled: checked })}
              />
              {draft.enabled ? "Ativo" : "Inativo"}
            </label>
          </div>

          {/* Editor de código */}
          <Textarea
            value={draft.code}
            onChange={(e) => patch({ code: e.target.value })}
            rows={14}
            spellCheck={false}
            placeholder='<ins class="adsbygoogle" ...></ins>'
            className="mt-3 rounded-md border-0 bg-zinc-900 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1"
          />

          {/* Rodapé de configuração */}
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">Inserção</span>
            <select
              value={draft.position}
              onChange={(e) => patch({ position: e.target.value })}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              {positions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {draft.position === "after_paragraph" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={draft.paragraph_no}
                  onChange={(e) =>
                    patch({
                      paragraph_no: Math.min(50, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                  className="h-9 w-20"
                />
                <span className="text-xs text-muted-foreground">nº do parágrafo</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {draft.code.length} caracteres
            </span>
            <div className="ml-auto flex items-center gap-2">
              {dirty && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setDrafts((d) => {
                      const n = { ...d };
                      delete n[slot.id];
                      return n;
                    })
                  }
                >
                  Cancelar
                </Button>
              )}
              <Button
                disabled={!dirty || mUpdate.isPending}
                onClick={() =>
                  mUpdate.mutate({
                    id: slot.id,
                    enabled: draft.enabled,
                    code: draft.code,
                    label: draft.label,
                    position: draft.position,
                    paragraph_no: draft.paragraph_no,
                  })
                }
              >
                Salvar configurações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesSection({
  onConfirm,
}: {
  onConfirm: (action: PendingAction) => void;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listCategories);
  const createFn = useServerFn(createCategory);
  const deleteFn = useServerFn(deleteCategory);
  const updateFn = useServerFn(updateCategoryDescription);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  const { data } = useQuery({ queryKey: ["categories"], queryFn: () => listFn() });
  const items = data?.categories ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["panel-articles"] });
    qc.invalidateQueries({ queryKey: ["public-articles"] });
  };

  const mCreate = useMutation({
    mutationFn: () => createFn({ data: { name: name.trim(), description: desc.trim() } }),
    onSuccess: () => {
      toast.success("Categoria adicionada.");
      setName("");
      setDesc("");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const mUpdate = useMutation({
    mutationFn: (v: { id: string; description: string }) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Descrição atualizada.");
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (res: any) => {
      toast.success(
        res?.affected
          ? `Categoria removida. ${res.affected} artigo(s) voltaram para rascunho sem categoria definida.`
          : "Categoria removida.",
      );
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold">Categorias</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length < 2) return;
            mCreate.mutate();
          }}
          className="mb-5 flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="new-category">Nova categoria</Label>
            <Input
              id="new-category"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Educação"
            />
          </div>
          <div className="min-w-[260px] flex-[2]">
            <Label htmlFor="new-category-desc">Descrição (opcional)</Label>
            <Input
              id="new-category-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Breve descrição exibida na página de categorias"
            />
          </div>
          <Button type="submit" disabled={mCreate.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </form>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditing(
                          editing?.id === c.id
                            ? null
                            : { id: c.id, value: (c as any).description ?? "" },
                        )
                      }
                    >
                      {editing?.id === c.id ? "Cancelar" : "Editar descrição"}
                    </Button>
                    <button
                      type="button"
                      aria-label={`Remover categoria ${c.name}`}
                      className="text-muted-foreground transition hover:text-destructive"
                      onClick={() =>
                        onConfirm({
                          title: `Remover a categoria "${c.name}"?`,
                          description:
                            "Todos os artigos dessa categoria voltarão para rascunho e ficarão marcados como \u201cSem categoria definida\u201d.",
                          confirmLabel: "Remover",
                          destructive: true,
                          run: () => mDelete.mutate(c.id),
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {editing?.id === c.id ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <Input
                      value={editing.value}
                      onChange={(e) => setEditing({ id: c.id, value: e.target.value })}
                      placeholder="Descrição da categoria"
                      className="min-w-[240px] flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={mUpdate.isPending}
                      onClick={() =>
                        mUpdate.mutate({ id: c.id, description: editing.value })
                      }
                    >
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(c as any).description || "Sem descrição."}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TrashSectionInner({
  onConfirm,
}: {
  onConfirm: (action: PendingAction) => void;
}) {
  const qc = useQueryClient();
  const listTrashFn = useServerFn(listTrashedArticles);
  const restoreFn = useServerFn(restoreArticle);
  const purgeFn = useServerFn(purgeArticle);

  const { data } = useQuery({
    queryKey: ["panel-trash"],
    queryFn: () => listTrashFn(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["panel-trash"] });
    qc.invalidateQueries({ queryKey: ["panel-articles"] });
  };

  const mRestore = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Artigo restaurado.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const mPurge = useMutation({
    mutationFn: (id: string) => purgeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Artigo excluído definitivamente.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const items = data?.articles ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold">Lixeira</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            A lixeira está vazia.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((a: any) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.category} · {a.author_name ?? "Sem autor"} · excluído em{" "}
                    {new Date(a.deleted_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={() =>
                      onConfirm({
                        title: "Restaurar artigo?",
                        description: `"${a.title}" voltará para a lista de artigos como rascunho.`,
                        confirmLabel: "Restaurar",
                        run: () => mRestore.mutate(a.id),
                      })
                    }
                    disabled={mRestore.isPending}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restaurar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="whitespace-nowrap"
                    onClick={() =>
                      onConfirm({
                        title: "Excluir definitivamente?",
                        description: `"${a.title}" será apagado para sempre. Esta ação não pode ser desfeita.`,
                        confirmLabel: "Excluir para sempre",
                        destructive: true,
                        run: () => mPurge.mutate(a.id),
                      })
                    }
                    disabled={mPurge.isPending}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value.toLocaleString("pt-BR")}
      </div>
    </div>
  );
}

function AuthorPerformance({
  articles,
  isAdmin,
}: {
  articles: any[];
  isAdmin: boolean;
}) {
  const published = articles.filter((a) => a.status === "published");
  const groups = new Map<string, { name: string; items: any[] }>();
  for (const a of published) {
    const key = a.author_id ?? "sem-autor";
    const g = groups.get(key) ?? {
      name: (a.author_name ?? "Sem autor") as string,
      items: [] as any[],
    };
    g.items.push(a);
    groups.set(key, g);
  }
  const blocks = Array.from(groups.values())
    .map((g) => ({
      name: g.name,
      data: [...g.items]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 5)
        .map((a) => ({
          name: a.title.length > 55 ? `${a.title.slice(0, 55)}…` : a.title,
          fullTitle: a.title,
          slug: a.slug,
          views: a.views ?? 0,
        })),
    }))
    .filter((b) => b.data.length > 0)
    .sort(
      (a, b) =>
        b.data.reduce((s, d) => s + d.views, 0) -
        a.data.reduce((s, d) => s + d.views, 0),
    );

  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        Ainda não há visualizações registradas para gerar o gráfico.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {isAdmin ? "Top 5 matérias por redator" : "Suas 5 matérias mais acessadas"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Baseado nas visualizações reais registradas no site. Clique no nome da matéria para abri-la.
        </p>
      </div>
      <div className="grid gap-4">
        {blocks.map((b) => (
          <div
            key={b.name}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">{b.name}</span>
              <span className="text-xs text-muted-foreground">
                {b.data.reduce((s, d) => s + d.views, 0).toLocaleString("pt-BR")} views
              </span>
            </div>
            <div style={{ width: "100%", height: 60 + b.data.length * 52 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={b.data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} strokeOpacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={380}
                    tick={<ArticleTick />}
                  />
                  <RTooltip
                    cursor={{ fillOpacity: 0.08 }}
                    formatter={(value: number) => [value.toLocaleString("pt-BR"), "Visualizações"]}
                    labelFormatter={(_, p: any) => p?.payload?.fullTitle ?? ""}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="views" name="Visualizações" radius={[0, 6, 6, 0]}>
                    {b.data.map((_, i) => (
                      <Cell key={i} fill="var(--primary)" fillOpacity={1 - i * 0.14} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string; slug?: string; fullTitle?: string } }) {
  const label = payload?.value ?? "";
  const slug = payload?.slug ?? "";
  const width = 360;
  const height = 24;
  const fx = (x ?? 0) - width;
  const fy = (y ?? 0) - height / 2;

  if (!slug) {
    return (
      <foreignObject x={fx} y={fy} width={width} height={height}>
        <div
          className="flex h-full items-center text-xs text-muted-foreground"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: `${width}px`,
          }}
        >
          {label}
        </div>
      </foreignObject>
    );
  }

  return (
    <foreignObject x={fx} y={fy} width={width} height={height}>
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        title={payload?.fullTitle ?? label}
        className="flex h-full items-center text-xs text-primary hover:underline"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: `${width}px`,
        }}
      >
        {label}
      </a>
    </foreignObject>
  );
}

function ProfileSection() {
  const { user, displayName, roles, refreshRoles } = useAuth();
  const [name, setName] = useState(displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (name && name !== displayName) {
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: name })
          .eq("id", user.id);
        if (error) throw error;
      }
      const authPayload: { email?: string; password?: string } = {};
      if (email && email !== user.email) authPayload.email = email;
      if (password) authPayload.password = password;
      if (Object.keys(authPayload).length > 0) {
        const { error } = await supabase.auth.updateUser(authPayload);
        if (error) throw error;
      }
      setPassword("");
      await refreshRoles();
      toast.success("Perfil atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = roles.includes("admin")
    ? "Administrador"
    : roles.includes("editor")
      ? "Redator"
      : "Leitor";

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Perfil</h2>
        <p className="text-sm text-muted-foreground">
          Atualize seus dados de acesso. Função atual: <strong>{roleLabel}</strong>.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="profile-email">E-mail</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="profile-password">Nova senha</Label>
          <Input
            id="profile-password"
            type="password"
            placeholder="Deixe em branco para manter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
