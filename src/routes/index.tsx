import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  Clock,
  AlertTriangle,
  Newspaper,
  LayoutGrid,
} from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { ArticleCard } from "@/components/site/article-card";
import { Button } from "@/components/ui/button";
import { articles, type Article } from "@/lib/mock-data";
import { listPublicArticles } from "@/lib/public-articles.functions";
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
  list?: "recent" | "golpes" | "fake";
};
const shortcuts: Shortcut[] = [
  { to: "/pesquisar", label: "Pesquisas em alta", icon: TrendingUp },
  { to: "/", label: "Verificações recentes", icon: Clock, list: "recent" },
  { to: "/golpes", label: "Golpes recentes", icon: AlertTriangle, list: "golpes" },
  { to: "/fake-news", label: "Fake News", icon: Newspaper, list: "fake" },
  { to: "/categorias", label: "Categorias", icon: LayoutGrid },
];

function Index() {
  const { live } = Route.useLoaderData();
  const [q, setQ] = useState("");
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
            <Button type="submit" className="shrink-0 self-center rounded-full px-6">
              Verificar
            </Button>
          </form>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.label}
              to={s.to as "/"}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary">
                {s.label}
              </h3>
              {s.showRecent && (
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {recent.map((r) => (
                    <li key={r.slug} className="flex gap-2">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span className="line-clamp-1">{r.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>
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
