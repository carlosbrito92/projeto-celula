# Progresso — Projeto Célula

> Checklist de acompanhamento. Não é um sprint com cerimônia — é um documento vivo, atualizado conforme o trabalho avança, seguindo o mesmo princípio dos demais markdowns do projeto: registra o que já foi decidido/feito, não o que "deveria" acontecer em teoria. Marcar `[x]` quando concluído; adicionar uma linha nova sempre que uma decisão nova entrar em qualquer um dos outros documentos.

---

## Fase 0 — Definição (concluída)

Tudo que precisava ser decidido antes de qualquer código existir.

- [x] Visão e problema central definidos (`projeto-celula.md` §1)
- [x] Escopo por fase (V1 vs V2) fechado (`projeto-celula.md` §3)
- [x] Modelo de acesso e permissão decidido — sem hierarquia (`projeto-celula.md` §2)
- [x] Módulo de pregações especificado — biblioteca, temas por série, navegação (`projeto-celula.md` §4)
- [x] Módulo de quebra-gelos especificado — tipos, fluxo, catálogo inicial (`projeto-celula.md` §5)
- [x] Kit de utilitários compartilhados especificado (`projeto-celula.md` §6)
- [x] Stack técnica decidida — React + Capacitor + Supabase + Vercel (`projeto-celula.md` §7)
- [x] Requisitos de segurança definidos — RLS, rate limiting, sem PII persistida (`projeto-celula.md` §7)
- [x] Estratégia de modularidade para não travar a V2 (`projeto-celula.md` §7)
- [x] Sistema de temas por série documentado, com workflow de criação de tema novo (`estilos-pregacao.md`)
- [x] Schema JSON de conteúdo de pregação definido e calibrado com 4 pregações reais (`geracao-pregacao.md`)
- [x] Regras de precedência de fonte (transcrição vs. anotação; ruído severo) formalizadas (`geracao-pregacao.md`)
- [x] Mock visual do projeto gerado e aprovado (`mock-prompt.md`, `mock-aprovado-v2.html`)
- [x] Sistema de ícones decidido — Lucide via fork próprio (`mock-prompt.md`)
- [x] Mecanismo de acompanhamento de progresso definido (este documento)

---

## Fase 1 — Fundação técnica (não iniciada)

Infraestrutura mínima antes de qualquer feature visível.

- [x] Criar fork do repositório Lucide no GitHub — https://github.com/carlosbrito92/lucide
- [x] Criar repositório do Projeto Célula (código) — https://github.com/carlosbrito92/projeto-celula
- [x] Criar projeto Supabase (auth anônima, banco Postgres) — projeto `projeto-celula`, região `sa-east-1`, ref `tvhywnpctttrmzcyueii`
- [x] Definir e aplicar Row Level Security nas tabelas iniciais (pregações, quebra-gelos) — tabelas `pregacoes`/`quebra_gelos` criadas com RLS habilitado, policy de `select` pública para `anon`/`authenticated`, sem policy de escrita (conteúdo editorial só via service role); migração em `supabase/migrations/`
- [x] Configurar projeto React + Capacitor (scaffold inicial, build Android/iOS/PWA funcionando) — Vite+React+TS, `com.minc.celula`; build Android testado de ponta a ponta em tablet físico via adb; PWA (manifest + service worker) validado via `vite preview`; iOS só escafoldado (build real exige macOS/Xcode)
- [x] Configurar deploy no Vercel — projeto `projeto-celula` linkado e conectado ao GitHub (deploy automático a cada push em `main`); produção em https://projeto-celula.vercel.app, verificado servindo build + manifest PWA + service worker (200)
- [x] Criar documento vivo de projeto para a fase de código (equivalente a um `CLAUDE.md`, conforme prática referenciada do artigo do Akita) — hurdles técnicos documentados aqui, não nos markdowns de conteúdo — ver `CLAUDE.md` na raiz do repo

## Fase 2 — Módulo de Pregações (concluída)

- [x] Modelar tabela(s) Supabase para pregações — já coberto pela migração da Fase 1 (`pregacoes` com colunas indexáveis + `conteudo jsonb`); nenhuma migração nova foi necessária
- [x] Implementar renderização dos tipos de bloco universais (`paragrafo`, `versiculo`, `callout`, `frase_chave`, `lista`) — `src/content/BlockRenderer.tsx`
- [x] Implementar renderização dos `componente_tema` (stage, diagnostico, antidoto, versus, analogia, banho_list, humor) e do `merch_section` — `src/content/ComponenteTemaRenderer.tsx` / `MerchSection.tsx`. Descoberta: `componente_tema` não é código exclusivo por tema — qualquer variante pode aparecer em qualquer pregação (confirmado no conteúdo real: `stage` apareceu numa pregação do Igrejar); um único registro por variante, cores resolvidas via CSS vars do tema ativo
- [x] Implementar sistema de tema por série — `src/themes/registry.ts` (6 temas de `estilos-pregacao.md`, dados completos) + `resolveTema()` + `ThemeScope` (CSS custom properties escopadas por componente, não só por tela — cards da Biblioteca aplicam o tema da própria série)
- [x] Implementar tela de biblioteca (destaque + lista + busca) — `src/screens/pregacoes/Library.tsx`, busca client-side tolerante a acento
- [x] Implementar tela de leitura com índice clicável + FAB — `src/screens/pregacoes/Reading.tsx` + `useIndiceFab.ts` (IntersectionObserver + `scrollIntoView`, nunca `href="#id"`)
- [x] Popular com as pregações já calibradas — os 4 JSONs (`content/pregacoes/`) inseridos via `execute_sql` (RLS bloqueia escrita client-side por design; seed é operação administrativa, não código de app)

Também entregue nesta fase, fora do checklist original: router mínimo próprio (`src/router/`) no lugar de `react-router-dom` — evita uma cadeia de CVEs do modo framework/RSC da lib, que o app não usa; suíte de testes (Vitest + Testing Library) com 44 testes, agora exigida no CI.

## Fase 3 — Módulo de Quebra-gelos + Utilitários (concluída)

- [x] Modelar tabela(s) Supabase para quebra-gelos — já coberta pela migração da Fase 1 (`quebra_gelos`, `tipo` com 3 valores incluindo `utilitario` puro); nenhuma migração nova foi necessária
- [x] Implementar os três utilitários como módulos isolados (sorteador nome/palavra, sorteador de papel, contador/cronômetro) — `src/utilitarios/`. Sorteador de atribuição e sorteador de papel compartilham o **fluxo de privacidade sequencial** ("passar o celular": setup → passagem revelar/confirmar/próximo por pessoa → gestão do líder com valores ocultos) especificado em `docs/spec-privacidade-sorteio.md` — decisão que chegou depois do plano original de Fase 3 e substituiu o desenho inicial (que tinha os dois widgets com comportamentos de privacidade diferentes)
- [x] Implementar tela de catálogo de utilitários (`/utilitarios`) + tela standalone por utilitário (`/utilitarios/:id`) — aba 100% funcional, `tipo='utilitario'` na mesma tabela de quebra-gelos
- [x] Implementar tela de catálogo de quebra-gelos (`/quebra-gelos`, com pills Todos/Só leitura/Com sorteio) + tela de detalhe (`/quebra-gelos/:id`) com utilitário(s) embutido(s) inline como overlay — reaproveita os widgets de `/utilitarios` sem duplicar lógica
- [x] Popular com o catálogo já mapeado (9 quebra-gelos do primeiro lote, `docs/projeto-celula.md` §5.3) — regras/jogadores/idade/duração não existem ainda como conteúdo real; seed só com nome/tipo/utilitário/ícone/`utilitarios_inline` (dado já decidido), fallback "Detalhes em breve" no resto. Achado ao popular: `SorteioPapel` precisou tratar `papeis` preset como valor inicial editável (não override fixo) — um preset parcial como "Detetive × 1" não bate a soma com o total de participantes sem completar via editor, já que a contagem só é conhecida em tempo real
- [x] Trocar ícones placeholder (emoji) pelos ícones Lucide definitivos — vendorizados do fork em `src/icons/`, ver `CLAUDE.md` "Decisões de arquitetura (Sistema de ícones)"
- [x] Regras reais (texto de instrução) dos 9 quebra-gelos, populadas a partir das instruções originais — antes só existia o fallback "Detalhes em breve"
- [x] Três extensões à spec de privacidade, motivadas por teste de campo real (célula ao vivo, Artista Impostor com papel e caneta): banco de categorias de palavras (fecha vazamento — quem configura nunca vê a palavra, só a categoria), nomes de participantes persistentes entre sessões (localStorage), reordenação da lista de nomes. `content/quebra-gelos/artista-impostor.json` populado com 3 categorias reais (Objetos da casa, Animais, Comida — 30-32 palavras cada), rascunho revisado e aprovado por Carlos com pequenos cortes antes de virar seed. Reordenação por arraste (`@dnd-kit/sortable`) testada no device real e não funcionou de forma confiável em touch — trocada por botões de seta (←/→), sem biblioteca nenhuma; `@dnd-kit/*` removido do projeto.
- [x] Correção do modelo "Artista Impostor" — rodava pela lógica de `sorteio_atribuicao` (cada participante recebia uma palavra diferente), quando o jogo real precisa de `sorteio_papel` com um modo novo: 1 "Impostor" implícito (quantidade fixa 1) + todo o resto do grupo recebendo a MESMA palavra sorteada da categoria. `CategoriaEditor` generalizado (prop `totalParticipantes` → `minimoPalavras`, movido para `src/utilitarios/` por ser compartilhado) e `SorteioPapel` ganhou o modo categoria/impostor ao lado do modo Detetive (papéis livres nome+quantidade) já existente — ver `CLAUDE.md` "Decisões de arquitetura (Fase 3)". `content/quebra-gelos/artista-impostor.json` colapsado de 2 `utilitarios_inline` para 1. Verificado em device físico: ciclo completo de 4 participantes produziu exatamente 1 "Você é o Impostor!" e a mesma palavra ("Pato") para os outros 3.

## Fase 4 — Polimento V1 (não iniciada)

- [ ] Testes (seguindo a prática de TDD desde o início, não retroativo) para utilitários e renderização de conteúdo
- [ ] Revisão de segurança (RLS, rate limiting) antes de qualquer exposição pública
- [ ] Testar build Capacitor real em dispositivo Android e iOS
- [ ] Convidar um pequeno grupo de líderes de célula para uso real / feedback

## Fase 5 — V2: Multiplayer (não iniciada, sem detalhamento ainda)

Arquitetura detalhada fica para quando esta fase entrar em pauta — ver `projeto-celula.md` §8.

- [ ] Detalhar arquitetura de lobby via QR code
- [ ] Detalhar sincronização de estado via Supabase Realtime
- [ ] Especificar o primeiro mini-jogo (candidato natural: Artista Impostor, já semi-especificado no material original)

---

## Como manter este documento

- Marcar `[x]` assim que algo for concluído — não esperar o fim da fase inteira.
- Se uma tarefa nova surgir que não estava prevista aqui, adicionar na fase correspondente (não deixar implícita).
- Se uma decisão em qualquer outro markdown do projeto mudar o escopo de uma fase, refletir aqui também — este documento deve sempre bater com o estado real dos outros cinco.
- Fases não têm data fixa nem duração estimada — o ritmo é ditado pelo tempo disponível de Carlos, não por sprint.
