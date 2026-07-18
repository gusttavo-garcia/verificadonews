import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { ArticleCard } from "@/components/site/article-card";
import { Button } from "@/components/ui/button";
import { articles } from "@/lib/mock-data";
import { getTrendingSearches } from "@/lib/trends.functions";

export const Route = createFileRoute("/pesquisar")({
  validateSearch: zodValidator(
    z.object({ q: fallback(z.string(), "").default("") }),
  ),
  component: PesquisarPage,
  head: () => ({
    meta: [
      { title: "Pesquisar — Verificado News" },
      { name: "description", content: "Pesquise notícias, empresas, sites, vídeos e golpes verificados." },
    ],
  }),
});

function PesquisarPage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ);
  const trendsFn = useServerFn(getTrendingSearches);
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["google-trends-br"],
    queryFn: () => trendsFn(),
    staleTime: 30 * 60 * 1000,
  });
  const trends = trendsData?.trends ?? [];

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return articles.filter(
      (a) => a.title.toLowerCase().includes(s) || a.excerpt.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Pesquise qualquer informação
        </h1>
        <p className="mt-3 text-muted-foreground">
          Descubra se uma notícia, vídeo, imagem, empresa ou golpe é verdadeiro.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-10 flex max-w-2xl overflow-hidden rounded-full border border-border bg-background p-1.5 shadow-sm"
        >
          <div className="flex flex-1 items-center gap-3 px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Essa notícia é verdadeira?"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" className="rounded-full px-6">
            Verificar
          </Button>
        </form>

        <div className="mt-10">
          {q.trim() === "" ? (
            <div className="rounded-2xl border border-dashed border-border bg-[color:var(--surface)] p-6 text-left">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-[color:var(--brand-orange)]" />
                Pesquisas em alta no Google (Brasil)
              </div>
              {trendsLoading ? (
                <p className="text-center text-sm text-muted-foreground">Carregando tendências…</p>
              ) : trends.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">Nenhuma pesquisa recente.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {trends.map((t, i) => (
                    <li key={`${t.title}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setQ(t.title)}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition hover:border-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)]/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-orange)]/10 text-xs font-semibold text-[color:var(--brand-orange)]">
                            {i + 1}
                          </span>
                          <span className="line-clamp-1 font-medium text-foreground">{t.title}</span>
                        </span>
                        {t.traffic && (
                          <span className="shrink-0 text-xs text-muted-foreground">{t.traffic}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-[color:var(--surface)] p-10 text-sm text-muted-foreground">
              Nenhum resultado encontrado para “{q}”.
            </div>
          ) : (
            <div className="grid gap-5 text-left sm:grid-cols-2">
              {results.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}