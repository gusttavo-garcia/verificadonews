import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";

export const Route = createFileRoute("/privacidade")({
  component: () => (
    <PageShell>
      <PageHero title="Política de Privacidade" subtitle="Como coletamos, usamos e protegemos suas informações." />
      <section className="mx-auto max-w-3xl px-4 py-14 text-sm leading-relaxed text-foreground/90">
        <p>O Verificado News respeita sua privacidade. Coletamos apenas os dados necessários para o funcionamento do site e para atender solicitações enviadas por meio dos nossos canais de contato.</p>
        <h2 className="mt-8 text-lg font-bold">Dados coletados</h2>
        <p className="mt-2">Coletamos dados de navegação agregados e informações fornecidas voluntariamente em formulários (nome, e-mail e mensagem).</p>
        <h2 className="mt-8 text-lg font-bold">Uso dos dados</h2>
        <p className="mt-2">Utilizamos os dados exclusivamente para responder mensagens, melhorar a experiência do site e cumprir obrigações legais.</p>
        <h2 className="mt-8 text-lg font-bold">Seus direitos</h2>
        <p className="mt-2">Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail contato@verificadonews.com.br.</p>
      </section>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Política de Privacidade — Verificado News" }] }),
});