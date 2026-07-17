import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PageShell, PageHero } from "./page-shell";
import { ArticleCard } from "./article-card";
import { articles as ALL, categories, type Article } from "@/lib/mock-data";

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

  const items = useMemo(() => {
    let list = ALL.filter(filter);
    if (cat !== "all") list = list.filter((a) => a.category === cat);
    list = [...list].sort((a, b) =>
      sort === "recent"
        ? b.date.localeCompare(a.date)
        : b.views - a.views,
    );
    return list;
  }, [cat, sort, filter]);

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