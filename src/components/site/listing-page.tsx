import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { PageShell, PageHero } from "./page-shell";
import { ArticleCard } from "./article-card";
import { articles as ALL, categories, type Article } from "@/lib/mock-data";
import { listPublicArticles } from "@/lib/public-articles.functions";

export function ListingPage({
  title,
  subtitle,
  icon,
  filter,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  filter: (a: Article) => boolean;
}) {
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"recent" | "views">("recent");

  const fetchArticles = useServerFn(listPublicArticles);
  const { data } = useQuery({
    queryKey: ["public-articles"],
    queryFn: () => fetchArticles(),
  });

  const source = useMemo<Article[]>(() => {
    const rows = data?.articles ?? [];
    if (rows.length === 0) return ALL;
    return rows.map((r) => {
      const fb = ALL.find((a) => a.slug === r.slug);
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
  }, [data]);

  const items = useMemo(() => {
    let list = source.filter(filter);
    if (cat !== "all") list = list.filter((a) => a.category === cat);
    list = [...list].sort((a, b) =>
      sort === "recent"
        ? b.date.localeCompare(a.date)
        : b.views - a.views,
    );
    return list;
  }, [cat, sort, filter, source]);

  return (
    <PageShell>
      <PageHero title={title} subtitle={subtitle} icon={icon} />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "views")}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="recent">Mais recentes</option>
            <option value="views">Mais vistos</option>
          </select>
        </div>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum resultado encontrado.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}