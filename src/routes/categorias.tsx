import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { ArticleCard } from "@/components/site/article-card";
import { articles, categories } from "@/lib/mock-data";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/categorias")({
  component: CategoriasPage,
  head: () => ({ meta: [{ title: "Categorias — Verificado News" }] }),
});

function CategoriasPage() {
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
          const items = articles.filter((a) => a.category === c);
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