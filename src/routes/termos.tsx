import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";

export const Route = createFileRoute("/termos")({
  component: () => (
    <PageShell>
      <PageHero title="Termos de Uso" subtitle="Regras para utilização da plataforma Verificado News." />
      <section className="mx-auto max-w-3xl px-4 py-14 text-sm leading-relaxed text-foreground/90">
        <p>Ao acessar o Verificado News você concorda com estes termos. O conteúdo publicado é resultado de checagem jornalística independente e tem finalidade informativa.</p>
        <h2 className="mt-8 text-lg font-bold">Uso do conteúdo</h2>
        <p className="mt-2">É permitido compartilhar links para nossas publicações. A reprodução integral requer autorização prévia por escrito.</p>
        <h2 className="mt-8 text-lg font-bold">Responsabilidades</h2>
        <p className="mt-2">Nos esforçamos para publicar informações precisas, mas eventuais correções são realizadas de forma pública e transparente.</p>
      </section>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Termos de Uso — Verificado News" }] }),
});