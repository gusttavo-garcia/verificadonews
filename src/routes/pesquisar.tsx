import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { ArticleCard } from "@/components/site/article-card";
import { Button } from "@/components/ui/button";
import { articles } from "@/lib/mock-data";

export const Route = createFileRoute("/pesquisar")({
  component: PesquisarPage,
  head: () => ({
    meta: [
      { title: "Pesquisar — Verificado News" },
      { name: "description", content: "Pesquise notícias, empresas, sites, vídeos e golpes verificados." },
    ],
  }),
});

function PesquisarPage() {
  const [q, setQ] = useState("");
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
            <div className="rounded-2xl border border-dashed border-border bg-[color:var(--surface)] p-10 text-sm text-muted-foreground">
              <Search className="mx-auto mb-3 h-6 w-6" />
              Nenhuma pesquisa recente.
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