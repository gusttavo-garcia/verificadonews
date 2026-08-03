import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { ShieldCheck, Eye, CheckCircle2, Users, Scale, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: () => pageHead({
    title: "Sobre o Verificado News — Quem somos",
    description: "Conheça o Verificado News: quem somos, nossa equipe de checagem e como combatemos a desinformação no Brasil com fatos e fontes verificáveis.",
    path: "/sobre",
  }),
});

function SobrePage() {
  return (
    <PageShell>
      <PageHero
        title="Sobre Verificado News"
        subtitle="Combatendo desinformação com fatos verificados."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Nossa Missão</h2>
          <p className="mt-4 text-muted-foreground">
            Combater a epidemia de desinformação fornecendo checagens de fatos rigorosas,
            independentes e acessíveis. Acreditamos que o acesso à informação verdadeira é
            um direito fundamental para uma sociedade democrática.
          </p>
          <p className="mt-3 text-muted-foreground">
            Trabalhamos diariamente para desmascarar golpes, fake news e conteúdos enganosos
            que circulam na internet, empoderando cidadãos a tomarem decisões baseadas na
            realidade.
          </p>
        </div>
        <div className="grid place-items-center rounded-2xl bg-primary/10 p-10">
          <ShieldCheck className="h-24 w-24 text-primary" />
        </div>

        <div className="grid place-items-center rounded-2xl bg-[color:var(--brand-teal)]/15 p-10 md:order-1">
          <Eye className="h-24 w-24 text-[color:var(--brand-teal)]" />
        </div>
        <div className="md:order-2">
          <h2 className="text-2xl font-bold">Nossa Visão</h2>
          <p className="mt-4 text-muted-foreground">
            Vislumbramos um ambiente digital onde a verdade prevalece sobre o sensacionalismo.
            Queremos ser a principal referência em confiabilidade de informações no Brasil.
          </p>
          <p className="mt-3 text-muted-foreground">
            Através de um processo transparente e educativo, buscamos não apenas corrigir
            informações falsas, mas também ensinar nosso público a identificar conteúdos
            suspeitos por conta própria.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-[color:var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Nossos Valores</h2>
            <p className="mt-3 text-muted-foreground">
              Os princípios inegociáveis que guiam nosso trabalho jornalístico todos os dias.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { icon: CheckCircle2, title: "Precisão", desc: "O rigor na apuração é nossa prioridade. Consultamos fontes primárias, especialistas e documentos oficiais antes de publicar qualquer verificação." },
              { icon: Eye, title: "Transparência", desc: "Nossa metodologia é pública. Explicamos detalhadamente como chegamos a cada conclusão e disponibilizamos os links para todas as fontes utilizadas." },
              { icon: Scale, title: "Independência", desc: "Não possuímos vínculos partidários, governamentais ou corporativos que influenciem nossa linha editorial. Avaliamos fatos, não opiniões." },
              { icon: Users, title: "Acessibilidade", desc: "Traduzimos informações complexas para uma linguagem clara e direta. A verdade deve ser compreensível para todos." },
            ].map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Por que confiar em nós?</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: Scale, title: "Metodologia Clara", desc: "Não pedimos confiança cega. Mostramos as provas e o caminho até a verdade." },
              { icon: MessageSquare, title: "Abertos a Correções", desc: "Se erramos, corrigimos publicamente e mantemos registro transparente das alterações." },
              { icon: Users, title: "Apoio da Comunidade", desc: "Nossas pautas nascem das dúvidas reais de nossos leitores." },
            ].map((v) => (
              <div key={v.title}>
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-background/10">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-background/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}