-- Tabelas iniciais de conteúdo editorial (pregações, quebra-gelos) + RLS.
-- Migrado de supabase/migrations/20260729104623_initial_tables_rls.sql na
-- troca de backend Supabase -> Neon. Schema idêntico; a única mudança real
-- é a policy de leitura, que passa de "to anon, authenticated" (papéis
-- geridos pelo Supabase via troca de JWT por request) para um único role
-- de aplicação fixo `app_readonly` (ver CLAUDE.md — não há autenticação
-- real neste app para justificar dois papéis).
--
-- Este arquivo assume que o role `app_readonly` já existe (criado via
-- console do Neon, aba Roles — nunca via este script, para nunca expor a
-- senha do role de leitura em texto/repo). Rodado uma vez via
-- scripts/db-schema.mjs com DATABASE_URL_ADMIN (role owner/admin do Neon).

create table public.pregacoes (
  id uuid primary key default gen_random_uuid(),
  serie text,
  capitulo text,
  tema text not null,
  data date,
  pregador text,
  texto_base text,
  modo_origem text check (modo_origem in ('A', 'B')),
  conteudo jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pregacoes is
  'Conteúdo editorial de pregações (gerado via geracao-pregacao.md). Somente leitura para o app — escrita só via DATABASE_URL_ADMIN, fora do client.';

create index pregacoes_serie_idx on public.pregacoes (serie);
create index pregacoes_tema_idx on public.pregacoes (tema);
create index pregacoes_pregador_idx on public.pregacoes (pregador);

create table public.quebra_gelos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('instrucional', 'utilitario', 'instrucional_utilitario')),
  utilitario text,
  conteudo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.quebra_gelos is
  'Catálogo de quebra-gelos (projeto-celula.md §5). Somente leitura para o app — escrita só via DATABASE_URL_ADMIN, fora do client.';

-- RLS: obrigatório em toda tabela (CLAUDE.md — sem exceção). Com um único
-- role de aplicação fixo, a policy "using (true)" não filtra linha nenhuma
-- por si só — quem faz o trabalho de controle de acesso aqui é o
-- REVOKE/GRANT abaixo. RLS fica habilitado mesmo assim como defesa em
-- profundidade barata (um GRANT futuro malfeito ainda não habilita
-- escrita, já que não existe nenhuma policy de insert/update/delete) e
-- para manter a disciplina do projeto sem exceção.
alter table public.pregacoes enable row level security;
alter table public.quebra_gelos enable row level security;

create policy "Leitura pública de pregações"
  on public.pregacoes
  for select
  to app_readonly
  using (true);

create policy "Leitura pública de quebra-gelos"
  on public.quebra_gelos
  for select
  to app_readonly
  using (true);

-- Privilégio a nível de role: no Supabase isso vinha implícito do papel
-- anon/authenticated gerido por eles. Aqui o role é nosso, o grant precisa
-- ser nosso também — nega tudo por padrão, libera só SELECT.
revoke all on public.pregacoes, public.quebra_gelos from public;
grant select on public.pregacoes, public.quebra_gelos to app_readonly;
grant usage on schema public to app_readonly;
