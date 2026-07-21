import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, Clock, Send } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contato")({
  component: ContatoPage,
  head: () => ({ meta: [{ title: "Contato — Verificado News" }] }),
});

function ContatoPage() {
  const [sent, setSent] = useState(false);
  return (
    <PageShell>
      <PageHero
        title="Fale Conosco"
        subtitle="Viu alguma notícia suspeita? Encontrou um erro? Quer propor uma parceria? Utilize os canais abaixo para falar com nossa equipe."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
        <form
          className="rounded-2xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast?.success?.("Mensagem enviada com sucesso!");
          }}
        >
          <h2 className="text-lg font-bold">Envie uma mensagem</h2>
          <div className="mt-5 space-y-4 text-sm">
            <Field label="Nome completo">
              <input required placeholder="Seu nome" className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </Field>
            <Field label="E-mail">
              <input required type="email" placeholder="seu@email.com" className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </Field>
            <Field label="Assunto">
              <select required defaultValue="" className="w-full rounded-lg border border-border bg-background px-3 py-2">
                <option value="" disabled>Selecione o motivo do contato</option>
                <option>Sugerir uma checagem</option>
                <option>Reportar erro em uma checagem</option>
                <option>Parceria ou imprensa</option>
                <option>Outro</option>
              </select>
            </Field>
            <Field label="Mensagem">
              <textarea required rows={5} placeholder="Descreva detalhadamente o motivo do seu contato." className="w-full rounded-lg border border-border bg-background px-3 py-2" />
            </Field>
          </div>
          <Button type="submit" className="mt-5 w-full">
            <Send className="mr-2 h-4 w-4" /> {sent ? "Enviado" : "Enviar mensagem"}
          </Button>
        </form>

        <div className="space-y-6">
          <h2 className="text-lg font-bold">Informações de Contato</h2>
          {[
            { icon: Mail, title: "E-mail", body: (<><p>contato@verificadonews.com.br</p><p className="text-xs text-muted-foreground">Para denúncias: denuncias@verificadonews.com.br</p></>) },
            { icon: Phone, title: "WhatsApp (apenas mensagens)", body: (<><p>+55 (14) 99752-3721</p><p className="text-xs text-muted-foreground">Envie links, fotos ou vídeos suspeitos.</p></>) },
            { icon: Clock, title: "Horário de Atendimento", body: (<><p>Segunda a Sexta: 09h às 18h</p><p className="text-xs text-muted-foreground">Monitoramento de urgências funciona 24/7.</p></>) },
          ].map((c) => (
            <div key={c.title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">{c.title}</p>
                <div className="mt-1 text-foreground/90">{c.body}</div>
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-[color:var(--surface)] p-6">
            <h3 className="font-bold">Perguntas Frequentes</h3>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-semibold">Quanto tempo demoram para responder?</p>
                <p className="text-muted-foreground">Tentamos responder todas as mensagens em até 48 horas úteis.</p>
              </div>
              <div>
                <p className="font-semibold">Vocês cobram para verificar uma notícia?</p>
                <p className="text-muted-foreground">Não. Nosso serviço de checagem é 100% gratuito para o público.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}