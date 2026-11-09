// Popula pregações + quebra-gelos/utilitários a partir de content/*.json contra
// o Neon. Rodado manualmente via `tsx scripts/db-seed.ts` com DATABASE_URL_ADMIN
// — nunca em runtime deployado. Reaproveita parseDataPtBr (nunca inserir a
// string PT-BR crua na coluna `data`, ver CLAUDE.md).
//
// Sem argumento: modo completo (truncate + reprocessa content/ inteiro).
// Com argumento (path pro .json): modo seletivo — upsert só desse arquivo,
// sem truncate, via `on conflict (arquivo_origem)` (ver CLAUDE.md, migração
// 0002_arquivo_origem.sql).
//
// Credencial: DATABASE_URL_SEED (role pregacoes_seed, migração 0003 — usado
// pelo workflow seed-pregacoes.yml pós-merge) tem prioridade sobre
// DATABASE_URL_ADMIN (owner, só .env.local). Com DATABASE_URL_SEED o script
// recusa o modo completo e qualquer arquivo fora de content/pregacoes/ — o
// role nem teria privilégio pra isso, mas a recusa explícita dá erro claro
// em vez de "permission denied" no meio do caminho.
//
// Toda pregação passa por validarPregacao antes de qualquer escrita; erro de
// validação = exit 1, nada gravado (no modo completo, antes do truncate).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { parseDataPtBr } from '../src/content/parseData.ts';
import { validarPregacao } from '../src/content/validarPregacao.ts';

const DATABASE_URL_SEED = process.env.DATABASE_URL_SEED;
const DATABASE_URL = DATABASE_URL_SEED ?? process.env.DATABASE_URL_ADMIN;
const modoCi = DATABASE_URL_SEED !== undefined;
if (!DATABASE_URL) {
  console.error('Nem DATABASE_URL_SEED nem DATABASE_URL_ADMIN definida. Configure em .env.local e exporte antes de rodar.');
  process.exit(1);
}

/** Aborta (exit 1) se a pregação não passar no validador — mesma regra do endpoint de publicação. */
function exigirPregacaoValida(arquivo: string, dado: unknown) {
  const r = validarPregacao(dado);
  for (const a of r.avisos) console.warn(`⚠ ${arquivo}: ${a.caminho} — ${a.mensagem}`);
  if (!r.ok) {
    for (const e of r.erros) console.error(`✖ ${arquivo}: ${e.caminho} — ${e.mensagem}`);
    console.error(`Pregação "${arquivo}" inválida — nada foi gravado.`);
    process.exit(1);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content');

interface PregacaoJson {
  metadados: {
    serie: string;
    capitulo?: string;
    tema: string;
    data?: string;
    pregador?: string;
    texto_base?: string;
    modo_origem?: 'A' | 'B';
  };
  [key: string]: unknown;
}

interface QuebraGeloJson {
  nome: string;
  tipo: 'instrucional' | 'utilitario' | 'instrucional_utilitario';
  utilitario: string | null;
  conteudo: unknown;
}

async function lerJsons<T>(dir: string): Promise<Array<{ arquivo: string; dado: T }>> {
  const arquivos = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  return Promise.all(
    arquivos.map(async (arquivo) => ({
      arquivo,
      dado: JSON.parse(await readFile(path.join(dir, arquivo), 'utf-8')) as T,
    })),
  );
}

async function upsertPregacao(client: pg.Client, arquivo: string, p: PregacaoJson) {
  const { serie, capitulo, tema, data, pregador, texto_base, modo_origem } = p.metadados;
  await client.query(
    `insert into public.pregacoes (serie, capitulo, tema, data, pregador, texto_base, modo_origem, conteudo, arquivo_origem)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
     on conflict (arquivo_origem) do update set
       serie = excluded.serie,
       capitulo = excluded.capitulo,
       tema = excluded.tema,
       data = excluded.data,
       pregador = excluded.pregador,
       texto_base = excluded.texto_base,
       modo_origem = excluded.modo_origem,
       conteudo = excluded.conteudo,
       updated_at = now()`,
    [
      serie || null,
      capitulo || null,
      tema,
      parseDataPtBr(data),
      pregador || null,
      texto_base || null,
      modo_origem || null,
      JSON.stringify(p),
      arquivo,
    ],
  );
}

async function upsertQuebraGelo(client: pg.Client, arquivo: string, q: QuebraGeloJson) {
  await client.query(
    `insert into public.quebra_gelos (nome, tipo, utilitario, conteudo, arquivo_origem)
     values ($1, $2, $3, $4::jsonb, $5)
     on conflict (arquivo_origem) do update set
       nome = excluded.nome,
       tipo = excluded.tipo,
       utilitario = excluded.utilitario,
       conteudo = excluded.conteudo,
       updated_at = now()`,
    [q.nome, q.tipo, q.utilitario ?? null, JSON.stringify(q.conteudo), arquivo],
  );
}

const DIRS_QUEBRA_GELO = ['quebra-gelos', 'utilitarios'];

const argArquivo = process.argv[2];
if (modoCi && !argArquivo) {
  console.error('Com DATABASE_URL_SEED só o modo seletivo é permitido (nunca truncate). Passe o path de um .json de content/pregacoes/.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {

  if (argArquivo) {
    // Modo seletivo: sem truncate, upsert só do arquivo passado.
    const caminhoAbsoluto = path.resolve(argArquivo);
    const dirPai = path.basename(path.dirname(caminhoAbsoluto));
    const arquivo = path.basename(caminhoAbsoluto);
    const dado = JSON.parse(await readFile(caminhoAbsoluto, 'utf-8'));

    if (modoCi && dirPai !== 'pregacoes') {
      console.error(`Com DATABASE_URL_SEED só arquivos de content/pregacoes/ são aceitos (recebido: ${dirPai}/${arquivo}).`);
      process.exit(1);
    }

    if (dirPai === 'pregacoes') {
      exigirPregacaoValida(arquivo, dado);
      await upsertPregacao(client, arquivo, dado as PregacaoJson);
      console.log(`Pregação "${arquivo}" upsertada.`);
    } else if (DIRS_QUEBRA_GELO.includes(dirPai)) {
      await upsertQuebraGelo(client, arquivo, dado as QuebraGeloJson);
      console.log(`Quebra-gelo/utilitário "${arquivo}" upsertado.`);
    } else {
      console.error(
        `Não foi possível determinar o tipo de conteúdo pelo diretório "${dirPai}". Esperado: pregacoes, quebra-gelos ou utilitarios.`,
      );
      process.exit(1);
    }
  } else {
    // Modo completo: truncate + reprocessa content/ inteiro.
    // Lê e valida tudo ANTES do truncate — um JSON quebrado nunca deixa o banco vazio.
    const pregacoes = await lerJsons<PregacaoJson>(path.join(contentDir, 'pregacoes'));
    for (const { arquivo, dado } of pregacoes) exigirPregacaoValida(arquivo, dado);

    console.log('Limpando tabelas...');
    await client.query('truncate table public.pregacoes, public.quebra_gelos');

    for (const { arquivo, dado } of pregacoes) {
      await upsertPregacao(client, arquivo, dado);
    }
    console.log(`${pregacoes.length} pregações inseridas.`);

    const quebraGelos = await lerJsons<QuebraGeloJson>(path.join(contentDir, 'quebra-gelos'));
    const utilitarios = await lerJsons<QuebraGeloJson>(path.join(contentDir, 'utilitarios'));
    for (const { arquivo, dado } of [...quebraGelos, ...utilitarios]) {
      await upsertQuebraGelo(client, arquivo, dado);
    }
    console.log(`${quebraGelos.length + utilitarios.length} quebra-gelos/utilitários inseridos.`);
  }
} finally {
  await client.end();
}
