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

## 5. Rascunhos no servidor — dimensionamento (próxima etapa)

**Recomendação: tabela própria no Neon**, não KV store novo. É a mesma stack já em uso, sem conta/serviço a mais, e o volume é minúsculo: cerca de 1 pregação/semana por líder, ~60KB de JSON cada. Mesmo 100 rascunhos dão ~6MB, frente aos 512MB do plano free do Neon.

```sql
-- db/migrations/0003_rascunhos_editoriais.sql
create table public.rascunhos_pregacao (
  id uuid primary key default gen_random_uuid(),
  lider text not null,              -- nome vindo de EDITORIAL_CODIGOS (nunca o código)
  arquivo text,                     -- preenchido na 1ª publicação; republicações reusam
  tema text not null default '',
  conteudo jsonb not null,          -- PregacaoConteudo parcial (rascunho pode estar incompleto)
  versao integer not null default 1,-- concorrência otimista: update exige versao atual
  atualizado_em timestamptz not null default now()
);
alter table public.rascunhos_pregacao enable row level security;  -- na mesma migração (CLAUDE.md)

create role editorial_rascunhos login password '...';
grant usage on schema public to editorial_rascunhos;
grant select, insert, update, delete on public.rascunhos_pregacao to editorial_rascunhos;
create policy "rascunhos: só o role editorial" on public.rascunhos_pregacao
  for all to editorial_rascunhos using (true) with check (true);
-- app_readonly NÃO recebe grant nenhum aqui; editorial_rascunhos NÃO recebe grant em pregacoes/quebra_gelos.
```

- Nova env var `DATABASE_URL_RASCUNHOS` (role `editorial_rascunhos`) só nas Vercel Functions `api/editorial/rascunhos*`. A regra "conteúdo editorial nunca tem escrita pelo app" continua intacta: rascunho não é conteúdo editorial publicado, é rascunho de trabalho, e o role não alcança `pregacoes`.
- Isolamento por líder (o `lider` vem do código validado no servidor, nunca do body). Visibilidade padrão: cada líder vê só os próprios rascunhos; o que está em revisão aparece para todos via PR.
- Concorrência otimista via `versao` (dois aparelhos do mesmo líder abertos ao mesmo tempo → o segundo save recebe 409 "rascunho mudou em outro aparelho", nunca sobrescreve em silêncio).
- `localStorage` fica só como cache de digitação ainda não salva (rascunho offline), nunca como única cópia.

Alternativas descartadas:
- **Upstash/Vercel KV**: serviço e credencial a mais, para um volume que o Postgres existente absorve sem custo.
- **Rascunho como draft PR no GitHub**: cada autosave viraria um commit e um preview deploy da Vercel. Cada preview cria uma branch no Neon, e o teto de 10 branches já foi atingido uma vez (hurdle de 2026-08-06).

## 6. Seed automático pós-merge (decisão pendente de Carlos)

Sem esta peça, o merge do PR leva o JSON ao repo, mas **não ao banco**: alguém ainda precisa rodar `npm run db:seed -- <arquivo>` manualmente. Isso é exatamente o passo que o projeto quer tirar do caminho crítico de Carlos.

Proposta: workflow do GitHub Actions disparado por `push` em `main` com `paths: content/pregacoes/**`, que roda o modo seletivo de `db-seed.ts` para cada arquivo alterado no commit (nunca o modo completo com truncate).

Exige uma credencial de banco fora do `.env.local`. Duas opções:

- **(recomendada) role novo `content_writer`**: `GRANT select, insert, update` só em `pregacoes`, mais policies RLS de insert/update só para esse role, e a credencial como *secret* do GitHub Actions. O app continua sem escrita: quem escreve é o CI, disparado pelo merge de Carlos.
- **`DATABASE_URL_ADMIN` como secret do GitHub**: mais simples, mas dá privilégio de owner a um runner de CI. Contraria a nota atual do CLAUDE.md ("`DATABASE_URL_ADMIN` só existe em `.env.local`").

Até esta decisão, o fluxo funciona com um passo manual de Carlos após o merge (um comando, sem editar JSON).

## 7. Editor visual (depois)

Ordem sugerida, cada item um PR:

1. **Painel mínimo**: rota `/editorial` em `src/router/`, botão discreto na `Library.tsx`, modal pedindo o código. O código fica em `localStorage` só para conveniência; o servidor valida sempre. Lista de rascunhos com status derivado (§3).
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
3. **Exportar/Copiar JSON** (fallback se GitHub/endpoint estiver fora, e para auditoria).
4. **Pré-visualização ao vivo** (`Reading.tsx`/`BlockRenderer.tsx` dentro do editor) — pós-MVP.
5. **Editar pregação já publicada**: carregar o JSON de `main` no editor. Hoje republicar exige ter o rascunho original.

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
4. Do "Publicar" do líder até a pregação no ar, o único passo de Carlos é o **merge do PR** (exige §6 decidido; até lá, merge + 1 comando).
5. JSON malformado é rejeitado no servidor antes de virar PR. O CI roda o mesmo validador contra todo `content/pregacoes/` (teste de regressão), então um arquivo inválido também nunca chega a `main`.
6. `npm run lint`, `npm test` e `npm run build` limpos em cada PR.
