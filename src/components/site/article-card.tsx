import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { VerdictBadge } from "./verdict-badge";
import { formatDate, type Article } from "@/lib/mock-data";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to="/verificacao/$slug"
      params={{ slug: article.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
    >
      {article.image && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            width={640}
            height={360}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={article.verdict} />
          <span className="rounded-full bg-[color:var(--brand-yellow)]/50 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.35_0.08_60)]">
            {article.category}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(article.date)}</span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {article.views.toLocaleString("pt-BR")}
        </span>
      </div>
      </div>
    </Link>
  );
}