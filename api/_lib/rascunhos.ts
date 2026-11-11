import { neon } from '@neondatabase/serverless';
import { ARQUIVO_REGEX } from './github.js';
import { identificarLider, type Lider } from './editorialAuth.js';

// Rascunhos do Painel Editorial (docs/painel-editorial.md §5).
//
// Rascunho NÃO é conteúdo editorial (decisão de Carlos, 2026-11-09): pode ter
// escrita a partir de api/, mas só na tabela rascunhos_pregacao, com o role
// editorial_rascunhos (DATABASE_URL_RASCUNHOS), que não alcança pregacoes.
//
// Isolamento por líder: o nome vem SEMPRE do código validado no servidor,
// nunca do body. Toda query filtra por `lider` e, por baixo, a RLS da migração
// 0004 só deixa ver linhas com lider = current_setting('app.lider').

/** Mesmo teto de api/editorial/publicar.ts — pregação real mais longa tem ~60KB. */
export const TAMANHO_MAXIMO = 512 * 1024;
/** Teto de armazenamento por líder (~1 pregação/semana; 50 dá quase um ano de folga). */
export const MAX_RASCUNHOS_POR_LIDER = 50;

export interface ResumoRascunho {
  id: string;
  arquivo: string | null;
  tema: string;
  versao: number;
  atualizado_em: string;
}

export interface Rascunho extends ResumoRascunho {
  conteudo: Record<string, unknown>;
}

export interface DadosRascunho {
  conteudo: Record<string, unknown>;
  tema: string;
  arquivo?: string;
}

export type ResultadoAtualizacao =
  | { ok: true; rascunho: ResumoRascunho }
  | { ok: false; motivo: 'nao_encontrado' }
  | { ok: false; motivo: 'conflito'; versaoAtual: number };

export interface RepositorioRascunhos {
  listar(lider: string): Promise<ResumoRascunho[]>;
  obter(lider: string, id: string): Promise<Rascunho | null>;
  contar(lider: string): Promise<number>;
  criar(lider: string, dados: DadosRascunho): Promise<ResumoRascunho>;
  atualizar(lider: string, id: string, versao: number, dados: DadosRascunho): Promise<ResultadoAtualizacao>;
  apagar(lider: string, id: string): Promise<boolean>;
}

type Linha = Record<string, unknown>;
/** Roda uma query parametrizada numa transação com app.lider definido (RLS). */
export type Executor = (lider: string, texto: string, params: unknown[]) => Promise<Linha[]>;

export function executorNeon(url: string): Executor {
  const sql = neon(url);
  return async (lider, texto, params) => {
    const [, linhas] = await sql.transaction([
      sql.query(`select set_config('app.lider', $1, true)`, [lider]),
      sql.query(texto, params),
    ]);
    return linhas as Linha[];
  };
}

const COLUNAS_RESUMO = 'id, arquivo, tema, versao, atualizado_em';

function resumo(l: Linha): ResumoRascunho {
  return {
    id: String(l.id),
    arquivo: (l.arquivo as string | null) ?? null,
    tema: String(l.tema ?? ''),
    versao: Number(l.versao),
    atualizado_em: l.atualizado_em instanceof Date ? l.atualizado_em.toISOString() : String(l.atualizado_em),
  };
}

export function repositorioSql(executar: Executor): RepositorioRascunhos {
  return {
    async listar(lider) {
      const linhas = await executar(
        lider,
        `select ${COLUNAS_RESUMO} from rascunhos_pregacao where lider = $1 order by atualizado_em desc`,
        [lider],
      );
      return linhas.map(resumo);
    },
    async obter(lider, id) {
      const [l] = await executar(
        lider,
        `select ${COLUNAS_RESUMO}, conteudo from rascunhos_pregacao where id = $1 and lider = $2`,
        [id, lider],
      );
      return l ? { ...resumo(l), conteudo: l.conteudo as Record<string, unknown> } : null;
    },
    async contar(lider) {
      const [l] = await executar(lider, `select count(*)::int as n from rascunhos_pregacao where lider = $1`, [lider]);
      return Number(l?.n ?? 0);
    },
    async criar(lider, dados) {
      const [l] = await executar(
        lider,
        `insert into rascunhos_pregacao (lider, arquivo, tema, conteudo) values ($1, $2, $3, $4)
         returning ${COLUNAS_RESUMO}`,
        [lider, dados.arquivo ?? null, dados.tema, JSON.stringify(dados.conteudo)],
      );
      return resumo(l);
    },
    async atualizar(lider, id, versao, dados) {
      const [l] = await executar(
        lider,
        `update rascunhos_pregacao
            set conteudo = $1, tema = $2, arquivo = coalesce($3, arquivo),
                versao = versao + 1, atualizado_em = now()
          where id = $4 and lider = $5 and versao = $6
          returning ${COLUNAS_RESUMO}`,
        [JSON.stringify(dados.conteudo), dados.tema, dados.arquivo ?? null, id, lider, versao],
      );
      if (l) return { ok: true, rascunho: resumo(l) };
      const [atual] = await executar(
        lider,
        `select versao from rascunhos_pregacao where id = $1 and lider = $2`,
        [id, lider],
      );
      return atual
        ? { ok: false, motivo: 'conflito', versaoAtual: Number(atual.versao) }
        : { ok: false, motivo: 'nao_encontrado' };
    },
    async apagar(lider, id) {
      const linhas = await executar(
        lider,
        `delete from rascunhos_pregacao where id = $1 and lider = $2 returning id`,
        [id, lider],
      );
      return linhas.length > 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Roteamento das duas rotas (sem I/O de HTTP, testável sem Vercel):
//   GET    /api/editorial/rascunhos        → lista (sem conteudo)
//   POST   /api/editorial/rascunhos        → cria   { conteudo, arquivo? }
//   GET    /api/editorial/rascunhos/:id    → um rascunho completo
//   PUT    /api/editorial/rascunhos/:id    → salva  { conteudo, versao, arquivo? }
//   DELETE /api/editorial/rascunhos/:id    → apaga

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PedidoRascunho {
  metodo: string | undefined;
  id?: unknown;
  codigo: unknown;
  body: unknown;
}

export interface Resposta {
  status: number;
  corpo?: unknown;
}

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

type Leitura = { ok: true; dados: DadosRascunho } | { ok: false; resposta: Resposta };

function lerDados(body: Record<string, unknown>): Leitura {
  const conteudo = body.conteudo;
  if (!ehObj(conteudo)) return { ok: false, resposta: { status: 400, corpo: { erro: '`conteudo` deve ser um objeto.' } } };
  if (Buffer.byteLength(JSON.stringify(conteudo), 'utf8') > TAMANHO_MAXIMO) {
    return { ok: false, resposta: { status: 413, corpo: { erro: 'Rascunho grande demais.' } } };
  }
  let arquivo: string | undefined;
  if (body.arquivo !== undefined && body.arquivo !== null) {
    if (typeof body.arquivo !== 'string' || !ARQUIVO_REGEX.test(body.arquivo)) {
      return { ok: false, resposta: { status: 400, corpo: { erro: 'Nome de arquivo inválido.' } } };
    }
    arquivo = body.arquivo;
  }
  const meta = conteudo.metadados;
  const tema = ehObj(meta) && typeof meta.tema === 'string' ? meta.tema.trim().slice(0, 300) : '';
  return { ok: true, dados: { conteudo, tema, arquivo } };
}

export async function tratarRascunhos(
  pedido: PedidoRascunho,
  deps: { lideres: Lider[]; repo: RepositorioRascunhos },
): Promise<Resposta> {
  const lider = identificarLider(pedido.codigo, deps.lideres);
  if (!lider) return { status: 401, corpo: { erro: 'Código editorial inválido.' } };

  const { repo } = deps;
  const body = ehObj(pedido.body) ? pedido.body : {};

  if (pedido.id === undefined) {
    if (pedido.metodo === 'GET') return { status: 200, corpo: { rascunhos: await repo.listar(lider) } };
    if (pedido.metodo === 'POST') {
      const lido = lerDados(body);
      if (!lido.ok) return lido.resposta;
      if ((await repo.contar(lider)) >= MAX_RASCUNHOS_POR_LIDER) {
        return {
          status: 409,
          corpo: { erro: `Limite de ${MAX_RASCUNHOS_POR_LIDER} rascunhos atingido. Apague rascunhos antigos.` },
        };
      }
      return { status: 201, corpo: await repo.criar(lider, lido.dados) };
    }
    return { status: 405, corpo: { erro: 'Método não suportado' } };
  }

  if (typeof pedido.id !== 'string' || !UUID_REGEX.test(pedido.id)) {
    return { status: 400, corpo: { erro: 'id inválido' } };
  }
  const id = pedido.id;
  const naoEncontrado: Resposta = { status: 404, corpo: { erro: 'Rascunho não encontrado.' } };

  switch (pedido.metodo) {
    case 'GET': {
      const r = await repo.obter(lider, id);
      return r ? { status: 200, corpo: r } : naoEncontrado;
    }
    case 'PUT': {
      if (!Number.isInteger(body.versao)) return { status: 400, corpo: { erro: '`versao` é obrigatória.' } };
      const lido = lerDados(body);
      if (!lido.ok) return lido.resposta;
      const r = await repo.atualizar(lider, id, body.versao as number, lido.dados);
      if (r.ok) return { status: 200, corpo: r.rascunho };
      if (r.motivo === 'conflito') {
        return {
          status: 409,
          corpo: { erro: 'Este rascunho mudou em outro aparelho. Recarregue antes de salvar.', versaoAtual: r.versaoAtual },
        };
      }
      return naoEncontrado;
    }
    case 'DELETE':
      return (await repo.apagar(lider, id)) ? { status: 204 } : naoEncontrado;
    default:
      return { status: 405, corpo: { erro: 'Método não suportado' } };
  }
}
