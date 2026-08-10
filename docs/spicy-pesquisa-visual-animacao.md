# Spicy — Pesquisa de referências visuais e animação

> Documento de trabalho, separado do `spicy-spec.md` enquanto a etapa de design/animação está em exploração. Quando fechado, as decisões finais voltam a ser incorporadas ao `spicy-spec.md` (que volta a ser a fonte principal) e este arquivo pode ser arquivado ou descartado.

Contexto: Sprint D (visual) do plano de sprints — depende do design das cartas (mock já aprovado, ver `Baralho_Spicy_dc.html`) e de uma decisão de abordagem técnica para posicionamento e animação (flip, shuffle, movimento de carta entre áreas).

---

## 1. Design de carta — status

**Mock aprovado por Carlos**: `Baralho_Spicy_dc.html`. Sistema minimalista já validado — círculo (Vermelho), losango (Azul), triângulo (Verde), cada cor com uma única forma geométrica de traço fino no fundo, número grande centralizado + repetido nos 4 cantos (par de número, par de forma). Cartas especiais (Troféu, World's End, verso) já desenhadas na mesma linguagem. O mock já inclui o JSON de tradução para o schema `shapes[]`/`texts[]` do `spicy-spec.md` §6.1 — praticamente pronto para virar dado real, não precisa de reinterpretação.

Paleta de referência do mock:

| Elemento | Cores |
|---|---|
| Vermelho | `#D92B1F` / `#FFFFFF` / `#E6E2DA` |
| Azul | `#0B63C5` / `#FFFFFF` / `#E6E2DA` |
| Verde | `#0E8A4F` / `#FFFFFF` / `#E6E2DA` |
| Troféu | `#C7A15A` / `#1C1B19` |
| Fim do Mundo | `#E8E4DC` / `#1F3A3D` |
| Verso | `#C7A15A` / `#0D0C0B` |
| Tipografia | Archivo 800, centro 104px, canto 22px |

**Pendente**: Wild de cor e Wild de número (§3.2 do spec) — não vistas no mock enviado até agora, precisam de tratamento visual próprio na mesma linguagem.

---

## 2. Abordagem de animação — alternativas levantadas

Escopo ainda em aberto (Carlos: "ainda não sei", quer ver referências antes de decidir). Três necessidades distintas identificadas:

1. **Flip** (revelar carta) — transição local, um único elemento.
2. **Movimento entre áreas** (mão → pilha → vencedor) — elemento muda de contêiner/pai.
3. **Shuffle** (embaralhar visualmente) — coreografia com várias cartas, delays escalonados.

### 2.1 CSS puro (abordagem original do mock de código)

- Resolve **flip** sozinho, sem dependência: `perspective` + `backfaceVisibility` + `rotateY`, exatamente como o exemplo de código que Carlos já tinha trazido no início do projeto.
- Não resolve bem **movimento entre áreas** (exigiria calcular coordenadas de origem/destino manualmente a cada mudança de layout) nem **shuffle com múltiplos delays precisos** — juntamente ressaltado pelo artigo do Juha Lindstedt (ver §2.4): CSS animations com múltiplos delays muito próximos tendem a ficar com tempo de início impreciso/arredondado.

### 2.2 Framer Motion (`motion`, pacote React)

- **Flip**: mesma técnica CSS 3D, mas como `motion.div` — nenhuma vantagem real sobre CSS puro aqui, só consistência de stack se o resto usar a lib.
- **Movimento entre áreas**: ponto forte real. Via prop `layoutId`, dois elementos em componentes-pai diferentes que compartilham o mesmo `layoutId` são automaticamente interpolados pela lib quando um substitui o outro no DOM (técnica FLIP — First-Last-Invert-Play). Confirmado com exemplo real de card game (`aod/zhithead`, projeto no GitHub): jogar uma carta a remove do componente `Hand` e a renderiza no componente `Pile`; o `layoutId` compartilhado faz a lib animar a transição sozinha.
- **Shuffle**: sem suporte dedicado — precisaria ser construído manualmente com `motion.div` + delays escalonados, replicando a técnica do artigo do Juha (§2.4) na sintaxe do Framer Motion.
- Já é uma lib React-first, API declarativa, boa integração com componentes controlados por estado (o que bate com o padrão do resto do Projeto Célula).

### 2.3 GSAP (GreenSock Animation Platform)

- Referência de uso real: **`oskarrough/slaytheweb`** (recriação de Slay the Spire para web, JS puro + engine própria) — as animações do jogo vivem em `animations.js`, majoritariamente construídas com GSAP.
- GSAP também tem sua própria implementação de FLIP (via plugin), cobrindo o mesmo caso de "elemento muda de posição/contêiner" que o `layoutId` do Framer Motion resolve — ou seja, cobre **movimento entre áreas** também.
- Ponto forte histórico do GSAP: timelines coreografadas com controle preciso de sequência/delay entre múltiplos elementos — a categoria de animação mais relevante para **shuffle** (várias cartas, cada uma com pequeno delay, movimento coordenado).
- Não é React-first (nasceu vanilla JS) — funciona bem com React mas exige integração manual via `useRef`/`useEffect` em vez de props declarativas como o Framer Motion.
- Ativamente mantido, extensamente documentado, com plugins prontos (FLIP, Draggable, easing avançado) — ausência de sinais de abandono, diferente do risco levantado para `anime.js` (lib concorrente sem atualização há vários anos, segundo fonte consultada).

### 2.4 Técnica de shuffle do artigo "JavaScript Playing Cards Part 3: Animations" (Juha Lindstedt)

Não é uma lib — é um **algoritmo documentado**, aplicável em qualquer stack de animação (CSS, Framer Motion, GSAP):

- Problema evitado: espalhar cartas aleatoriamente faz elas "atravessarem" umas às outras visualmente, o que não parece um shuffle real.
- Técnica: percorre o baralho card a card, sorteando cada uma para uma pilha "esquerda" ou "direita" (metade do baralho em cada), anima cada carta indo para sua pilha designada. Depois, para reconstituir o baralho embaralhado, intercala de volta card a card sorteando de qual pilha (esquerda/direita) puxar a próxima — imitando fisicamente como um riffle shuffle funciona.
- Motivo dado pelo autor para não usar animação CSS pura em várias cartas com pequenos delays entre si: o tempo de início de cada animação fica impreciso/arredondado em CSS, part quebrando o efeito quando o timing precisa ser muito próximo entre elementos.
- **Reaproveitável**: o algoritmo (separar em 2 pilhas, intercalar de volta) pode ser reimplementado com Framer Motion ou GSAP, sem depender do código original (que é vanilla JS com um helper próprio, `animationFrames`, não publicado como parte de nenhuma lib madura).

### 2.5 Bibliotecas prontas descartadas

- **`deck-of-cards/deck-of-cards`** (repo do mesmo Juha Lindstedt): API de alto nível pronta (`deck.flip()`, `.shuffle()`, `.fan()`, `.sort()`, drag), mas (a) vanilla JS, exigiria camada de adaptação para React/estado do Playroom; (b) o próprio repo está rotulado "(old version)" — a versão nova (multiplayer, a que roda `deck.of.cards`) nunca foi publicada como código aberto apesar do artigo prometer; (c) gráficos de carta fixos (baralho francês tradicional), não aproveitáveis para o sistema de cores/formas já definido no mock aprovado — só o motor de animação seria reaproveitável, não o visual.
- **`react-poker-example`** (joseteodoro): avaliado por Carlos como "decente mas não chega perto" das outras opções — escopo estreito (mesa de poker), sem o nível de polimento das referências acima.
- **`react-poker`** (therewillbecode) e **`react-poker-code`**: libs específicas de poker (mão + board comunitário), usam `react-motion` (lib descontinuada) por baixo — escopo e stack não compatíveis.
- **`react-card-flip`** / **`ReactCardFlip`**: resolvem só flip, com a mesma técnica CSS 3D que já se tem sem dependência nenhuma — não agregam sobre a abordagem já esboçada no mock de código original.
- **`react-flip-toolkit`**: técnica FLIP genérica para reordenar listas (bom para staggered effects em UI geral), não pensada especificamente para jogo de cartas — poderia servir de base para shuffle, mas sem vantagem clara sobre Framer Motion (que já cobre FLIP) ou GSAP.

---

## 3. Comparativo direto

| Necessidade | CSS puro | Framer Motion | GSAP |
|---|---|---|---|
| Flip | ✅ suficiente sozinho | ✅ mesma técnica, via `motion.div` | ✅ mesma técnica, via GSAP |
| Movimento entre áreas | ⚠️ manual, sem ajuda da ferramenta | ✅ `layoutId` (FLIP automático) | ✅ plugin FLIP próprio |
| Shuffle (coreografia multi-elemento) | ⚠️ timing impreciso com delays próximos | ⚠️ sem suporte dedicado, construir manualmente | ✅ ponto forte histórico (timelines) |
| Integração com React | nativa (é CSS) | nativa (lib React-first) | manual (`useRef`/`useEffect`) |
| Precedente real em jogo de cartas | mock de código original de Carlos | `aod/zhithead` (projeto real, card game) | `oskarrough/slaytheweb` (Slay the Spire para web) |
| Manutenção ativa | N/A | sim | sim (vs. `anime.js`, alternativa mais leve mas parada) |

---

## 4. Status

**Decidido (2026-08-10)**: **Framer Motion** (flip via `motion.div` + `rotateY`, movimento entre áreas via `layoutId`) **+ técnica de shuffle do artigo de Juha Lindstedt** (§2.4), reimplementada na sintaxe do Framer Motion em vez do `AnimationFrames` caseiro do original.

**`oskarrough/slaytheweb` (GSAP) fica como referência para consulta futura** — não descartado, mas não escolhido como abordagem técnica agora. Guardar o link caso surja necessidade de coreografia mais complexa que o Framer Motion não cubra bem (ex: efeitos de timeline mais elaborados), ou como fonte de inspiração de UX/timing de animação de jogo de cartas mesmo sem reaproveitar a lib.

Esta decisão está pronta para ser incorporada à Sprint D do `spicy-spec.md` §7 — a partir daí, `spicy-spec.md` volta a ser a fonte principal e este documento pode ser arquivado.
