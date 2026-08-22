# Editor de artigos em página própria + edição de texto rica

## 1. Página separada para criar/editar

Hoje o formulário de rascunho abre dentro da própria tela do painel. Passa a ser uma página dedicada:

- `/painel/novo` — ao abrir, o sistema **já cria automaticamente um rascunho vazio** no banco (título provisório "Rascunho sem título") e redireciona para `/painel/editar/<id>`. Isso garante que nada se perca se a aba fechar.
- `/painel/editar/<id>` — editor completo do artigo (título, resumo, conteúdo, categoria, veredito, tipo, imagem de destaque).
- Salvamento automático a cada poucos segundos após parar de digitar, com indicador "Salvando… / Salvo às HH:MM" no topo, mais botão "Salvar" manual.
- Ações no topo da página: Voltar ao painel, Pedir revisão (redator) ou Publicar (administrador), e Excluir (vai para a lixeira).
- No painel, o botão "Novo rascunho" e o botão "Editar" de cada artigo passam a navegar para essas páginas em vez de abrir o modal atual.

Rascunhos vazios (sem título alterado e sem conteúdo) continuam visíveis só para o próprio autor, como já acontece hoje.

## 2. Editor de texto visual (sem markdown)

Substituir a caixa de texto simples por um editor rico com barra de ferramentas:

- Títulos H1, H2, H3 e parágrafo
- Negrito, itálico, sublinhado, tachado, destaque (grifado)
- Listas com marcadores e numeradas, citação, linha divisória
- Link (inserir/remover) e limpar formatação
- Desfazer/refazer e contador de caracteres
- Área de edição alta (mesma altura confortável de hoje) com a mesma tipografia do site, para o texto ficar igual ao que sai publicado

Formatação é aplicada selecionando o texto e clicando no botão — sem escrever markdown.

## 3. Compatibilidade com os artigos existentes

- O conteúdo passa a ser salvo como HTML.
- Artigos antigos em markdown continuam funcionando: ao abrir no editor, o markdown é convertido para o formato visual; na publicação, o site detecta se o conteúdo é HTML ou markdown e renderiza corretamente.
- A inserção de blocos de anúncio por parágrafo continua funcionando igual, pois continua baseada nos parágrafos do conteúdo final.

## Notas técnicas

- Editor: TipTap (`@tiptap/react` + StarterKit, Underline, Highlight, Link) — leve, controlado, gera HTML limpo.
- Novas rotas: `src/routes/_authenticated/painel.novo.tsx` e `src/routes/_authenticated/painel.editar.$id.tsx`; painel atual vira lista/dashboard.
- Nova server function `createEmptyDraft` em `src/lib/articles.functions.ts` (redator/admin), reutilizando `createArticle`; `updateArticle` usado no autosave.
- `src/routes/$slug.tsx`: renderizar direto quando o corpo já for HTML (detecção por tag inicial), senão passar por `marked` como hoje; sanitizar o HTML antes de renderizar.
- `getArticleById` (autor ou admin) para carregar o artigo na página de edição.
