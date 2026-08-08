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

**Canal principal: PWA.** Decisão fechada após avaliar update automático: distribuir o build nativo (APK) manualmente exigiria reinstalação a cada deploy — o mesmo tipo de atrito que motivou o projeto inteiro (ver problema original do HTML que quebra ao ser baixado, acima). Publicar em loja (Google Play/App Store) resolveria isso, mas exige conta de desenvolvedor, review a cada versão, e (se quiser update fora do ciclo de review) contratar um provedor de OTA/Live Updates de terceiro — mercado fragmentado e instável em 2026 (Ionic Appflow, a solução oficial, está sendo descontinuada; App Center também). PWA instalado direto do navegador atualiza sozinho a cada visita, sem loja, sem terceiro, sem custo — e já estava previsto desde a concepção do projeto.

**Build nativo (Capacitor→APK/loja): canal secundário.** Mantido para quem quiser um "app de verdade" instalado, ou como caminho futuro caso o projeto cresça a ponto de valer a pena publicar em loja — nesse cenário, reavaliar um provedor de Live Updates pago (ex: Capgo, OtaKit) como custo operacional normal, não como algo a resolver gratuitamente.

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

### V2 — Em andamento (desde 2026-08-05)

4. Mini-jogos multiplayer via lobby com QR code. Cada participante joga no próprio celular, sem tela central. Dois jogos já em produção: **Quem Sou Eu** (primeiro) e **Artista Impostor** (segundo, canvas colaborativo — ver §10). Detalhe de implementação e progresso real em `progresso.md` Fase 5, não duplicado aqui.

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
| Quem Sou Eu? | Instrucional + utilitário (com variante multiplayer V2, "Jogar pelo Celular") | Sorteador de nome com atribuição escondida |
| Encontre o Líder | Instrucional | Sorteador de papel especial (detetive) — opcional |
| Histórias de Uma Palavra Só | Instrucional | — |
| Artista Impostor | Instrucional + utilitário (com variante multiplayer V2, "Jogar pelo Celular" — canvas colaborativo) | Sorteador de nome/palavra + sorteador de papel especial (impostor) |
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
- **Backend + banco**: Neon (Postgres puro) desde 2026-08-01, acessado via Vercel Serverless Functions (`api/pregacoes/*`, `api/quebra-gelos/*`). Antes disso, Supabase — a escolha original (linha abaixo) continua válida como justificativa de "por que Postgres com `jsonb`"; o que mudou foi só o provedor.
  - **Motivo da troca**: Supabase free tier permite só 2 projetos ativos por pessoa (não por organização — confirmado que criar uma segunda organização Free não contorna o limite), limite já ocupado por outros projetos de Carlos, sem orçamento disponível pro Pro ($25/mês). Neon foi escolhido entre as alternativas Postgres gratuitas avaliadas (Railway: sem tier grátis permanente, é crédito de teste; Render: banco free expira em 30 dias e é deletado) por ser o único com tier gratuito permanente de verdade, e por ser Postgres puro — portar o schema e o conteúdo já existente (`jsonb`, RLS, as mesmas 2 tabelas) não exigiu remodelar nada, só trocar a camada de acesso (de PostgREST/client SDK para Vercel Functions + `@neondatabase/serverless`, já que Neon não expõe REST/auth/realtime prontos como o Supabase). Detalhe técnico completo da migração em `CLAUDE.md` ("Decisões de arquitetura (Migração Neon)" e hurdles de 2026-08-01).
  - **Auth anônima do Supabase nunca chegou a ser usada de fato** (confirmado ao migrar: zero chamada `supabase.auth.*` em qualquer lugar do código) — "sem login tradicional" sempre foi resolvido por não ter auth nenhuma, não por uma feature de auth anônima ativa. Isso não muda com Neon.
  - ~~Realtime nativo do Supabase, cotado para a V2 multiplayer, precisa de mecanismo novo~~ — resolvido: **Playroom Kit**, não um serviço de realtime genérico. Neon nunca precisou de equivalente próprio porque a sincronização da V2 não passa pelo banco — vive inteiramente no backend do Playroom (ver §10 e `CLAUDE.md`).
- **Hospedagem**: Vercel para o frontend e para o backend (Serverless Functions); Neon hospeda só o banco.
- **Alternativa descartada (histórico, na escolha original Supabase vs. outros, e reconfirmada na reavaliação pós-limite do Supabase)**: Firebase cobriria auth+banco+realtime da mesma forma, mas seu modelo NoSQL é menos confortável para consultas estruturadas (busca por série, palavra-chave) do que Postgres/jsonb — trocar para NoSQL exigiria reescrever RLS como Firestore Security Rules e remodelar o JSON de pregação pro limite de profundidade de documento do Firestore, custo desproporcional ao problema real (limite de projetos), que uma alternativa Postgres resolve sem reescrita. Descartado nas duas ocasiões.

### Segurança

- **Row Level Security (RLS) obrigatório** em toda tabela — mesmo sem "conta de usuário", é o que impede leitura/escrita livre via API pública.
- **Conteúdo editorial é somente leitura para o app**: pregações e quebra-gelos (gerados por Carlos/Claude) nunca são editáveis pelo usuário final. Dado efêmero de sessão (resultado de sorteio, nome digitado numa dinâmica) pode ter escrita livre, por não ter valor de permanência.
- **Rate limiting nos utilitários** (ex: Vercel Firewall/`@vercel/firewall` ou Upstash + `@upstash/ratelimit`, no ecossistema atual pós-Neon) para evitar abuso trivial, já que os utilitários não exigem autenticação para serem acionados. Ainda não implementado — utilitários são 100% client-side sem chamada de rede hoje, então não há superfície a proteger; vira requisito real no dia em que ganharem backend.
- **Sem PII persistida**: nome/número informados numa dinâmica não são guardados além da sessão, a não ser que histórico seja explicitamente desejado depois — simplifica LGPD por natureza (dado não guardado não precisa ser protegido).

### Modularidade — espaço para crescer sem reescrever

Preocupação central: a chegada da V2 (multiplayer) não pode forçar reescrever a V1. Estrutura pensada em camadas desde já:

- **Camada de conteúdo** (pregações, quebra-gelos estáticos) — já isolada via JSON + tema (seções 4.3 e 5). Não muda quando a V2 chegar.
- **Camada de utilitários locais** (sorteio single-device da V1) — desenhada como módulo isolado (ex: um hook/serviço próprio por utilitário). Quando a V2 precisar de sincronização multiplayer, esse módulo é **estendido**, não reescrito do zero — mecanismo concreto de sincronização em aberto desde a migração para Neon (ver seção 8).
- **Roteamento por feature**: cada quebra-gelo e utilitário vive na própria rota/módulo desde o início, evitando um app monolítico onde adicionar um jogo da V2 exige mexer em código não relacionado.

### Práticas de desenvolvimento com IA (referência: artigo "Do Zero à Pós-Produção em 1 Semana", Akita)

Carlos usa esse artigo como base para seu processo de desenvolvimento assistido por IA. Lições diretamente aplicáveis ao Projeto Célula quando a fase de código começar:

- **Segurança não emerge sozinha da IA.** O agente "implementa o que você pede, mas raramente sugere proteções que você não pediu" (SSRF, rate limiting, encryption at rest). Os requisitos de segurança já definidos acima (RLS obrigatório, conteúdo editorial somente leitura, rate limiting, sem PII persistida) precisam estar escritos num documento vivo do projeto (equivalente a um `CLAUDE.md`) — não assumir que a IA vai lembrar ou sugerir isso sem essa instrução explícita.
- **TDD nasce junto com o código, não depois.** O contraste do artigo (projeto sem testes exigiu 6 "cirurgias de emergência"; projeto com 1.323 testes teve zero paradas forçadas) sugere que mesmo os utilitários simples da V1 (sorteador, contador) devem nascer com teste, não como algo adicionado depois que o código "já funciona".
- **Refactoring contínuo é disciplina, não decisão única.** A separação em camadas (seção acima) evita acúmulo de dívida técnica se for mantida ativamente — não é suficiente desenhar a arquitetura bonita uma vez; exige poda regular conforme features são adicionadas.
- **O humano decide o quê, a IA decide o como.** Trazer contexto e objetivo para o agente, deixar a implementação por conta dele, mas continuar questionando decisões de arquitetura propostas (ex: recusar over-engineering, como uma state machine complexa quando um caso simples resolve).
- **Documento vivo do projeto.** Os três markdowns do Projeto Célula (`projeto-celula.md`, `estilos-pregacao.md`, `geracao-pregacao.md`) já seguem esse padrão — cada calibração adicionou uma lição aprendida em vez de documentação estática escrita uma única vez. Esse padrão continua na fase de código: `CLAUDE.md`, no repositório, registra hurdles técnicos e decisões de arquitetura pelo mesmo princípio.

---

## 8. Decisões em aberto

- ~~Estrutura de dados definitiva do JSON de saída das pregações~~ — resolvida e implementada (`src/content/types.ts`), validada com as 4 pregações reais de calibração já no banco. Ver `geracao-pregacao.md`.
- ~~Formato do arquivo de tema por série~~ — resolvido e implementado (`src/themes/registry.ts`, 6 temas registrados como dados). Ver `estilos-pregacao.md`.
- ~~Arquitetura da camada multiplayer da V2~~ — implementada e em produção desde 2026-08-07: lobby via QR code + Playroom Kit, dois jogos completos (Quem Sou Eu, Artista Impostor). Ver §10 para decisões de produto e `CLAUDE.md` ("Decisões de arquitetura (V2 — Quem Sou Eu)" / "(V2 — Artista Impostor)") para o detalhe técnico.
- ~~Mecanismo de sincronização real-time da V2, pós-migração para Neon~~ — resolvido: **Playroom Kit**, sem envolver o Neon nem exigir WebSocket próprio hospedado pela Vercel. As alternativas cotadas aqui (Pusher, Ably, Colyseus) não foram necessárias.

## 9. Fluxo de geração de conteúdo (decidido)

**O HTML continua sendo gerado no domingo**, via o processo já existente — velocidade e mobilidade importam mais nesse momento do que o formato final. Calibração para JSON acontece depois, sem pressa, sempre nesta conversa (não no Claude Code) — o Claude Code só recebe o JSON já pronto para popular o banco.

**Objetivo explícito da calibração**: não é só extrair conteúdo corretamente — é aproximar ao máximo a qualidade estética do resultado final renderizado à do HTML original. Feedback registrado: o HTML tem direção artística mais agradável que a primeira versão renderizada em JSON (caso do `label_box`/`contextualizacao` ausentes, corrigido). Diagnóstico: a causa raiz não é a extração de conteúdo pontual — é que `estilos-pregacao.md` ainda não captura todo o repertório visual que um HTML bem feito carrega. Cada nova calibração deve ser tratada também como oportunidade de auditar se o sistema de temas está capturando a riqueza visual da fonte, não só o conteúdo teológico.

---

## 10. V2 — Decisões de produto e arquitetura

Escopo de produto da V2: um jogo por vez em desenvolvimento — **Quem Sou Eu foi o primeiro jogo** (prioridade trocada em relação ao plano original, que era começar pelo Artista Impostor: a mecânica de QR code abaixo resolve Quem Sou Eu de forma mais direta e serviu como validação do lobby antes do Artista Impostor, que tem mais partes móveis — canvas colaborativo, turnos de desenho). **Artista Impostor é o segundo jogo, em produção desde 2026-08-07** — ver subseção própria abaixo. Host é quem cria o lobby, sem regra fixa de que precise ser sempre "o líder" da V1.

### Decisões de produto fechadas

- **Líder pode participar do jogo sem vazamento.** Diferente da V1 (onde quem configura o setup corre risco de ver dados sensíveis antes do sorteio), na V2 a atribuição acontece no servidor/estado sincronizado — o host nunca precisa "ver" os valores dos outros para configurar a partida. Resolve de raiz a classe de bug que apareceu duas vezes na V1 (Artista Impostor e Quem Sou Eu).
- **Revelação simultânea, não sequencial.** A V1 usa o fluxo de passagem sequencial (`spec-privacidade-sorteio.md`) porque só existe um celular físico circulando. Na V2, cada participante tem o próprio celular conectado à sessão — não há razão para fila de revelação um por vez. Todos veem seu próprio resultado ao mesmo tempo, cada um na própria tela.
- **Desconexão: o jogo continua sem a pessoa, com chance de reconectar.** Se um participante perde conexão ou sai, a partida segue para os demais — o estado dela permanece na sessão por um tempo, permitindo retomar se for problema de conexão (não é descartada imediatamente).

### Mecânica do primeiro jogo — Quem Sou Eu via QR code

Desenhada por Carlos, resolve o vazamento de valores para o organizador sem exigir fluxo de passagem de celular:

1. Organizador escolhe a categoria e toca em Sortear — o servidor/estado da sessão já decide os valores que serão distribuídos, mas ainda sem atrelar a nenhuma pessoa física.
2. Um QR code aparece na tela do organizador — é a **porta de entrada da sessão de rede** (fixo durante a partida, não muda a cada leitura), não carrega a palavra em si.
3. Cada participante escaneia o mesmo QR code com o próprio celular — ao entrar na sessão, o servidor atribui a essa pessoa um dos valores ainda não distribuídos, por ordem de chegada (mecanismo padrão de estado sincronizado multiplayer — é o gancho `onPlayerJoin` do Playroom Kit, ver "Tecnologia" abaixo).
4. No celular de quem escaneou: aviso de alguns segundos → instrução "coloque o celular na sua testa" → a palavra aparece em caixa alta, orientação horizontal, ocupando a tela — réplica digital do post-it na testa do jogo original.
5. **Variante com organizador participando**: se o organizador quiser jogar também, depois de escanear e ver a instrução de 7 segundos, a palavra pode ficar oculta e a pessoa tentando adivinhar "toca" na testa da outra pessoa (segurando o próprio celular na própria testa) para revelar — mecânica ainda a detalhar na prática, mas o princípio (visibilidade controlada por interação, não por quem configurou) já está definido.

**Importante**: o QR code não é "o valor" — é o link de entrada da sala. A atribuição de valores por pessoa acontece no momento em que cada participante entra na sessão, gerenciada pelo estado compartilhado da partida, não pelo QR code em si (que permanece fixo).

### Tecnologia para lobby + sincronização

Duas opções avaliadas, ambas resolvem sincronização de estado entre celulares diferentes:

- **Playroom Kit** (joinplayroom.com) — **escolhido como caminho principal, viabilidade técnica confirmada em 2026-08-05** lendo a documentação oficial e testando um protótipo real (lobby + `onPlayerJoin` + distribuição de valores) contra o backend do Playroom. "Zero server setup": o SDK cuida da camada de rede/estado compartilhado, sem precisar hospedar/manter servidor próprio. Modelo host-autoritativo, `onPlayerJoin` e `reconnectGracePeriod` encaixam exatamente com as decisões de produto fechadas acima — detalhe técnico completo em `CLAUDE.md`. As duas pendências técnicas iniciais estão **fechadas**: re-escanear o mesmo QR não duplica participante, reconecta como a mesma identidade/sala (testado em device físico); e sala/QR não expira por tempo — o estado é limpo quando todos os jogadores saem, sem timeout fixo (confirmado na doc oficial "Persistent Storage in Playroom Kit", já que não pretendemos usar `persistentMode`). O exemplo oficial "Live Canvas" (mecânica de desenho colaborativo por polling de traços) foi de fato usado como referência real na implementação do Artista Impostor — não ficou só como pista útil, virou o mecanismo de sincronização do canvas em produção. Funciona com React nativamente. Free tier descrito como "generous" — limites reais não confirmados em detalhe, seguiu suficiente pros dois jogos até agora.
- **Colyseus** (colyseus.io) — **alternativa documentada, não escolhida agora**. Open source, framework de servidor de jogo Node.js com estado autoritativo — mais robusto para lógica de servidor complexa (turnos validados, anti-trapaça), mas exige hospedar/manter um servidor (mesmo via Colyseus Cloud gerenciado, que tem free tier). Descartado como primeira escolha por adicionar mais uma peça de infraestrutura a manter, no mesmo período em que o projeto já lida com a fricção de limites de plano gratuito (ver migração Neon, §7). Revisitar se Playroom Kit não atender bem na prática.

### Segundo jogo — Artista Impostor (em produção desde 2026-08-07)

Canvas colaborativo com sorteio de impostor + objeto secreto, decisões de produto fechadas por Carlos em 2026-08-06/07:

- **Turno livre, não travado pelo app** — diferente do jogo físico original (que também nunca teve trava real, era só combinado verbal), o app não implementa lógica de "vez de quem"; qualquer participante pode desenhar a qualquer momento, por decisão consciente de simplicidade (evita estado compartilhado de lock, que não agregaria à experiência real de uma célula desenhando junto).
- **Todos acompanham o desenho se formando ao vivo**, não só quem está desenhando no momento — resolvido pela própria arquitetura de sincronização do canvas (ver "Tecnologia" acima), sem trabalho de produto extra.
- **Votação híbrida**: o app atribui uma cor fixa a cada participante (referência tanto pra apontar fisicamente quanto pra votar digital); votação digital é opcional — quem preferir decide na conversa/apontando, sem quebrar o jogo. O app revela só o resultado agregado (achou ou não achou o impostor), nunca quem votou em quem, preservando a dinâmica social. Depois do resultado, pergunta se quer jogar outra rodada.
- **Organizador não participa da rodada** (mesma decisão já tomada informalmente no Quem Sou Eu) — só conduz: escolhe categoria, sorteia, acompanha o canvas, controla a transição pra votação e pro resultado.

Testado de ponta a ponta em produção real (device físico + QR code) em 2026-08-07 — ver `progresso.md` Fase 5 para o relato do teste e `CLAUDE.md` para o detalhe técnico de implementação.

### Achado paralelo — não é a V2, mas vale como feature própria

**`KnotzerIO/find-the-impostor`** (github.com/KnotzerIO/find-the-impostor, licença MIT) — jogo de "impostor não sabe a palavra secreta" (variante diferente do Artista Impostor: aqui não há desenho colaborativo, é revelação de palavra + rodadas de pista falada + votação). Interessante não pela tecnologia (Next.js + Zustand + Dexie/IndexedDB — stack diferente da do projeto) mas pelo **fluxo de UX**: setup de jogadores → atribuição de papéis → "players take turns looking at their phone/device privately" → discussão → votação — muito próximo do `spec-privacidade-sorteio.md` já implementado na V1. É **local-first** (sem rede, sem servidor), não multiplayer de verdade — por isso não resolve o problema técnico da V2, mas é candidato a **feature própria futura** quando o app for divulgado mais amplamente, como evolução natural da V1 sem precisar de nenhuma infraestrutura de rede nova.

### Pendências (não bloqueiam, ainda não são spec de implementação)

- **Quem Sou Eu**: detalhamento de interação da variante "toca na testa do outro" (organizador participando) ainda não feito — organizador segue só conduzindo, não jogando. Decisão equivalente pro Artista Impostor já foi tomada de forma definitiva (organizador não participa, ponto final — ver subseção acima), então essa pendência é específica do primeiro jogo, não um padrão geral em aberto.
- ~~Timeout do aviso "coloque na testa"~~ (Quem Sou Eu) — implementado fixo em 7 segundos (`useCountdown`, subiu de 3s após feedback de usuário — 3s era curto demais em aparelhos mais lentos; ainda não ajustável). Ainda em aberto: se a palavra some sozinha depois de aparecer ou fica até interação — hoje fica revelada indefinidamente, sem esconder de volta. (Não se aplica ao Artista Impostor, que não usa esse mecanismo de revelação — ver subseção acima.)
- ~~Direção da rotação da tela de revelação~~ (Quem Sou Eu) — testado em device físico e confirmado: `rotate(-90deg)`. Ver `CLAUDE.md`.
- Comportamento se alguém escaneia sem que o organizador tenha aberto o QR ainda, ou outros edge cases de ordem de operações — parcialmente exercitado nos testes de ponta a ponta dos dois jogos (2026-08-06/07), mas sem varredura sistemática de edge case; segue como algo que só aparece testando de verdade, não spec fechada.
- Artista Impostor testado até agora só com participantes de teste (device físico + 2 abas simulando participantes) — teste com um grupo real de célula (3+ pessoas de verdade) ainda não aconteceu.

---

## Documentos relacionados

- `estilos-pregacao.md` — registro dos estilos visuais por série, extraído do markdown de compartilhar original, reformulado como definição de tema.
- `geracao-pregacao.md` — evolução do markdown de geração de resumo, adaptado para saída em JSON estruturado em vez de HTML completo.
- `mock-prompt.md` — prompt descritiva do projeto inteiro (visão + módulos + identidade visual), para geração de mock visual. v2 aprovada por Carlos.
- `mock-aprovado-v2.html` — mock visual gerado a partir da prompt v2, validado como referência visual do projeto ("moderno, sleek, parece um app").
- `progresso.md` — checklist de acompanhamento por fase, vive no repositório de código (não em ferramenta externa).
- `CLAUDE.md` (raiz do repositório de código) — documento vivo da fase de código: recursos/IDs do projeto (Neon, Vercel, GitHub), requisitos de segurança, decisões de arquitetura e hurdles técnicos. Não duplica o conteúdo destes markdowns — complementar, focado em *como construir*.
- `db/migrations/` (repositório de código) — schema do banco (Neon) e RLS, versionados.
- `content/pregacoes/` (repositório de código) — os JSONs de calibração reais, servindo de fixture para testes e referência de conteúdo real.
