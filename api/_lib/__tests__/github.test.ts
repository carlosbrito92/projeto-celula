import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARQUIVO_REGEX, publicarViaPr, slugArquivo, type PedidoPublicacao } from '../github.js';

describe('slugArquivo', () => {
  it('gera nome de arquivo seguro a partir do tema', () => {
    expect(slugArquivo('A Graça Não É o Que Você Pensa')).toBe('a-graca-nao-e-o-que-voce-pensa.json');
    expect(slugArquivo('Igrejar', '4')).toBe('igrejar-cap-4.json');
    expect(slugArquivo('!!!')).toBe('pregacao.json');
  });

  it('resultado sempre passa em ARQUIVO_REGEX', () => {
    for (const t of ['Ação & Reação: parte 2', 'x'.repeat(200), 'Ünïcödé']) {
      expect(slugArquivo(t)).toMatch(ARQUIVO_REGEX);
    }
  });

  it('ARQUIVO_REGEX recusa path traversal e nomes estranhos', () => {
    for (const ruim of ['../segredo.json', 'a/b.json', 'Maiuscula.json', 'sem-extensao', '.json', '-x.json']) {
      expect(ruim).not.toMatch(ARQUIVO_REGEX);
    }
  });
});

/** GitHub falso em memória: arquivos por branch + PRs abertos. */
function githubFalso(inicial: { main?: Record<string, string>; prs?: { number: number; ref: string }[] } = {}) {
  const branches: Record<string, Record<string, { sha: string; conteudo: string }>> = {
    main: Object.fromEntries(Object.entries(inicial.main ?? {}).map(([k, v]) => [k, { sha: `sha-${k}`, conteudo: v }])),
  };
  for (const pr of inicial.prs ?? []) branches[pr.ref] = { ...branches.main };
  const prs = (inicial.prs ?? []).map((p) => ({ number: p.number, html_url: `https://gh/pr/${p.number}`, head: { ref: p.ref } }));
  const chamadas: string[] = [];

  const json = (status: number, dado: unknown) => new Response(JSON.stringify(dado), { status });

  const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    const metodo = init?.method ?? 'GET';
    const caminho = u.pathname.replace('/repos/dono/repo', '');
    chamadas.push(`${metodo} ${caminho}`);
    const corpo = init?.body ? JSON.parse(String(init.body)) : undefined;

    if (metodo === 'GET' && caminho === '/pulls') return json(200, prs);
    if (metodo === 'GET' && caminho === '/git/ref/heads/main') return json(200, { object: { sha: 'abc' } });
    if (metodo === 'POST' && caminho === '/git/refs') {
      branches[corpo.ref.replace('refs/heads/', '')] = { ...branches.main };
      return json(201, {});
    }
    if (caminho.startsWith('/contents/')) {
      const arq = caminho.replace('/contents/', '');
      if (metodo === 'GET') {
        const ref = u.searchParams.get('ref')!;
        const atual = branches[ref]?.[arq];
        return atual ? json(200, { sha: atual.sha }) : json(404, {});
      }
      if (metodo === 'PUT') {
        const atual = branches[corpo.branch][arq];
        if (atual && corpo.sha !== atual.sha) return json(409, { message: 'sha mismatch' });
        branches[corpo.branch][arq] = { sha: `sha-novo-${chamadas.length}`, conteudo: Buffer.from(corpo.content, 'base64').toString() };
        return json(200, {});
      }
    }
    if (metodo === 'POST' && caminho === '/pulls') {
      const pr = { number: 99, html_url: 'https://gh/pr/99', head: { ref: corpo.head } };
      prs.push(pr);
      return json(201, pr);
    }
    return json(500, { message: `rota não simulada: ${metodo} ${caminho}` });
  });

  return { fetch: f as unknown as typeof fetch, branches, chamadas, prs };
}

const cfg = (f: typeof fetch) => ({ token: 't', owner: 'dono', repo: 'repo', base: 'main', fetch: f });
const pedido = (extra: Partial<PedidoPublicacao> = {}): PedidoPublicacao => ({
  arquivo: 'nova.json',
  json: '{"x":1}\n',
  lider: 'Fulano',
  tema: 'Nova',
  substituir: false,
  ...extra,
});
const ARQ = 'content/pregacoes/nova.json';

describe('publicarViaPr', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

  it('pregação nova: cria branch editorial, commita o arquivo e abre PR', async () => {
    const gh = githubFalso();
    const r = await publicarViaPr(cfg(gh.fetch), pedido());

    expect(r).toEqual({ ok: true, prUrl: 'https://gh/pr/99', prNumero: 99, prNovo: true });
    const branch = gh.prs[0].head.ref;
    expect(branch).toMatch(/^editorial\/nova-/);
    expect(gh.branches[branch][ARQ].conteudo).toBe('{"x":1}\n');
    expect(gh.branches.main[ARQ]).toBeUndefined(); // main nunca é tocada direto
  });

  it('pregação nova com nome que já existe em main: 409, nada é escrito', async () => {
    const gh = githubFalso({ main: { [ARQ]: 'antigo' } });
    const r = await publicarViaPr(cfg(gh.fetch), pedido());
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(gh.chamadas.some((c) => c.startsWith('PUT') || c.startsWith('POST'))).toBe(false);
  });

  it('republicação de arquivo existente: novo PR substituindo o arquivo (com sha)', async () => {
    const gh = githubFalso({ main: { [ARQ]: 'antigo' } });
    const r = await publicarViaPr(cfg(gh.fetch), pedido({ substituir: true, json: 'corrigido' }));
    expect(r).toMatchObject({ ok: true, prNovo: true });
    expect(gh.branches[gh.prs[0].head.ref][ARQ].conteudo).toBe('corrigido');
    expect(gh.branches.main[ARQ].conteudo).toBe('antigo');
  });

  it('republicar com PR ainda aberto: novo commit no mesmo PR, sem abrir outro', async () => {
    const gh = githubFalso({ prs: [{ number: 7, ref: 'editorial/nova-abc' }] });
    gh.branches['editorial/nova-abc'][ARQ] = { sha: 's1', conteudo: 'v1' };

    const r = await publicarViaPr(cfg(gh.fetch), pedido({ substituir: true, json: 'v2' }));
    expect(r).toEqual({ ok: true, prUrl: 'https://gh/pr/7', prNumero: 7, prNovo: false });
    expect(gh.branches['editorial/nova-abc'][ARQ].conteudo).toBe('v2');
    expect(gh.chamadas).not.toContain('POST /pulls');
    expect(gh.chamadas).not.toContain('POST /git/refs');
  });

  it('PR aberto de outro arquivo com prefixo parecido não é confundido', async () => {
    const gh = githubFalso({ prs: [{ number: 7, ref: 'editorial/nova-parte-2-abc' }] });
    // prefixo de "nova.json" é "editorial/nova-" — "nova-parte-2" casaria por startsWith ingênuo
    const r = await publicarViaPr(cfg(gh.fetch), pedido());
    expect(r).toMatchObject({ ok: true });
  });

  it('republicar arquivo que não existe: 404', async () => {
    const gh = githubFalso();
    expect(await publicarViaPr(cfg(gh.fetch), pedido({ substituir: true }))).toMatchObject({ ok: false, status: 404 });
  });

  it('erro do GitHub vira 502 com mensagem genérica (sem vazar detalhe/token)', async () => {
    const f = vi.fn(async () => new Response('boom', { status: 500 })) as unknown as typeof fetch;
    const r = await publicarViaPr(cfg(f), pedido());
    expect(r).toMatchObject({ ok: false, status: 502 });
    expect(JSON.stringify(r)).not.toContain('boom');
  });
});
