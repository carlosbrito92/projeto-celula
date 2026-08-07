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
- [x] Nova calibração: "A Religião Te Confundiu" (Religião Tóxica cap. 3, Pastora Anaily) — introduziu 2 gaps reais entre schema documentado e código, corrigidos junto com o conteúdo: `componente_tema` variante `contraste` (documentada em `estilos-pregacao.md`, nunca implementada em `ComponenteTemaRenderer.tsx`) e `banner_intro.versiculo_ancora` (documentado em `geracao-pregacao.md`, nunca existiu no tipo `BannerIntro` nem em `Reading.tsx`). Ver `CLAUDE.md` "Hurdles técnicos".

Também entregue nesta fase, fora do checklist original: router mínimo próprio (`src/router/`) no lugar de `react-router-dom` — evita uma cadeia de CVEs do modo framework/RSC da lib, que o app não usa; suíte de testes (Vitest + Testing Library) com 44 testes, agora exigida no CI.

## Fase 3 — Módulo de Quebra-gelos + Utilitários (concluída)

- [x] Modelar tabela(s) Supabase para quebra-gelos — já coberta pela migração da Fase 1 (`quebra_gelos`, `tipo` com 3 valores incluindo `utilitario` puro); nenhuma migração nova foi necessária
- [x] Implementar os três utilitários como módulos isolados (sorteador nome/palavra, sorteador de papel, contador/cronômetro) — `src/utilitarios/`. Sorteador de atribuição e sorteador de papel compartilham o **fluxo de privacidade sequencial** ("passar o celular": setup → passagem revelar/confirmar/próximo por pessoa → gestão do líder com valores ocultos) especificado em `docs/spec-privacidade-sorteio.md` — decisão que chegou depois do plano original de Fase 3 e substituiu o desenho inicial (que tinha os dois widgets com comportamentos de privacidade diferentes)
- [x] Implementar tela de catálogo de utilitários (`/utilitarios`) + tela standalone por utilitário (`/utilitarios/:id`) — aba 100% funcional, `tipo='utilitario'` na mesma tabela de quebra-gelos
- [x] Implementar tela de catálogo de quebra-gelos (`/quebra-gelos`, com pills Todos/Só leitura/Com sorteio) + tela de detalhe (`/quebra-gelos/:id`) com utilitário(s) embutido(s) inline como overlay — reaproveita os widgets de `/utilitarios` sem duplicar lógica
- [x] Popular com o catálogo já mapeado (9 quebra-gelos do primeiro lote, `docs/projeto-celula.md` §5.3) — regras/jogadores/idade/duração populados para os 9; Artista Impostor também ganhou `dica` (campo novo em `QuebraGeloJogoConteudo`, ver `CLAUDE.md` "Decisões de arquitetura (Fase 3)"), renderizado como callout na tela de Detalhe. Achado ao popular: `SorteioPapel` precisou tratar `papeis` preset como valor inicial editável (não override fixo) — um preset parcial como "Detetive × 1" não bate a soma com o total de participantes sem completar via editor, já que a contagem só é conhecida em tempo real
- [x] Trocar ícones placeholder (emoji) pelos ícones Lucide definitivos, usando a tabela de mapeamento já documentada — vendorizados em `src/icons/lucide/` (ver `CLAUDE.md` "Decisões de arquitetura (Sistema de ícones)")

## Fase 4 — Polimento V1 (não iniciada)

- [ ] Testes (seguindo a prática de TDD desde o início, não retroativo) para utilitários e renderização de conteúdo
- [ ] Revisão de segurança (RLS, rate limiting) antes de qualquer exposição pública
- [ ] Testar build Capacitor real em dispositivo Android e iOS
- [ ] Convidar um pequeno grupo de líderes de célula para uso real / feedback

## Fase 5 — V2: Multiplayer (em andamento)

- [x] Tecnologia de sincronização escolhida, viabilidade confirmada e implementada — **Playroom Kit** (não mais Supabase Realtime — referência obsoleta desde a migração pra Neon, que não tem equivalente nativo; ver `projeto-celula.md` §7/§10 e `CLAUDE.md` "Decisões de arquitetura (V2 — Quem Sou Eu)")
- [x] Lobby via QR code implementado e testado — `src/multiplayer/quemSouEu/` (`Organizador.tsx`/`Participante.tsx`, UI própria via `skipLobby: true`, QR gerado com `qrcode-generator`). Testado de ponta a ponta contra o backend real do Playroom e em device físico Android (incluindo cenário de re-scan)
- [x] Primeiro mini-jogo — **Quem Sou Eu** (trocado do candidato original Artista Impostor: mecânica de QR code resolve Quem Sou Eu mais diretamente, serve de validação do lobby antes do Artista Impostor, que tem mais partes móveis). Fluxo completo funcionando: organizador escolhe categoria → cria sala → participantes escaneiam e digitam nome → organizador vê ao vivo e inicia → cada participante revela sua palavra sorteada em tela landscape (direção de rotação confirmada em device físico). 3 categorias de conteúdo aprovadas por Carlos (Figuras bíblicas, Personagens de desenho animado, Animais) — `src/multiplayer/quemSouEu/categorias.ts`
- [x] Segundo mini-jogo (Artista Impostor) — implementado em `src/multiplayer/artistaImpostor/` (Organizador escolhe categoria → sala → sorteia impostor + palavra → canvas compartilhado com turno livre → votação digital opcional (híbrida com fallback físico) → resultado agregado sem expor voto individual → "jogar outra rodada"). Canvas sincroniza via polling de `strokes` a cada 50ms (mesmo mecanismo do exemplo oficial "Live Canvas" do Playroom Kit). **Testado de ponta a ponta em 2026-08-07** — primeiro em dev (2 abas Playwright + 1 device físico Android), depois **em produção real** (app nativo instalado no device conectado, fluxo completo "Biblioteca → Quebra-gelos → Artista Impostor → Jogar pelo Celular" → organizador cria sala → Carlos escaneia o QR com o próprio celular → 2 participantes de teste completam o mínimo de 3 → sorteio, canvas, votação, resultado). Achado e corrigido no processo: `Votacao.module.css`/`Resultado.module.css` sem fallback nas CSS vars de tema — como essas telas rodam do lado do participante (sem `ThemeScope`, diferente do organizador), ficavam com estilo quebrado (fundo branco, fonte serifada do browser) até ganharem `var(--x, #fallback)` como `Participante.module.css` já tinha. **Workflow completo (código → PR → merge → seed → device real) considerado validado por Carlos** — teste com mais pessoas reais fica para depois, mas não bloqueia o que já foi feito
- [x] Integração na navegação real do app — botão "Jogar pelo Celular" leva direto pra `/v2/quem-sou-eu`, não mais só por URL direta (PR #24). Fixes de suporte no mesmo pacote: QR corrigido pra não apontar `localhost` dentro do app nativo (PR #25), `vercel.json` com rewrite SPA corrigindo 404 em rotas profundas num fresh load (PR #26), tela do organizador estilizada com tema do app (PR #27)
- [ ] Pendências abertas de produto: variante "organizador participando", timeout/auto-hide da palavra revelada, edge cases de ordem de operações — ver `projeto-celula.md` §10 "Pendências"

---

## Como manter este documento

- Marcar `[x]` assim que algo for concluído — não esperar o fim da fase inteira.
- Se uma tarefa nova surgir que não estava prevista aqui, adicionar na fase correspondente (não deixar implícita).
- Se uma decisão em qualquer outro markdown do projeto mudar o escopo de uma fase, refletir aqui também — este documento deve sempre bater com o estado real dos outros cinco.
- Fases não têm data fixa nem duração estimada — o ritmo é ditado pelo tempo disponível de Carlos, não por sprint.
- **Este arquivo é a única fonte de verdade de progresso — nunca deve existir uma segunda cópia editada em paralelo fora do repositório.** Quando Carlos planeja algo fora do Claude Code (spec, decisão, roadmap) e traz o resultado pra incorporar, o material referencia a fase/seção correspondente aqui (ex: "ver Fase 5 — V2 Multiplayer") em vez de carregar sua própria lista de status duplicada. Decidido em 2026-08-05 depois de um desalinhamento real: uma cópia externa mantida por Carlos ainda dizia Fase 3 "não iniciada" enquanto este arquivo já reportava concluída.
