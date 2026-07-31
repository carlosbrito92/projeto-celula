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
- `docs/spec-privacidade-sorteio.md` — fluxo de privacidade sequencial ("passar o celular") dos utilitários de sorteio (Fase 3)
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

## Decisões de arquitetura (Fase 3)

- **`quebra_gelos.tipo='utilitario'` são as 3 ferramentas da aba Utilitários, não uma categoria à parte.** A migração de Fase 1 já tinha 3 valores no CHECK (`instrucional`/`utilitario`/`instrucional_utilitario`), mas nenhum dos 9 itens reais do catálogo de quebra-gelos usa `utilitario` puro — esse valor só serve para as linhas-ferramenta de `/utilitarios`. Unifica os dois módulos numa única tabela, sem tabela nova nem migração.
- **Fluxo de privacidade sequencial compartilhado entre sorteio de atribuição e sorteio de papel** (`docs/spec-privacidade-sorteio.md`, `src/utilitarios/passagemSequencial/`). Os dois widgets diferem só em *o que* é sorteado; o mecanismo de "passar o celular" (setup → passagem revelar/confirmar/próximo por pessoa → gestão do líder com valores ocultos por padrão) é um hook único (`usePassagemSequencial`) consumido por ambos. Decisão de implementação: só o caminho de toque explícito ("Quer rever antes de passar?" → toque), sem timer automático — o spec permite ambos, mas o toque evita introduzir `setTimeout`/`vi.useFakeTimers` numa peça que já tem estado suficiente; timer automático fica como extensão isolada do hook se pedido depois. Natureza explicitamente temporária (V1 single-device, um celular circulando) — não generalizar para além disso quando a V2 (multiplayer via lobby) chegar.
- **`atribuir()` é o único primitivo de distribuição, vive em `src/utilitarios/shuffle.ts`** (não em `sorteioAtribuicao/`, apesar do nome parecido) — embaralha uma lista de valores e distribui 1:1 entre participantes. Sorteio de atribuição passa valores livres digitados pelo usuário; sorteio de papel especial passa "fichas" geradas por `sorteioPapel/papeis.ts` (`gerarFichas`, que expande cada papel configurado em N cópias do seu nome — ex: `{nome:"Cidadão",quantidade:3}` vira 3 fichas `"Cidadão"`). Ambos os widgets convergem no mesmo `atribuir()`; não há lógica de sorteio duplicada entre eles.
- **Sorteio de papel especial suporta múltiplos papéis simultâneos com quantidade explícita** (`docs/spec-privacidade-sorteio.md` § Extensão: papéis múltiplos) — não um único "papel_nome" livre como na primeira versão. Setup exige que a soma das quantidades bata exatamente com o total de participantes antes de liberar "Sortear" (`SetupParticipantes.podeIniciarExtra`); mismatch mostra aviso ("faltam N" / "excesso de N"), nunca sorteia parcialmente. Achado ao revisar o primeiro protótipo funcional — dinâmicas reais (ex: jogo do Detetive) precisam de papéis únicos (1 Detetive) e repetíveis (N Cidadãos) ao mesmo tempo.
- **Sem escrita no Supabase para resultados de utilitário.** 100% estado local client-side e efêmero — nenhuma tabela de sessão, nenhuma persistência. Consistente com a modularidade planejada para a V2 (Realtime substitui o estado local, não o reescreve).

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
- **2026-07-30** — Título "Quem É a Graça?" (Estilo #5b) renderizava ora em Anton uppercase (correto), ora em mixed-case numa fonte serifada de fallback, variando entre tablet e celular e até entre recargas da mesma tela. Causa: `font-weight: 600` estava hardcodado direto no CSS de todo título em `var(--font-display)` (6 locais: `.headerTitulo`/`.indiceTitulo`/`.secaoTitulo` em `Reading.module.css`, `.titulo` em `Library.module.css` e `SermonCard.module.css`, `.stageFrase` em `ComponenteTemaRenderer.module.css`), mas Anton só existe em peso 400 (a `googleFontsUrl` não injeta `wght@600`) — alguns WebView/Chrome fazem *fallback silencioso de font-family inteira* (não synthesize-bold) quando o peso pedido não está entre os carregados, em vez de simplesmente ignorar o peso. Corrigido tornando o peso um dado do tema: `Theme.pesoDisplay: number` (obrigatório, forçando checar cada tema novo contra os pesos reais da `googleFontsUrl`) → `--font-display-weight` via `ThemeScope` → os 6 CSS hardcodes viraram `font-weight: var(--font-display-weight)`. Teste de regressão em `src/themes/__tests__/registry.test.ts` (`pesosDisponiveis`) parseia a própria `googleFontsUrl` de cada tema e falha se `pesoDisplay` não estiver entre os pesos realmente carregados — pega esse bug em CI antes de chegar em device.
- **2026-07-30** — No mesmo diagnóstico acima, capturas de tela comparando tablet/celular/HTML original revelaram um segundo gap (não um bug, uma lacuna): `docs/estilos-pregacao.md` já documentava caixa alta para o Estilo #5b ("Anton — peso único extra-bold, uppercase") e maiúsculas+itálico peso 800 para títulos de seção do Estilo #4 ("Barlow Condensed 800"), mas nenhum dos dois nunca tinha sido implementado — só existia `text-transform: uppercase` em badges/labels, nunca nos títulos de fato. Adicionados `Theme.maiusculoDisplay?: boolean` (geral, true só no #5b) e `Theme.secaoTitulo?: { peso, maiusculo, italico }` (override específico de `.secaoTitulo`, usado só pelo #4 pra não vazar peso 800/itálico pros outros títulos de display da mesma série) → `--font-display-transform`/`--secao-titulo-weight`/`--secao-titulo-transform`/`--secao-titulo-style` em `ThemeScope`, com fallback em cascata via `var(x, var(y, default))` no CSS (`.secaoTitulo` herda o tratamento geral quando o tema não tem override específico). Lição: sempre que um bug de tipografia aparecer, vale reler a seção do tema em `estilos-pregacao.md` inteira, não só o ponto do bug — specs já escritas e nunca implementadas não aparecem em nenhum grep de "bug", só de comparação visual com a referência.
- **2026-07-30** — `usePassagemSequencial.iniciar()` (fluxo de privacidade sequencial, Fase 3) recebia a quantidade de participantes via `quantidade` já commitado no estado do hook, mas os widgets chamavam `passagem.setQuantidade(passagem.nomes.length)` e `passagem.iniciar(gerarValores)` **na mesma função/tick** — `setQuantidade` não reflete no `quantidade` lido pelo `iniciar` desta mesma chamada (closure obsoleta, state update assíncrono do React), então `resolverParticipantes` rodava com a quantidade antiga (0), gerando `participantes: []`. Sintoma: "Passe para" aparecia sem nome, mas o cabeçalho já mostrava a contagem certa ("1 de 2") — os dois sintomas juntos (`quantidade` certo, `participantes` vazio) são a assinatura desse tipo de bug. Corrigido fazendo `iniciar(quantidadeFinal, gerarValores)` receber a quantidade como argumento explícito em vez de ler do estado. Só apareceu testando no device físico — os testes do hook passavam porque usavam dois `act()` separados (`setNomes` num, `iniciar` noutro), o que sem querer *evita* a condição de corrida que o código real (mesmo handler síncrono) tem. Lição: ao escrever teste de hook com múltiplas chamadas de estado, replicar a ordem/agrupamento real de chamadas do componente consumidor, não só validar o resultado final.
- **2026-07-30** — Depois de corrigir o bug acima, `adb install -r` (upgrade install, sem uninstall) continuou servindo o bundle antigo — o mesmo sintoma do bug persistiu no device mesmo com o fix confirmado no JS compilado (`grep` no `dist/` mostrava o fix presente). Causa: o service worker do PWA (`vite-plugin-pwa`) já registrado da instalação anterior continua servindo os assets precacheados até um ciclo de ativação que nem sempre acontece de imediato — `adb install -r` preserva dados do app (incluindo o cache do service worker), diferente de uninstall+install. Corrigido com `adb uninstall` (limpa tudo) antes de reinstalar. Mesma causa-raiz do achado "Get started / Vite + React" aparecendo em vez do app real, de uma sessão anterior — vale sempre desconfiar de "corrigi o código mas o bug persiste idêntico no device" como sintoma de bundle desatualizado, não de fix incompleto.
