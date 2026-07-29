-- Tabelas iniciais de conteúdo editorial (pregações, quebra-gelos) + RLS.
-- Modelagem completa (blocos de conteúdo, tema por série, catálogo de utilitários)
-- fica para Fase 2/3 — aqui só o suficiente para fundação técnica + segurança.

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
  'Conteúdo editorial de pregações (gerado via geracao-pregacao.md). Somente leitura para o app — escrita via service role.';

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
  'Catálogo de quebra-gelos (projeto-celula.md §5). Somente leitura para o app — escrita via service role.';

-- RLS: obrigatório em toda tabela (projeto-celula.md §7).
-- Conteúdo editorial é somente leitura para o app: sem policy de insert/update/delete
-- para anon/authenticated, então RLS nega escrita por padrão nesses papéis.
alter table public.pregacoes enable row level security;
alter table public.quebra_gelos enable row level security;

create policy "Leitura pública de pregações"
  on public.pregacoes
  for select
  to anon, authenticated
  using (true);

create policy "Leitura pública de quebra-gelos"
  on public.quebra_gelos
  for select
  to anon, authenticated
  using (true);
