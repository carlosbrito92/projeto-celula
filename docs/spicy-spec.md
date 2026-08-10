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
| Troféu: ganho se não desafiado, ou se desafiado e vencer. 2º ou 3º troféu encerra o jogo; senão, compra 6 cartas | Condição de fim verificada a cada resolução de desafio/troféu; tela de resultado com pontuação final |
| Fim de jogo: 2º troféu de um jogador, último troféu do pote, ou World's End revelada (não comprar a carta) | Verificação a cada compra/desafio; World's End nunca é adicionada à mão de ninguém |
| Pontuação: 2 troféus = vitória automática; senão, 1 ponto/carta vencida + 10 pontos/troféu − 1 ponto/carta na mão | Cálculo automático ao fim de partida |
| Variantes "Spice It Up!" | **Decidido**: apenas 1 variante ativa por partida (não 2, apesar da regra oficial permitir para "advanced players") — simplifica o motor no primeiro momento; selecionável no setup antes do `insertCoin` |

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

```json
{
  "id": "red_7_a",
  "kind": "numbered",
  "color": "red",
  "value": 7,
  "background": "#8B0000",
  "border": "#FF4500",
  "shapes": [
    { "type": "rect", "x": 10, "y": 10, "width": 180, "height": 280, "rx": 15, "fill": "#A00000" }
  ],
  "texts": [
    { "content": "7", "x": 25, "y": 45, "fontSize": 28, "fill": "#FFFFFF", "fontWeight": "bold" }
  ]
}
```

- `kind`: `"numbered" | "wild_color" | "wild_number" | "trophy" | "worlds_end" | "spice_it_up"`
- Wilds e especiais seguem o mesmo formato de `shapes`/`texts`, sem `value`/`color` fixos (ou com valor simbólico, a definir na implementação).
- Renderização via React + SVG, iterando sobre `shapes`/`texts` — conforme mock já validado por Carlos. Flip de carta via CSS 3D (`perspective`, `backfaceVisibility`, `rotateY`), mesmo padrão.

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

### ▶️ Sprint B — Rede (Playroom Kit) + UI mínima (próxima)

Objetivo: o motor já validado da Sprint A rodando entre 2+ clients reais, sincronizado via Playroom Kit, com UI mínima o suficiente para jogar uma partida de ponta a ponta (texto/botões simples, sem componente visual de carta ainda).

- Estado sincronizado (Playroom Kit): pilha de compra, pilha "spicy" ativa (oculto: identidade real da carta no topo), mão por jogador, jogador da vez, troféus, posição do World's End, toggles de setup (World's End, variante Spice It Up!, aviso de sequência).
- Tela de setup: organizador escolhe variante (ou nenhuma), liga/desliga World's End, liga/desliga aviso de sequência — antes do `insertCoin`.
- Lobby + QR code, mesmo mecanismo dos outros 2 jogos V2 (`insertCoin` com `skipLobby: true`, `onPlayerJoin`).
- UI mínima: lista de cartas em texto/botões (declarar, passar, desafiar com seleção de traço) — sem SVG, sem flip, sem tema visual.
- Naming não-descritivo para chaves de estado sensíveis no Playroom (§2) — mão de cada jogador, carta real sob a declaração.

### Sprint C — Renderização visual (componente de carta)

Objetivo: trocar a UI mínima da Sprint B pelo componente React+SVG real, consumindo o mesmo JSON de carta já especificado (§6.1) — sem alterar a lógica de jogo por baixo.

- Componente `Card`/`FlippableCard` conforme os mocks já validados (SVG dinâmico a partir de `shapes`/`texts`, flip via CSS 3D).
- Depende do design visual das cartas estar pronto (Carlos trabalhando em paralelo via Canva/Claude Design — prompt de design na seção 8 abaixo) e traduzido para o schema JSON.
- Nenhuma lógica de jogo nova nesta sprint — é troca de camada de apresentação sobre um motor já validado nas Sprints A/B.

---

## 8. Prompt de design das cartas (para Canva / Claude Design)

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

Nenhuma pendência de produto restante. Sprint A concluída (§7); próximo passo é a implementação da Sprint B — rede (Playroom Kit) + UI mínima.
