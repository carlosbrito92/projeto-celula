// Publicação editorial via Pull Request (decisão de 2026-11-07, ver CLAUDE.md
// "Decisões de arquitetura (Painel Editorial)"): o app nunca escreve no banco.
// O endpoint só abre/atualiza um PR em content/pregacoes/; Carlos revisa e
// dá merge, e o fluxo normal (db-seed seletivo) leva ao banco.
//
// Cliente REST mínimo via fetch (sem octokit) — 5 chamadas, não justifica
// dependência nova. `fetch` é injetável pra teste.

export interface ConfigGithub {
  token: string;
  owner: string;
  repo: string;
  base: string;
  fetch?: typeof fetch;
}

export interface PedidoPublicacao {
  /** Nome do arquivo em content/pregacoes/ (já validado por ARQUIVO_REGEX). */
  arquivo: string;
  /** JSON final, já serializado e validado. */
  json: string;
  lider: string;
  tema: string;
  /** true = republicação (corrige arquivo existente); false = pregação nova, recusa se o arquivo já existir. */
  substituir: boolean;
}

export type ResultadoPublicacao =
  | { ok: true; prUrl: string; prNumero: number; prNovo: boolean }
  | { ok: false; status: number; erro: string };

/** Só minúsculas/dígitos/hífen + `.json` — impede path traversal e nomes estranhos no repo. */
export const ARQUIVO_REGEX = /^[a-z0-9][a-z0-9-]{1,79}\.json$/;

const PASTA = 'content/pregacoes';

export function slugArquivo(tema: string, capitulo?: string): string {
  const base = [tema, capitulo ? `cap-${capitulo}` : '']
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/, '');
  return `${base || 'pregacao'}.json`;
}

/**
 * Branch editorial de um arquivo: `editorial/<slug>-<sufixo>`, sufixo base36
 * SEM hífen. Casar por `startsWith` não basta: o prefixo de `nova.json`
 * (`editorial/nova-`) também casaria com a branch de `nova-parte-2.json`.
 * Exigir que o resto depois do prefixo não tenha hífen desfaz a ambiguidade.
 */
const prefixoBranch = (arquivo: string) => `editorial/${arquivo.replace(/\.json$/, '')}-`;
export const ehBranchDoArquivo = (ref: string, arquivo: string) => {
  const prefixo = prefixoBranch(arquivo);
  return ref.startsWith(prefixo) && /^[0-9a-z]+$/.test(ref.slice(prefixo.length));
};

class ErroGithub extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

function cliente(cfg: ConfigGithub) {
  const f = cfg.fetch ?? fetch;
  const raiz = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;

  return async function gh<T>(metodo: string, caminho: string, corpo?: unknown): Promise<{ status: number; dado: T }> {
    const resp = await f(`${raiz}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'projeto-celula-editorial',
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (resp.status === 404) return { status: 404, dado: null as T };
    if (!resp.ok) {
      const texto = await resp.text().catch(() => '');
      throw new ErroGithub(resp.status, `GitHub ${metodo} ${caminho} → ${resp.status} ${texto.slice(0, 300)}`);
    }
    return { status: resp.status, dado: (await resp.json()) as T };
  };
}

interface PrResumo {
  number: number;
  html_url: string;
  head: { ref: string };
}

export async function publicarViaPr(cfg: ConfigGithub, pedido: PedidoPublicacao): Promise<ResultadoPublicacao> {
  const gh = cliente(cfg);
  const caminhoArquivo = `${PASTA}/${pedido.arquivo}`;
  const contentsUrl = (ref: string) => `/contents/${caminhoArquivo}?ref=${encodeURIComponent(ref)}`;

  try {
    // 1. Já existe PR editorial aberto pra este arquivo? Republicar antes do
    //    merge = novo commit no mesmo PR (Carlos revisa uma coisa só).
    const { dado: abertos } = await gh<PrResumo[]>('GET', `/pulls?state=open&base=${cfg.base}&per_page=100`);
    const prExistente = (abertos ?? []).find((pr) => ehBranchDoArquivo(pr.head.ref, pedido.arquivo));

    // 2. Estado do arquivo em main decide entre "novo" e "republicação".
    const { status: statusMain } = await gh<{ sha: string }>('GET', contentsUrl(cfg.base));
    const existeEmMain = statusMain !== 404;
    if (existeEmMain && !pedido.substituir) {
      return {
        ok: false,
        status: 409,
        erro: `Já existe uma pregação publicada no arquivo ${pedido.arquivo}. Para corrigi-la, use "Republicar"; para uma pregação diferente, mude o tema.`,
      };
    }
    if (!existeEmMain && pedido.substituir && !prExistente) {
      return { ok: false, status: 404, erro: `Arquivo ${pedido.arquivo} não existe para republicar.` };
    }

    // 3. Branch: reaproveita a do PR aberto, ou cria uma nova a partir de main.
    let branch: string;
    if (prExistente) {
      branch = prExistente.head.ref;
    } else {
      const { dado: refMain } = await gh<{ object: { sha: string } }>('GET', `/git/ref/heads/${cfg.base}`);
      if (!refMain) throw new ErroGithub(500, `branch base ${cfg.base} não encontrada`);
      branch = `${prefixoBranch(pedido.arquivo)}${Date.now().toString(36)}`;
      await gh('POST', '/git/refs', { ref: `refs/heads/${branch}`, sha: refMain.object.sha });
    }

    // 4. Commit do arquivo (sha atual na branch é obrigatório pra substituir).
    const { dado: atualNaBranch } = await gh<{ sha: string } | null>('GET', contentsUrl(branch));
    const acao = existeEmMain || atualNaBranch ? 'atualiza' : 'adiciona';
    await gh('PUT', `/contents/${caminhoArquivo}`, {
      message: `content: ${acao} "${pedido.tema}" (via painel editorial, ${pedido.lider})`,
      content: Buffer.from(pedido.json, 'utf8').toString('base64'),
      branch,
      ...(atualNaBranch ? { sha: atualNaBranch.sha } : {}),
    });

    if (prExistente) {
      return { ok: true, prUrl: prExistente.html_url, prNumero: prExistente.number, prNovo: false };
    }

    // 5. Abre o PR.
    const { dado: pr } = await gh<PrResumo>('POST', '/pulls', {
      title: `${existeEmMain ? 'Corrige' : 'Nova pregação'}: ${pedido.tema}`,
      head: branch,
      base: cfg.base,
      body: [
        `Enviado pelo painel editorial por **${pedido.lider}**.`,
        '',
        `Arquivo: \`${caminhoArquivo}\` (${existeEmMain ? 'republicação de pregação existente' : 'pregação nova'})`,
        '',
        'Schema já validado no servidor (`src/content/validarPregacao.ts`). Após o merge, o conteúdo vai ao banco pelo fluxo normal de `db-seed`.',
      ].join('\n'),
    });
    return { ok: true, prUrl: pr.html_url, prNumero: pr.number, prNovo: true };
  } catch (e) {
    console.error(e);
    return { ok: false, status: 502, erro: 'Falha ao falar com o GitHub. Tente de novo em alguns minutos.' };
  }
}
