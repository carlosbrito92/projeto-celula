# Projeto Célula

## 1. Visão geral

### O problema

O sistema atual de resumos de pregação produz arquivos HTML autocontidos (estilo + conteúdo), gerados via um prompt de IA a partir de transcrições ou anotações de célula. Esses arquivos funcionam bem quando visualizados diretamente, mas **quebram quando baixados** para uso no compartilhar de célula — recursos como o índice flutuante (FAB) dependem de comportamento de navegador/WebView que nem sempre está disponível no contexto de arquivo local.

Além disso, cada resumo é uma peça isolada: não há um lugar único onde líderes e membros possam encontrar pregações passadas, buscar por tema, ou acessar outros recursos de apoio à célula (quebra-gelos, dinâmicas, geradores).

### A solução

Uma **plataforma unificada** (web app instalável) que hospeda:
- A biblioteca de resumos de pregação, com navegação e temas visuais preservados independente de como o usuário acessa
- Quebra-gelos e dinâmicas de célula, com utilitários de apoio (sorteio, atribuição, contagem)
- Futuramente, mini-jogos multiplayer para uso em célula

### Distribuição

Web app único, empacotado via **Capacitor** para funcionar tanto como PWA instalável quanto como build nativo para Android e iOS — uma única base de código, sem manter apps separados por plataforma.

---

## 2. Público e acesso

- **Dois tipos de usuário**: líderes de célula e membros. **Não há hierarquia de permissão no sistema.** "Líder" não é um papel técnico — é só quem naturalmente conduz o encontro. Qualquer pessoa presente pode acionar utilitários (sorteio, gerador, etc), usar ou criar quebra-gelos, sem checagem de papel. A aplicação precisa ser fluida o suficiente para que qualquer um use sua criatividade, independente de hierarquia.
- **Sem tela de gestão.** Não há cadastro de membros da célula, histórico de encontros, ou qualquer função administrativa — decisão explícita de manter o escopo enxuto. O único "papel" real é situacional: quem está conduzindo a dinâmica naquele momento.
- **Sem sistema de login tradicional.** Não há coleta de informação crítica. No máximo, nome e/ou número são solicitados quando uma feature específica exigir (ex: sorteios nomeados, futuras salas multiplayer).

---

## 3. Escopo por fase

### V1 — Prioridade atual

1. Biblioteca de pregações (mais recente em destaque + busca simples por palavra-chave/tema)
2. Catálogo de quebra-gelos (instrucionais + utilitários)
3. Kit de utilitários compartilhados (sorteio, atribuição, contagem)

### V2 — Depois

4. Mini-jogos multiplayer via lobby com QR code (ex: Pictionary, Impostor). Cada participante joga no próprio celular, sem tela central. Prioridade menor — entra depois que V1 estiver consolidada.

---

## 4. Módulo: Pregações

### 4.1 Biblioteca

- Lista de pregações com a **mais recente em destaque**.
- **Busca simples** por palavra-chave e tema. Pregações antigas podem não ter data registrada — a busca não pode depender disso.
- Metadados por pregação (já formalizados no processo atual de geração): Série, Capítulo/Episódio, Tema/Título, Data, Pregador, Texto-base, Modo de origem (A/B). Esses campos são os candidatos naturais a filtros de busca.

### 4.2 Sistema de temas por série

Cada **série** de pregações tem identidade visual própria — hoje isso é resolvido gerando HTML/CSS customizado por mensagem, com paleta extraída de fotos de palco, ou definida editorialmente pelo tom do conteúdo quando não há referência visual. Esse histórico de decisões está preservado em `estilos-pregacao.md`.

Na plataforma, isso vira um **sistema de temas programático**:
- Cada série tem um tema (paleta de cores, tipografia, variantes de componente) aplicado automaticamente a qualquer pregação daquela série.
- Pregações avulsas (sem série) usam o **padrão MINC** ou um dos estilos já registrados.
- Quando uma referência visual oficial da série surge depois da primeira mensagem já publicada (caso real: Estilo #5 → #5b em *Religião Tóxica*), o tema da série é atualizado e **todas as pregações daquela série herdam a mudança retroativamente** — sem precisar regenerar cada resumo individualmente. Essa é uma vantagem direta de separar conteúdo de apresentação.

### 4.3 Geração de conteúdo — o que muda e o que não muda

O processo de geração via IA (Claude) **continua o mesmo em essência**: transcrição ou anotações são enviadas, o modelo identifica pontos principais, versículos, callouts, palavras-chave, cruza múltiplas fontes de anotação quando aplicável, etc. Esse trabalho editorial não é automatizável sem perda de qualidade e permanece manual/assistido por IA.

**O que muda é o formato de saída**: em vez de HTML+CSS completo, o Claude passa a gerar **conteúdo estruturado (JSON)** — os mesmos campos e decisões editoriais de sempre, só que como dados, não como marcação visual. A plataforma aplica o tema da série sobre esses dados para renderizar.

Essa mudança está documentada e especificada em `geracao-pregacao.md` (evolução do markdown de geração atual, adaptado para saída em JSON).

### 4.4 Navegação — índice + botão flutuante

Requisito original: evitar que o usuário fique fazendo scroll repetitivo em pregações extensas.

Isso **já foi resolvido e testado** no sistema atual (ver Estilo #3 em `estilos-pregacao.md`): índice clicável no topo, cada seção com `id` e `scroll-margin-top`, botão flutuante (FAB) que aparece via `IntersectionObserver` quando o índice sai da viewport e usa `scrollIntoView` interceptando o clique (não confiar em `href="#id"` puro — falha em alguns WebViews, incluindo o de apps mobile).

Na plataforma, isso vira um **componente único e reutilizável** — implementado uma vez, corrigido uma vez, funcionando em toda pregação, em vez de reproduzido em cada HTML gerado. Cores do FAB seguem o acento primário do tema da série ativa.

---

## 5. Módulo: Quebra-gelos

### 5.1 Tipos

- **Instrucional/estático**: orienta como conduzir a dinâmica (regras, número de jogadores, idade recomendada, tempo, preparação, como jogar). Não exige interação de software além da leitura.
- **Utilitário**: dinâmicas cuja preparação já pressupõe uma ferramenta de sorteio/geração (ex: atribuir nomes secretos, decidir quem é o impostor). Nesses casos, as próprias instruções originais já descrevem o comportamento esperado do software.

### 5.2 Fluxo de página

Cada quebra-gelo é uma página com:
- Texto de regras/instrução (jogadores, idade, tempo, preparação, como jogar) — fiel ao material de referência.
- Botão de utilitário embutido inline, quando o jogo pede (ex: "Sortear impostor", "Atribuir nomes").

### 5.3 Catálogo (em construção)

Lista de quebra-gelos recebidos e catalogados até o momento — Carlos envia o material aos poucos e cada um é classificado por tipo e utilitário associado.

| Quebra-gelo | Tipo | Utilitário usado |
|---|---|---|
| Quem Sou Eu? | Instrucional + utilitário | Sorteador de nome com atribuição escondida |
| Encontre o Líder | Instrucional | Sorteador de papel especial (detetive) — opcional |
| Histórias de Uma Palavra Só | Instrucional | — |
| Artista Impostor | Instrucional + utilitário (protótipo da v2 multiplayer) | Sorteador de nome/palavra + sorteador de papel especial (impostor) |
| Eu Fui à Feira | Instrucional | — |
| Medusa | Instrucional | Contador/cronômetro (opcional) |
| Psíquico | Instrucional | Contador/cronômetro (opcional) |
| Psicólogo | Instrucional | — |
| Contact | Instrucional | Sorteador de papel especial (mestre da palavra) — opcional |

---

## 6. Kit de utilitários compartilhados

Peças reutilizáveis entre múltiplos quebra-gelos, com valor mesmo antes de qualquer camada multiplayer:

1. **Sorteador de nome/palavra com atribuição escondida** — sorteia e atribui um valor por jogador, visível apenas aos outros (ou oculto conforme a dinâmica). Base para "Quem Sou Eu" e prototipa o mecanismo central do "Artista Impostor".
2. **Sorteador de papel especial** — escolhe um jogador para um papel distinto (detetive, impostor, mestre da palavra).
3. **Contador/cronômetro** — apoio simples para dinâmicas com tempo ou contagem em grupo (Medusa, Psíquico).

---

## 7. Stack técnica

- **Frontend**: React + Capacitor (build único para Android, iOS e PWA — decisão de distribuição já fixada na seção 1).
- **Backend + banco**: Supabase — Postgres com colunas `jsonb` acomodando o schema de pregação já desenhado sem modelagem campo a campo; auth anônima/opcional nativa, compatível com "sem login tradicional"; Realtime nativo (WebSocket) é o mecanismo natural para a V2 multiplayer, evitando troca de banco quando essa fase chegar.
- **Hospedagem**: Vercel para o frontend; Supabase hospeda o backend.
- **Alternativa descartada**: Firebase cobriria auth+banco+realtime da mesma forma, mas seu modelo NoSQL é menos confortável para consultas estruturadas (busca por série, palavra-chave) do que Postgres/jsonb — descartado em favor de Supabase.

### Segurança

- **Row Level Security (RLS) obrigatório** em toda tabela — mesmo sem "conta de usuário", é o que impede leitura/escrita livre via API pública.
- **Conteúdo editorial é somente leitura para o app**: pregações e quebra-gelos (gerados por Carlos/Claude) nunca são editáveis pelo usuário final. Dado efêmero de sessão (resultado de sorteio, nome digitado numa dinâmica) pode ter escrita livre, por não ter valor de permanência.
- **Rate limiting nos utilitários** (ex: Supabase Edge Functions com throttle) para evitar abuso trivial, já que os utilitários não exigem autenticação para serem acionados.
- **Sem PII persistida**: nome/número informados numa dinâmica não são guardados além da sessão, a não ser que histórico seja explicitamente desejado depois — simplifica LGPD por natureza (dado não guardado não precisa ser protegido).

### Modularidade — espaço para crescer sem reescrever

Preocupação central: a chegada da V2 (multiplayer) não pode forçar reescrever a V1. Estrutura pensada em camadas desde já:

- **Camada de conteúdo** (pregações, quebra-gelos estáticos) — já isolada via JSON + tema (seções 4.3 e 5). Não muda quando a V2 chegar.
- **Camada de utilitários locais** (sorteio single-device da V1) — desenhada como módulo isolado (ex: um hook/serviço próprio por utilitário). Quando a V2 precisar de sincronização multiplayer, esse módulo é **estendido** para usar Supabase Realtime, não reescrito do zero.
- **Roteamento por feature**: cada quebra-gelo e utilitário vive na própria rota/módulo desde o início, evitando um app monolítico onde adicionar um jogo da V2 exige mexer em código não relacionado.

### Práticas de desenvolvimento com IA (referência: artigo "Do Zero à Pós-Produção em 1 Semana", Akita)

Carlos usa esse artigo como base para seu processo de desenvolvimento assistido por IA. Lições diretamente aplicáveis ao Projeto Célula quando a fase de código começar:

- **Segurança não emerge sozinha da IA.** O agente "implementa o que você pede, mas raramente sugere proteções que você não pediu" (SSRF, rate limiting, encryption at rest). Os requisitos de segurança já definidos acima (RLS obrigatório, conteúdo editorial somente leitura, rate limiting, sem PII persistida) precisam estar escritos num documento vivo do projeto (equivalente a um `CLAUDE.md`) — não assumir que a IA vai lembrar ou sugerir isso sem essa instrução explícita.
- **TDD nasce junto com o código, não depois.** O contraste do artigo (projeto sem testes exigiu 6 "cirurgias de emergência"; projeto com 1.323 testes teve zero paradas forçadas) sugere que mesmo os utilitários simples da V1 (sorteador, contador) devem nascer com teste, não como algo adicionado depois que o código "já funciona".
- **Refactoring contínuo é disciplina, não decisão única.** A separação em camadas (seção acima) evita acúmulo de dívida técnica se for mantida ativamente — não é suficiente desenhar a arquitetura bonita uma vez; exige poda regular conforme features são adicionadas.
- **O humano decide o quê, a IA decide o como.** Trazer contexto e objetivo para o agente, deixar a implementação por conta dele, mas continuar questionando decisões de arquitetura propostas (ex: recusar over-engineering, como uma state machine complexa quando um caso simples resolve).
- **Documento vivo do projeto.** Os três markdowns do Projeto Célula (`projeto-celula.md`, `estilos-pregacao.md`, `geracao-pregacao.md`) já seguem esse padrão — cada calibração adicionou uma lição aprendida em vez de documentação estática escrita uma única vez. Esse padrão deve continuar quando a fase de código começar, registrando hurdles técnicos conforme aparecerem.

---

## 8. Decisões em aberto

- Estrutura de dados definitiva do JSON de saída das pregações — ver `geracao-pregacao.md`.
- Formato do arquivo de tema por série (extraído dos estilos existentes) — ver `estilos-pregacao.md`.
- Arquitetura da camada multiplayer da V2 (lobby via QR code, sincronização de estado em tempo real) — camada de extensão já prevista na modularidade acima, detalhamento fica para quando a V2 entrar em pauta.

---

## Documentos relacionados

- `estilos-pregacao.md` — registro dos estilos visuais por série, extraído do markdown de compartilhar original, reformulado como definição de tema.
- `geracao-pregacao.md` — evolução do markdown de geração de resumo, adaptado para saída em JSON estruturado em vez de HTML completo.
- `mock-prompt.md` — prompt descritiva do projeto inteiro (visão + módulos + identidade visual), para geração de mock visual. v2 aprovada por Carlos.
- `mock-aprovado-v2.html` — mock visual gerado a partir da prompt v2, validado como referência visual do projeto ("moderno, sleek, parece um app").
- `progresso.md` — checklist de acompanhamento por fase, vive no repositório de código (não em ferramenta externa).
