# Painel Editorial — plano de implementação

Status de cada etapa: ver `docs/progresso.md` § "Painel Editorial" (única fonte de verdade de progresso — este documento é o *plano*, não o checklist).

## 1. Problema

Criar uma pregação nova hoje exige editar JSON à mão, git e `db-seed.ts` — só Carlos sabe operar esse pipeline, e não tem tempo livre na semana pra isso. Os colaboradores previstos são **outros líderes de célula**, com conhecimento teológico igual ou maior que o de Carlos: o julgamento editorial não precisa passar por ele. O gargalo é só técnico.

Restrições que não mudam:

- O app continua 100% gratuito, anônimo, sem login para líderes e membros.
- **Conteúdo editorial continua somente leitura para o app** (CLAUDE.md, segurança, item 2). O painel nunca escreve em `pregacoes`/`quebra_gelos`.
- `content/pregacoes/*.json` continua sendo a fonte de verdade do conteúdo. `db-seed.ts` continua funcionando exatamente como hoje.

## 2. Decisões (Carlos, 2026-11-07)

| Tema | Decisão |
|---|---|
| Fonte de verdade | Commit/PR via GitHub API em `content/pregacoes/`. Carlos revisa e dá merge. Nada é escrito direto no banco. |
| Autenticação | Um código por líder, numa env var da Vercel (`EDITORIAL_CODIGOS`), validado **no servidor** em cada request. Revogar = remover a entrada. No client, o código só decide mostrar/esconder a tela. |
| Rascunhos | Salvos no servidor (troca de aparelho / limpeza de dados do navegador não perde nada). Dimensionamento em §5. |
| Correção pós-publicação | Republicar = novo commit substituindo o mesmo arquivo (§4.3). |
| `scripts/db-delete.ts` | Fora do escopo deste plano. |

## 3. Fluxo de ponta a ponta

```
Líder (painel)           Vercel Function                GitHub                  Carlos              Banco (Neon)
──────────────           ───────────────                ──────                  ──────              ────────────
edita rascunho  ──────▶  /api/editorial/rascunhos  ──▶  (tabela de rascunhos, §5)
"Publicar"      ──────▶  /api/editorial/publicar
                           1. valida código (401)
                           2. valida schema (422 + lista de erros)
                           3. abre/atualiza PR  ───────▶  branch editorial/<slug>-<id>
                                                          PR "Nova pregação: X"
                                                          CI (lint/test/build)
                                                                         ──▶  revisa, dá merge
                                                          push em main
                                                          workflow de seed (§6) ─────────────────────▶  upsert do arquivo
```

Status visto pelo líder é **derivado**, não um campo editado à mão:
- **Rascunho** — existe só na tabela de rascunhos.
- **Em revisão** — tem PR aberto.
- **Publicado** — PR mergeado (e seed rodado).

## 4. Endpoint de publicação — implementado (PR desta etapa)

### 4.1 Contrato

`POST /api/editorial/publicar` (`api/editorial/publicar.ts`)

- Header `X-Editorial-Codigo: <código do líder>`
- Body `{ pregacao: PregacaoConteudo, arquivo?: string }`
  - sem `arquivo`: pregação nova. Nome derivado de `metadados.tema` (+ `capitulo`) por `slugArquivo` (`a-graca-nao-e-o-que-voce-pensa.json`)
  - com `arquivo`: republicação de um arquivo existente
- Respostas:
  - `200 { ok, prUrl, prNumero, prNovo, arquivo, avisos }`
  - `401` código inválido
  - `422 { erros[], avisos[] }` schema inválido; cada erro tem `caminho` (`secoes[2].corpo[0].referencia`) e `mensagem`, pro editor apontar o campo exato
  - `409` pregação nova cujo nome já existe em `main`
  - `400` / `413` / `502` (falha no GitHub, mensagem genérica)

### 4.2 Validação de schema — `src/content/validarPregacao.ts`

Mesmo módulo no servidor (fonte de verdade) e, depois, no editor (validação em tempo real, só UX). Espelha `PregacaoConteudo` de `src/content/types.ts`:

- `metadados.serie`/`tema` obrigatórios. `data` no formato PT-BR (`parseDataPtBr`); formato não reconhecido vira **aviso** (o conteúdo real tem `"27-28 de maio de 2026"`).
- `mapa_pontos[]` e `secoes[]`: ids únicos, cada seção numerada tem ponto correspondente, cada ponto não-`pendente` tem seção. Seção com `numero` vazio (encerramento/aplicação) pode ficar fora do mapa.
- `corpo[].tipo`: só os 11 tipos com renderer (`paragrafo`, `versiculo`, `callout`, `frase_chave`, `lista`, `subtitulo`, `citacao`, `glossario`, `pergunta`, `resposta`, `componente_tema`). Tipo desconhecido = **erro**, porque o texto sumiria da leitura.
- `componente_tema`: os `dados` de cada variante conhecida são validados (`analogia` = `{label, corpo[], conclusao}` etc.). Variante desconhecida = **aviso** (o renderer ignora com segurança).
- `resumo_lider.pontos[]` = `{numero: number, titulo, resumo, frase_chave}`; `resumo_curto`; `resumo_final`.
- **Teste de regressão** roda o validador contra todo `content/pregacoes/*.json` real.

> **Achado do teste de regressão (bug real em produção):** 6 arquivos usam `stage` com `texto`/`sub` em vez de `frase`/`subtitulo`. `ComponenteTemaRenderer` só lê `frase`, então a declaração some na leitura e só o label aparece. Corrigido no PR #68; `PENDENCIAS_CONHECIDAS` no teste está vazia. Qualquer erro novo de conteúdo quebra o CI.

### 4.3 PR via GitHub — `api/_lib/github.ts`

Cliente REST mínimo (fetch, sem octokit):

1. Procura PR aberto cuja branch seja deste arquivo (`editorial/<slug>-<sufixo base36>`; o sufixo sem hífen evita confundir `nova.json` com `nova-parte-2.json`).
2. Arquivo existe em `main`?
   - pregação nova + existe → 409, nada é escrito
   - republicação + não existe (nem em PR aberto) → 404
3. Sem PR aberto: cria a branch a partir de `main`. Com PR aberto: reaproveita a branch dele.
4. Faz o commit do arquivo (com `sha` quando substitui).
5. Abre o PR, cujo corpo cita o líder, ou só retorna o PR existente.

**Republicar cobre a correção pós-publicação?** Sim, para editar texto, com duas ressalvas:
- **Antes do merge**, republicar = novo commit no mesmo PR (Carlos revisa um PR só).
- **Depois do merge**, republicar = novo PR substituindo o arquivo. No banco, o upsert por `arquivo_origem` atualiza a mesma linha. Verificado em 2026-11-07: as 22 linhas de `pregacoes` têm `arquivo_origem` preenchido.
- **Não cobre remover uma pregação** (arquivo apagado do repo não some do banco; modo seletivo do seed só faz upsert). Remoção continua manual, fora deste plano.
- **Não cobre renomear o tema de forma que mude o nome do arquivo.** O editor precisa guardar o `arquivo` original no rascunho e mandar sempre o mesmo nome em republicações.

### 4.4 Autenticação — `api/_lib/editorialAuth.ts`

- `EDITORIAL_CODIGOS="Nome:codigo;Nome 2:codigo2"` (separador nome/código = último `:`).
- Códigos com menos de 16 caracteres são **ignorados** (logado só o nome, nunca o código). Gerar com alfabeto de 32 símbolos (ex: `k7q2-m9xv-p4tz-w8hc`) = 80 bits, inviável por força bruta.
- Comparação por hash SHA-256 + `timingSafeEqual`, percorrendo a lista inteira.
- CORS `*` é seguro aqui: autenticação por header explícito, não cookie.

### 4.5 Configuração necessária antes de funcionar (Carlos)

1. **GitHub**: criar um *fine-grained personal access token* restrito a `carlosbrito92/projeto-celula`, com permissões `Contents: Read and write` e `Pull requests: Read and write`, e expiração definida. Ele não consegue escrever em `main` (branch protection com `enforce_admins`), só em branches `editorial/*`.
2. **Vercel** (Production + Preview):
   - `GITHUB_TOKEN_EDITORIAL` = o token acima
   - `EDITORIAL_CODIGOS` = lista de líderes
3. **Recomendado**: ativar "Automatically delete head branches" no repo, para não acumular branches `editorial/*` mergeadas.

## 5. Rascunhos no servidor — implementado (2026-11-10)

**Tabela própria no Neon**, não KV store novo. É a mesma stack já em uso, sem conta/serviço a mais, e o volume é minúsculo: cerca de 1 pregação/semana por líder, ~60KB de JSON cada. Mesmo 100 rascunhos dão ~6MB, frente aos 512MB do plano free do Neon. Teto de 50 rascunhos por líder (`MAX_RASCUNHOS_POR_LIDER`), 512KB por rascunho.

**Rascunho não é conteúdo editorial** (decisão de Carlos, 2026-11-09): é trabalho em andamento, que só vira conteúdo depois de publicado via PR e mergeado. Por isso pode ter escrita a partir de `api/`, com um role próprio que não alcança `pregacoes` nem `quebra_gelos`.

- **Migração `db/migrations/0004_rascunhos_pregacao.sql`** (aplicada no Neon em 2026-11-10): tabela `rascunhos_pregacao` (`id`, `lider`, `arquivo`, `tema`, `conteudo jsonb`, `versao`, `criado_em`, `atualizado_em`) com RLS, role `editorial_rascunhos` só com `SELECT`/`INSERT`/`UPDATE`/`DELETE` nessa tabela.
- **Isolamento por líder em duas camadas.** O nome do líder vem sempre do código validado no servidor, nunca do body.
  1. Toda query de `api/_lib/rascunhos.ts` filtra por `lider`.
  2. A policy RLS só deixa ver ou gravar linhas com `lider = current_setting('app.lider', true)`. Cada query roda numa transação que faz `set_config('app.lider', <nome>, true)` antes. Sem o setting, nada casa.
  - Testado no banco real com o role: sem `app.lider` o insert falha e o select volta vazio; um líder não vê, não altera e não apaga linha de outro, nem consegue gravar com o nome de outro; `pregacoes`/`quebra_gelos` dão `permission denied`.
- **Rotas** (header `X-Editorial-Codigo` obrigatório):
  - `GET /api/editorial/rascunhos`: lista os rascunhos do líder, sem `conteudo`.
  - `POST /api/editorial/rascunhos`: cria, com `{ conteudo, arquivo? }`.
  - `GET /api/editorial/rascunhos/:id`: rascunho completo.
  - `PUT /api/editorial/rascunhos/:id`: salva, com `{ conteudo, versao, arquivo? }`.
  - `DELETE /api/editorial/rascunhos/:id`: apaga.
- **Concorrência otimista via `versao`.** `PUT` com versão antiga recebe 409 `{ versaoAtual }` ("rascunho mudou em outro aparelho") e nunca sobrescreve em silêncio.
- **Rascunho pode estar incompleto.** Não passa pelo validador de publicação; só exige que `conteudo` seja um objeto. `tema` é copiado de `conteudo.metadados.tema` para a listagem.
- **Credencial `DATABASE_URL_RASCUNHOS`** (role `editorial_rascunhos`): só nas env vars da Vercel (Production), usada só por `api/_lib/rascunhosHandler.ts`.
- **Rate limit:** a regra do Vercel Firewall em `/api/editorial` também vale para os rascunhos. Ela passou de 10 para **30 requisições/60s** em 2026-11-11, por decisão de Carlos: com 10, o primeiro minuto de uso do editor (abrir o painel, criar, abrir o editor e os primeiros salvamentos) ficava perto do limite, e o teste em produção de 2026-11-11 bateu no 403. O limite provavelmente é contado por IP, e nesse caso vários líderes no mesmo Wi-Fi somariam as chamadas. Com códigos de ≥80 bits, 30/min não torna força bruta viável. O editor (§7) precisa de autosave com debounce (por exemplo, salvar no máximo a cada 15s e ao sair da tela), não a cada tecla.
- `localStorage` fica só como cache de digitação ainda não salva (rascunho offline), nunca como única cópia.

Alternativas descartadas:
- **Upstash/Vercel KV**: serviço e credencial a mais, para um volume que o Postgres existente absorve sem custo.
- **Rascunho como draft PR no GitHub**: cada autosave viraria um commit e um preview deploy da Vercel. Cada preview cria uma branch no Neon, e o teto de 10 branches já foi atingido uma vez (hurdle de 2026-08-06).

## 6. Seed automático pós-merge — implementado (2026-11-08)

Decisão de Carlos: seed automático, com as condições abaixo. Os detalhes de segurança estão no CLAUDE.md, item 2.

- **Workflow** `.github/workflows/seed-pregacoes.yml`:
  - roda em `push` na `main` (nunca em `pull_request`);
  - faz upsert seletivo de cada `.json` de `content/pregacoes/` adicionado ou modificado no push;
  - `concurrency` com grupo único e sem cancelamento.
- **Credencial**: role `pregacoes_seed` (migração `0003`), só `SELECT`/`INSERT`/`UPDATE` em `pregacoes`. Fica como secret `DATABASE_URL_SEED` do Environment `seed-producao`, restrito à `main`.
- **Validação** (`validarPregacao`) dentro do `db-seed.ts`, antes de qualquer escrita. Falha = job vermelho, e o GitHub notifica.
- **Não propaga**: remoção e renomeação de arquivo (manual).
- **Gate**: o merge manual de Carlos, que dá para fazer pelo app do GitHub no celular. Sem auto-merge.

## 7. Editor visual (depois)

Ordem sugerida, cada item um PR:

1. **Painel mínimo**: rota `/editorial` em `src/router/`, botão discreto na `Library.tsx`, modal pedindo o código. O código fica em `localStorage` só para conveniência; o servidor valida sempre. Lista de rascunhos com status derivado (§3).
   - **Implementado em 2026-11-11** (`src/screens/editorial/Painel.tsx`, `src/editorial/`). A entrada por código é uma tela, não um modal.
   - **Status derivado sem chamar o GitHub:** sem `arquivo` = Rascunho; `arquivo` presente em `pregacoes.arquivo_origem` (lista pública `/api/pregacoes`) = Publicado; caso contrário = Em revisão.
   - **Limitação conhecida:** uma correção enviada de uma pregação já publicada continua aparecendo como "Publicado" até o merge. Para distinguir, o editor (§7.2) teria que guardar a versão enviada.
   - **CORS:** `Access-Control-Max-Age: 600` nas rotas com header customizado. Sem isso, cada chamada do painel geraria um preflight `OPTIONS` e contaria em dobro no rate limit do Firewall.
2. **Formulário guiado**, gerando exatamente `PregacaoConteudo`:
   - **Dados gerais**: `metadados.{tema, serie, capitulo, pregador, data (seletor de data → formato PT-BR), texto_base}`.
   - **Visual**: escolher série/tema de `src/themes/registry.ts`. O tema é resolvido pela `serie`; série nova sem tema próprio usa `metadados.tema_override`.
   - **Banner**: `frase_sintese`, `contextualizacao`, `versiculo_ancora`.
   - **Pontos e seções**: cada ponto do `mapa_pontos` gera sua seção (ids sincronizados automaticamente, sem o líder ver "id").
   - **Blocos de corpo**: Parágrafo, Versículo (referência + texto), Frase-chave, Callout (aplicação prática), Lista, Pergunta/Resposta, Citação.
   - **Componentes visuais** (`componente_tema`): Analogia (`label`, `corpo[]`, `conclusao`), Declaração (`stage`: `label`, `frase`, `subtitulo`), Diagnóstico, Contraste.
   - Ordenação subir/descer/remover.
   - **Resumo do líder**: `resumo_lider.{frase_tema, pontos[{numero, titulo, resumo, frase_chave}], versiculo_chave}`, com `pontos` pré-gerados a partir do `mapa_pontos`.
   - Validação em tempo real com o mesmo `validarPregacao`, destacando o campo pelo `caminho` do erro.
   - **Implementado em 2026-11-11** (`src/screens/editorial/Editor.tsx`, `src/screens/editorial/editor/`, `src/editorial/modelo.ts`):
     - **Pontos:** cada ponto do índice nasce, some e muda de lugar junto com a sua seção. A renumeração ("01", "02"…) só acontece quando toda a numeração já é desse formato; seções extras sem número e pontos pendentes são preservados.
     - **Títulos:** o título no índice e o título da seção herdam um do outro quando um está vazio. A lista de pendências mostra um aviso só.
     - **Blocos:** parágrafo, versículo, frase-chave, destaque, lista, subtítulo, pergunta, resposta, citação, analogia, declaração (`stage`), diagnóstico e contraste. Blocos de outros tipos em conteúdo carregado (ex.: `timeline`, `glossario`) aparecem como "mantido como está" e podem ser movidos ou removidos.
     - **Antes de validar e de enviar:** `limparParaPublicar` remove campos opcionais vazios e linhas vazias de listas. Os caminhos dos erros continuam batendo com a tela, porque só campos são removidos, nunca itens de `secoes`/`corpo`.
     - **Autosave:** salva 4s depois da última edição, no mínimo 15s depois do último salvamento e no máximo 30s depois da primeira edição não salva; também salva quando a aba vai para segundo plano. O `localStorage` guarda o que ainda não subiu, junto com a versão de base, e o cache é descartado se o servidor estiver mais novo.
     - **Conflito (409):** pausa o autosave e oferece "Usar a versão salva" ou "Manter a minha".
     - **Envio:** "Enviar para revisão" manda o JSON limpo para `/publicar`. O `arquivo` devolvido é gravado no rascunho, e o próximo envio vira "Enviar correção", com o mesmo arquivo.
   - **Usabilidade, 1ª rodada (2026-11-11):**
     - **Negrito:** `src/editorial/negrito.ts`, função pura; só nos campos que o app renderiza com `**destaque**`. Não entra em frase-síntese, título nem declaração (`stage.frase`), que são exibidos como texto puro.
     - **Índice com pendências por parte:** `src/editorial/navegacao.ts` agrupa o caminho de cada erro pelo trecho da tela onde ele se corrige.
     - **Exemplos:** `src/editorial/exemplos.ts`. Trechos com `fonte` precisam existir literalmente na pregação citada, e `exemplos.test.ts` quebra o CI se um exemplo for inventado ou o conteúdo mudar.
   - **Usabilidade, 2ª rodada (2026-11-11):**
     - **Título:** a tela mostra um campo só, "Título do ponto" (`mapa_pontos[i].titulo`). `secoes[i].titulo` fica vazio e é herdado em `limparParaPublicar`. O campo de título diferente na leitura abre sozinho só se o rascunho já tiver um título diferente ao carregar, ou se houver erro nele.
     - **Inserir no meio:** `adicionarBloco(c, s, tipo, posicao)`.
     - **Remoção:** `blocoVazio` decide se pede confirmação. O rótulo "Analogia" pré-preenchido não conta como texto.
3. **Exportar/Copiar JSON** (fallback se GitHub/endpoint estiver fora, e para auditoria).
   - **Implementado em 2026-11-11**, junto com a geração por IA (pedido de Carlos):
     - **Copiar/Baixar JSON** no fim do editor, com o mesmo `limparParaPublicar` do envio.
     - **"Gerar com IA / importar JSON"** no painel (`src/screens/editorial/GerarComIA.tsx`), em três passos: copiar ou baixar o prompt, copiar o modelo de metadados e colar a resposta da IA ou escolher o arquivo.
     - **Prompt:** é o `docs/geracao-pregacao.md` inteiro, importado com `?raw` só quando o líder pede, mais um apêndice (`src/editorial/promptIA.ts`) com os payloads de `componente_tema` e as séries com tema. O doc remete a `estilos-pregacao.md`, que o líder não tem. Um teste roda cada payload do apêndice contra o validador.
     - **Importação:** `extrairJson` aceita cercas \`\`\`json e texto em volta. O resultado vira rascunho novo via `normalizar`, sem validar. O que faltar aparece como pendência no editor.
     - **Limite:** blocos que o editor não edita (ex.: `timeline`, `versus`) e têm erro só podem ser removidos ou corrigidos pedindo de novo à IA.
4. **Pré-visualização ao vivo** (`Reading.tsx`/`BlockRenderer.tsx` dentro do editor) — pós-MVP.
   - **Implementado em 2026-11-11** (`src/screens/editorial/Previa.tsx`):
     - O corpo da Leitura saiu de `Reading.tsx` para `src/screens/pregacoes/ConteudoLeitura.tsx`, usado pela Leitura e pela prévia. Não existe uma segunda renderização para manter.
     - A prévia mostra `limparParaPublicar(conteudo)`, ou seja, o JSON que seria enviado, com o tema resolvido pela série e `useDeferredValue` para não atrasar a digitação.
     - No celular, cobre a tela ("Voltar a editar" ou Esc). A partir de 1100px, fica na metade direita e acompanha a digitação ao lado do editor.
5. **Editar pregação já publicada**: carregar o JSON de `main` no editor. Hoje republicar exige ter o rascunho original.
   - **Implementado em 2026-11-11** (`src/editorial/publicadas.ts`, `src/screens/editorial/CorrigirPublicada.tsx`):
     - **"Corrigir pregação publicada"** no painel lista as pregações de `/api/pregacoes` cujo `arquivo_origem` tem o formato publicável. `Teste Pregação.json` fica de fora.
     - **Fonte do JSON:** o arquivo em `main` via `raw.githubusercontent.com` (repositório público, sem credencial). A coluna `conteudo` do banco é `jsonb`, que não guarda a ordem das chaves, e o PR de correção viraria um diff do arquivo inteiro. O banco só é usado se o GitHub não responder. O CDN do raw pode servir uma versão de até ~5 min atrás logo depois de um merge.
     - **Rascunho já nasce com o `arquivo`**, então o editor mostra "Enviar correção" e o envio substitui o mesmo arquivo: um PR novo ou um commit novo no PR aberto desse arquivo. Se o líder já tem um rascunho desse arquivo, o painel abre esse rascunho em vez de criar outro.
     - **Teste:** toda pregação de `content/pregacoes/` passa por `normalizar` + `limparParaPublicar` e valida sem erro, ou seja, abre no editor e pode ser reenviada sem mexer.
     - **Limite:** se outro líder tem um PR aberto do mesmo arquivo, o envio entra nesse PR e substitui a versão dele. A revisão do Carlos é o que pega isso.

Fora do escopo:
- merge de rascunho "publicado" direto na Biblioteca local (substituído pelo fluxo PR + seed, que valida antes)
- remoção de pregação pelo painel

## 8. Riscos conhecidos

- **Branches do Neon**: cada PR editorial gera um preview da Vercel e uma branch no Neon (integração nativa, hurdle de 2026-08-06). Com publicações semanais, o teto de 10 volta a ser atingido mais rápido. Mitigações:
  - limpeza periódica
  - deletar branch do git no merge (a integração pode ou não limpar a branch Neon junto — confirmar)
  - avaliar desligar o branch-por-preview no Neon, já que o preview usa só leitura
- **Rate limiting** (CLAUDE.md, segurança, item 4): o endpoint agora é superfície de rede pública. A proteção contra força bruta vem da entropia do código (≥80 bits). Abuso por um líder válido é limitado pela revisão de Carlos no PR, e o token GitHub não escreve em `main`. Antes de distribuir códigos, configurar uma regra de rate limit no Vercel Firewall para `/api/editorial/*` (barato, sem código).
- **Token GitHub vazado** (env var da Vercel comprometida): o token só cria branches e PRs, sem conseguir mergear em `main`. Revogar no GitHub e trocar.

## 9. Critérios de sucesso

1. Líderes e membros continuam abrindo o app sem login e sem mudança visual.
2. Um líder cria uma pregação em menos de 15 minutos sem ver JSON, terminal ou git.
3. Fontes e paletas vêm sempre dos temas registrados (`src/themes/registry.ts`), nunca de escolha livre.
4. Do "Publicar" do líder até a pregação no ar, o único passo de Carlos é o **merge do PR** (§6).
5. JSON malformado é rejeitado no servidor antes de virar PR. O CI roda o mesmo validador contra todo `content/pregacoes/` (teste de regressão), então um arquivo inválido também nunca chega a `main`.
6. `npm run lint`, `npm test` e `npm run build` limpos em cada PR.
