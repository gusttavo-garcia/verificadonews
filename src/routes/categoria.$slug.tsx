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
import { categorySlug } from "@/lib/category-slug";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/categoria/$slug")({
  component: CategoriaPage,
  head: ({ params }) => {
    const nice = params.slug.replace(/-/g, " ");
    return pageHead({
      title: `Categoria ${nice} — Verificado News`,
      description: `Todas as verificações do Verificado News na categoria ${nice}.`,
      path: `/categoria/${params.slug}`,
    });
  },
});

function CategoriaPage() {
  const { slug } = Route.useParams();
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

  const category = useMemo(() => {
    const fromDb = (catData?.categories ?? []).find(
      (c) => categorySlug(c.name) === slug,
    );
    if (fromDb) return { name: fromDb.name, description: (fromDb as { description?: string }).description ?? "" };
    const fromArticles = articles.find((a) => a.category && categorySlug(a.category) === slug);
    return fromArticles ? { name: fromArticles.category as string, description: "" } : null;
  }, [catData, articles, slug]);

  const items = useMemo(
    () =>
      articles
        .filter((a) => a.category && categorySlug(a.category) === slug)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [articles, slug],
  );

  return (
    <PageShell>
      <PageHero
        title={category?.name ?? "Categoria"}
        subtitle={category?.description || "Verificações publicadas nesta categoria."}
        icon={<Tag className="h-6 w-6" />}
      />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Link
          to="/categorias"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-primary"
        >
          ← Todas as categorias
        </Link>
        {items.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma verificação publicada nesta categoria por enquanto.
          </p>
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
