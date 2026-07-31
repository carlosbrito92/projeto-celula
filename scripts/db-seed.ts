// Popula pregações + quebra-gelos/utilitários a partir de content/*.json contra
// o Neon. Rodado manualmente via `tsx scripts/db-seed.ts` com DATABASE_URL_ADMIN
// — nunca em runtime deployado. Reaproveita parseDataPtBr (nunca inserir a
// string PT-BR crua na coluna `data`, ver CLAUDE.md).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { parseDataPtBr } from '../src/content/parseData.ts';

const DATABASE_URL_ADMIN = process.env.DATABASE_URL_ADMIN;
if (!DATABASE_URL_ADMIN) {
  console.error('DATABASE_URL_ADMIN não definida. Configure em .env.local e exporte antes de rodar.');
  process.exit(1);
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

async function lerJsons<T>(dir: string): Promise<T[]> {
  const arquivos = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  return Promise.all(
    arquivos.map(async (f) => JSON.parse(await readFile(path.join(dir, f), 'utf-8')) as T),
  );
}

const client = new pg.Client({ connectionString: DATABASE_URL_ADMIN });
await client.connect();

try {
  console.log('Limpando tabelas...');
  await client.query('truncate table public.pregacoes, public.quebra_gelos');

  const pregacoes = await lerJsons<PregacaoJson>(path.join(contentDir, 'pregacoes'));
  for (const p of pregacoes) {
    const { serie, capitulo, tema, data, pregador, texto_base, modo_origem } = p.metadados;
    await client.query(
      `insert into public.pregacoes (serie, capitulo, tema, data, pregador, texto_base, modo_origem, conteudo)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        serie || null,
        capitulo || null,
        tema,
        parseDataPtBr(data),
        pregador || null,
        texto_base || null,
        modo_origem || null,
        JSON.stringify(p),
      ],
    );
  }
  console.log(`${pregacoes.length} pregações inseridas.`);

  const quebraGelos = await lerJsons<QuebraGeloJson>(path.join(contentDir, 'quebra-gelos'));
  const utilitarios = await lerJsons<QuebraGeloJson>(path.join(contentDir, 'utilitarios'));
  for (const q of [...quebraGelos, ...utilitarios]) {
    await client.query(
      `insert into public.quebra_gelos (nome, tipo, utilitario, conteudo)
       values ($1, $2, $3, $4::jsonb)`,
      [q.nome, q.tipo, q.utilitario ?? null, JSON.stringify(q.conteudo)],
    );
  }
  console.log(`${quebraGelos.length + utilitarios.length} quebra-gelos/utilitários inseridos.`);
} finally {
  await client.end();
}
