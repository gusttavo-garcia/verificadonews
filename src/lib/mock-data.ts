export type Verdict = "verificado" | "falso" | "enganoso" | "parcial" | "apuracao";

export const verdictLabel: Record<Verdict, string> = {
  verificado: "Verificado",
  falso: "Falso",
  enganoso: "Enganoso",
  parcial: "Parcialmente Verdade",
  apuracao: "Em Apuração",
};

export type Category =
  | "Política"
  | "Saúde"
  | "Economia"
  | "Famosos"
  | "Copa do Mundo"
  | "Tecnologia"
  | "Meio Ambiente";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  verdict: Verdict;
  category: Category;
  date: string;
  views: number;
  type: "noticia" | "golpe" | "empresa" | "site" | "video" | "fake";
  sources?: { label: string; url: string }[];
}

export const articles: Article[] = [
  {
    slug: "reforma-tributaria-2026",
    title: "Reforma Tributária 2026: análise das mudanças fiscais",
    excerpt:
      "Analisamos ponto a ponto as principais alterações trazidas pela nova reforma e o impacto direto no bolso do consumidor.",
    verdict: "verificado",
    category: "Economia",
    date: "2026-07-15",
    views: 1240,
    type: "noticia",
  },
  {
    slug: "golpe-pix-falso-banco",
    title: "Golpe do falso funcionário de banco cresce 220% no Pix",
    excerpt:
      "Criminosos ligam se passando pelo banco e convencem vítimas a transferir dinheiro para uma conta 'segura'. Saiba como identificar.",
    verdict: "falso",
    category: "Tecnologia",
    date: "2026-07-14",
    views: 3820,
    type: "golpe",
  },
  {
    slug: "vacina-gripe-2026",
    title: "Nova vacina da gripe altera o DNA humano?",
    excerpt:
      "Boato viraliza no WhatsApp com áudio de suposto médico. Confira o que dizem os especialistas e agências reguladoras.",
    verdict: "falso",
    category: "Saúde",
    date: "2026-07-12",
    views: 5410,
    type: "fake",
  },
  {
    slug: "celebridade-crise-publica",
    title: "Celebridade brasileira enfrenta crise após vídeo editado",
    excerpt:
      "Vídeo circulando nas redes foi manipulado com corte estratégico. A gravação original mostra contexto diferente.",
    verdict: "enganoso",
    category: "Famosos",
    date: "2026-07-10",
    views: 8730,
    type: "noticia",
  },
  {
    slug: "loja-online-fraude",
    title: "Loja 'MegaOfertas Brasil' aplica golpe do produto que não chega",
    excerpt:
      "Site clonado usa selos falsos de segurança e anúncios patrocinados. Denúncias no Procon passam de 400 casos.",
    verdict: "falso",
    category: "Tecnologia",
    date: "2026-07-09",
    views: 2110,
    type: "empresa",
  },
  {
    slug: "video-manifestacao-editado",
    title: "Vídeo de manifestação em Brasília foi gravado em 2019",
    excerpt:
      "Imagens compartilhadas como recentes são de protesto ocorrido há sete anos, conforme análise reversa de vídeo.",
    verdict: "enganoso",
    category: "Política",
    date: "2026-07-08",
    views: 6390,
    type: "video",
  },
  {
    slug: "brasil-argentina-analise",
    title: "Brasil x Argentina: tática, gols e momentos decisivos",
    excerpt:
      "Cobertura verificada da partida com dados oficiais da CBF e Conmebol, sem os boatos que circularam nas redes.",
    verdict: "verificado",
    category: "Copa do Mundo",
    date: "2026-07-07",
    views: 940,
    type: "noticia",
  },
  {
    slug: "site-clone-receita-federal",
    title: "Site clone da Receita Federal captura CPF e dados bancários",
    excerpt:
      "Página com domínio parecido promete restituição do IR e coleta dados sensíveis. Denunciado às autoridades.",
    verdict: "falso",
    category: "Tecnologia",
    date: "2026-07-06",
    views: 4520,
    type: "site",
  },
  {
    slug: "queimadas-amazonia-2026",
    title: "Queimadas na Amazônia bateram recorde em junho?",
    excerpt:
      "Dado circula fora de contexto. Comparação com anos anteriores mostra cenário diferente do afirmado.",
    verdict: "parcial",
    category: "Meio Ambiente",
    date: "2026-07-05",
    views: 1780,
    type: "noticia",
  },
  {
    slug: "premio-atriz-brasileira",
    title: "Atriz brasileira conquista prêmio internacional de cinema",
    excerpt:
      "Confirmamos com a organização do festival: prêmio é real, entregue na cerimônia de encerramento.",
    verdict: "verificado",
    category: "Famosos",
    date: "2026-07-04",
    views: 2210,
    type: "noticia",
  },
  {
    slug: "decreto-governo-economia",
    title: "Novo decreto do governo impacta economia e sociedade",
    excerpt:
      "Publicação oficial no Diário da União confirma as medidas anunciadas na coletiva.",
    verdict: "verificado",
    category: "Política",
    date: "2026-07-03",
    views: 1360,
    type: "noticia",
  },
  {
    slug: "app-emprestimo-fantasma",
    title: "App de empréstimo desaparece após cobrar taxa antecipada",
    excerpt:
      "Modelo clássico de golpe: cobra 'taxa de liberação' e some. Aplicativo foi removido das lojas oficiais.",
    verdict: "falso",
    category: "Economia",
    date: "2026-07-02",
    views: 3105,
    type: "golpe",
  },
];

export const categories: Category[] = [
  "Política",
  "Saúde",
  "Economia",
  "Famosos",
  "Copa do Mundo",
  "Tecnologia",
  "Meio Ambiente",
];

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}