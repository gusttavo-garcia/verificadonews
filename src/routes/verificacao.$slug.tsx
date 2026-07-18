import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Eye, Share2, Link2 } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/site/page-shell";
import { VerdictBadge } from "@/components/site/verdict-badge";
import { RelatedArticles } from "@/components/site/related-articles";
import { CommentsSection } from "@/components/site/comments-section";
import { NewsletterOptIn } from "@/components/site/newsletter-optin";
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
  const confidence = 99;
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(article.title);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-14">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={article.verdict} />
          <span className="rounded-full bg-[color:var(--brand-yellow)]/50 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.35_0.08_60)]">
            {article.category}
          </span>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-medium text-foreground">
            <span>Índice de confiança da equipe</span>
            <span>{confidence}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${confidence}%`,
                background:
                  "linear-gradient(90deg, var(--brand-red) 0%, var(--brand-yellow) 55%, var(--brand-teal) 100%)",
              }}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-5 text-sm text-primary">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {formatDate(article.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> {article.views.toLocaleString("pt-BR")} visualizações
          </span>
        </div>

        <hr className="my-5 border-border" />

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Share2 className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Share2 className="h-4 w-4" /> Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Share2 className="h-4 w-4" /> X
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Link2 className="h-4 w-4" /> {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-[color:var(--brand-red)]/25 bg-[color:var(--brand-red)]/5 p-6">
          <h2 className="text-lg font-bold text-[color:var(--brand-red)]">Resposta rápida</h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/90">
            {article.excerpt}
          </p>
        </div>

        <div className="mt-10 space-y-5 text-base leading-relaxed text-foreground/90">
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

        <RelatedArticles current={article} />
        <NewsletterOptIn />
        <CommentsSection slug={article.slug} />
      </article>
    </PageShell>
  );
}