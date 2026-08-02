# Prompt: Geração de Conteúdo de Pregação (JSON)

> Evolução de `Prompt: Resumo de Pregação em HTML`. O processo editorial é **idêntico** ao original — leitura de transcrição/anotações, identificação de pontos, correção bíblica, cruzamento de fontes, tratamento de anotações pessoais. A única mudança é o **formato de saída**: em vez de HTML+CSS completo, o resultado é um **JSON estruturado**, consumido pela plataforma junto com o tema da série (ver `estilos-pregacao.md`) para renderização.
>
> Isso significa: nenhuma cor, fonte ou marcação visual entra no conteúdo gerado. O JSON descreve *o que* existe (pontos, versículos, callouts, palavras-chave, anotações) — nunca *como* é desenhado.

## Arquivos necessários

Mesmo funcionamento em dois modos:

### Modo A — Transcrição completa *(padrão)*
1. **Transcrição da pregação** — arquivo `.txt`.
2. *(Opcional)* JSON de uma pregação anterior como referência de estrutura.

### Modo B — Somente anotações
1. **Anotações** — coladas no corpo da mensagem. Fragmentadas, pessoais, abreviadas — serão reorganizadas e expandidas.
2. *(Opcional)* JSON de referência.

> No Modo B, o conteúdo gerado é fiel ao registrado nas anotações, mas expandido e conectado para leitura por quem não estava presente — sem inventar conteúdo ausente. Versículos mencionados são completados com o texto bíblico oficial. Lacunas de contexto são sinalizadas com `"nota_lacuna": "não registrado nas anotações"` no campo correspondente.

> **Detecção de modo pelo conteúdo, não pelo nome do arquivo.** Identificado na segunda calibração: um arquivo `.txt` chamado como se fosse transcrição continha, na verdade, um esboço estruturado (títulos numerados, tópicos curtos, referências agrupadas) — Modo B, não Modo A. O sinal confiável é a **forma do conteúdo**: fala corrida com timestamps e marcadores de orador (`Pastor Fulano (00:00)`) é transcrição (Modo A); texto organizado em tópicos/títulos sem marcação de fala é esboço (Modo B), mesmo que o arquivo tenha extensão `.txt` e um nome que sugira transcrição. A IA deve inspecionar a estrutura do texto antes de assumir o modo.

---

## Instrução principal

> Observe o material em anexo (transcrição ou anotações) e produza o conteúdo em formato JSON, seguindo o schema abaixo. O objetivo é o mesmo de sempre: compartilhar a palavra com um grupo de forma que consigam entender a mensagem com clareza — a plataforma cuida da apresentação visual.

### Requisitos de conteúdo — idênticos ao processo original

- Versículos mencionados devem aparecer **completos e corretos**, conforme texto bíblico oficial (ARA ou NVI), mesmo que a fonte cite de memória ou de forma imprecisa.
- Organize o conteúdo na **ordem em que os pontos aparecem no material** — não reordenar nem agrupar por conveniência.
- Identifique os **pontos principais** (princípios, chaves, blocos temáticos).
- Produza um **mapa de pontos** (lista curta, título + uma linha) para o índice/visão geral.
- Produza um **resumo final** com todos os pontos em formato compacto.
- **Palavras-chave** devem ser identificadas e marcadas (equivalente a `.k1`/`.k2` do sistema visual — aqui, apenas o texto marcado, sem decidir cor).

### Requisitos adicionais — Modo B

- Tratar anotações fragmentadas, títulos em maiúsculas e observações pessoais como matéria-prima, não texto final.
- Expandir e conectar pontos sem ultrapassar o que as anotações permitem inferir.
- Títulos em maiúsculas nas anotações geralmente indicam momentos de ênfase — marcar como candidatos a seção ou callout.
- Observações pessoais pontuais do anotador (ex: uma reflexão isolada sobre um trecho) vão no campo `anotacoes[]`, nunca misturadas ao conteúdo da pregação.
- Com múltiplas pessoas anotando a mesma mensagem: cruzar fontes para preencher lacunas; quando uma complementa a outra, integrar organicamente; em divergência, priorizar a mais alinhada ao contexto bíblico.

### Precedência de fontes — quando transcrição E anotação estruturada coexistem

Situação distinta do Modo B "só anotações": aqui há **transcrição completa (Modo A)** e, além dela, uma **anotação estruturada de um membro** — feita in loco, seguindo a pregação do início ao fim (esboço com títulos, subtítulos e referências), não uma observação pontual solta.

Nesse caso, a anotação estruturada **não vai para `anotacoes[]`** — ela participa da geração do conteúdo principal, com a seguinte regra de precedência:

- **Títulos e subtítulos de seção** (`secoes[].titulo`, `mapa_pontos[].titulo`) — a anotação do membro tem precedência. Ela foi registrada in loco e reflete a nomenclatura real usada na pregação, algo que a transcrição por si só nem sempre preserva com fidelidade.
- **Referências bíblicas** (`secoes[].referencias`, `versiculo.referencia`) — a anotação do membro tem precedência quando presente. A transcrição frequentemente cita referências de forma imprecisa ou incompleta (ruído de fala/transcrição); quando a IA precisa inferir a referência a partir do contexto da transcrição sozinha, deve buscar o versículo mais coerente com o tema, mas isso é a alternativa de segundo grau, não a preferida.
- **Corpo do texto** (parágrafos, desenvolvimento de cada ponto) — a transcrição continua sendo a fonte mais rica, pois carrega a fala expandida do pregador. A anotação estruturada serve aqui como cross-check: confirma a ordem e a presença dos pontos, mas não substitui o desenvolvimento textual que só a transcrição tem.
- **Na ausência de anotação de membro** — a transcrição assume tudo, inclusive a definição de títulos/subtítulos. Nesse caso a IA define essas convenções de nomenclatura por conta própria, seguindo o padrão editorial já estabelecido nas pregações anteriores da mesma série.

> Esta regra é diferente da anterior (múltiplas pessoas anotando, sem transcrição) — lá as anotações entre si é que se cruzam. Aqui, é a transcrição e UMA anotação estruturada se cruzando, cada uma contribuindo com o que faz melhor.

---

## Schema de saída (JSON)

```json
{
  "metadados": {
    "serie": "Religião Tóxica",
    "capitulo": "Capítulo 2",
    "tema": "A Graça Não É o Que Você Pensa",
    "data": "26 de julho de 2026",
    "pregador": "Pastor Pedro Estrella",
    "texto_base": "Efésios 2.8–9",
    "modo_origem": "A",
    "tema_override": "opcional — string, nome exato de um tema registrado em estilos-pregacao.md (ex: 'Estilo #3', 'Padrão MINC'). Só usado quando serie for 'Avulsa' (ou qualquer série sem tema próprio) e a pregação precisar de um tema específico diferente do fallback Padrão MINC. Ausente/null → aplica o fallback normal. Ver 'Resolução de tema' em estilos-pregacao.md."
  },
  "banner_intro": {
    "contextualizacao": "opcional — string. Texto de recapitulação/enquadramento editorial, ex: 'Segundo capítulo da série X. No episódio anterior...'. Situa o leitor antes da frase-síntese. Distinto do conteúdo teológico da pregação — é metadado editorial sobre a mensagem, não fala do pregador. Omitir quando não aplicável (mensagem avulsa, primeira de uma série, etc).",
    "componente_tema": "opcional — mesmo formato de tipo/variante/dados usado em secoes[].corpo[], mas aqui vive no nível do header/introdução, não dentro de uma seção específica. Uso identificado na calibração: variante 'label_box' como síntese diagnóstica da mensagem inteira (ex: Antídoto/Toxina identificada/Status no tema Religião Tóxica). Só incluir quando o tema da série tiver esse tipo de componente de abertura — não é comum a toda pregação.",
    "versiculo_ancora": "opcional — objeto { referencia: string, texto: string }. Versículo-base citado por extenso, em destaque isolado, entre a frase-síntese e o índice (distinto de metadados.texto_base, que é só a referência curta usada como metadado/filtro). Identificado na calibração de 'A Religião Te Confundiu' — o HTML de referência isolava o texto-âncora completo antes do índice, não só citava a referência.",
    "frase_sintese": "string — frase de abertura em destaque"
  },
  "mapa_pontos": [
    { "id": "ponto-1", "numero": "01", "titulo": "string curto" }
  ],
  "secoes": [
    {
      "id": "ponto-1",
      "numero": "01",
      "titulo": "string",
      "sec_eyebrow": "rótulo semântico curto do papel da seção — ex: 'Fundação', 'Subtema 1', 'A Transição', 'Conclusão'. Opcional; a IA propõe com base na função do bloco no argumento da mensagem.",
      "referencias": "lista de referências bíblicas tocadas na seção, formatada como string única separada por ' · ' — ex: 'Gênesis 3.15 · Romanos 3.20 · Tiago 2.10'. Reflete todas as referências usadas no corpo desta seção, na ordem em que aparecem.",
      "corpo": [
        {
          "tipo": "paragrafo",
          "texto": "string, com palavras-chave marcadas como **texto**"
        },
        {
          "tipo": "versiculo",
          "referencia": "Efésios 2.8-9",
          "texto": "texto bíblico completo, versão ARA ou NVI"
        },
        {
          "tipo": "callout",
          "texto": "citação-chave da pregação"
        },
        {
          "tipo": "frase_chave",
          "texto": "usado quando a fonte já traz uma síntese formulada (comum no Modo B com esboço estruturado)"
        },
        {
          "tipo": "lista",
          "itens": ["string, com palavras-chave marcadas como **texto**", "string", "..."]
        },
        {
          "tipo": "componente_tema",
          "variante": "stage | diagnostico | antidoto | versus | contraste | verb_block | poeiras_grid | label_box | analogia | banho_list",
          "dados": "objeto específico da variante — ver 'Payloads de componente_tema por variante' abaixo"
        }
      ],
      "anotacoes": [
        {
          "autor": "Carlos",
          "texto": "observação pessoal exata, contextualizada neste ponto"
        }
      ]
    }
  ],
  "resumo_final": [
    { "ponto": "string curta", "versiculo_ancora": "referência, se houver" }
  ],
  "merch_section": {
    "titulo": "opcional — string, ex: 'Menções e Indicações do Pastor'. Omitir o campo inteiro quando não houver indicações.",
    "itens": [
      { "icone": "emoji", "titulo": "string curta", "descricao": "string" }
    ]
  },
  "celula_box": {
    "anotado_por": "opcional — string, nome de quem fez a anotação original (Modo B)",
    "compartilhado_por": "opcional — string, nome de quem vai compartilhar/conduzir na célula",
    "sugestao_uso": "opcional — string, orientação prática para a dinâmica de grupo (ex: 'as frases-chave de cada ponto são boas âncoras para a discussão — escolha uma ou duas conforme o tempo disponível')"
  },
  "nota_lacuna": [
    { "secao_id": "ponto-3", "texto": "não registrado nas anotações" }
  ]
}
```

### Notas sobre o schema

- **`metadados`** — os seis campos permanecem os mesmos do processo original (Série, Capítulo, Tema, Data, Pregador, Texto-base) mais `modo_origem` (`"A"` ou `"B"`). São a base direta da busca/filtro na biblioteca da plataforma.
- **`secoes[].sec_eyebrow`** e **`secoes[].referencias`** — dados estruturados, não texto solto. Faltavam no schema original e foram identificados na primeira calibração com material real (pregação *A Graça Não É o Que Você Pensa*): o HTML de referência já carregava esse rótulo semântico e essa lista de referências por seção como elementos próprios, então o JSON precisa capturá-los como campos, não deixar implícitos no corpo.
- **`corpo[].tipo`** — cada bloco de conteúdo é tipado (`paragrafo`, `versiculo`, `callout`, `frase_chave`, `lista`, `componente_tema`). A plataforma decide a apresentação visual de cada tipo conforme o tema ativo da série — o JSON nunca especifica cor, fonte ou componente HTML.
- **`lista`** — sequência simples de itens com marcador (equivalente a `.blist` no sistema visual: lista corrida sem numeração nem cards). Identificado na segunda calibração (pregação de Igrejar cap. 4, ex: "quando caminhamos em unidade..."). Diferente de `banho_list` (que é numerada e decorativa) e de `poeiras_grid` (cards com nome+descrição próprios) — `lista` é o caso simples, um `<ul>` de bullets.
- **`componente_tema`** — cobre componentes que só existem em temas específicos (ex: `.stage` do Estilo #1, `.diagnostico`/`.antidoto`/`.versus` de Religião Tóxica, `.verb-block`/`.poeiras-grid` de Igrejar, `.label-box` do 5b) **e também componentes universais reaproveitáveis entre séries** — caso de `analogia` (label + corpo + conclusão em destaque, usado para ilustrações/parábolas do pregador; identificado na calibração, disponível em qualquer tema, não exclusivo de uma série). Diferente dos outros tipos, o formato de `dados` varia por `variante` — não é uma questão de cor, é uma estrutura de dado própria (ex: `versus` precisa de dois lados, `diagnostico` precisa de uma lista, `analogia` precisa de label+corpo+conclusão). Os payloads de cada variante estão documentados em `estilos-pregacao.md`. **Regra de uso:** só incluir um bloco `componente_tema` quando o conteúdo da pregação genuinamente pede aquela estrutura (ex: uma dicotomia explícita e citável para `versus`, uma ilustração/parábola isolada para `analogia`) — não forçar o encaixe. Se a série não tiver esse componente no tema, ou se a plataforma não reconhecer a `variante`, o bloco deve cair no tratamento padrão (`paragrafo`), sem quebrar a renderização.
- **Palavras-chave** — marcadas inline no texto do parágrafo (ex: `**palavra**`), sem distinguir `.k1`/`.k2` — essa decisão de qual classe de destaque usar fica a cargo do tema/renderização, não do conteúdo.
- **`anotacoes[]`** — mantém o mesmo princípio do componente `.annotation` original: nome do autor + texto, associado ao `id` da seção correspondente. Renderizado pela plataforma como caixa inline discreta, seguindo o tema ativo.
- **`nota_lacuna[]`** — usado no Modo B quando uma parte do conteúdo não pode ser reconstituída com confiança a partir das anotações disponíveis. **Também usado no Modo A quando a transcrição tem ruído severo** (ver "Transcrição com ruído severo" abaixo) — nesse caso, `secao_id: "geral"` sinaliza uma ressalva sobre o documento inteiro, e entradas por seção sinalizam trechos específicos onde o texto gerado se apoia mais em reconstrução do que em confirmação direta da fonte.
- **`merch_section`** — campo de topo opcional (não faz parte de `secoes[]`), para a seção de indicações/menções do pregador (livros, redes sociais, ferramentas) comum em pregações de convidado ou eventos especiais. Omitir o campo inteiro quando a pregação não tiver esse conteúdo — não é parte do fluxo padrão de séries regulares da casa.
- **`celula_box`** — campo de topo opcional, equivalente ao componente `.celula-box` do Estilo #3 (nota de rodapé, não de header): quem anotou, quem vai compartilhar, e sugestão prática de uso da mensagem na dinâmica de célula. Identificado como lacuna real na calibração de "Jamais Será em Vão" — o primeiro JSON gerado colou uma versão truncada disso em `banner_intro.contextualizacao` (perdendo a frase de sugestão de uso) e no lugar errado (header em vez de rodapé). `celula_box` é conceitualmente distinto de `contextualizacao`: este último é enquadramento de abertura da mensagem; `celula_box` é metadado de processo e orientação de uso, e vive no fim do documento.

### Achado de implementação — `banner_intro` incompleto na primeira calibração

O primeiro JSON de calibração (*A Graça Não É o Que Você Pensa*) foi gerado sem os campos `contextualizacao` e `componente_tema` de `banner_intro` — o HTML de referência original tinha um parágrafo de recapitulação da série e um bloco `label_box` (ficha "Antídoto/Toxina identificada/Status") logo no header, mas o processo de extração de conteúdo focou nos blocos teológicos de `secoes[]` e não capturou esses dois elementos editoriais de abertura. Resultado: a implementação em código renderizou corretamente (o componente `label_box` existe e funciona), mas a tela ficou visualmente mais pobre que a referência original porque o **conteúdo** desses campos nunca chegou ao JSON. Corrigido retroativamente no JSON de calibração; o schema acima já reflete os campos corretos para conteúdo futuro. Lição: ao gerar o JSON de uma pregação a partir de um HTML de referência já existente, conferir explicitamente se o header/introdução do HTML tem elementos além da frase-síntese antes de considerar a extração completa.

### Transcrição com ruído severo — precedência e mitigação

Identificado na calibração com a pregação "De Volta ao Pai" (Pastor Naor Pedroza): transcrições de qualidade muito baixa (repetições duplicadas, palavras trocadas sem relação aparente, trechos ininteligíveis) tornam inviável reconstituir o conteúdo com confiança usando só a transcrição.

**Regra de precedência:** o **conteúdo e as referências bíblicas têm precedência** na montagem do material final — não o HTML por si só. Quando um HTML de referência já existe para aquela pregação, ele é usado como estrutura e como candidato de conteúdo, mas cada afirmação, versículo e cifra numérica precisa se sustentar no que a transcrição realmente permite confirmar (referências bíblicas tendem a sobreviver ao ruído melhor que a prosa ao redor). O HTML não é fonte de verdade automática — é o melhor material disponível para cruzar contra a transcrição, do mesmo jeito que a transcrição é cruzada contra anotações no Modo B.

**Mitigação — adiantar o tema principal:** ao enviar uma transcrição sabidamente ruidosa, informar o tema/assunto principal da pregação antes do texto ajuda a IA a interpretar palavras ambíguas ou trocadas com o viés correto em mente (o tema já carregado como contexto reduz erro de interpretação em trechos degradados). Isso é uma prática recomendada de entrada, não um campo do schema de saída.

Sinalizar em `nota_lacuna[]`, com `secao_id: "geral"`, que o documento se apoia significativamente no HTML pré-existente por causa do ruído da fonte bruta — e sinalizar por seção quaisquer trechos específicos (números, valores, detalhes práticos) onde o HTML e a transcrição não se confirmam mutuamente, para que Carlos possa verificar antes de publicar.

---

## Metadados da pregação — formato de entrada (inalterado)

Mesmo bloco de sempre, informado no início da mensagem ao anexar o material:

```
Série: Religião Tóxica
Capítulo: 2
Tema: A Graça Não É o Que Você Pensa
Data: 26 de julho de 2026
Pregador: Pastor Pedro Estrella
Texto-base: Efésios 2.8–9
Modo: A (transcrição)
```

---

## Anotações pessoais — formato de entrada (inalterado)

```
ANOTAÇÃO — [Nome da pessoa]
Ponto de referência: [título ou trecho da pregação onde inserir]
Texto: "[observação exata da pessoa]"
```

Vira, na saída, um item em `anotacoes[]` dentro da seção correspondente.

---

## O que este documento **não** define

- Paleta de cores, tipografia, componentes visuais e suas variantes — tudo isso está em `estilos-pregacao.md`, resolvido pela `Série` presente em `metadados`.
- Navegação (índice + FAB) — implementada como componente universal da plataforma, fora do escopo deste JSON.
- Regras de qual série usa qual tema, ou o que acontece quando não há tema definido (fallback) — também em `estilos-pregacao.md`.

---

## Exemplo de uso

### Modo A — com transcrição

```
Série: Igrejar
Capítulo: 2
Tema: Quem Está Lavando Seus Pés?
Data: 14 de junho de 2026
Pregador: Pastor Pedro Estrella
Texto-base: João 13.1-17
Modo: A (transcrição)

Siga as instruções deste markdown para gerar o conteúdo em JSON.

[Anexar transcrição .txt]
```

### Modo B — anotações de múltiplas pessoas

```
Modo B. Sem transcrição disponível.
Série: Avulsa
Tema: O Fim do Adultério Espiritual
Data: [se conhecida]
Pregador: Pr. Yan Augusto
Siga as instruções deste markdown para gerar o conteúdo em JSON.

--- ANOTAÇÕES: Raissa Moreira ---
[colar anotações]

--- ANOTAÇÕES: Talita Silva ---
[colar anotações]
```

---

## Compatibilidade e qualidade esperada

Mesma observação do processo original: este prompt foi desenvolvido e testado com **Claude Sonnet** como modelo de referência. As mesmas exigências de instruction-following denso, julgamento editorial, cruzamento de fontes e correção bíblica silenciosa se aplicam — a mudança de saída (JSON em vez de HTML) não reduz a complexidade do trabalho editorial, apenas separa esse trabalho da apresentação visual.

> Se o resultado não corresponder ao schema ou à qualidade esperada, o modelo utilizado é provavelmente o fator limitante — não o material fornecido nem o schema em si.
