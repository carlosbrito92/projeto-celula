# Prompt: Mock Visual — Projeto Célula

> Documento de referência para gerar um mock/protótipo visual do Projeto Célula. Não substitui `projeto-celula.md`, `estilos-pregacao.md` ou `geracao-pregacao.md` — traduz o que já está definido neles para linguagem de design.
>
> **v2 deste documento — aprovada.** A v1 gerou um mock avaliado como denso demais, mais parecido com uma apresentação/documento do que um app real, sem espaço de composição para evolução futura, e com os quebra-gelos usando o mesmo peso visual sério das pregações. As regras abaixo corrigiram isso — o mock gerado a partir desta v2 (`mock-aprovado-v2.html`) foi validado por Carlos como "moderno, sleek, parece um app" e serve de referência visual para o projeto daqui em diante.

---

## O que é o Projeto Célula

Um web app (React + Capacitor, instalável em Android/iOS/PWA) para redes de células de igreja. Resolve dois problemas: (1) resumos de pregação em HTML hoje quebram funcionalidades (navegação, índice) quando baixados para compartilhar fora do navegador; (2) não existe um lugar único onde líderes e membros de célula encontrem pregações passadas e recursos de apoio ao encontro (quebra-gelos, dinâmicas, sorteios).

**Não é um app institucional formal.** É uma ferramenta de bolso para um encontro semanal informal — o tom visual deve refletir isso: convidativo, rápido de usar no meio de uma reunião, não burocrático.

---

## Regra estrutural: mock de app, não painel de apresentação

Esta regra vale mais que qualquer outra neste documento — foi a maior falha da primeira tentativa.

- **Uma tela por vez, dentro de moldura de dispositivo** (frame de celular com bordas, notch ou barra de status simplificada). Nunca várias telas inteiras expostas lado a lado como um dashboard de referência — isso lê como apresentação, não como produto.
- **Mostrar o app como alguém realmente veria**, com espaço de respiro: não tentar caber o máximo de conteúdo possível dentro da viewport para "mostrar tudo de uma vez". Cortar conteúdo (com reticências, scroll implícito, ou "e mais N itens") é preferível a espremer.
- **Prefira menos telas bem resolvidas a muitas telas espremidas.** Se o mock cobrir 3-4 telas com espaço de verdade, é melhor do que 8 telas todas comprimidas para caber juntas.
- Se for útil comparar duas variações lado a lado (ex: mostrar o mesmo card com dois temas diferentes), tudo bem — mas isso é exceção pontual, não o padrão de toda a composição.

---

## Regra estrutural: espaço para evolução

A segunda maior falha da primeira tentativa: o layout resolvia cada tela com posições e proporções tão específicas que qualquer adição futura (um campo novo, uma seção que a igreja pedir depois) exigiria redesenho, não encaixe.

- **Grids e listas devem parecer extensíveis**, não uma composição fechada desenhada para exatamente N itens. Um card de pregação deve parecer que "mais um card igual a esse cabe do lado" sem quebrar nada.
- **Evitar decoração ou posicionamento que dependa da quantidade exata de conteúdo atual** (ex: um número decorativo gigante calibrado pixel a pixel para um título de X caracteres). Testar mentalmente: "e se esse título tivesse o dobro do tamanho, ou esse card tivesse mais um campo — ainda funciona?"
- **Componentes simples e repetíveis** são preferíveis a composições únicas e artesanais por tela. Isso não significa pobre visualmente — significa que a riqueza vem de poucos componentes bem feitos e reutilizados, não de cada tela sendo uma peça de design única.

---

## Identidade visual compartilhada (o que TODOS os módulos usam)

Isso é a única coisa que pregações e quebra-gelos/utilitários têm em comum visualmente — tudo o mais (densidade, formato de card, peso, composição) é livre e deve divergir entre os módulos.

| Variável | Valor | Uso |
|---|---|---|
| Fundo geral | `#0a0805` | Preto quente |
| Superfície (cards, headers) | `#111009` | — |
| Superfície secundária | `#1a1610` | Blocos internos, seções |
| Borda | `#2a2318` | Separadores |
| Texto principal | `#e8e0d4` | Bege claro |
| Texto secundário | `#6b5f50` | Muted |
| Acento primário | `#e8720c` | Laranja MINC — destaques, botões, ícones ativos |
| Acento secundário | `#f4b06a` | Laranja suave |
| Fundo de tag/badge | `#1e1008` | — |

**Tipografia (também compartilhada):** Display/títulos em `Cormorant Garamond` (serif elegante); corpo/interface em `Inter` (limpa, legível em telas pequenas). Ambas via Google Fonts.

Fora isso — densidade de informação, formato de card, quantidade de bordas/divisórias, uso de ícones vs. texto, tom geral — **cada módulo define o próprio registro**, descrito nas seções abaixo. Não copiar o peso visual do módulo de pregações para os demais.

---

## Estrutura de navegação (o que existe no app)

Três áreas principais, acessíveis a partir de uma navegação simples (tab bar ou menu — a IA do mock decide o padrão de navegação mais adequado):

1. **Pregações** — biblioteca de resumos
2. **Quebra-gelos** — catálogo de dinâmicas de célula
3. **Utilitários** — ferramentas de sorteio/geração usadas pelos quebra-gelos (pode aparecer como seção própria ou acessível de dentro de cada quebra-gelo — decisão de composição em aberto)

Sem tela de login, sem tela de perfil de usuário, sem hierarquia de permissão visível — o app não distingue "líder" de "membro" na interface. Qualquer pessoa vê e usa tudo.

---

## Módulo 1 — Pregações

**Registro visual deste módulo: editorial, sóbrio, denso onde o conteúdo pede densidade** (é leitura teológica de verdade — não faz sentido esvaziar isso). Mas "denso onde o conteúdo pede" não é licença para expor a pregação inteira de uma vez no mock — ver a regra estrutural de uma-tela-por-vez acima. Mostrar a tela de leitura rolada até UM ponto específico (ex: o índice + início da seção 1), não a pregação inteira esticada.

### Tela de biblioteca
- A pregação mais recente aparece em destaque (maior, no topo).
- Lista das demais pregações abaixo, mais compactas — mas a lista deve parecer que continua além do que está visível (scroll implícito), não uma lista fechada de N itens exatos.
- Busca simples por palavra-chave/tema (campo de busca visível).
- Cada item de lista mostra, no mínimo: título, série (se houver, como badge), pregador, data (quando disponível).

### Tela de leitura de uma pregação
Estrutura de cima para baixo (mostrar no mock só o trecho necessário para comunicar a estrutura — não a pregação inteira):
1. **Header**: título da mensagem, badge de série (se houver), nome do pregador, data.
2. **Banner intro**: frase-síntese em destaque, borda lateral colorida.
3. **Versículo-base** (se houver): bloco de citação bíblica em destaque.
4. **Índice de pontos**: grid de cards curtos (número + título), clicáveis.
5. **Seções numeradas**: número decorativo, título, barra colorida, conteúdo (parágrafos, blocos de versículo, callouts, palavras-chave destacadas).
6. **Resumo final**: lista compacta ao final.
7. **Botão flutuante de índice (FAB)**: fixo no canto inferior direito, aparece ao rolar além do índice — requisito funcional central do projeto.

**Nota sobre temas por série:** o mock usa o tema Padrão MINC como base, mas pode incluir uma segunda variação pontual (um card isolado, não uma tela inteira duplicada) mostrando a mesma seção com outra paleta de série, só para comunicar que o tema muda por série — sem duplicar toda a tela de leitura.

---

## Módulo 2 — Quebra-gelos

**Registro visual deste módulo: leve, lúdico, rápido de escanear — precisa parecer um jogo, não um manual.** Compartilha só fonte e paleta de cor com o módulo de pregações; densidade, formato de card e composição são livres e devem ser deliberadamente mais simples/divertidos do que a tela de leitura de pregação. Referências de tom: apps de jogo de festa tipo Jackbox, Psych, Heads Up — cards grandes, pouco texto por tela, ícones/emojis permitidos aqui (diferente do módulo de pregações, que é mais tipográfico), botões de ação chamativos.

### Tela de catálogo
- Lista de quebra-gelos, organizáveis por tipo: **instrucional** (só leitura) e **utilitário** (com ferramenta embutida).
- Cada item mostra: nome, indicador visual do tipo (pode usar ícone/emoji aqui), metadados rápidos (jogadores, idade, tempo).
- Composição pode ser mais parecida com "cards de jogo" (mais quadrados, mais visuais) do que com a lista tipográfica do módulo de pregações.

### Tela de um quebra-gelo específico
- Texto de regras (jogadores, idade, tempo, preparação, como jogar) — mas com menos densidade tipográfica que uma seção de pregação: frases curtas, mais espaço em branco, não blocos de parágrafo longo.
- Quando o quebra-gelo pede um utilitário, botão de ação embutido inline, no ponto em que a regra pede — grande, chamativo, com o acento laranja como cor de ação principal.

---

## Módulo 3 — Utilitários (kit compartilhado)

**Registro visual: o mais leve e lúdico de todos os módulos.** Interface mínima, quase um brinquedo — este é o módulo onde a diferença de tom com as pregações deve ser mais óbvia.

Três ferramentas reutilizáveis entre múltiplos quebra-gelos — aparecem como modais/overlays acionados a partir de um quebra-gelo, ou como mini-telas próprias:

1. **Sorteador de nome/palavra com atribuição escondida** — sorteia e atribui um valor por jogador, oculto do próprio jogador mas visível aos demais.
2. **Sorteador de papel especial** — escolhe um jogador para um papel distinto.
3. **Contador/cronômetro** — apoio para dinâmicas com tempo ou contagem em grupo.

**Composição:** botão de ação grande e central ("Sortear"), resultado exibido de forma clara e temporária (nada persiste além da sessão). Mostrar cada utilitário como UMA tela/estado por vez (ex: tela de repouso OU tela de resultado — não as duas coladas mostrando todo o fluxo de uma vez). Isso precisa parecer instantâneo e divertido, usado no meio de um encontro.

---

## O que NÃO incluir no mock

- Tela de login/cadastro de usuário
- Tela de perfil ou configurações de conta
- Qualquer indicação visual de hierarquia (líder vs. membro)
- Telas de administração/gestão (cadastro de membros, histórico de encontros — explicitamente fora de escopo do projeto)
- Os mini-jogos multiplayer (Pictionary, Impostor com lobby via QR code) — são V2, não fazem parte do escopo deste mock

---

## Sistema de ícones — Lucide (substituindo emojis placeholder)

Os emojis usados no `mock-aprovado-v2.html` (🕵️ 🎭 🤥 🔤 🪢 ✏️ 🎲 🙈) eram placeholder — comunicavam a ideia rápido, mas sem o acabamento de um asset pensado nos detalhes. O sistema de ícones definitivo é **Lucide** (`lucide-icons/lucide`, MIT), via fork próprio do repositório completo (não apenas a dependência npm) para ter controle de versão e espaço para customização futura.

**Implementado em 2026-08-01** (`src/icons/`) — não via `lucide-react` (pacote npm), mas vendorizando só os SVGs necessários direto do fork numa revisão pinada, com um componente `<Icon name="..." />` próprio que injeta o SVG via `dangerouslySetInnerHTML` (`width`/`height` trocados para `1em` no arquivo salvo, então o ícone escala com `font-size` do elemento em volta, igual o emoji que substituiu). Decisão: build do pacote `lucide-react` a partir do monorepo do fork (pnpm/turborepo) seria mais fiel à ideia original, mas peso de engenharia desproporcional para consumir ~12 ícones estáticos — revisar se a lista crescer muito ou se ícones customizados (`icons/celula/` no fork) entrarem em jogo. Ver `src/icons/README.md` para a revisão pinada do fork e como adicionar um ícone novo.

**Estrutura do fork:** manter o fork sincronizável com o upstream Lucide (sem editar os SVGs originais diretamente); se surgir necessidade de ícone customizado que o Lucide não tem, adicionar num diretório próprio dentro do fork (ex: `icons/celula/`), sem misturar com os arquivos originais.

**Mapeamento emoji → ícone Lucide** (catálogo real de quebra-gelos + utilitários, `content/quebra-gelos/*.json` e `content/utilitarios/*.json` — a tabela antiga referenciava nomes de jogos de uma versão anterior do catálogo, já substituída):

| Jogo/utilitário | Emoji antigo | Ícone Lucide |
|---|---|---|
| Quem Sou Eu? | 🎭 | `drama` |
| Artista Impostor | 🎨 | `palette` |
| Encontre o Líder | 🕵️ | `user-search` |
| Eu Fui à Feira | 🛒 | `shopping-cart` |
| Histórias de Uma Palavra Só | 📖 | `book-open` |
| Medusa | 🐍 | `eye` (Lucide não tem ícone de cobra) |
| Psicólogo | 🛋️ | `sofa` |
| Psíquico | 🔮 | `sparkle` |
| Contact | 📡 | `satellite-dish` |
| Contador / Cronômetro | ⏱️ | `timer` |
| Sorteador de Nome/Palavra | 🎭 | `shuffle` |
| Sorteador de Papel Especial | 🕵️ | `users-round` |
| CTA "Sortear" (Detalhe de quebra-gelo) | 🎲 | `dices` |

Esta tabela deve crescer conforme novos quebra-gelos/utilitários entrarem no catálogo — cada novo emoji placeholder ganha uma linha aqui antes de virar ícone definitivo.

---

## Referência de tom

Dois registros claramente diferentes sob a mesma paleta e tipografia:
- **Pregações**: leitura devocional bem cuidada, editorial, séria onde o conteúdo pede seriedade.
- **Quebra-gelos e utilitários**: leve, rápido, divertido — jogo de festa, não manual de instruções.

A diferença de tom deve ser **visível de cara** ao comparar uma tela de cada módulo — se as duas parecerem a mesma linguagem visual só com texto diferente, a composição errou. O que as une é só a paleta de cor e a tipografia; a densidade, o peso e a personalidade de cada módulo são propositalmente distintos.
