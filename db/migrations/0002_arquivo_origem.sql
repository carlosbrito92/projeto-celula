-- Coluna de chave natural pra upsert seletivo em scripts/db-seed.ts. Antes
-- desta migração não havia forma confiável de identificar "essa é a mesma
-- pregação/quebra-gelo de antes" (serie+capitulo+tema colide: capitulo é
-- opcional, tema é texto livre) — o único mapeamento 1:1 real já existente é
-- arquivo de content/ -> linha, então o nome do arquivo vira a chave.
-- Nullable porque linhas já existentes não têm como derivar o nome do
-- arquivo original; ficam preenchidas no próximo `npm run db:seed` (modo
-- completo, sem argumento) rodado depois desta migração.
alter table public.pregacoes add column arquivo_origem text unique;
alter table public.quebra_gelos add column arquivo_origem text unique;

comment on column public.pregacoes.arquivo_origem is
  'Nome do arquivo em content/pregacoes/ (ex: calibracao-x.json) — chave natural pro modo seletivo de db-seed.ts.';
comment on column public.quebra_gelos.arquivo_origem is
  'Nome do arquivo em content/quebra-gelos/ ou content/utilitarios/ — chave natural pro modo seletivo de db-seed.ts.';
