import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { ShieldCheck } from "lucide-react";

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 md:p-8">
      <h2 className="text-lg font-bold text-foreground md:text-xl">
        {number}. {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export const Route = createFileRoute("/privacidade")({
  component: () => (
    <PageShell>
      <PageHero
        icon={<ShieldCheck className="h-6 w-6" />}
        title="Política de Privacidade"
        subtitle="O Verificado News está comprometido em proteger sua privacidade e garantir a segurança dos seus dados pessoais. Esta política explica como coletamos, usamos e protegemos suas informações quando você utiliza nossa plataforma."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-14">
        <Section number={1} title="Informações que Coletamos">
          <p>Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Informações Pessoais:</strong> nome, endereço de e-mail e outras
              informações fornecidas voluntariamente ao criar uma conta, assinar nossa newsletter ou entrar em contato conosco.
            </li>
            <li>
              <strong className="text-foreground">Dados de Uso:</strong> informações sobre como você interage com
              nosso site, incluindo páginas visitadas, tempo gasto, links clicados e termos de pesquisa utilizados.
            </li>
            <li>
              <strong className="text-foreground">Cookies e Tecnologias de Rastreamento:</strong> utilizamos cookies
              para lembrar suas preferências, entender o uso do site e melhorar sua experiência.
            </li>
          </ul>
        </Section>

        <Section number={2} title="Como Usamos suas Informações">
          <p>As informações coletadas são utilizadas para os seguintes propósitos:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Funcionalidade:</strong> fornecer, operar e manter nosso site e serviços.</li>
            <li><strong className="text-foreground">Personalização:</strong> adaptar o conteúdo e as recomendações de acordo com seus interesses.</li>
            <li><strong className="text-foreground">Comunicações:</strong> enviar atualizações, newsletters, alertas de segurança e respostas às suas solicitações.</li>
            <li><strong className="text-foreground">Análise:</strong> compreender e analisar como você usa nosso site para melhorar nossos serviços e desenvolver novos recursos.</li>
            <li><strong className="text-foreground">Conformidade:</strong> cumprir obrigações legais e proteger nossos direitos e os direitos de nossos usuários.</li>
          </ul>
        </Section>

        <Section number={3} title="Segurança de Dados">
          <p>A segurança dos seus dados é uma prioridade para nós. Implementamos medidas técnicas e organizacionais rigorosas, incluindo:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Criptografia de dados em trânsito (HTTPS/SSL) e em repouso.</li>
            <li>Armazenamento em servidores seguros com acesso restrito.</li>
            <li>Auditorias regulares de segurança e monitoramento de vulnerabilidades.</li>
            <li>Controle de acesso rigoroso para funcionários que precisam acessar os dados para realizar seu trabalho.</li>
          </ul>
        </Section>

        <Section number={4} title="Seus Direitos">
          <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Acesso:</strong> solicitar uma cópia dos seus dados pessoais que mantemos.</li>
            <li><strong className="text-foreground">Correção:</strong> solicitar a correção de dados imprecisos ou incompletos.</li>
            <li><strong className="text-foreground">Exclusão:</strong> solicitar a exclusão de seus dados pessoais de nossos sistemas.</li>
            <li><strong className="text-foreground">Opt-out:</strong> cancelar a assinatura de comunicações de marketing a qualquer momento.</li>
            <li><strong className="text-foreground">Portabilidade:</strong> solicitar a transferência de seus dados para outro provedor de serviços.</li>
          </ul>
        </Section>

        <Section number={5} title="Serviços de Terceiros">
          <p>Podemos utilizar serviços de terceiros que coletam, monitoram e analisam dados para melhorar nossa plataforma:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Google AdSense:</strong> para exibição de anúncios relevantes. O Google pode usar cookies para veicular anúncios com base em suas visitas anteriores.</li>
            <li><strong className="text-foreground">Microsoft Clarity:</strong> para entender como os usuários interagem com nosso site (mapas de calor, gravações de sessão) e melhorar a usabilidade.</li>
            <li><strong className="text-foreground">Ferramentas de Analytics:</strong> para coletar estatísticas anônimas sobre o tráfego do site.</li>
          </ul>
        </Section>

        <Section number={6} title="Contato e Atualizações">
          <p>Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como lidamos com seus dados, entre em contato conosco:</p>
          <p>
            <strong className="text-foreground">E-mail:</strong>{" "}
            <a href="mailto:contato@verificadonews.com.br" className="text-primary hover:underline">
              contato@verificadonews.com.br
            </a>
          </p>
          <p>Nosso tempo de resposta padrão para solicitações relacionadas a dados é de até 48 horas úteis.</p>
          <h3 className="pt-4 text-base font-semibold text-foreground">Atualizações da Política</h3>
          <p>
            Esta política foi atualizada pela última vez em 06 de julho de 2026. Reservamo-nos o direito de modificar
            esta política a qualquer momento. Alterações significativas serão comunicadas através de um aviso em nosso
            site ou por e-mail.
          </p>
        </Section>
      </div>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Política de Privacidade — Verificado News" }] }),
});