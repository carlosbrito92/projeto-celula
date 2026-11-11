import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PregacaoRow } from '../../content/types';
import { validarPregacao } from '../../content/validarPregacao';
import { limparParaPublicar, normalizar } from '../modelo';
import { carregarPublicada, listarCorrigiveis } from '../publicadas';

const linha = (arquivo_origem: string | null, tema: string) => ({ id: tema, tema, serie: 'S', arquivo_origem, conteudo: { tema } }) as unknown as PregacaoRow;

describe('listarCorrigiveis', () => {
  it('só pregações com arquivo publicável, em ordem alfabética', () => {
    const r = listarCorrigiveis([linha('beta.json', 'Beta'), linha(null, 'Sem arquivo'), linha('Teste Pregação.json', 'Fora do formato'), linha('alfa.json', 'Alfa')]);
    expect(r.map((p) => p.arquivo)).toEqual(['alfa.json', 'beta.json']);
    expect(r[0]).toMatchObject({ tema: 'Alfa', serie: 'S', reserva: { tema: 'Alfa' } });
  });
});

describe('carregarPublicada', () => {
  afterEach(() => vi.unstubAllGlobals());
  const p = { arquivo: 'a.json', tema: 'Alfa', serie: null, reserva: { do: 'banco' } };

  it('lê o arquivo de main no GitHub', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ do: 'github' }), { status: 200 }));
    vi.stubGlobal('fetch', f);
    expect(await carregarPublicada(p)).toEqual({ conteudo: { do: 'github' }, doGithub: true });
    expect(String((f.mock.calls[0] as unknown[])[0])).toBe('https://raw.githubusercontent.com/carlosbrito92/projeto-celula/main/content/pregacoes/a.json');
  });

  it('GitHub fora ou 404: usa a cópia do banco', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404 })));
    expect(await carregarPublicada(p)).toEqual({ conteudo: { do: 'banco' }, doGithub: false });
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await carregarPublicada(p)).toEqual({ conteudo: { do: 'banco' }, doGithub: false });
  });
});

describe('toda pregação publicada abre no editor e pode ser reenviada sem mexer', () => {
  const arquivos = import.meta.glob('../../../content/pregacoes/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
  const corrigiveis = Object.entries(arquivos).filter(([caminho]) => /\/[a-z0-9][a-z0-9-]{1,79}\.json$/.test(caminho));

  it.each(corrigiveis)('%s', (_caminho, conteudo) => {
    const ida = limparParaPublicar(normalizar(structuredClone(conteudo)));
    expect(validarPregacao(ida).erros).toEqual([]);
  });
});
