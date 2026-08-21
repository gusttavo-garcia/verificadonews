import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Search,
  TrendingUp,
  Clock,
  AlertTriangle,
  Newspaper,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/site/page-shell";
import { ArticleCard } from "@/components/site/article-card";
import { Button } from "@/components/ui/button";
import { articles, type Article } from "@/lib/mock-data";
import { listPublicArticles } from "@/lib/public-articles.functions";
import { listCategories } from "@/lib/categories.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    const { articles: rows } = await listPublicArticles();
    const live: Article[] = (rows ?? []).map((r) => {
      const fb = articles.find((a) => a.slug === r.slug);
      return {
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        verdict: r.verdict as Article["verdict"],
        category: r.category as Article["category"],
        date: (r.published_at ?? r.created_at ?? "").slice(0, 10),
        author: r.author_name ?? "Equipe Verificado News",
        views: r.views ?? 0,
        type: r.type as Article["type"],
        image: r.image_url ?? fb?.image,
      };
    });
    return { live };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Nada encontrado.
    </div>
  ),
  head: () =>
    pageHead({
      title: "Verificado News — Pesquise e verifique qualquer informação",
      description:
        "Pesquise e descubra se uma notícia, vídeo, imagem, empresa ou golpe é verdadeiro antes de compartilhar. Checagem de fatos brasileira, com fontes.",
      path: "/",
    }),
});

type Shortcut = {
  to: string;
  label: string;
  icon: typeof TrendingUp;
  list?: "recent" | "golpes" | "fake" | "categorias";
};
const shortcuts: Shortcut[] = [
  { to: "/pesquisar", label: "Pesquisas em alta", icon: TrendingUp },
  { to: "/", label: "Verificações recentes", icon: Clock, list: "recent" },
  { to: "/golpes", label: "Golpes recentes", icon: AlertTriangle, list: "golpes" },
  { to: "/fake-news", label: "Fake News", icon: Newspaper, list: "fake" },
  { to: "/categorias", label: "Categorias", icon: LayoutGrid, list: "categorias" },
];

function Index() {
  const { live } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const categoriesRef = useRef<HTMLDivElement>(null);
  const fetchCategories = useServerFn(listCategories);
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  const sortedArticles = useMemo(
    () => [...(live.length > 0 ? live : articles)].sort((a, b) => b.date.localeCompare(a.date)),
    [live],
  );
  const recent = sortedArticles.slice(0, 3);
  const feed = sortedArticles.slice(0, 8);
  const golpes = useMemo(
    () =>
      sortedArticles
        .filter((a) => a.type === "golpe" || (a.type === "empresa" && a.verdict === "falso"))
        .slice(0, 3),
    [sortedArticles],
  );
  const fakes = useMemo(
    () =>
      sortedArticles
        .filter((a) => a.verdict === "falso" || a.verdict === "enganoso")
        .slice(0, 3),
    [sortedArticles],
  );
  const listFor = (kind?: Shortcut["list"]) =>
    kind === "recent" ? recent : kind === "golpes" ? golpes : kind === "fake" ? fakes : [];
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of sortedArticles) {
      if (!a.category) continue;
      counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    }
    return counts;
  }, [sortedArticles]);
  const categoriesWithMeta = useMemo(() => {
    const rows = catData?.categories ?? [];
    const named = new Map<string, { name: string; description?: string }>();
    for (const c of rows) {
      named.set(c.name, { name: c.name, description: c.description ?? undefined });
    }
    for (const [name] of categoryCounts) {
      if (!named.has(name)) named.set(name, { name });
    }
    return [...named.values()]
      .map((c) => ({ ...c, count: categoryCounts.get(c.name) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));
  }, [catData, categoryCounts]);
  const scrollCategories = (dir: "left" | "right") => {
    const el = categoriesRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-[color:var(--surface)]">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[color:var(--brand-teal)]/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            Verificado News — Pesquise e verifique{" "}
            <span className="text-primary">qualquer</span> informação.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Descubra se uma notícia, vídeo, imagem, empresa ou golpe é verdadeiro antes de
            compartilhar.
          </p>
          <form
            className="mx-auto mt-10 flex max-w-2xl items-center overflow-hidden rounded-full border border-border bg-background p-1.5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.trim()) return;
              navigate({ to: "/pesquisar", search: { q: q.trim() } as never });
            }}
          >
            <div className="flex flex-1 items-center gap-3 px-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Pesquisar uma notícia, empresa, site ou golpe"
                placeholder="Essa notícia é verdadeira?"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="mr-1 shrink-0 self-center rounded-full px-6">
              Verificar
            </Button>
          </form>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts
            .filter((s) => s.list !== "categorias")
            .map((s) => {
              const items = listFor(s.list);
              return (
                <div
                  key={s.label}
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <Link to={s.to as "/"} className="block">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary">
                      {s.label}
                    </h3>
                  </Link>
                  {items.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      {items.map((r) => (
                        <li key={r.slug} className="flex gap-2">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          <Link
                            to="/$slug"
                            params={{ slug: r.slug }}
                            className="line-clamp-1 hover:text-primary hover:underline"
                          >
                            {r.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </div>

        {/* Categories — horizontal scroll with name + description */}
        {categoriesWithMeta.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.08] via-secondary/[0.12] to-accent/[0.08] p-6 transition hover:shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Link to="/categorias" className="group flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                    Categorias
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore verificações por tema
                  </p>
                </div>
              </Link>
              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => scrollCategories("left")}
                  aria-label="Categorias anteriores"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition hover:border-primary hover:text-primary"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCategories("right")}
                  aria-label="Próximas categorias"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition hover:border-primary hover:text-primary"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div
              ref={categoriesRef}
              className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categoriesWithMeta.map((c) => (
                <Link
                  key={c.name}
                  to="/categorias"
                  hash={c.name}
                  className="group w-[260px] shrink-0 snap-start rounded-xl border border-border bg-background/90 p-4 shadow-sm transition hover:border-primary hover:bg-background hover:shadow-md sm:w-[300px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary">
                      {c.name}
                    </h4>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {c.count}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {c.description || "Verificações sobre " + c.name.toLowerCase()}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Ver verificações <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recent verifications */}
      <section className="border-t border-border bg-[color:var(--surface)]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Verificações recentes
            </h2>
            <Link
              to="/categorias"
              className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-primary hover:text-primary"
            >
              Ver todas as verificações
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {feed.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
