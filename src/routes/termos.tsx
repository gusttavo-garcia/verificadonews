import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { FileText } from "lucide-react";

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

export const Route = createFileRoute("/termos")({
  component: () => (
    <PageShell>
      <PageHero
        icon={<FileText className="h-6 w-6" />}
        title="Termos de Uso"
        subtitle="Ao acessar e utilizar o Verificado News, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-14">
        <Section number={1} title="Aceitação dos Termos">
          <p>Ao acessar o site Verificado News, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
          <p>Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.</p>
          <p>O Verificado News reserva-se o direito de modificar estes termos de serviço a qualquer momento sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>
        </Section>

        <Section number={2} title="Licença de Uso">
          <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Verificado News, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>modificar ou copiar os materiais;</li>
            <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não);</li>
            <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Verificado News;</li>
            <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
            <li>transferir os materiais para outra pessoa ou "espelhar" os materiais em qualquer outro servidor.</li>
          </ul>
          <p>Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida pelo Verificado News a qualquer momento.</p>
        </Section>

        <Section number={3} title="Isenção de Garantias">
          <p>Os materiais no site da Verificado News são fornecidos "como estão". O Verificado News não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.</p>
          <p>Além disso, o Verificado News não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site. O usuário é responsável por verificar as informações antes de tomar decisões baseadas nelas.</p>
        </Section>

        <Section number={4} title="Limitações de Responsabilidade">
          <p>Em nenhum caso o Verificado News ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro, ou devido a interrupção de negócios) decorrentes do uso ou da incapacidade de usar os materiais em Verificado News, mesmo que o Verificado News ou um representante autorizado de Verificado News tenha sido notificado oralmente ou por escrito da possibilidade de tais danos.</p>
          <p>Você concorda em indenizar, defender e isentar o Verificado News, seus diretores, funcionários e parceiros de qualquer reclamação, responsabilidade, dano ou custo decorrente do seu uso da plataforma ou violação destes termos.</p>
        </Section>

        <Section number={5} title="Precisão dos Materiais">
          <p>Os materiais exibidos no site da Verificado News podem incluir erros técnicos, tipográficos ou fotográficos. O Verificado News não garante que qualquer material em seu site seja preciso, completo ou atual.</p>
          <p>O Verificado News pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, o Verificado News não se compromete a atualizar os materiais. Mantemos um processo transparente de correções caso erros sejam identificados em nossas checagens.</p>
        </Section>

        <Section number={6} title="Links para Sites de Terceiros">
          <p>O Verificado News não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por Verificado News do site.</p>
          <p>O uso de qualquer site vinculado é por conta e risco do usuário. Recomendamos que você leia os termos de uso e a política de privacidade de qualquer site de terceiros que visitar.</p>
        </Section>

        <Section number={7} title="Conduta do Usuário">
          <p>Ao utilizar áreas interativas do site (como comentários ou formulários de denúncia), você concorda em não postar, enviar ou transmitir todo o que:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>seja ilegal, difamatório, ameaçador, abusivo ou obsceno;</li>
            <li>incite ódio, violência ou discriminação;</li>
            <li>viole direitos autorais ou de propriedade intelectual de terceiros;</li>
            <li>contenha spam, publicidade não autorizada ou links maliciosos.</li>
          </ul>
          <p>O Verificado News reserva-se o direito de remover qualquer conteúdo que viole essas regras e suspender ou banir contas de usuários infratores sem aviso prévio.</p>
        </Section>

        <Section number={8} title="Propriedade Intelectual">
          <p>Todo o conteúdo original produzido pelo Verificado News, incluindo textos, gráficos, logotipos, ícones e imagens, é propriedade exclusiva do Verificado News e protegido por leis de direitos autorais.</p>
          <p>É permitido o uso justo (fair use) de trechos de nossas checagens para fins informativos, educacionais ou jornalísticos, desde que atribuído o devido crédito ao Verificado News com um link direto para a publicação original.</p>
        </Section>

        <Section number={9} title="Lei Aplicável">
          <p>Estes termos e condições são regidos e interpretados de acordo com as leis do Brasil. Você se submete irrevogavelmente à jurisdição exclusiva dos tribunais localizados no Brasil para a resolução de qualquer disputa decorrente ou relacionada a estes termos ou ao uso do site.</p>
        </Section>
      </div>
    </PageShell>
  ),
  head: () => pageHead({
    title: "Termos de Uso — Verificado News",
    description: "Leia os termos de uso do Verificado News: regras de acesso, licença de uso do conteúdo, isenções de garantia e limitações de responsabilidade.",
    path: "/termos",
  }),
});