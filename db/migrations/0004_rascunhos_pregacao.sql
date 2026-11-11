-- Rascunhos do Painel Editorial no servidor — decisão de Carlos, 2026-11-09.
-- Ver docs/painel-editorial.md §5 e CLAUDE.md "Requisitos de segurança" item 2.
--
-- Rascunho NÃO é conteúdo editorial (decisão de Carlos, 2026-11-09): é trabalho
-- em andamento de um líder, que só vira conteúdo depois de publicado via PR e
-- mergeado por Carlos. Por isso pode ter escrita a partir de api/, com um role
-- próprio que não alcança pregacoes nem quebra_gelos.
--
-- Isolamento por líder em duas camadas:
--   1. toda query de api/_lib/rascunhos.ts filtra por `lider`;
--   2. RLS: o role só enxerga/escreve linhas cujo `lider` é igual a
--      current_setting('app.lider'), definido por transação (set_config local)
--      a partir do nome validado no servidor — nunca vindo do body.
--   Sem app.lider definido, current_setting(..., true) devolve null e nada casa.
--
-- A senha do role NÃO fica neste arquivo: definida fora do repo logo depois de
-- aplicar a migração (`alter role editorial_rascunhos password '...'`).
--
-- Aplicar direto via psql (db:schema não é idempotente — ver CLAUDE.md):
--   psql "$DATABASE_URL_ADMIN" -v ON_ERROR_STOP=1 -f db/migrations/0004_rascunhos_pregacao.sql

create table public.rascunhos_pregacao (
  id uuid primary key default gen_random_uuid(),
  lider text not null check (length(lider) between 1 and 200),
  arquivo text,
  tema text not null default '',
  conteudo jsonb not null,
  versao integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index rascunhos_pregacao_lider_idx
  on public.rascunhos_pregacao (lider, atualizado_em desc);

alter table public.rascunhos_pregacao enable row level security;

do $$
begin
  if not exists (select from pg_roles where rolname = 'editorial_rascunhos') then
    create role editorial_rascunhos login;
  end if;
end
$$;

grant usage on schema public to editorial_rascunhos;
grant select, insert, update, delete on public.rascunhos_pregacao to editorial_rascunhos;

create policy "Rascunhos: cada líder só os próprios"
  on public.rascunhos_pregacao
  for all
  to editorial_rascunhos
  using (lider = current_setting('app.lider', true))
  with check (lider = current_setting('app.lider', true));

-- app_readonly e pregacoes_seed NÃO recebem grant nesta tabela;
-- editorial_rascunhos NÃO recebe grant em pregacoes/quebra_gelos.
