# Spicy — Terceiro jogo V2 (Projeto Célula)

> Documento de especificação de produto e arquitetura, no mesmo padrão dos markdowns do Projeto Célula (`projeto-celula.md`, `estilos-pregacao.md`, `geracao-pregacao.md`). Complementar ao `CLAUDE.md` do repositório, que registra o detalhe técnico de implementação conforme o código avança.

Fonte oficial das regras: [UltraBoardGames — Spicy Game Rules](https://www.ultraboardgames.com/spicy/game-rules.php). Adaptado para versão digital multiplayer com twist de cores (Vermelho/Azul/Verde no lugar das especiarias físicas).

---

## 1. Viabilidade dentro do Projeto Célula

**Confirmada, sem conflito de stack.** Spicy usa a mesma infraestrutura já validada nos outros dois jogos V2:

- **Lobby + sincronização**: Playroom Kit, mesmo mecanismo do Quem Sou Eu e Artista Impostor — `insertCoin` com `skipLobby: true`, QR code fixo como porta de entrada da sessão, `onPlayerJoin` para atribuir cada participante que escaneia.
- **Frontend**: React + Capacitor, mesma base do restante do app — nenhuma peça nova de stack.
- **Repositório**: mantido dentro do Projeto Célula como terceiro jogo V2, não como projeto separado. O critério de modularidade já em uso (roteamento por feature — cada jogo na própria rota/módulo) cobre o caso mesmo sendo o jogo mais complexo até agora. Separar em repo próprio duplicaria Playroom Kit + Capacitor + design tokens sem ganho real.
- **Engine**: descartada a hipótese de Godot. Todo o estado do jogo é discreto (mão, pilha, declaração, turno) — não há necessidade de física ou engine de jogo. React + SVG (conforme mock já esboçado) resolve a parte visual sem abrir mão da infraestrutura de sync já pronta.

## 2. Limitação de sigilo — decisão aceita

Playroom Kit não tem estado privado de verdade: `player.setState`/`getState` só define **quem escreve** um valor, não **quem pode ler**. Toda sincronização roda via WebRTC peer-to-peer entre browsers, sem servidor autoritativo retendo segredo. Isso significa que, tecnicamente, qualquer participante pode abrir o DevTools e inspecionar a mão dos outros jogadores ou a carta real da pilha antes da hora.

**Decisão fechada**: manter Playroom Kit, aceitar esse sigilo por convenção/confiança — mesmo padrão social já aplicado no Quem Sou Eu (onde a "testa" também não é sigilo técnico real). Não introduzir servidor autoritativo (Colyseus ou similar) só para este jogo.

**Mitigação recomendada**: nomear as chaves de estado sensíveis (mão de cada jogador, carta real sob a declaração) de forma não descritiva (ex: `s_7f2a` em vez de `maoJogador` ou `cartaReal`), para elevar a barreira de "tropeçar sem querer" para "abrir o console deliberadamente para trapacear" — reforço social, não técnico.

---

## 3. Componentes do baralho

| Componente | Quantidade | Cor física original |
|---|---|---|
| Cartas Spicy (numeradas) | 100 | Preta |
| Cartas Troféu | 3 | Branca |
| Carta Fim do Mundo (World's End) | 1 | Azul-petróleo |
| Cartas "Spice It Up!" (variantes) | 6 | Vermelha |
| **Wild de cor** | 3 | — (adicional, fora das 100) |
| **Wild de número** | 3 | — (adicional, fora das 100) |

**Twist de tradução**: as 3 especiarias físicas do jogo original (ex: chili) são substituídas por 3 cores — **Vermelho, Azul, Verde** — como o "naipe"/traço que pode ser declarado e desafiado.

### 3.1 Distribuição das 100 cartas numeradas

Proporcional entre as 3 cores, com maior repetição nos números baixos (mais jogáveis, conforme a lógica de "declarar 1-3 no início de pilha" e "reset após 10"). Distribuição de referência (a ajustar em playtesting):

| Número | Cópias por cor | Total (×3 cores) |
|---|---|---|
| 1 | 5 | 15 |
| 2 | 5 | 15 |
| 3 | 4 | 12 |
| 4 | 4 | 12 |
| 5 | 3 | 9 |
| 6 | 3 | 9 |
| 7 | 3 | 9 |
| 8 | 2 | 6 |
| 9 | 2 | 6 |
| 10 | 2 | 6 |
| **Total** | **33** | **99** |

**Decidido**: a 100ª carta (99→100) vira uma **4ª Wild de cor** — não uma numerada extra. Total de Wilds de cor sobe para 4; Wild de número permanece em 3 (7 wilds no total, assimetria intencional).

### 3.2 Wilds

- **Wild de cor** (4 cópias — 3 originais + 1 vinda do ajuste 99→100, ver §3.1): quando revelada, "cobre" qualquer número declarado — sempre errada se o desafio for sobre a cor.
- **Wild de número** (3 cópias): quando revelada, "cobre" qualquer cor declarada — sempre errada se o desafio for sobre o número.
- Jogadas **viradas para baixo como declaração normal** (o jogador já sabe que está jogando uma Wild desde o início do turno — não há troca reativa no momento do desafio). Na revelação, o "dúvida da cor ou do número?" formaliza qual traço está sendo contestado — equivalente ao "not chili" da regra oficial, adaptado ao fato de haver dois tipos de Wild em vez de um genérico.

---

## 4. Adaptação das regras ao digital

Regras oficiais completas (fonte: UltraBoardGames, transcrito na íntegra) confirmaram e corrigiram alguns pontos do rascunho inicial — em particular, a mão inicial já estava certa em 6 cartas, e a lógica de "declaração ilegal" é auto-policiada pelo próprio jogador, não arbitrada por desafio.

| Regra física | Adaptação digital |
|---|---|
| Embaralhar e distribuir 6 cartas por jogador | Host embaralha o baralho (estado sincronizado) e distribui 6 cartas por jogador ao `onPlayerJoin`/início de partida |
| World's End inserida "à altura determinada pelo número de jogadores" | Posição calculada programaticamente na pilha de compra conforme contagem de jogadores na sala |
| Cartas viradas para baixo, ninguém pode olhar | Estado sensível existe no Playroom mas não é exibido na UI; sigilo por convenção (§2) |
| Declaração ilegal (número/cor fora de sequência): jogador "must take back your card and pass" | **Decidido**: sem bloqueio ativo no client — o app aceita qualquer declaração, fiel ao físico (não há árbitro). Mas com uma **configuração opcional de partida**: aviso não-bloqueante na UI quando a declaração quebra a sequência (ajuda iniciantes sem sequência conhecida entre os jogadores; toggle ligado/desligado no setup, ao lado da escolha de variante) |
| "Colocar a pata" para desafiar, citando um traço específico (número OU cor) | Botão de desafio na UI com seleção do traço contestado, disponível a qualquer jogador enquanto houver carta no topo da pilha |
| Revelação da carta desafiada — só o traço citado importa | Estado revelado simultaneamente para todos os clients; resolução compara apenas o traço citado (exceto Copy Cat, ver §6 abaixo — modo "ambos os traços") |
| Vencedor coleta a pilha como pontos / perdedor compra 2 cartas e inicia pilha nova | Atualização automática de mão e pontuação via estado sincronizado |
| Anunciar última carta da mão; se esquecer, deve recolher e passar | UI força/lembra declaração explícita de "última carta" antes de confirmar a jogada quando a mão do jogador tem 1 carta |
| Troféu: ganho se não desafiado, ou se desafiado e vencer. 2º troféu **do mesmo jogador** encerra o jogo; senão, compra 6 cartas | Condição de fim verificada a cada resolução de desafio/troféu; tela de resultado com pontuação final |
| Fim de jogo: 2º troféu do mesmo jogador, monte de compra esgotado, ou World's End revelada (não comprar a carta) | Verificação a cada compra/desafio; World's End nunca é adicionada à mão de ninguém |
| Pontuação: 2 troféus (mesmo jogador) = vitória automática; senão, 1 ponto/carta vencida + 10 pontos/troféu − 1 ponto/carta na mão | Cálculo automático ao fim de partida |
| Variantes "Spice It Up!" | **Decidido**: apenas 1 variante ativa por partida (não 2, apesar da regra oficial permitir para "advanced players") — simplifica o motor no primeiro momento; selecionável no setup antes do `insertCoin` |

> **Correção (Carlos, 2026-08-13)**: o pote tem só 3 troféus físicos, mas esgotar o pote **não** encerra o jogo sozinho — se 3 jogadores diferentes pegam 1 troféu cada (comum com 4+ jogadores), a partida continua (sem mais troféu pra distribuir, mas jogador que zera a mão ainda puxa 6 cartas normalmente) até o **monte de compra esgotar**. Só o 2º troféu do **mesmo** jogador encerra na hora (vitória automática). Bug real corrigido em `fimDePartida.ts`/`turno.ts` (`verificarFimDePartida` tratava pote vazio como fim de jogo) — versão anterior deste documento e o motor antes da correção estavam errados nesse ponto específico. Pontos de desafio = tamanho da pilha de rodada no momento do desafio, **incluindo a carta do próprio declarante desafiado** (ex: 5 declarações antes + a 6ª do blefado = 6 pontos pro desafiante que vence) — já implementado corretamente (`pilhaSpicy.length` conta a jogada mais recente antes de zerar).

---

## 5. Variantes "Spice It Up!" — detalhamento de estado/transição

Cada variante altera pontualmente o fluxo padrão de turno (`declarar → passar/desafiar`). Apenas 1 ativa por partida (§4).

| Variante | Gatilho | Efeito no estado |
|---|---|---|
| **We Love Chili!** (→ "Vermelho!") | Declaração legal de 1, 2 ou 3, em qualquer cor | Pode declarar "Vermelho" mesmo fora da cor esperada da pilha — a partir daí, a cor-alvo da pilha passa a ser Vermelho |
| **Start It Up!** | Depois de um 8, 9 ou 10 na pilha | Também é permitido declarar 1, 2 ou 3 (além de seguir a sequência normal); a cor não muda |
| **Spice Raider** (valor 4) | Jogador declara um 4 | Marca a pilha como reivindicada (`paw_holder = jogador`); assim que a **próxima carta for jogada de fato** (passe não conta — decidido) por qualquer jogador, o Raider vence automaticamente toda a pilha sob sua marca; pilha nova recomeça só com a carta recém-jogada |
| **Change Your Luck** (valor 5) | Jogador declara um 5 | Pode enfiar até 2 cartas extras da mão embaixo do 5 na pilha, comprando a mesma quantidade do monte; essas cartas extras são imunes a desafio (não fazem parte do que é revelado/verificado) |
| **Turn It Up!** (6 ↔ 9) | Sempre ativo enquanto a variante está ligada | 6 e 9 são declaráveis um pelo outro; ao desafiar uma declaração de "9", tanto um 6 quanto um 9 revelados vencem o desafio |
| **Copy Cat** | Depois de qualquer jogador jogar uma carta (a sua, não a de quem copiou antes) | Outro jogador pode declarar exatamente o mesmo número+cor, "roubando" a vez; turno segue para a esquerda de quem copiou; cópia de uma cópia é permitida; não pode copiar a própria jogada |

### Desafio especial do Copy Cat

Diferente do desafio normal (que verifica **um só** traço, o citado pelo desafiante), desafiar um Copy Cat usa **modo de verificação diferente**: o desafiante só diz "Errado!" sem escolher traço, e **os dois traços (número E cor) precisam estar corretos** para quem copiou vencer. Não afeta cópias anteriores na cadeia nem a carta original copiada.

**Implicação de arquitetura**: o motor de resolução de desafio (Sprint A) precisa nascer com um parâmetro de modo (`traço único` vs `ambos os traços`) desde o início, mesmo em partidas sem nenhuma variante ativa — porque Copy Cat liga esse modo dinamicamente por jogada específica, não por partida inteira.

---

## 6. Estrutura de dados (rascunho)

### 6.1 Carta — JSON declarativo

ViewBox de referência: **200×300**, raio de canto 16. Exemplo real (não placeholder — vem do mock aprovado `docs/Baralho Spicy.dc.html`, seção "Tradução para o schema"):

```json
{
  "id": "red_7_a",
  "kind": "numbered",
  "color": "red",
  "value": 7,
  "background": "#FFFFFF",
  "border": "#E6E2DA",
  "shapes": [
    { "type": "circle", "cx": 100, "cy": 150, "r": 77,
      "fill": "none", "stroke": "#D92B1F",
      "strokeOpacity": 0.32, "strokeWidth": 1.5 },
    { "type": "circle", "cx": 176, "cy": 24, "r": 6,
      "fill": "none", "stroke": "#D92B1F", "strokeWidth": 2 },
    { "type": "circle", "cx": 24, "cy": 276, "r": 6,
      "fill": "none", "stroke": "#D92B1F", "strokeWidth": 2 }
  ],
  "texts": [
    { "content": "7", "x": 100, "y": 150, "fontSize": 104,
      "fill": "#D92B1F", "fontWeight": 800,
      "anchor": "middle", "baseline": "central" },
    { "content": "7", "x": 15, "y": 35, "fontSize": 22,
      "fill": "#D92B1F", "fontWeight": 700 },
    { "content": "7", "x": 185, "y": 265, "fontSize": 22,
      "fill": "#D92B1F", "fontWeight": 700,
      "anchor": "end", "rotate": 180 }
  ]
}
```

- `kind`: `"numbered" | "wild_color" | "wild_number" | "trophy" | "worlds_end" | "spice_it_up" | "back"` — `"back"` é o verso universal do baralho (§6.1.1), não uma carta da distribuição.
- Convenção de forma por família (mock §"Tradução para o schema"): círculo → `type: "circle"` (`cx`/`cy`/`r`, centro); losango → `type: "rect"` (`cx`/`cy`/`width`/`height`/`rotate: 45`, também centrado); triângulo → `type: "polygon"` (`points`: array de `[x, y]`, 3 pontos). Traço radial (mostrador do Wild de número) → `type: "line"` (`x1`/`y1`/`x2`/`y2`).
- Campos novos em relação ao rascunho original, necessários pra traduzir as cartas especiais (§6.1.1) fielmente: `fontFamily` em `texts[]` (`"mono"` para os rótulos de canto tipo "COR"/"Nº"/"TROFÉU"/"FIM", que usam JetBrains Mono no mock — diferente da família de exibição usada no número central) e `fillOpacity` em `texts[]` (usado só em `worlds_end`, rótulo "FIM" a 80% de opacidade).
- Wilds e especiais seguem o mesmo formato de `shapes`/`texts`, sem `value`/`color` fixos (ou com valor simbólico, a definir na implementação).
- Renderização via React + SVG, iterando sobre `shapes`/`texts` — conforme mock já validado por Carlos. Flip de carta via CSS 3D (`perspective`, `backfaceVisibility`, `rotateY`), mesmo padrão.

#### 6.1.1 Cartas especiais — tradução do mock

Traduzidas de `docs/Baralho Spicy.dc.html` § "Cartas especiais" (achado de Carlos, 2026-08-10: já estavam desenhadas ali, não uma lacuna de design real). Mesma gramática das numeradas — mas só Troféu/Fim do Mundo/Verso de fato invertem pra fundo escuro; Wild de cor e Wild de número mantêm o fundo branco das numeradas (a legenda do mock diz "fundo invertido ou neutro" — na prática só 3 das 5 invertem).

**Wild de cor** (`wild_color`, ×4 — 3 originais + a 4ª de §3.1) — fundo branco, as 3 formas da família juntas no centro (translúcidas), corner mark é um mini-conjunto das 3 formas (sólidas) + rótulo "COR":

```json
{
  "id": "wild_color_a",
  "kind": "wild_color",
  "background": "#FFFFFF",
  "border": "#E6E2DA",
  "shapes": [
    { "type": "circle", "cx": 100, "cy": 114, "r": 39,
      "fill": "#D92B1F", "fillOpacity": 0.10, "stroke": "#D92B1F", "strokeOpacity": 0.55, "strokeWidth": 1.5 },
    { "type": "rect", "cx": 64, "cy": 183, "width": 56, "height": 56, "rotate": 45,
      "fill": "#0B63C5", "fillOpacity": 0.10, "stroke": "#0B63C5", "strokeOpacity": 0.55, "strokeWidth": 1.5 },
    { "type": "polygon", "points": [[133, 153], [170, 217], [96, 217]],
      "fill": "#0E8A4F", "fillOpacity": 0.10, "stroke": "#0E8A4F", "strokeOpacity": 0.55, "strokeWidth": 1.5 },
    { "type": "circle", "cx": 19, "cy": 17, "r": 4, "fill": "#D92B1F" },
    { "type": "rect", "cx": 32, "cy": 17, "width": 8, "height": 8, "rotate": 45, "fill": "#0B63C5" },
    { "type": "polygon", "points": [[45, 13], [50, 21], [40, 21]], "fill": "#0E8A4F" },
    { "type": "circle", "cx": 154, "cy": 283, "r": 4, "fill": "#D92B1F" },
    { "type": "rect", "cx": 167, "cy": 283, "width": 8, "height": 8, "rotate": 45, "fill": "#0B63C5" },
    { "type": "polygon", "points": [[180, 278], [185, 286], [175, 286]], "fill": "#0E8A4F" }
  ],
  "texts": [
    { "content": "COR", "x": 184, "y": 22, "fontSize": 11, "fontWeight": 500, "fill": "#8A857C", "fontFamily": "mono", "anchor": "end" },
    { "content": "COR", "x": 16, "y": 278, "fontSize": 11, "fontWeight": 500, "fill": "#8A857C", "fontFamily": "mono", "rotate": 180 }
  ]
}
```

**Wild de número** (`wild_number`, ×3) — fundo branco, mostrador circular com 10 traços radiais, "1–10" central, cantos com `*` + rótulo "Nº":

```json
{
  "id": "wild_number_a",
  "kind": "wild_number",
  "background": "#FFFFFF",
  "border": "#E6E2DA",
  "shapes": [
    { "type": "circle", "cx": 100, "cy": 150, "r": 77, "fill": "none", "stroke": "#1C1B19", "strokeOpacity": 0.22, "strokeWidth": 1.5 },
    { "type": "line", "x1": 100.0, "y1": 73.0, "x2": 100.0, "y2": 86.0, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 145.3, "y1": 88.7, "x2": 137.6, "y2": 98.2, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 173.2, "y1": 126.2, "x2": 160.9, "y2": 130.2, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 173.2, "y1": 173.8, "x2": 160.9, "y2": 169.8, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 145.3, "y1": 211.3, "x2": 137.6, "y2": 201.8, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 100.0, "y1": 227.0, "x2": 100.0, "y2": 214.0, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 54.7, "y1": 211.3, "x2": 62.4, "y2": 201.8, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 26.8, "y1": 173.8, "x2": 39.1, "y2": 169.8, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 26.8, "y1": 126.2, "x2": 39.1, "y2": 130.2, "stroke": "#1C1B19", "strokeWidth": 2 },
    { "type": "line", "x1": 54.7, "y1": 88.7, "x2": 62.4, "y2": 98.2, "stroke": "#1C1B19", "strokeWidth": 2 }
  ],
  "texts": [
    { "content": "1–10", "x": 100, "y": 150, "fontSize": 52, "fill": "#1C1B19", "fontWeight": 800, "anchor": "middle", "baseline": "central" },
    { "content": "*", "x": 15, "y": 35, "fontSize": 20, "fill": "#1C1B19", "fontWeight": 700 },
    { "content": "*", "x": 185, "y": 265, "fontSize": 20, "fill": "#1C1B19", "fontWeight": 700, "anchor": "end", "rotate": 180 },
    { "content": "Nº", "x": 184, "y": 22, "fontSize": 11, "fontWeight": 500, "fill": "#8A857C", "fontFamily": "mono", "anchor": "end" },
    { "content": "Nº", "x": 16, "y": 278, "fontSize": 11, "fontWeight": 500, "fill": "#8A857C", "fontFamily": "mono", "rotate": 180 }
  ]
}
```

**Troféu** (`trophy`, ×3) — fundo escuro (mesmo tom das numeradas em negativo), taça dourada sobre um pedestal, cantos com mini-taça + rótulo "TROFÉU":

```json
{
  "id": "trophy_a",
  "kind": "trophy",
  "background": "#1C1B19",
  "border": "#1C1B19",
  "shapes": [
    { "type": "circle", "cx": 100, "cy": 150, "r": 75, "fill": "none", "stroke": "#C7A15A", "strokeOpacity": 0.55, "strokeWidth": 1.5 },
    { "type": "polygon", "points": [[100, 103], [148, 187], [52, 187]], "fill": "#C7A15A" },
    { "type": "rect", "cx": 100, "cy": 202, "width": 56, "height": 5, "rx": 3, "fill": "#C7A15A" },
    { "type": "polygon", "points": [[23, 15], [30, 27], [16, 27]], "fill": "#C7A15A" },
    { "type": "polygon", "points": [[177, 273], [184, 285], [170, 285]], "fill": "#C7A15A" }
  ],
  "texts": [
    { "content": "TROFÉU", "x": 184, "y": 22, "fontSize": 11, "fontWeight": 500, "fill": "#C7A15A", "fontFamily": "mono", "anchor": "end" },
    { "content": "TROFÉU", "x": 16, "y": 278, "fontSize": 11, "fontWeight": 500, "fill": "#C7A15A", "fontFamily": "mono", "rotate": 180 }
  ]
}
```

**Fim do Mundo** (`worlds_end`, ×1) — fundo verde escuro (tom exclusivo dessa carta, único diferente do preto das outras 3 invertidas), quadrado dentro de quadrado cortado por uma linha, cantos com quadrado sólido + rótulo "FIM":

```json
{
  "id": "worlds_end",
  "kind": "worlds_end",
  "background": "#1F3A3D",
  "border": "#1F3A3D",
  "shapes": [
    { "type": "rect", "x": 0, "y": 147, "width": 200, "height": 6, "fill": "#E8E4DC" },
    { "type": "rect", "cx": 100, "cy": 150, "width": 132, "height": 132, "rx": 4, "fill": "none", "stroke": "#E8E4DC", "strokeOpacity": 0.45, "strokeWidth": 1.5 },
    { "type": "rect", "cx": 100, "cy": 150, "width": 52, "height": 52, "rx": 2, "fill": "#1F3A3D", "stroke": "#E8E4DC", "strokeOpacity": 0.45, "strokeWidth": 1.5 },
    { "type": "rect", "x": 16, "y": 15, "width": 12, "height": 12, "fill": "#E8E4DC" },
    { "type": "rect", "x": 172, "y": 273, "width": 12, "height": 12, "fill": "#E8E4DC" }
  ],
  "texts": [
    { "content": "FIM", "x": 184, "y": 22, "fontSize": 11, "fontWeight": 500, "fill": "#E8E4DC", "fillOpacity": 0.8, "fontFamily": "mono", "anchor": "end" },
    { "content": "FIM", "x": 16, "y": 278, "fontSize": 11, "fontWeight": 500, "fill": "#E8E4DC", "fillOpacity": 0.8, "fontFamily": "mono", "rotate": 180 }
  ]
}
```

**Verso** (`back`, universal — não faz parte da distribuição, §3, é a face exibida sempre que uma carta não deve ser revelada) — fundo preto puro, círculos concêntricos dourados com as 3 formas da família centralizadas, "SPICY" embaixo:

```json
{
  "id": "back",
  "kind": "back",
  "background": "#0D0C0B",
  "border": "#0D0C0B",
  "shapes": [
    { "type": "circle", "cx": 100, "cy": 150, "r": 75, "fill": "none", "stroke": "#C7A15A", "strokeOpacity": 0.35, "strokeWidth": 1.5 },
    { "type": "circle", "cx": 100, "cy": 150, "r": 59, "fill": "none", "stroke": "#C7A15A", "strokeOpacity": 0.55, "strokeWidth": 1.5 },
    { "type": "circle", "cx": 71, "cy": 150, "r": 9, "fill": "none", "stroke": "#C7A15A", "strokeWidth": 2 },
    { "type": "rect", "cx": 100, "cy": 150, "width": 16, "height": 16, "rotate": 45, "fill": "none", "stroke": "#C7A15A", "strokeWidth": 2 },
    { "type": "polygon", "points": [[129, 141], [139, 158], [119, 158]], "fill": "#C7A15A" }
  ],
  "texts": [
    { "content": "SPICY", "x": 100, "y": 274, "fontSize": 11, "fill": "#C7A15A", "fontFamily": "mono", "anchor": "middle" }
  ]
}
```

Coordenadas calculadas a partir do CSS do mock (posições px num card 200×300) — arredondadas, não pixel-perfect; ajuste fino normal na implementação real do componente `Card` (Sprint D), mesmo espírito de qualquer calibração visual do projeto.

### 6.2 Estado de partida (rascunho conceitual, não final)

Mantido no Playroom Kit — chaves com naming não descritivo para os campos sensíveis (§2):

- Estado global (host): pilha de compra, pilha "spicy" ativa (visível: quantidade; oculto: identidade real da carta no topo), World's End (posição, revelada ou não), troféus disponíveis, jogador da vez, variante ativa (0 ou 1), toggle de aviso de sequência, `paw_holder` (Spice Raider, quando aplicável).
- Estado por jogador: mão (oculta), pontuação, troféus coletados.

Máquina de turno (alto nível): `declarar → (passar | desafiar)`. Se desafiar → revelar → resolver (modo traço único, exceto Copy Cat = ambos os traços) → definir vencedor da pilha → novo turno. Detalhamento fino de transições fica para a fase de implementação (`CLAUDE.md`), mas o esqueleto de regras e variantes já está fechado (§4, §5).

---

## 7. Plano de sprints

Decisão de sequenciamento: **lógica de jogo (backend/estado) primeiro, renderização visual das cartas depois** — desacopladas propositalmente. O motivo é de risco: a máquina de estados do turno (declarar → passar/desafiar → resolver → definir vencedor, mais a variante ativa) é onde mora toda a complexidade real do Spicy; o componente visual é, comparado a isso, mecânico — troca de `shapes`/`texts` por um objeto JSON, já com padrão resolvido nos outros jogos. Validar a lógica com uma UI mínima (texto puro, sem SVG) evita gastar tempo de design antes de saber se as regras batem.

**Nota de nomenclatura (2026-08-10)**: o plano original prometia isolar a lógica de variante numa "Sprint B" separada, depois de um "Sprint A" só com o fluxo padrão. Na prática, a implementação real da Sprint A já saiu com o reducer de turno cobrindo declarar/passar/desafiar **incluindo** o modo de verificação "ambos os traços" do Copy Cat — a separação não se sustentou porque o parâmetro de modo precisava existir desde o desafio básico (ver §5, "Implicação de arquitetura"). Por isso a numeração abaixo foi ajustada para bater com o que de fato foi entregue, evitando confusão de escopo daqui pra frente.

### ✅ Sprint A — Motor de jogo completo (concluída — PR #34, merged em `main`)

Objetivo: motor de jogo completo e testado, sem rede e sem visual — validado só com testes automatizados (TDD), sem UI real ainda.

- Estrutura do baralho: 110 cartas (100 numeradas com a distribuição de §3.1 + 3 Troféu + 1 World's End + 6 Spice It Up! + 4 Wild de cor + 3 Wild de número) — `baralho.ts`.
- Ações do turno: declarar (sem bloqueio, aviso opcional não-bloqueante de sequência — `sequencia.ts`), passar, desafiar (traço único, exceto Copy Cat = ambos os traços — `desafio.ts`) — reducer de turno em `turno.ts`.
- Resolução de desafio, troféu de última carta, condições de fim de partida e pontuação — `fimDePartida.ts`.
- World's End implementada como **toggle de setup** (`OpcoesPartida.worldsEndAtiva`, default `false`) — mesma lógica de opcionalidade da variante Spice It Up!, não peça fixa do motor (corrigido depois de um desalinhamento inicial do Claude Code — ver nota abaixo).
- 192 testes (TDD), typecheck e lint limpos.

*Nota registrada: a primeira entrega tratou World's End como sempre presente no baralho com posição fixa calculada. Corrigido para toggle real de setup — motivo: reembaralhamentos repetidos numa sessão casual aumentam a chance da carta sair cedo e encerrar a partida sem aviso, por isso grupos tratam ela (e as variantes) como escolha consciente do organizador com o grupo, não padrão fixo do motor.*

### ✅ Sprint B — Rede (Playroom Kit) + UI mínima (concluída — PR #36, merged em `main`)

Objetivo: o motor já validado da Sprint A rodando entre 2+ clients reais, sincronizado via Playroom Kit, com UI mínima o suficiente para jogar uma partida de ponta a ponta (texto/botões simples, sem componente visual de carta ainda).

- Estado sincronizado (Playroom Kit): pilha de compra, pilha "spicy" ativa (oculto: identidade real da carta no topo — `s_topo`, naming não-descritivo, §2/§6.2), mão por jogador (`s_h4x`), jogador da vez, troféus, toggles de setup (World's End, variante Spice It Up!, aviso de sequência) — `src/multiplayer/spicy/Organizador.tsx`/`Participante.tsx`/`Jogo.tsx`.
- Tela de setup: organizador escolhe variante (ou nenhuma), liga/desliga World's End, liga/desliga aviso de sequência — antes do `insertCoin`. **Organizador joga junto** (mão + ordem de turno), diferente de Quem Sou Eu/Artista Impostor onde o host só facilita — decisão específica do Spicy por ser jogo de cartas de mesa.
- Lobby + QR code, mesmo mecanismo dos outros 2 jogos V2 (`insertCoin` com `skipLobby: true`).
- Ações de participante chegam ao host por caixa-postal (`PlayerState.s_acao`), aplicadas via `aplicarAcao` (dispatcher puro, testado) e republicadas.
- UI mínima: lista de cartas em texto/botões (declarar, passar, desafiar com seleção de traço) — sem SVG, sem flip, sem tema visual.
- Testado de ponta a ponta com 2 clientes Playwright reais contra o backend Playroom. 196 testes, typecheck, lint e build de produção limpos.

### ✅ Sprint C — Motor das 6 variantes "Spice It Up!" (§5) (concluída — PR #39, merged em `main`)

Objetivo: os 6 efeitos de variante detalhados em §5 rodando de verdade no motor — na Sprint B, a variante escolhida no setup era só rótulo sincronizado, sem efeito.

- **We Love Chili!**: 1-3 declarado em Vermelho nunca quebra sequência, mesmo no meio da pilha com cor estabelecida diferente — `sequencia.ts`.
- **Start It Up!**: reset pra 1-3 também vale depois de 8 ou 9, não só 10 — `sequencia.ts`.
- **Spice Raider** (valor 4): marca `pawHolderId`; próxima carta jogada de fato (declarar/copiar — passar não conta) resolve, Raider fica com a pilha antiga como pontos, pilha nova começa só com a carta recém-jogada — `turno.ts`.
- **Change Your Luck** (valor 5): até 2 cartas extras da mão enfiadas embaixo da declaração, repostas por compra do monte, imunes a desafio (nunca são o topo) — `turno.ts`.
- **Turn It Up!**: 6 e 9 equivalentes no traço valor de um desafio — `desafio.ts`.
- **Copy Cat**: nova ação `copiar` (qualquer jogador, menos quem declarou por último, replica a declaração atual com carta própria, rouba a vez) — `turno.ts`/`acao.ts`; desafiar essa jogada força traço 'ambos' automático, sem escolha do desafiante.
- UI mínima ganhou os controles específicos de cada variante (picker de cópia, picker de cartas extras, status do Raider, desafio sem traço quando é cópia) — `Jogo.tsx`.
- 37 testes novos (231 no total). Copy Cat, Spice Raider e Change Your Luck testados de ponta a ponta com 2 clientes Playwright reais; We Love Chili/Start It Up/Turn It Up cobertos por unit + integração.

### ▶️ Sprint D — Visual da carta + animação (próxima)

Objetivo: trocar a UI mínima das Sprints B/C pelo componente React real (SVG + animação), consumindo o mesmo JSON de carta já especificado (§6.1) — sem alterar a lógica de jogo por baixo. Nenhuma lógica de jogo nova nesta sprint — é troca de camada de apresentação sobre um motor já validado nas Sprints A/B/C.

**Design de carta**: mock aprovado por Carlos (`docs/Baralho Spicy.dc.html`) — sistema minimalista já validado (círculo/Vermelho, losango/Azul, triângulo/Verde, cada cor com uma forma geométrica de traço fino no fundo; número grande centralizado + repetido nos 4 cantos). As 5 cartas especiais (Wild de cor, Wild de número, Troféu, Fim do Mundo, Verso) **já estavam desenhadas no mock também** (§ "Cartas especiais", achado de Carlos, 2026-08-10 — não era uma lacuna real) e já foram traduzidas pro schema JSON em §6.1.1. Nenhuma pendência de design real restante — Sprint D desbloqueada por completo.

**Abordagem técnica de animação (decidido 2026-08-10, pesquisa completa em `docs/spicy-pesquisa-visual-animacao.md`)**: **Framer Motion** — flip via `motion.div`/`rotateY` (mesma técnica CSS 3D do mock original), movimento de carta entre áreas (mão → pilha → vencedor) via prop `layoutId` (FLIP automático entre componentes-pai diferentes, técnica confirmada em projeto real de card game — `aod/zhithead`). Shuffle visual (embaralhar várias cartas com coreografia) reimplementa o algoritmo do artigo "JavaScript Playing Cards Part 3: Animations" (Juha Lindstedt) — separar em 2 pilhas, intercalar de volta simulando riffle shuffle — na sintaxe do Framer Motion, não com CSS puro (delays muito próximos entre elementos ficam com timing impreciso em CSS). GSAP (referência real: `oskarrough/slaytheweb`) avaliado e **não descartado**, mas não escolhido agora — fica pra consulta se a coreografia precisar de controle mais fino que o Framer Motion não cubra bem.

- Componente `Card`/`FlippableCard` consumindo `shapes`/`texts` de §6.1, incluindo as 5 cartas especiais traduzidas em §6.1.1 e o verso (`kind: "back"`).
- Movimento entre áreas (mão/pilha/vencedor) via `layoutId`, shuffle via algoritmo de Juha Lindstedt reimplementado em Framer Motion.

---

## 8. Prompt de design das cartas (para Canva / Claude Design)

**Resultado já aprovado**: `docs/Baralho Spicy.dc.html` (ver Sprint D, §7), incluindo as 5 cartas especiais (§6.1.1) — este prompt fica registrado como histórico de como se chegou lá. Nenhuma pendência de design restante.

Uso: colar diretamente em uma ferramenta de geração de design (Canva, Claude Design) para gerar as peças visuais das cartas do Spicy. Desacoplada da lógica de jogo — o resultado visual só precisa, no fim, ser traduzível para o schema JSON já definido (§6.1: `background`, `border`, `shapes[]`, `texts[]`).

> Estou desenhando o baralho de cartas de um jogo digital multiplayer chamado Spicy, meu jogo é uma adaptação de um jogo físico de blefe (tipo "Cheat"/"Bullshit") para navegador, feito para ser jogado em grupo durante encontros de célula de uma igreja. Preciso de um sistema visual de cartas **minimalista e limpo**, não temático/decorativo — o oposto de ilustração densa ou tema de "pimenta/especiaria" (é uma versão anterior do conceito que estou abandonando). Pense em algo mais próximo de um baralho de carteado moderno e enxuto do que de um card game colecionável.
>
> Preciso de 3 famílias de carta, cada uma associada a uma cor: **Vermelho, Azul e Verde**. Cada carta numerada (1 a 10) pertence a uma dessas cores e mostra o número grande e legível ao centro, repetido nos dois cantos opostos (como uma carta de baralho tradicional, para leitura rápida quando a carta está na mão em leque). Quero um único elemento gráfico simples de fundo por cor (uma forma geométrica, uma textura leve, ou um padrão discreto) que marque a identidade da cor sem competir com a leitura do número — nada de ilustração figurativa, nada de brilho/glow forte, nada de excesso de detalhe.
>
> Além das numeradas, preciso de 4 tipos de carta especial, visualmente distintas das numeradas mas na mesma linguagem minimalista:
> 1. **Wild de cor** — representa "qualquer uma das 3 cores", precisa comunicar isso visualmente (ex: as 3 cores presentes de forma sutil) sem ficar poluída.
> 2. **Wild de número** — representa "qualquer número de 1 a 10", precisa comunicar variedade/abertura sem listar os 10 números de forma literal ou poluída.
> 3. **Troféu** — carta de recompensa, deve se destacar claramente das demais (ex: paleta neutra/dourada, ou alto contraste), transmitindo "conquista" sem ser suntuosa.
> 4. **Fim do Mundo (World's End)** — carta rara e especial, com peso visual e seriedade — algo que sinalize "atenção, evento importante" de forma discreta, sem apelo dramático.
>
> Formato de referência: retângulo vertical (proporção de carta de baralho, ~2:3), cantos arredondados suaves, número/símbolo nos 4 cantos (2 pares opostos) para leitura em leque na mão, e o elemento gráfico central ocupando a maior parte do espaço sem sobrecarregar a legibilidade do número. A paleta de cada família deve ser reconhecível rapidamente a distância (jogo social, várias pessoas olhando ao mesmo tempo), mas sem saturação ou efeitos "gamer"/neon — priorize clareza, contraste alto entre número e fundo, e um visual que pareça um jogo de mesa contemporâneo, não um card game de fantasia.

---

## 9. Status

Todas as pendências de produto fechadas nesta rodada de definição:

- ✅ Distribuição 99→100: resolvida como 4ª Wild de cor (§3.1).
- ✅ Validação de declaração: sem bloqueio, com aviso opcional não-bloqueante configurável por partida (§4).
- ✅ Detalhamento das 6 variantes Spice It Up! em nível de estado/transição, incluindo o modo de verificação especial do Copy Cat (§5).
- ✅ Apenas 1 variante ativa por partida, não 2 (§4) — simplificação deliberada para a primeira versão.
- ✅ Nome do módulo/rota: mantido `spicy` por ora; ícone/identidade visual a definir depois, não bloqueia.
- ✅ World's End é toggle de setup, não peça fixa do motor (Carlos, 2026-08-10) — ver Sprint A (§7) e nota registrada ali.
- ✅ Design de carta aprovado (`docs/Baralho Spicy.dc.html`) e abordagem técnica de animação decidida — Framer Motion + algoritmo de shuffle de Juha Lindstedt, GSAP como referência futura (Carlos, 2026-08-10; pesquisa completa em `docs/spicy-pesquisa-visual-animacao.md`, incorporada na Sprint D acima).
- ✅ Wild de cor / Wild de número: já estavam desenhadas no mock (§ "Cartas especiais"), não era lacuna real (Carlos, 2026-08-10) — traduzidas pro schema JSON em §6.1.1 junto com Troféu, Fim do Mundo e Verso.

Nenhuma pendência de produto ou design restante das rodadas anteriores. Status real de sprint (A–D + integração/reformulação visual, todas concluídas) está em `progresso.md` — não duplicar aqui, ver lá.

**Pendências (Carlos, 2026-08-13)**:
- Indicador visual do monte de compra diminuindo na UI — "relógio da partida", contagem numérica no mínimo, animação de pilha encolhendo desejável. **Ainda não implementado.**
- ✅ Textos de declaração/desafio sorteados aleatoriamente (26 variações de declaração + 30 de desafio, conteúdo real em `docs/spicy-textos-declaracao-desafio.json`) — `src/multiplayer/spicy/textos.ts` sorteia e substitui `[nome-jogador]`/`[nome-jogador-desafiante]`/`[cor+número]` por valores reais em runtime, exibido em `Jogo.tsx` junto do pill "DECLARADO" e do bloco "REVELADO".
