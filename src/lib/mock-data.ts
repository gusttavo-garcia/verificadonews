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
  image?: string;
  sources?: { label: string; url: string }[];
}

const IMG: Record<string, string> = {
  "michelle-bolsonaro-internacao-fake-news-avc": "/uploads/michelle-bolsonaro-internacao-fact-check.jpg",
  "vermes-comem-plastico": "/__l5e/assets-v1/0d477dc2-8dfb-4d09-91ea-75a129d417ef/queimadas-amazonia.jpg",
  "reforma-tributaria-2026": "/__l5e/assets-v1/864f663c-0cb0-481a-b111-e1ebb68cd1dd/reforma-tributaria.jpg",
  "golpe-pix-falso-banco": "/__l5e/assets-v1/7f8eff35-7547-4eac-abab-d0c23c2a5cb5/golpe-pix.jpg",
  "vacina-gripe-2026": "/__l5e/assets-v1/ca3e6ddc-bcd6-4410-81d4-7089ca40a091/vacina-gripe.jpg",
  "celebridade-crise-publica": "/__l5e/assets-v1/4a1817b4-57da-4b21-a6d9-e92390a50001/celebridade.jpg",
  "loja-online-fraude": "/__l5e/assets-v1/83ed2817-94a2-43af-951d-326dbdc57bbf/loja-fraude.jpg",
  "video-manifestacao-editado": "/__l5e/assets-v1/b81dbac7-e38e-4753-981e-96b62f5cc71f/manifestacao.jpg",
  "brasil-argentina-analise": "/__l5e/assets-v1/bb5de1ba-56a8-48d5-98a7-cbff7102fabe/brasil-argentina.jpg",
  "site-clone-receita-federal": "/__l5e/assets-v1/2c55d823-f570-4788-aeda-0ae5725fe752/site-clone.jpg",
  "queimadas-amazonia-2026": "/__l5e/assets-v1/0d477dc2-8dfb-4d09-91ea-75a129d417ef/queimadas-amazonia.jpg",
  "premio-atriz-brasileira": "/__l5e/assets-v1/cbbba1f3-d2b9-4595-9477-97d7a49b4f6f/premio-atriz.jpg",
  "decreto-governo-economia": "/__l5e/assets-v1/23aec2b3-b95c-4f54-b618-f1525c51d307/decreto-governo.jpg",
  "app-emprestimo-fantasma": "/__l5e/assets-v1/270916e4-8532-4d46-b5db-b79301588e58/app-emprestimo.jpg",
  "ia-clona-voz-golpe": "/__l5e/assets-v1/270916e4-8532-4d46-b5db-b79301588e58/app-emprestimo.jpg",
  "proibicao-energia-solar": "/__l5e/assets-v1/23aec2b3-b95c-4f54-b618-f1525c51d307/decreto-governo.jpg",
};

export const articles: Article[] = [
  {
    slug: "michelle-bolsonaro-internacao-fake-news-avc",
    title: "É falso que Michelle Bolsonaro tenha sido internada com AVC ou infarto",
    excerpt:
      "Ex-primeira-dama foi hospitalizada em Brasília para tratar cefaleia refratária, segundo boletim médico do DF Star. Recebeu alta no dia 2 de agosto após resposta satisfatória a procedimento de bloqueio anestésico.",
    verdict: "falso",
    category: "Política",
    date: getIsoDateDaysAgo(0),
    views: 1840,
    type: "fake",
    sources: [
      { label: "G1 DF", url: "https://g1.globo.com/df/distrito-federal/noticia/2026/08/02/michelle-bolsonaro-recebe-alta-apos-internacao-para-tratar-cefaleia-convencao-do-pl-oficializa-candidatura-ao-senado-neste-domingo.ghtml" },
      { label: "Estadão", url: "https://www.estadao.com.br/politica/michelle-bolsonaro-diz-que-esta-internada-em-hospital-e-e-duvida-na-convencao-do-pl/" },
      { label: "UOL", url: "https://noticias.uol.com.br/eleicoes/2026/08/02/michelle-recebe-alta-de-internacao-pouco-antes-de-convencao-do-pl.ghtm" },
    ],
  },
  {
    slug: "vermes-comem-plastico",
    title: "Cientistas descobrem 'supervermes' capazes de comer e digerir plástico?",
    excerpt:
      "Estudos comprovam que larvas de besouros possuem bactérias no trato digestivo capazes de degradar isopor e plástico. Saiba o que é fato científico e quais os limites dessa descoberta.",
    verdict: "verificado",
    category: "Meio Ambiente",
    date: getIsoDateDaysAgo(0),
    views: 3840,
    type: "noticia",
  },
  {
    slug: "ia-clona-voz-golpe",
    title: "Criminosos usam Inteligência Artificial para clonar voz de familiares em ligações",
    excerpt:
      "Novo golpe utiliza pequenas amostras de áudio retiradas de redes sociais para sintetizar a voz com perfeição e simular pedido de socorro financeiro. Saiba como se proteger.",
    verdict: "verificado",
    category: "Tecnologia",
    date: getIsoDateDaysAgo(1),
    views: 4890,
    type: "golpe",
  },
  {
    slug: "proibicao-energia-solar",
    title: "Governo vai proibir a instalação de painéis de energia solar em residências?",
    excerpt:
      "Vídeo viralizado em redes sociais afirma falsamente que novo decreto proíbe a geração de energia solar própria e prevê multas pesadas. Consultamos a ANEEL e a legislação vigente.",
    verdict: "falso",
    category: "Meio Ambiente",
    date: getIsoDateDaysAgo(2),
    views: 5210,
    type: "fake",
  },
  {
    slug: "reforma-tributaria-2026",
    title: "Reforma Tributária 2026: análise das mudanças fiscais",
    excerpt:
      "Analisamos ponto a ponto as principais alterações trazidas pela nova reforma e o impacto direto no bolso do consumidor.",
    verdict: "verificado",
    category: "Economia",
    date: getIsoDateDaysAgo(3),
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
    date: getIsoDateDaysAgo(4),
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
    date: getIsoDateDaysAgo(5),
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
    date: getIsoDateDaysAgo(6),
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
    date: getIsoDateDaysAgo(7),
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
    date: getIsoDateDaysAgo(8),
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
    date: getIsoDateDaysAgo(9),
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
    date: getIsoDateDaysAgo(10),
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
    date: getIsoDateDaysAgo(11),
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
    date: getIsoDateDaysAgo(12),
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
    date: getIsoDateDaysAgo(13),
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
    date: getIsoDateDaysAgo(14),
    views: 3105,
    type: "golpe",
  },
];

articles.sort((a, b) => b.date.localeCompare(a.date));

for (const a of articles) {
  if (IMG[a.slug]) a.image = IMG[a.slug];
}

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
  if (!iso) return "";
  if (iso.length === 10 && iso.includes("-")) {
    const [year, month, day] = iso.split("-").map(Number);
    if (year && month && day) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getIsoDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}