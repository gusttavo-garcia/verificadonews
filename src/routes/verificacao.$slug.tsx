import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { VerdictBadge } from "@/components/site/verdict-badge";
import { articles, formatDate } from "@/lib/mock-data";

export const Route = createFileRoute("/verificacao/$slug")({
  loader: ({ params }) => {
    const article = articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — Verificado News` },
          { name: "description", content: loaderData.article.excerpt },
          { property: "og:title", content: loaderData.article.title },
          { property: "og:description", content: loaderData.article.excerpt },
        ]
      : [],
  }),
  component: VerificacaoPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Verificação não encontrada</h1>
        <p className="mt-2 text-muted-foreground">O conteúdo pode ter sido removido.</p>
        <Link to="/" className="mt-6 inline-block text-primary">Voltar ao início</Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ reset }) => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Erro ao carregar</h1>
        <button onClick={reset} className="mt-6 text-primary">Tentar novamente</button>
      </div>
    </PageShell>
  ),
});

function VerificacaoPage() {
  const { article } = Route.useLoaderData();
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-14">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={article.verdict} />
          <span className="rounded-full bg-[color:var(--brand-yellow)]/50 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.35_0.08_60)]">
            {article.category}
          </span>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          {article.title}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(article.date)}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {article.views.toLocaleString("pt-BR")}</span>
        </div>

        <div className="mt-10 space-y-5 text-base leading-relaxed text-foreground/90">
          <p className="text-lg text-muted-foreground">{article.excerpt}</p>
          <p>
            Nossa equipe realizou a checagem seguindo o protocolo padrão de investigação:
            identificação da origem do conteúdo, análise de fontes primárias, cruzamento de
            dados públicos e consulta a especialistas independentes.
          </p>
          <p>
            Após o processo, aplicamos o selo com base nas evidências disponíveis até a data
            da publicação. Novas informações podem levar a atualizações neste artigo, sempre
            registradas ao final do texto.
          </p>
          <h2 className="mt-8 text-xl font-bold">Como chegamos a essa conclusão</h2>
          <ul className="list-disc space-y-2 pl-6 text-foreground/90">
            <li>Consulta a documentos oficiais e diários públicos.</li>
            <li>Busca reversa de imagens e vídeos relacionados.</li>
            <li>Entrevista com especialistas na área do assunto abordado.</li>
            <li>Revisão por um editor sênior antes da publicação.</li>
          </ul>
        </div>
      </article>
    </PageShell>
  );
}