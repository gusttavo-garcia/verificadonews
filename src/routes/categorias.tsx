import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { ArticleCard } from "@/components/site/article-card";
import { articles as ALL, type Article } from "@/lib/mock-data";
import { listPublicArticles } from "@/lib/public-articles.functions";
import { listCategories } from "@/lib/categories.functions";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/categorias")({
  component: CategoriasPage,
  head: () => pageHead({
    title: "Categorias de verificações — Verificado News",
    description: "Explore todas as verificações do Verificado News organizadas por tema: política, saúde, economia, golpes, fake news, empresas, sites e vídeos.",
    path: "/categorias",
  }),
});

function CategoriasPage() {
  const fetchArticles = useServerFn(listPublicArticles);
  const { data } = useQuery({
    queryKey: ["public-articles"],
    queryFn: () => fetchArticles(),
  });
  const fetchCategories = useServerFn(listCategories);
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  const articles = useMemo<Article[]>(() => {
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

  const categories = useMemo(() => {
    const names = new Set<string>((catData?.categories ?? []).map((c) => c.name));
    for (const a of articles) if (a.category) names.add(a.category);
    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [catData, articles]);

  return (
    <PageShell>
      <PageHero
        title="Categorias"
        subtitle="Explore nossas verificações organizadas por tema."
        icon={<Tag className="h-6 w-6" />}
      />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((c) => {
            const count = articles.filter((a) => a.category === c).length;
            if (count === 0) return null;
            return (
              <Link
                key={c}
                to="/categorias"
                hash={c}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary"
              >
                {c} <span className="text-muted-foreground">({count})</span>
              </Link>
            );
          })}
        </div>

        {categories.map((c) => {
          const items = articles
            .filter((a) => a.category === c)
            .sort((a, b) => b.date.localeCompare(a.date));
          if (items.length === 0) return null;
          return (
            <div key={c} id={c} className="mb-14">
              <h2 className="mb-5 text-xl font-bold text-foreground">{c}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </PageShell>
  );
}