# Estilos de Pregação — Registro de Temas por Série

> Extraído do markdown original de geração de resumos (`geracao-pregacao.md`, seção "Registro de Estilos"). Aqui os estilos deixam de ser referência de código HTML/CSS para copiar manualmente e passam a ser **definições de tema** consumidas pela plataforma — cada série aponta para um tema, e qualquer pregação daquela série herda automaticamente paleta, tipografia e variantes de componente.

## Como este documento funciona

Cada estilo abaixo corresponde a um **tema**. Um tema define:
- Paleta de cores (variáveis)
- Tipografia (display + corpo)
- Quais componentes visuais estão disponíveis e suas variantes
- Decisões editoriais que orientam quando/como cada componente é usado

Quando uma pregação nova é gerada (ver `geracao-pregacao.md`), o conteúdo (JSON) não carrega nenhuma informação de estilo — apenas referencia a **Série**. A plataforma resolve `Série → tema` e aplica a paleta/componentes correspondentes no momento da renderização.

**Regra de herança retroativa:** se uma referência visual oficial de uma série surge depois que mensagens daquela série já foram publicadas com uma paleta editorial provisória (sem referência visual), o tema da série é atualizado e **todas as pregações da série herdam a mudança automaticamente** — não é necessário reprocessar o conteúdo de cada mensagem. Este é o caso documentado do Estilo #5 → #5b (*Religião Tóxica*).

**Regra de fallback:** pregações sem série (`Avulsa`) usam o tema **Padrão MINC** por padrão, ou podem apontar explicitamente para qualquer um dos temas registrados abaixo.

---

## Workflow: criando o tema de uma série nova

Processo repetível para quando uma série nova de pregações surgir, formalizando o que já era feito manualmente para os 5 temas abaixo.

### 1. Critério — a série precisa de tema próprio?

Nem toda série ganha tema novo. Critério: **só quando há identidade visual própria e forte o suficiente pra justificar** (arte de palco, projeção, lettering característico, esquema de cor evidente). Séries sem identidade visual distinta usam o tema **Padrão MINC** ou reaproveitam um tema já registrado que combine com o tom do conteúdo — não criam tema novo por padrão.

### 2. Input — fotos de referência

Mesmo processo de sempre: fotos tiradas do palco/telão durante o culto (backdrop, projeção de título, versículos projetados, elementos gráficos do evento).

### 3. Extração assistida por IA

As fotos são anexadas à IA (Claude) com a instrução de:
- Identificar as **cores dominantes** da arte oficial e sugerir a paleta completa — seguindo a mesma lógica estrutural dos temas já registrados: `--bg` (fundo escuro, tom derivado da cor principal), `--surface`/`--surface2` (variações mais claras do fundo), `--border`, `--text`/`--muted`, e os acentos primário/secundário extraídos diretamente da arte, cada um com sua variante `-dim` para bordas e fundos de tag.
- Sugerir **tipografia compatível** com o peso e estilo do lettering visto nas fotos (ex: lettering condensado bold → algo na linha de `Barlow Condensed`, como no Estilo #4; serifada elegante → linha de `Cormorant Garamond`/`Playfair Display`/`Lora`, dependendo do peso).
- Indicar se **algum componente visual novo** parece necessário para representar um elemento gráfico marcante da arte (ex: o `.verb-block` nasceu de um slide de conjugação verbal específico da série Igrejar; o `.label-box` nasceu da estética de "ficha técnica" de Religião Tóxica). Nem toda série precisa de componente novo — muitas usam só os componentes universais com a paleta nova.
- O objetivo declarado da extração é **alcançar a mesma fonte e cores da arte oficial** o mais fielmente possível — não uma interpretação livre.

### 4. Validação

Carlos revisa a sugestão e ajusta o que for necessário antes de registrar.

### 5. Registro como novo tema

O tema aprovado é adicionado a este documento, seguindo a mesma estrutura dos temas existentes: Origem, Paleta (tabela), Tipografia, Componentes e variantes específicas, Decisões editoriais. Se algum `componente_tema` novo foi introduzido, seu payload (formato de `dados`) é documentado junto, como já feito para `stage`, `diagnostico`, `versus`, etc.

### 6. Vínculo Série → Tema

Uma vez registrado, o tema fica disponível para qualquer pregação daquela série via o campo `metadados.serie` do JSON de conteúdo (ver `geracao-pregacao.md`) — a plataforma resolve a ligação automaticamente, sem precisar reprocessar conteúdo já gerado.

> **Nota:** este workflow também é o que se aplica ao caso de herança retroativa (regra acima) — quando uma arte oficial chega depois de uma paleta editorial provisória já estar em uso, o processo é o mesmo (passos 2–5), só que atualizando um tema existente em vez de criar um novo.

---

## Tema: Padrão MINC (fallback)

Aplicado a qualquer pregação avulsa sem personalização explícita.

### Paleta

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#0a0805` | Fundo geral (preto quente) |
| `--surface` | `#111009` | Header, footer, cards |
| `--surface2` | `#1a1610` | Blocos de versículo, seções internas |
| `--border` | `#2a2318` | Bordas e separadores |
| `--text` | `#e8e0d4` | Texto principal (bege claro) |
| `--muted` | `#6b5f50` | Texto secundário, referências |
| `--accent1` | `#e8720c` | Destaque primário — laranja MINC |
| `--accent2` | `#f4b06a` | Destaque secundário — laranja suave |
| `--accent-dim` | `#3d2008` | Bordas de ênfase, fundos de tags |
| `--tag-bg` | `#1e1008` | Fundo de badges e etiquetas |

**Racional:** identidade MINC usa fundo escuro com laranja vibrante — energia, urgência, calor. Esquema monocromático quente mantém seriedade teológica sem perder identidade da casa.

### Tipografia

| Função | Família |
|---|---|
| Display / Títulos | `Cormorant Garamond` |
| Corpo / Interface | `Inter` |

### Componentes disponíveis

Todo tema deve suportar o conjunto de componentes obrigatórios (ver seção "Componentes universais" ao final deste documento). O tema Padrão MINC usa a versão base de cada um, sem variantes de cor adicionais.

---

## Tema: Estilo #1 — Maio de Salvação

**Origem:** Fotografias do palco — gradiente vermelho-rosa-roxo, título em verde-lima projetado, versículos em lilás-azulado.
**Uso:** série/evento *Maio de Salvação*.

### Paleta

| Variável | Valor | Origem / Uso |
|---|---|---|
| `--bg` | `#0d0610` | Fundo geral — preto arroxeado profundo |
| `--surface` | `#160b1a` | Header, footer |
| `--surface2` | `#1e1026` | Blocos de versículo, cards |
| `--border` | `#2e1a3a` | Bordas e separadores |
| `--text` | `#f0eaf8` | Texto principal |
| `--muted` | `#8a7299` | Referências, labels |
| `--lime` | `#b8e86e` | Acento primário — do título projetado |
| `--lilac` | `#8ba7f5` | Acento secundário — dos textos de tela |
| `--rose` | `#e8507a` | Acento de alerta / ênfase negativa |
| `--lime-dim` | `#2a3a10` | Bordas/fundos de tags lime |
| `--lilac-dim` | `#1a2458` | Bordas de versículos, tags lilás |
| `--rose-dim` | `#3a1020` | Fundos de callouts de alerta |

**Gradiente de fundo:** `linear-gradient(135deg, #1a0820 0%, #2d0e2a 40%, #1a1035 100%)`, `background-attachment: fixed`.
**Textura:** noise overlay via SVG inline, `opacity: .4`.

### Tipografia

| Função | Família | Pesos |
|---|---|---|
| Display | `Cormorant Garamond` | 400, 600, 700 (+ itálico) |
| Corpo | `DM Sans` | 300, 400, 500, 600 |

### Componentes e variantes específicas deste tema

- **`.stage`** (Stage Callout) — introduzido neste tema. Imita visualmente uma projeção de palco. Fundo com gradiente horizontal escuro, borda esquerda gradiente lime→lilac (3px), label superior maiúsculo em `--lime`, título em Cormorant 1.55rem/600, subtítulo em DM Sans 300 cor `--lilac`.
  **Payload (`componente_tema`, variante `stage`):** `{ "label": "string curta, ex: 'Promessa de Deus'", "frase": "string — a frase projetada", "subtitulo": "referência bíblica + contexto curto" }`
- **`.callout`** com 3 variantes: padrão (borda `--lime`), `.lilac` (borda `--lilac`), `.rose` (borda `--rose`, usado para alertas/crenças errôneas).
- **`.verse`** com 3 variantes: padrão (`--lilac-dim`), `.lime` (`--lime-dim`), `.rose` (`--rose-dim`).
- **`.sec-bar`** com 3 variantes: padrão (lime), `.lilac`, `.rose`.
- **Bloco `00`** (ou símbolo `✦`) — seção de fundação teológica antes do "Ponto 1", quando há base extensa. Introduzido neste tema.
- **`map-grid`** — 4 colunas (2 em mobile), cards com `border-top: 3px solid var(--lilac-dim)`, transição de cor no hover.

### Decisões editoriais

- Três acentos simultâneos (lime/lilac/rose), cada um com semântica própria: lime = promessas/afirmações, lilac = paz/descanso, rose = alertas/correções.
- Badge de série no header quando identificável.
- Gradiente fixo no fundo para profundidade de scroll.

---

## Tema: Estilo #2 — Renovo'26

**Origem:** Identidade visual do evento — lettering 3D translúcido sobre quatro faixas verticais (verde, magenta, azul celeste, coral).
**Uso:** série/evento *Renovo'26*, contexto de liderança.

### Paleta

| Variável | Valor | Origem / Uso |
|---|---|---|
| `--bg` | `#080810` | Fundo geral — preto azulado |
| `--surface` | `#0f0f1a` | Header, footer |
| `--surface2` | `#141420` | Cards, blocos de versículo |
| `--border` | `#1e1e30` | Bordas e separadores |
| `--text` | `#f4f2ff` | Texto principal |
| `--muted` | `#6a6888` | Referências, labels |
| `--green` | `#3dd68c` | Faixa 1 — Justiça (identidade firme) |
| `--magenta` | `#f03e8a` | Faixa 2 — Paz (revelação da graça) |
| `--sky` | `#5ab4f5` | Faixa 3 — Alegria (leveza) |
| `--coral` | `#f5743a` | Faixa 4 — Conclusão e ênfases |
| `--green-dim` | `#0e2e1e` | Fundos/bordas acento verde |
| `--magenta-dim` | `#2e0a1a` | Fundos/bordas acento magenta |
| `--sky-dim` | `#0c1e2e` | Fundos/bordas acento azul |
| `--coral-dim` | `#2e1408` | Fundos/bordas acento coral |

**Semântica:** verde → Justiça/identidade/declarações de fé; magenta → Paz/graça/revelação; sky → Alegria/leveza/segurança; coral → Conclusão/ênfases finais/chamados.

### Tipografia

| Função | Família | Pesos |
|---|---|---|
| Display | `Playfair Display` | 700, 900 (+ itálico) |
| Corpo | `Sora` | 300, 400, 500, 600 |

### Componentes e variantes específicas deste tema

- **`.header-stripe` / `.footer-stripe`** — 4 faixas horizontais (verde·magenta·azul·coral), 6px no topo / 4px no rodapé. Réplica direta da identidade do evento.
- **`.stage`** com variantes `.g` (verde) e `.m` (magenta) — evolução do componente do Estilo #1.
- **Sufixo de cor por classe** em todos os componentes principais: `.verse.g/.m/.s/.c`, `.callout.g/.m/.s`, `.sec-bar.g/.m/.s/.c`, `.map-card.g/.m/.s`, `.kg/.km/.ks/.kc` (keywords).
- **`.renovo-note`** — banner de contexto de evento, discreto (sem borda lateral colorida), ícone + texto.
- **`map-grid`** — 3 colunas quando a mensagem tem 3 pilares; cada card herda cor do pilar via `.g/.m/.s`.

### Decisões editoriais

- Quatro acentos simultâneos — viável porque cada cor está atrelada a uma faixa visual que o público reconhece.
- Faixas no header/footer substituem logo/imagem para reforçar identidade do evento.
- Contexto de liderança documentado no banner de abertura.
- **Transcrição de baixa qualidade:** quando o áudio tem muito ruído, ancorar a reconstituição no texto-base bíblico, ilustrações centrais e estrutura do argumento (que tendem a sobreviver ao ruído) — nunca inventar conteúdo.

---

## Tema: Estilo #3 — Célula (Jamais Será em Vão)

**Origem:** Escolha editorial — sem referência de imagem de palco. Tom âmbar/dourado quente evocando fidelidade silenciosa e valor eterno.
**Uso:** resumos de célula a partir de anotações estruturadas (Modo B), sem transcrição.

### Paleta

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#09080a` | Fundo geral |
| `--surface` | `#110f12` | Header, footer |
| `--surface2` | `#18151a` | Cards, blocos de versículo |
| `--border` | `#241e28` | Bordas e separadores |
| `--text` | `#f0eaf5` | Texto principal |
| `--muted` | `#6a5e72` | Referências, labels |
| `--gold` | `#f0b84a` | Acento primário — fidelidade, graça, valor eterno |
| `--gold-soft` | `#e8d09a` | Acento suave — destaque, frases-chave |
| `--gold-dim` | `#2e2208` | Bordas/fundos dourados |
| `--gold-glow` | `rgba(240,184,74,.08)` | Fundo de frase-chave e badge |
| `--plum` | `#c09ae0` | Acento frio — contrapontos, notas de célula |
| `--plum-dim` | `#1e1030` | Fundo de elementos lilás |

**Gradiente decorativo:** radial glow âmbar no topo, sutil, fixo.
**Linha do header:** gradiente linear dourado de borda a borda (substitui faixas multicoloridas dos estilos de evento).

### Tipografia

| Função | Família | Pesos |
|---|---|---|
| Display | `Lora` | 400, 600, 700 (+ itálico) |
| Corpo | `DM Sans` | 300, 400, 500, 600 |

`Lora` é mais intimista/legível em corpo de texto do que Playfair ou Cormorant — adequada para leitura contínua em contexto de célula, não apresentação de conferência.

### Componentes e variantes específicas deste tema

- **`.key-phrase`** — bloco horizontal centrado com aspas decorativas, para a frase-síntese de cada ponto (diferente do callout, que é atribuído ao pregador e alinhado à direita).
- **`.sec-header`** com número decorativo lateral — número grande (Lora 5rem) à esquerda, título à direita, em vez do padrão "número acima do título". Melhor para mensagens com 6+ pontos.
- **`.index-grid`** — grid 2×N com cards discretos listando os temas antes do conteúdo detalhado.
- **`.celula-box`** — nota final identificando quem anotou e quem compartilha, com sugestão de uso para a dinâmica do grupo. Usa acento `--plum`.
- **Navegação interna (índice + FAB)** — ver seção "Componentes universais" abaixo; este foi o tema onde o padrão foi originalmente especificado.

### Particularidades do Modo B com anotação estruturada (esboço completo)

Quando a fonte já chega como esboço organizado (texto-base, pontos numerados, frases-chave prontas): não requer reconstituição, apenas editorialização e formatação leve. Frases-chave do anotador são preservadas textualmente. Estrutura de pontos não deve ser reordenada nem comprimida.

### Decisões editoriais

- Paleta sem referência de imagem → escolha editorial baseada no tom (âmbar/dourado para fidelidade e valor eterno).
- Linha dourada discreta no header em vez de faixas — tom de célula, não de conferência.
- Nota de célula no rodapé identifica anotador e responsável pelo compartilhamento.

---

## Tema: Estilo #4 — Série Igrejar

**Origem:** Fotografias de projeção — fundo preto, lettering laranja-vermelho quente e branco puro, contraste duro, sem gradiente.
**Uso:** série *Igrejar*.

### Paleta

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#080808` | Fundo geral — preto puro |
| `--surface` | `#0f0f0f` | Header, footer |
| `--surface2` | `#161616` | Cards, blocos de versículo |
| `--border` | `#242424` | Bordas e separadores |
| `--text` | `#f0f0f0` | Texto principal |
| `--muted` | `#5a5a5a` | Referências, labels |
| `--orange` | `#e84c1e` | Acento primário — laranja-vermelho das projeções |
| `--orange-s` | `#f5825a` | Laranja suave — destaques, subtítulos |
| `--orange-dim` | `#2e1008` | Bordas/fundos laranja |
| `--white` | `#ffffff` | Contraste máximo em títulos |

**Caráter:** monocromático escuro, um único acento — hierarquia construída por tipografia/peso, não por cor.
**Detalhe scanline:** `repeating-linear-gradient` sutil no header (`opacity: .012`), imitando telas LED de palco — usar só quando as fotos de referência tiverem esse padrão.
**Linha laranja no footer:** `border-top: 3px solid var(--orange)`.

### Tipografia

| Função | Família | Pesos |
|---|---|---|
| Display/Títulos | `Barlow Condensed` | 400, 600, 700, 800 (+ itálico) |
| Corpo | `Barlow` | 300, 400, 500 |

`Barlow Condensed` é adequada para identidades com lettering bold condensado (eventos, séries com comunicação visual forte). **Evitar em documentos de leitura longa** (célula, estudo) — preferir `Lora` ou `DM Sans` nesses casos.

**Importação:**
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&family=Barlow:wght@300;400;500&display=swap" rel="stylesheet" />
```

### Componentes e variantes específicas deste tema

- **`.verb-block`** — réplica de slide de palco (título grande em dois tons + mini-grade de conjugação verbal). Princípio geral: quando as fotos de palco mostram um slide marcante (conjugação, diagrama, frase projetada em tipografia grande), reproduzir esse elemento no header cria reconhecimento imediato para quem esteve no culto.
  **Payload (variante `verb_block`):** `{ "label": "ex: 'Nova série:'", "verbo": "igrejar", "conjugacoes": [{ "pronome": "eu", "forma": "igrejo" }, "..."] }`
- **`.poeiras-grid` / `.poeira-card`** — grid de itens paralelos (4–6), 2 colunas (1 em mobile), número decorativo + nome + descrição curta.
  **Payload (variante `poeiras_grid`):** `{ "itens": [{ "numero": "01", "nome": "Amargura", "descricao": "Hebreus 12.15 — descrição curta" }, "..."] }`
- **`.sec-eyebrow`** — rótulo maiúsculo acima do título de seção (função da seção: Fundação / Problema / Solução / Conclusão), em vez de referência abaixo do título. Útil para títulos longos.
- **Títulos de seção** em maiúsculas + itálico (Barlow Condensed 800) — não recomendado para estilos intimistas.
- **Navegação interna (índice + FAB)** — igual ao Estilo #3, cores usando `--orange`/`--orange-dim`.

### Decisões editoriais

- Um único acento (laranja + branco + preto), toda hierarquia resolvida por tipografia.
- Reprodução de slide de palco no header quando há elemento visual marcante.
- Grid de cards para listas paralelas de itens com peso equivalente.
- Contexto de série: quando é o primeiro episódio, badge/banner devem indicar que há mais conteúdo vindo.

---

## Tema: Série Religião Tóxica (Estilo #5 → #5b, paleta oficial vigente)

> **Nota histórica:** este tema teve duas versões. O Estilo #5 original foi criado editorialmente (sem referência visual) para a primeira mensagem da série. Na segunda mensagem, a arte oficial de palco chegou e **substituiu retroativamente** a paleta editorial. **O Estilo #5b é o tema vigente** — o #5 original é mantido abaixo apenas como registro histórico do princípio de "paleta provisória".

### 5b — Paleta oficial (vigente)

**Origem:** Arte oficial de palco — fundo preto com textura de ruído, verde-tóxico saturado como acento primário, magenta como secundário, tipografia condensada pesada tipo pôster/laboratório, elementos de biohazard (☣) e etiquetas de "antídoto".

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#060806` | Fundo geral — preto esverdeado quase puro |
| `--surface` | `#0a0f0a` | Header, footer |
| `--surface2` | `#0f160f` | Cards, blocos de versículo, boxes de analogia |
| `--border` | `#1c2a1c` | Bordas e separadores |
| `--text` | `#e8f5ea` | Texto principal |
| `--muted` | `#566356` | Referências, labels |
| `--toxic` | `#39e87a` | Acento primário — verde-tóxico saturado |
| `--toxic-soft` | `#8ff5b4` | Acento suave — textos em destaque |
| `--toxic-dim` | `#0e2e18` | Bordas/fundos verde |
| `--toxic-glow` | `rgba(57,232,122,.08)` | Glow decorativo, fundo do badge de série |
| `--magenta` | `#e84fa8` | Acento secundário — contraste da arte oficial |
| `--magenta-dim` | `#2e0e22` | Bordas/fundos magenta |

### Tipografia (5b)

| Função | Família | Nota |
|---|---|---|
| Display | `Anton` | Peso único extra-bold, uppercase |
| Labels/metadados | `IBM Plex Mono` | Reforça estética "ficha técnica de laboratório" |
| Corpo | `IBM Plex Sans` | — |

### Componentes específicos do 5b

- **`.label-box`** — réplica de etiqueta "Antídoto / Princípio ativo: Graça". Mini ficha técnica no header, linhas `campo: valor` em monoespaçada.
  **Payload (variante `label_box`):** `{ "titulo": "string, ex: 'Antídoto'", "campos": [{ "campo": "Princípio ativo", "valor": "Graça" }, "..."] }`
- **Textura de ruído tingida** — variante do noise overlay (introduzido no Estilo #3) com `fill` na cor do acento primário (`%2339e87a`) em vez de neutro.
- **`.hazard-row`** — linha decorativa com símbolo ☣ ao lado do badge de série.

### 5 — Paleta editorial original (histórico, não usar em mensagens novas)

**Origem:** Escolha editorial pelo vocabulário clínico da mensagem ("doença dos gálatas", "sintomas", "antídoto") — sem referência visual disponível na época.

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#07100e` | Fundo geral — preto esverdeado profundo |
| `--surface` | `#0d1815` | Header, footer |
| `--surface2` | `#12211d` | Cards, blocos de versículo, boxes de diagnóstico |
| `--border` | `#1e332d` | Bordas e separadores |
| `--text` | `#e8f0ed` | Texto principal |
| `--muted` | `#5c766e` | Referências, labels |
| `--teal` | `#2dd4a8` | Acento primário — graça, clareza, antídoto |
| `--teal-soft` | `#8fe8cf` | Acento suave |
| `--teal-dim` | `#0a2e24` | Bordas/fundos teal |
| `--teal-glow` | `rgba(45,212,168,.07)` | Fundo do box de antídoto, glow do header |
| `--red` | `#e8604a` | Acento de alerta — religião, sintomas, confronto |
| `--red-dim` | `#2e120c` | Bordas/fundos vermelho |

**Tipografia original:** Display `Source Serif 4` (400, 600, 700 + itálico), Corpo `IBM Plex Sans` (300–600).

**Regra de cor estrita:** teal nunca descreve o erro/religião; vermelho nunca descreve a graça. Separação categórica reforça o argumento teológico central.

### Componentes (ambas versões, 5 e 5b compartilham a estrutura)

- **`.diagnostico`** — box de sintomas, marcador `✕` vermelho, borda esquerda vermelha.
  **Payload (variante `diagnostico`):** `{ "label": "ex: '⚠ Sintomas da Doença dos Gálatas'", "itens": ["string", "string", "..."] }`
- **`.antidoto`** — par direto do `.diagnostico`, em teal/verde, sem lista, para o "tratamento".
  **Payload (variante `antidoto`):** `{ "label": "ex: '✓ O tratamento'", "texto": "string" }`
- **`.versus`** — comparação de duas colunas (ex: "A Religião Ensina" vs "O Evangelho Ensina"), cada lado com cor e borda superior própria. Usar apenas quando a mensagem apresenta uma dicotomia explícita e citável — não para qualquer contraste genérico.
  **Payload (variante `versus`):** `{ "lado_a": { "label": "string", "citacao": "string" }, "lado_b": { "label": "string", "citacao": "string" } }` — `lado_a` sempre o polo negativo/confrontado (cor de alerta do tema), `lado_b` sempre o polo positivo/afirmado (cor de acento primário do tema).
- **Navegação interna (índice + FAB)** — igual às demais, cores usando o acento primário vigente do tema (`--toxic`/`--toxic-dim` no 5b).

### Decisões editoriais

- **Paleta editorial é sempre provisória** quando não há referência visual — deve ser tratada como candidata a substituição, não como definitiva.
- **Herança retroativa:** se a arte oficial aparecer depois — mesmo em capítulo posterior —, o tema da série inteira é atualizado, não apenas a mensagem que trouxe a referência.
- Reaproveitamento de tema: mensagem de série já estabelecida reutiliza o tema da série; série nova sem referência gera tema próprio (não herda de outra série, mesmo que do mesmo pregador).

---

## Componentes universais (todo tema deve suportar)

Independente do tema ativo, toda pregação renderizada precisa destes elementos, com cores resolvidas pelas variáveis do tema em uso:

| Componente | Descrição |
|---|---|
| Header | Título, pregador, badge de série (se houver) |
| Banner intro | Frase-síntese em destaque, borda lateral colorida |
| Mapa de pontos | Grid com princípios/blocos numerados, antes do conteúdo detalhado |
| Seções numeradas | Número decorativo, título, barra colorida, texto. Cada seção pode carregar um `sec_eyebrow` (rótulo semântico curto acima do título — ex: "Fundação", "Subtema 1", "Conclusão") e uma lista de `referencias` bíblicas tocadas naquela seção, exibida junto ao título. |
| Blocos de versículo | Texto bíblico completo, itálico, referência alinhada à direita |
| Callouts | Citações-chave, destacadas à direita com borda colorida |
| Palavras-chave | Duas classes de destaque (`.k1`/`.k2`) |
| Separadores | Linhas horizontais entre seções |
| Resumo final | Lista compacta com pontos e versículos-âncora |
| Footer | Pregador, data, indicação de uso |
| Anotações (`.annotation`, se fornecidas) | Caixa inline discreta — fundo levemente diferenciado, borda esquerda tracejada em `--accent2` (ou equivalente do tema), ícone ✎ ou prefixo "Nota:", nome em `font-weight: 600`, texto em itálico, ~14px |

### `componente_tema` universal: `analogia`

Diferente dos componentes exclusivos de tema (documentados junto de cada estilo), `analogia` está disponível em **qualquer tema**, pois cobre um recurso comum a praticamente todo pregador: uma ilustração ou parábola isolada (analogia do cotidiano, objeto, situação) usada para explicar um ponto teológico, seguida de uma frase de conclusão que amarra a ilustração ao ponto. Identificado na primeira calibração com material real (três ocorrências na pregação *A Graça Não É o Que Você Pensa*: "O Celular e a Barata", "O Copo de Água Suja", "O Vídeo Cassete e o Streaming").

Estrutura visual: label superior (título curto da ilustração), um ou mais parágrafos de corpo, e uma frase de conclusão com tratamento tipográfico distinto (peso maior ou cor de acento) — a "virada" que conecta a ilustração ao ponto teológico.

**Payload (`componente_tema`, variante `analogia`):** `{ "label": "string curta, ex: 'Ilustração — O Copo de Água Suja'", "corpo": ["string", "string, se houver mais de um parágrafo"], "conclusao": "string — a frase que conecta a ilustração ao ponto teológico" }`

Cores/bordas seguem o mesmo padrão do `.analogia`/`.diagnostico` de cada tema (fundo `surface2`, borda esquerda discreta na cor `muted` ou acento secundário do tema, conforme a paleta ativa) — cada tema decide a variante visual exata, o payload é o mesmo em todos.

> **Confirmado na segunda calibração:** o mesmo componente aparece no tema Igrejar sob o nome de classe `.ilustracao` (label + parágrafos + `.punchline`) — estrutura de dado idêntica, apenas o nome da classe CSS muda por tema. O payload do JSON é o mesmo em qualquer tema.

### `componente_tema` universal: `banho_list` (lista numerada decorativa)

Identificado na segunda calibração (Estilo #4, Igrejar — "A Parábola do Banho", 10 itens). Diferente de `.blist` (lista com marcador `—`, sem numeração) e diferente de `poeiras_grid` (cards em grid, cada um com nome próprio e descrição separada), este é uma **lista numerada corrida**, sem título individual por item — apenas um número decorativo grande (estilo tipográfico do tema, ex: `01, 02...`) e o texto do item. Usar quando a fonte apresenta uma sequência numerada de afirmações/desculpas/passos que não têm nome próprio nem card individual — apenas ordem.

**Payload (`componente_tema`, variante `banho_list`):** `{ "itens": ["string", "string", "..."] }`

### `componente_tema` universal: `humor`

Identificado na calibração com pregação de convidado (Pastor Naor Pedroza, "De Volta ao Pai"). Bloco discreto para um momento de humor/piada do pregador durante a mensagem — diferente de `analogia` (ilustração séria que sustenta um ponto teológico) e de `callout` (citação de peso). Estruturalmente mais simples: só texto, sem label nem conclusão separada. Visualmente marcado com um emoji (ex: 😄) e tratamento levemente distinto (borda tracejada) para sinalizar tom leve sem competir com o conteúdo principal.

**Payload (`componente_tema`, variante `humor`):** `{ "texto": "string — o momento de humor, já editorializado em prosa corrida" }`

### `componente_tema` universal: `merch_section` (menções e indicações)

Identificado na mesma calibração — seção de fechamento inteira (não um bloco dentro de uma seção de conteúdo, mas uma seção própria no fim do documento) para recomendações práticas que o pregador faz à audiência: livros, redes sociais, produtos, ferramentas. Comum em pregações de convidado/conferência, onde o pregador tem canais próprios a divulgar; menos comum em pregações regulares da série da casa. Cada item tem um ícone, um título curto e uma descrição.

**Payload (`componente_tema`, variante `merch_section`):** `{ "titulo": "string, ex: 'Menções e Indicações do Pastor'", "itens": [{ "icone": "emoji, ex: '📖'", "titulo": "string curta", "descricao": "string" }, "..."] }`

Diferente dos demais `componente_tema`, este não aparece dentro de `secoes[].corpo[]` — é anexado ao final do documento, após `resumo_final`, quando presente. Ver nota no schema de `geracao-pregacao.md`.

### Navegação interna (índice + FAB) — especificação universal

Aplicável a qualquer pregação com 4+ pontos, independente do tema:

1. **Índice clicável** — cada item aponta para o `id` da seção (`#ponto-N`). Toda seção recebe `scroll-margin-top: 32px` para não ficar encoberta ao navegar.
2. **Botão flutuante (FAB)** — fixo no canto inferior direito, some quando o índice está visível, aparece quando o usuário rola além dele.
   - Implementado com `IntersectionObserver` nativo (`rootMargin: '0px 0px -80% 0px'`) — sem biblioteca externa.
   - **Importante:** não confiar em `href="#indice"` puro — falha em alguns WebViews (apps mobile, preview de artifact). Interceptar o clique e usar `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
   - Cores seguem o acento primário e o acento dim do tema ativo.

Na plataforma, esta navegação deixa de ser reproduzida por HTML gerado e vira **componente único da aplicação**, implementado e corrigido uma vez.
