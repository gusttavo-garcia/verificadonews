import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { VerdictBadge } from "@/components/site/verdict-badge";
import { Search, FileSearch, CheckCircle2, Tag, UploadCloud, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/metodologia")({
  component: MetodologiaPage,
  head: () => pageHead({
    title: "Metodologia de checagem — Verificado News",
    description: "Veja passo a passo como o Verificado News apura, cruza dados, consulta fontes oficiais e classifica cada conteúdo com nosso sistema de selos.",
    path: "/metodologia",
  }),
});

const steps = [
  {
    icon: Search,
    label: "IDENTIFICAÇÃO",
    title: "Seleção do Conteúdo",
    body: (
      <>
        <p>Monitoramos redes sociais, aplicativos de mensagens e portais em busca de conteúdos virais suspeitos. Priorizamos a checagem de informações que:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Possuem alto potencial de dano (saúde pública, golpes financeiros, segurança).</li>
          <li>Estão ganhando rápida tração e viralidade.</li>
          <li>Foram enviadas por nossos leitores através do canal de denúncias.</li>
          <li>Envolvem figuras públicas ou instituições de grande relevância.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FileSearch,
    label: "PESQUISA",
    title: "Investigação Profunda",
    body: (
      <>
        <p>Nossa equipe busca a origem da informação e coleta evidências usando ferramentas avançadas e jornalismo tradicional:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Busca reversa de imagens e vídeos para identificar manipulações.</li>
          <li>Consulta a bases de dados públicas, diários oficiais e documentos legais.</li>
          <li>Entrevistas com especialistas independentes na área do assunto.</li>
          <li>Contato direto com as pessoas, empresas ou instituições citadas.</li>
        </ul>
      </>
    ),
  },
  {
    icon: CheckCircle2,
    label: "VERIFICAÇÃO",
    title: "Cruzamento de Dados",
    body: (
      <p>
        As evidências coletadas são cruzadas e analisadas criticamente. Exigimos múltiplas
        fontes independentes que corroborem a mesma conclusão. Se as provas forem
        inconclusivas, a checagem não é publicada ou é classificada como “Em Apuração”.
        Todo o processo passa por revisão de um editor sênior antes de avançar.
      </p>
    ),
  },
  {
    icon: Tag,
    label: "CLASSIFICAÇÃO",
    title: "Sistema de Selos",
    body: (
      <div className="space-y-3">
        <p>Com base nas evidências, aplicamos um selo padronizado:</p>
        {[
          { v: "verificado", d: "A informação é verdadeira e os fatos correspondem à realidade." },
          { v: "parcial", d: "Mistura fatos reais com informações falsas ou omissões relevantes." },
          { v: "enganoso", d: "Usa dados reais mas fora de contexto, manipulados de forma a induzir o leitor." },
          { v: "falso", d: "A informação não tem base na realidade, foi inventada ou é uma montagem." },
        ].map((s) => (
          <div key={s.v} className="flex items-start gap-3 rounded-lg bg-muted p-3">
            <VerdictBadge verdict={s.v as never} />
            <p className="text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: UploadCloud,
    label: "PUBLICAÇÃO",
    title: "Transparência Total",
    body: (
      <p>
        O artigo final é publicado contendo: o boato original (com tarjas para não propagar
        a desinformação), a explicação detalhada do porquê é falso ou verdadeiro e a lista
        completa de links e documentos usados como fontes, permitindo verificação
        independente pelo leitor.
      </p>
    ),
  },
  {
    icon: RefreshCw,
    label: "ATUALIZAÇÕES",
    title: "Correções e Novas Evidências",
    body: (
      <p>
        Se novas evidências surgirem ou se cometermos um erro, atualizamos o artigo
        imediatamente. Inserimos uma nota de “Atualização” ou “Correção” no topo do texto,
        com data, hora e a explicação clara do que foi alterado.
      </p>
    ),
  },
];

function MetodologiaPage() {
  return (
    <PageShell>
      <PageHero
        title="Nossa Metodologia"
        subtitle="A transparência é a base da nossa credibilidade. Conheça o processo rigoroso e padronizado que nossa equipe utiliza para investigar, verificar e classificar cada conteúdo."
      />
      <section className="mx-auto max-w-4xl px-4 py-16">
        <ol className="space-y-10">
          {steps.map((s, i) => (
            <li key={s.title} className="grid gap-6 md:grid-cols-[160px_1fr]">
              <div className="text-center md:text-right">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary md:ml-auto md:mr-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold">Passo {i + 1}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-bold">{s.title}</h3>
                <div className="mt-3 text-sm text-muted-foreground">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}