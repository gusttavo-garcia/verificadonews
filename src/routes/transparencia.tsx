import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { DollarSign, Users, AlertTriangle, BarChart3, Handshake } from "lucide-react";

export const Route = createFileRoute("/transparencia")({
  component: TransparenciaPage,
  head: () => pageHead({
    title: "Portal de Transparência — Verificado News",
    description: "Veja como o Verificado News se financia, quem faz parte da equipe e quais políticas garantem a independência editorial das nossas checagens.",
    path: "/transparencia",
  }),
});

function TransparenciaPage() {
  return (
    <PageShell>
      <PageHero
        title="Portal de Transparência"
        subtitle="Acreditamos que quem cobra transparência deve ser o primeiro a praticá-la. Aqui você encontra informações sobre como nos financiamos, quem somos e como garantimos nossa independência."
      />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <div>
            <h2 className="flex items-center gap-3 text-xl font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <DollarSign className="h-4 w-4" />
              </span>
              Financiamento
            </h2>
            <div className="mt-4 rounded-xl border border-border bg-card p-6 text-sm text-foreground/90">
              <p>
                O Verificado News é uma iniciativa independente. Para garantir imparcialidade,{" "}
                <strong>não aceitamos financiamento de partidos políticos, governos ou candidatos.</strong>
              </p>
              <p className="mt-3">Nossas fontes de receita atuais são:</p>
              <ul className="mt-4 space-y-4">
                {[
                  { t: "Publicidade Programática", d: "Anúncios exibidos no site através de redes como Google AdSense. Não temos contato direto com os anunciantes e eles não influenciam nosso conteúdo." },
                  { t: "Apoio da Comunidade", d: "Doações voluntárias de leitores. Nenhum doador individual representa mais de 5% de nossa receita total." },
                  { t: "Bolsas e Editais de Jornalismo", d: "Participação em fundos de fomento ao jornalismo independente de organizações não-governamentais." },
                ].map((r) => (
                  <li key={r.t} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-semibold">{r.t}</p>
                      <p className="text-muted-foreground">{r.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-3 text-xl font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--brand-teal)]/15 text-[color:var(--brand-teal)]">
                <Users className="h-4 w-4" />
              </span>
              Independência Editorial
            </h2>
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-6 text-sm text-foreground/90">
              <p>
                Nossa equipe editorial tem autonomia total para decidir quais conteúdos serão
                verificados e qual será o resultado, baseando-se exclusivamente nas evidências.
              </p>
              <p>
                Nenhum financiador, parceiro ou anunciante tem o direito de revisar, aprovar
                ou vetar nossas publicações. Membros da equipe são proibidos de atuar em
                campanhas políticas ou possuir filiação partidária ativa.
              </p>
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-3 text-xl font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Política de Correções
            </h2>
            <div className="mt-4 rounded-xl border border-border bg-card p-6 text-sm text-foreground/90">
              <p>O jornalismo é feito por humanos e erros podem acontecer. Quando erramos, admitimos de forma clara e transparente.</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Qualquer leitor pode apontar um possível erro através do nosso formulário de contato.</li>
                <li>A reclamação é revisada por um editor diferente do que publicou a checagem original.</li>
                <li>Se o erro for confirmado, o texto é alterado imediatamente.</li>
                <li>Uma nota de “Correção” é adicionada no topo do artigo, explicando o que foi alterado.</li>
              </ul>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <BarChart3 className="h-4 w-4 text-primary" /> Dados e Estatísticas
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Checagens publicadas", "5.241"],
                ["Correções emitidas", "42 (0,8%)"],
                ["Denúncias recebidas", "+12.000"],
                ["Tempo médio de resposta", "24 horas"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <Handshake className="h-4 w-4 text-[color:var(--brand-teal)]" /> Parcerias
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">Trabalhamos em rede para ampliar o alcance do combate à desinformação.</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
              <li>Coalizão Brasileira de Checagem</li>
              <li>Programa de Verificação do Meta</li>
              <li>Universidades Federais (Pesquisa)</li>
            </ul>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}