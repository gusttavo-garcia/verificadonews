import { ArticleCard } from "./article-card";
import { articles, type Article } from "@/lib/mock-data";

export function RelatedArticles({ current }: { current: Article }) {
  // Prefer same category, then same type, filling up to 4 items.
  const others = articles.filter((a) => a.slug !== current.slug);
  const sameCategory = others.filter((a) => a.category === current.category);
  const sameType = others.filter(
    (a) => a.type === current.type && a.category !== current.category,
  );
  const rest = others.filter(
    (a) => a.category !== current.category && a.type !== current.type,
  );
  const related = [...sameCategory, ...sameType, ...rest].slice(0, 4);
  if (related.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold text-foreground">Verificações relacionadas</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {related.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}