-- Role do seed automático pós-merge (CI) — decisão de Carlos, 2026-11-08.
-- Ver CLAUDE.md, "Requisitos de segurança" item 2 e "Decisões de arquitetura
-- (Painel Editorial)".
--
-- Escopo deliberadamente mínimo:
--   - só a tabela public.pregacoes (nada em quebra_gelos)
--   - só SELECT/INSERT/UPDATE — sem DELETE, sem TRUNCATE
--     (SELECT é necessário: INSERT ... ON CONFLICT DO UPDATE checa a policy
--     de SELECT da linha existente quando RLS está habilitado)
--   - credencial usada apenas pelo workflow .github/workflows/seed-pregacoes.yml,
--     como secret DATABASE_URL_SEED de um GitHub Environment restrito à main.
--     Nunca nas env vars da Vercel, nunca em api/.
--
-- A senha NÃO fica neste arquivo: definida fora do repo, logo depois de
-- aplicar a migração (`alter role pregacoes_seed password '...'` numa sessão
-- psql com DATABASE_URL_ADMIN).
--
-- Aplicar direto via psql (db:schema reaplica todos os .sql e não é
-- idempotente — ver CLAUDE.md):
--   psql "$DATABASE_URL_ADMIN" -v ON_ERROR_STOP=1 -f db/migrations/0003_role_seed_pregacoes.sql

do $$
begin
  if not exists (select from pg_roles where rolname = 'pregacoes_seed') then
    create role pregacoes_seed login;
  end if;
end
$$;

grant usage on schema public to pregacoes_seed;
grant select, insert, update on public.pregacoes to pregacoes_seed;

create policy "Seed CI: leitura de pregações"
  on public.pregacoes
  for select
  to pregacoes_seed
  using (true);

create policy "Seed CI: inserção de pregações"
  on public.pregacoes
  for insert
  to pregacoes_seed
  with check (true);

create policy "Seed CI: atualização de pregações"
  on public.pregacoes
  for update
  to pregacoes_seed
  using (true)
  with check (true);
