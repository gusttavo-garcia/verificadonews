import { Link } from "@tanstack/react-router";
import { formatDate, type Article } from "@/lib/mock-data";
import { categorySlug } from "@/lib/category-slug";

export function ArticleSidebar({
  articles,
  categories,
  currentSlug,
}: {
  articles: Article[];
  categories: { id: string; name: string }[];
  currentSlug: string;
}) {
  const recent = articles.filter((a) => a.slug !== currentSlug).slice(0, 6);
  const names = new Set<string>(categories.map((c) => c.name));
  for (const a of articles) if (a.category) names.add(a.category);
  const cats = [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <aside className="space-y-8 lg:sticky lg:top-24">
      <section>
        <h2 className="text-xl font-bold text-foreground">Artigos recentes</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-[color:var(--surface)]">
          {recent.map((a) => (
            <li key={a.slug}>
              <Link
                to="/$slug"
                params={{ slug: a.slug }}
                className="block px-4 py-3 text-sm leading-snug text-foreground transition hover:bg-primary/5 hover:text-primary"
              >
                {a.title}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatDate(a.date)}
                </span>
              </Link>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              Nenhum artigo publicado ainda.
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground">Categorias</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-[color:var(--surface)]">
          {cats.map((name) => (
            <li key={name}>
              <Link
                to="/categoria/$slug"
                params={{ slug: categorySlug(name) }}
                className="block px-4 py-3 text-sm text-foreground transition hover:bg-primary/5 hover:text-primary"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
