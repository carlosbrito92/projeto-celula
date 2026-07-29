# CLAUDE.md — Projeto Célula

Documento vivo da fase de código, conforme prática referenciada em `docs/projeto-celula.md` §7 (artigo "Do Zero à Pós-Produção em 1 Semana", Akita). Registra decisões técnicas, requisitos não-negociáveis e hurdles conforme aparecem — atualizar sempre que algo relevante mudar, não deixar como documento estático.

Para visão de produto, escopo e módulos: ver `docs/projeto-celula.md`. Este arquivo é sobre **como construir**, não **o que construir**.

---

## O projeto em uma frase

Web app (React + Capacitor) para redes de célula: biblioteca de pregações, catálogo de quebra-gelos, kit de utilitários. Sem login tradicional, sem hierarquia de permissão, escopo V1 enxuto.

## Recursos e IDs

- **GitHub**: https://github.com/carlosbrito92/projeto-celula
- **Supabase**: projeto `projeto-celula`, ref `tvhywnpctttrmzcyueii`, região `sa-east-1`
- **Vercel**: https://projeto-celula.vercel.app (deploy automático a cada push em `main`)
- **Fork Lucide** (ícones, ver `docs/mock-prompt.md`): https://github.com/carlosbrito92/lucide
- **App id Capacitor**: `com.minc.celula`

## Documentos relacionados

- `docs/projeto-celula.md` — visão, escopo por fase, stack, segurança (fonte de verdade do produto)
- `docs/estilos-pregacao.md` — sistema de temas por série
- `docs/geracao-pregacao.md` — schema de conteúdo (JSON) de pregações
- `docs/mock-prompt.md` / `docs/mock-aprovado-v2.html` — referência visual aprovada
- `docs/progresso.md` — checklist de acompanhamento por fase
- `supabase/migrations/` — migrações do banco (schema + RLS)

---

## Fluxo de trabalho — branches + PR, main protegida

Desde 2026-07-29, `main` tem branch protection (`enforce_admins: true`, sem bypass nem para admin):

- **Push direto em `main` é bloqueado.** Todo trabalho vai para uma branch, com PR para `main`.
- **Checks obrigatórios antes do merge**: `build` (GitHub Actions — `.github/workflows/ci.yml`, roda lint + build) e `Vercel` (preview deployment do PR precisa ficar verde).
- **Sem revisão humana obrigatória** — decisão consciente, dado que o projeto é mantido por uma pessoa só. Os checks automatizados são o gate.
- `allow_force_pushes: false`, `allow_deletions: false` em `main`.
- Por quê: reversibilidade (cada PR é um ponto de revert limpo) + garantia de que nada quebra o build/deploy antes de entrar em `main`.

Fluxo prático para qualquer mudança a partir daqui:
```bash
git checkout -b nome-da-branch
# ...commits...
git push -u origin nome-da-branch
gh pr create --fill
# esperar checks (build + Vercel) ficarem verdes, então:
gh pr merge --squash  # ou merge normal, conforme preferir
```

## Requisitos de segurança — não-negociáveis

Direto de `docs/projeto-celula.md` §7. Um agente de IA "implementa o que você pede, mas raramente sugere proteções que você não pediu" — por isso ficam explícitos aqui, não implícitos:

1. **RLS obrigatório em toda tabela nova**, sem exceção — mesmo sem "conta de usuário".
2. **Conteúdo editorial é somente leitura para o app.** `pregacoes` e `quebra_gelos` (e qualquer tabela de conteúdo futura) nunca têm policy de insert/update/delete para `anon`/`authenticated`. Escrita só via service role (script/dashboard, fora do client).
3. **Dado efêmero de sessão** (resultado de sorteio, nome digitado numa dinâmica) pode ter escrita livre — não tem valor de permanência, não precisa das mesmas garantias do conteúdo editorial.
4. **Rate limiting nos utilitários** (ex: Supabase Edge Functions com throttle) antes de qualquer utilitário ficar acessível publicamente sem autenticação.
5. **Sem PII persistida** além da sessão, a não ser que histórico seja explicitamente decidido depois.

Ao adicionar uma tabela nova: habilitar RLS na mesma migração que cria a tabela, nunca depois.

**Chave anon/publishable do Supabase é pública por design** — está hardcoded em `src/lib/supabase.ts`, sem `.env`. Isso não é um vazamento: é literalmente o que "publishable key" significa (Supabase a projetou para ir no bundle do client). O gate de segurança real é RLS (item 2 acima), não o sigilo dessa chave. Não "corrigir" isso movendo para variável de ambiente sem necessidade real — normal.

## Práticas de desenvolvimento

- **TDD nasce junto com o código.** Utilitários (sorteador, contador) e lógica de renderização de conteúdo nascem com teste, não como algo adicionado depois.
- **Refactoring contínuo é disciplina.** A separação em camadas (conteúdo / utilitários locais / roteamento por feature — ver `docs/projeto-celula.md` §7) exige poda regular, não desenho único.
- **O humano decide o quê, a IA decide o como.** Questionar decisões de arquitetura propostas (ex: recusar over-engineering, state machine complexa quando um caso simples resolve).
- **Modularidade para a V2.** Utilitários da V1 (sorteio single-device) são módulos isolados desde já, pensados para serem *estendidos* com Supabase Realtime na V2 — não reescritos.

## Decisões de arquitetura (Fase 2)

- **Router próprio (`src/router/`), não `react-router-dom`.** O app só precisa de ~4 rotas estáticas; a lib puxava uma cadeia de CVEs do modo framework/RSC (SSR, actions) que este app nunca usa (SPA client-side puro). Antes de adicionar uma lib de roteamento "de verdade" no futuro, reavaliar se ainda faz sentido dado o tamanho real do app.
- **`componente_tema` é um registro por variante, não por tema.** Qualquer variante (`stage`, `diagnostico`, etc.) pode aparecer em qualquer pregação — confirmado no conteúdo real (`stage`, documentado como do Estilo #1/#2, apareceu numa pregação do Igrejar). Um único componente por `variante` em `src/content/ComponenteTemaRenderer.tsx`, cores resolvidas via CSS custom properties do tema ativo. Variante desconhecida não quebra a renderização (retorna `null`, `console.warn` em dev).
- **Tema é escopado por componente (`ThemeScope`), não só por tela.** A casca do app (tab bar) usa Padrão MINC; cada card da Biblioteca aplica o tema da própria série; a tela de Leitura aplica o tema da pregação. CSS vars via `style` inline num wrapper — funciona porque custom properties cascateiam normalmente.
- **Busca da Biblioteca é client-side.** Dataset pequeno (dezenas de registros) — sem Postgres full-text search por enquanto. Reavaliar se o catálogo crescer para centenas de pregações.
- **Datas em português exigem conversão.** `metadados.data` no JSON vem como `"26 de julho de 2026"`; a coluna `pregacoes.data` é `date` nativo do Postgres, que não entende nome de mês em PT-BR. `src/content/parseData.ts` (`parseDataPtBr`/`formatDataPtBr`) é o conversor canônico — usar sempre que inserir conteúdo novo, nunca inserir a string crua na coluna `data`.

## Ambiente de build

- **JDK 21 é obrigatório para o build Android** (Capacitor 8 / AGP atual). Pinado localmente via `.sdkmanrc` neste diretório — não altera o JDK padrão da máquina. Se o build falhar com `invalid source release: 21`, rodar `sdk env` (sem pipe — pipe roda em subshell e não propaga `JAVA_HOME`) antes do `./gradlew`.
- **iOS só builda em macOS/Xcode.** A plataforma está escafoldada (`ios/`), mas nunca foi buildada de verdade neste ambiente (Linux). Testar em macOS antes de considerar a V1 pronta para a App Store.
- Build Android já validado de ponta a ponta em hardware físico (tablet Samsung via `adb`) — ver commit do scaffold inicial.

## Hurdles técnicos

> Registrar aqui conforme aparecem, com data e contexto suficiente para não repetir o mesmo erro. Não duplicar em `docs/progresso.md` (que é só checklist) nem nos markdowns de conteúdo.

- **2026-07-29** — Build Android falhava com `invalid source release: 21` mesmo após instalar JDK 21 e exportar `JAVA_HOME` corretamente. Causa: `sdk env | tail -1` — o pipe roda `sdk env` em subshell, então a variável exportada não chegava ao shell pai. Corrigido rodando `sdk env` sem pipe antes do comando de build.
- **2026-07-29** — Testes Vitest com múltiplos `it()` no mesmo arquivo falhavam com "multiple elements found" a partir do segundo teste. Causa: sem `test.globals` habilitado no `vite.config.ts`, o auto-cleanup do Testing Library (que depende de detectar `afterEach` global) não roda — o DOM de um teste vaza para o próximo. Corrigido chamando `cleanup()` explicitamente num `afterEach` em `src/test/setup.ts`.
- **2026-07-29** — jsdom não implementa `IntersectionObserver` nem `Element.prototype.scrollIntoView` — qualquer componente que os use (ex: `useIndiceFab`) quebra em teste sem um stub. Stubs inofensivos adicionados em `src/test/setup.ts`; testes que precisam simular comportamento real (ex: clique chamando `scrollIntoView`) usam `vi.spyOn`/`vi.stubGlobal` por cima desse stub.
- **2026-07-29** — FAB do índice nunca aparecia, só descoberto testando no tablet físico (os testes automatizados não pegaram — ver abaixo). Dois bugs empilhados:
  1. `useIndiceFab` usava `useRef` + `useEffect(() => ..., [])`. A tela de Leitura renderiza um estado de "carregando" antes do índice existir; o efeito rodava uma vez com `ref.current === null` e nunca mais, então o observer nunca era anexado ao elemento real. Corrigido com **callback ref** (reanexa sempre que o nó monta/desmonta).
  2. Mesmo com o observer anexado, o `rootMargin: '0px 0px -80% 0px'` (variante do padrão "sticky header": só considera "interseção" o top 20% da viewport) presumia que o elemento observado já nasce colado no topo. Nosso índice vem depois do header/banner, então ele nunca cai dentro desse top-20% mesmo recém-carregado — `isIntersecting` já nascia `false`, então o FAB aparecia (ou não) de forma dissociada do scroll real. Trocado para `threshold: 0` sem `rootMargin`: `isIntersecting` reflete literalmente "alguma parte do índice está visível", que é a semântica certa quando o elemento observado não é um header fixo.
  - **Por que os testes não pegaram:** o teste original só verificava clique no índice → `scrollIntoView`, nunca a visibilidade do FAB em si. Um teste com `IntersectionObserver` fake capturando o elemento observado (não só mockado para não quebrar) pegou o bug nº 1 de primeira. O bug nº 2 só apareceu ao testar no dispositivo real — vale desconfiar de qualquer lógica de scroll/observer "passou no teste" sem também rodar no `npm run dev` ou num device de verdade.
- **2026-07-29** — `banner_intro` da primeira pregação de calibração (*A Graça Não É o Que Você Pensa*) renderizava mais pobre que o HTML de referência original: faltava o parágrafo de recapitulação da série e a ficha "Antídoto" (`label_box`) do header. Duas causas empilhadas, não uma: (1) o JSON de conteúdo nunca teve os campos `banner_intro.contextualizacao`/`banner_intro.componente_tema` — o schema em `docs/geracao-pregacao.md` foi estendido para cobri-los; (2) o renderizador de `label_box` **também não existia no código** (caía no fallback silencioso de variante desconhecida) — implementado em `ComponenteTemaRenderer.tsx` junto com a correção do dado. Lição dupla: ao extrair JSON de um HTML de referência já existente, conferir se o header tem elementos além da frase-síntese antes de considerar completo (ver nota em `geracao-pregacao.md`); e não presumir que "a tela renderizou incompleta" é sempre dado faltando — vale checar se o renderizador do componente citado de fato existe.
