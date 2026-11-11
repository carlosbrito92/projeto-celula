import { describe, expect, it } from 'vitest';
import { parseCodigos } from '../editorialAuth.js';
import {
  MAX_RASCUNHOS_POR_LIDER,
  repositorioSql,
  tratarRascunhos,
  type DadosRascunho,
  type Executor,
  type Rascunho,
  type RepositorioRascunhos,
  type ResumoRascunho,
} from '../rascunhos.js';

const A = 'k7q2-m9xv-p4tz-w8hc';
const B = 'z3n8-b6rd-q1fy-t5ka';
const lideres = parseCodigos(`Fulano:${A};Ciclano:${B}`);

/** Repositório em memória com o mesmo contrato do SQL (isolamento por líder + versão otimista). */
function repoMemoria(): RepositorioRascunhos & { linhas: (Rascunho & { lider: string })[] } {
  const linhas: (Rascunho & { lider: string })[] = [];
  let seq = 0;
  const resumo = ({ id, arquivo, tema, versao, atualizado_em }: Rascunho): ResumoRascunho => ({
    id,
    arquivo,
    tema,
    versao,
    atualizado_em,
  });
  const achar = (lider: string, id: string) => linhas.find((l) => l.id === id && l.lider === lider);
  return {
    linhas,
    async listar(lider) {
      return linhas.filter((l) => l.lider === lider).map(resumo);
    },
    async obter(lider, id) {
      const l = achar(lider, id);
      return l ? { ...resumo(l), conteudo: l.conteudo } : null;
    },
    async contar(lider) {
      return linhas.filter((l) => l.lider === lider).length;
    },
    async criar(lider, d: DadosRascunho) {
      seq += 1;
      const id = `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
      const l = { id, lider, arquivo: d.arquivo ?? null, tema: d.tema, conteudo: d.conteudo, versao: 1, atualizado_em: 't' };
      linhas.push(l);
      return resumo(l);
    },
    async atualizar(lider, id, versao, d) {
      const l = achar(lider, id);
      if (!l) return { ok: false, motivo: 'nao_encontrado' };
      if (l.versao !== versao) return { ok: false, motivo: 'conflito', versaoAtual: l.versao };
      Object.assign(l, { conteudo: d.conteudo, tema: d.tema, arquivo: d.arquivo ?? l.arquivo, versao: l.versao + 1 });
      return { ok: true, rascunho: resumo(l) };
    },
    async apagar(lider, id) {
      const i = linhas.findIndex((l) => l.id === id && l.lider === lider);
      if (i < 0) return false;
      linhas.splice(i, 1);
      return true;
    },
  };
}

const conteudo = (tema = 'Fé') => ({ metadados: { serie: 'S', tema } });

describe('tratarRascunhos', () => {
  it('sem código válido: 401 em qualquer método, nada é tocado', async () => {
    const repo = repoMemoria();
    for (const metodo of ['GET', 'POST']) {
      const r = await tratarRascunhos({ metodo, codigo: 'errado-errado-errado', body: { conteudo: conteudo() } }, { lideres, repo });
      expect(r.status).toBe(401);
    }
    expect(repo.linhas).toHaveLength(0);
  });

  it('cria, lista e lê; tema vem de metadados.tema', async () => {
    const repo = repoMemoria();
    const criado = await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: conteudo('Graça') } }, { lideres, repo });
    expect(criado.status).toBe(201);
    const { id } = criado.corpo as ResumoRascunho;

    const lista = await tratarRascunhos({ metodo: 'GET', codigo: A, body: undefined }, { lideres, repo });
    expect(lista.corpo).toEqual({ rascunhos: [expect.objectContaining({ id, tema: 'Graça', versao: 1 })] });
    expect(JSON.stringify(lista.corpo)).not.toContain('metadados'); // lista não carrega conteudo

    const lido = await tratarRascunhos({ metodo: 'GET', id, codigo: A, body: undefined }, { lideres, repo });
    expect(lido.corpo).toMatchObject({ id, conteudo: conteudo('Graça') });
  });

  it('líder vem do código, nunca do body: outro líder não vê, não edita, não apaga', async () => {
    const repo = repoMemoria();
    const criado = await tratarRascunhos(
      { metodo: 'POST', codigo: A, body: { conteudo: conteudo(), lider: 'Ciclano' } },
      { lideres, repo },
    );
    const { id } = criado.corpo as ResumoRascunho;
    expect(repo.linhas[0].lider).toBe('Fulano');

    const deps = { lideres, repo };
    expect((await tratarRascunhos({ metodo: 'GET', codigo: B, body: undefined }, deps)).corpo).toEqual({ rascunhos: [] });
    expect((await tratarRascunhos({ metodo: 'GET', id, codigo: B, body: undefined }, deps)).status).toBe(404);
    expect((await tratarRascunhos({ metodo: 'PUT', id, codigo: B, body: { conteudo: conteudo('x'), versao: 1 } }, deps)).status).toBe(404);
    expect((await tratarRascunhos({ metodo: 'DELETE', id, codigo: B, body: undefined }, deps)).status).toBe(404);
    expect(repo.linhas).toHaveLength(1);
  });

  it('salvar com versão antiga: 409 com versaoAtual, nunca sobrescreve em silêncio', async () => {
    const repo = repoMemoria();
    const deps = { lideres, repo };
    const { id } = (await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: conteudo('v1') } }, deps)).corpo as ResumoRascunho;

    const ok = await tratarRascunhos({ metodo: 'PUT', id, codigo: A, body: { conteudo: conteudo('v2'), versao: 1 } }, deps);
    expect(ok).toMatchObject({ status: 200, corpo: { versao: 2, tema: 'v2' } });

    const velho = await tratarRascunhos({ metodo: 'PUT', id, codigo: A, body: { conteudo: conteudo('outro aparelho'), versao: 1 } }, deps);
    expect(velho).toMatchObject({ status: 409, corpo: { versaoAtual: 2 } });
    expect(repo.linhas[0].tema).toBe('v2');
  });

  it('PUT sem versao: 400', async () => {
    const repo = repoMemoria();
    const deps = { lideres, repo };
    const { id } = (await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: conteudo() } }, deps)).corpo as ResumoRascunho;
    expect((await tratarRascunhos({ metodo: 'PUT', id, codigo: A, body: { conteudo: conteudo() } }, deps)).status).toBe(400);
  });

  it('rejeita conteudo que não é objeto, arquivo inválido, id malformado e payload grande', async () => {
    const deps = { lideres, repo: repoMemoria() };
    expect((await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: [] } }, deps)).status).toBe(400);
    expect((await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: conteudo(), arquivo: '../x.json' } }, deps)).status).toBe(400);
    expect((await tratarRascunhos({ metodo: 'GET', id: '1 or 1=1', codigo: A, body: undefined }, deps)).status).toBe(400);
    const grande = { metadados: { tema: 'x' }, texto: 'a'.repeat(600 * 1024) };
    expect((await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: grande } }, deps)).status).toBe(413);
  });

  it('rascunho pode estar incompleto (não passa pelo validador de publicação)', async () => {
    const deps = { lideres, repo: repoMemoria() };
    const r = await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: {} } }, deps);
    expect(r).toMatchObject({ status: 201, corpo: { tema: '' } });
  });

  it(`limite de ${MAX_RASCUNHOS_POR_LIDER} rascunhos por líder: 409, sem afetar outro líder`, async () => {
    const repo = repoMemoria();
    const deps = { lideres, repo };
    for (let i = 0; i < MAX_RASCUNHOS_POR_LIDER; i++) await repo.criar('Fulano', { conteudo: {}, tema: '' });
    expect((await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: {} } }, deps)).status).toBe(409);
    expect((await tratarRascunhos({ metodo: 'POST', codigo: B, body: { conteudo: {} } }, deps)).status).toBe(201);
  });

  it('apaga o próprio rascunho: 204', async () => {
    const repo = repoMemoria();
    const deps = { lideres, repo };
    const { id } = (await tratarRascunhos({ metodo: 'POST', codigo: A, body: { conteudo: {} } }, deps)).corpo as ResumoRascunho;
    expect(await tratarRascunhos({ metodo: 'DELETE', id, codigo: A, body: undefined }, deps)).toEqual({ status: 204 });
    expect(repo.linhas).toHaveLength(0);
  });
});

describe('repositorioSql', () => {
  it('toda query roda com o líder no executor (RLS) e filtra por lider no SQL', async () => {
    const chamadas: { lider: string; texto: string; params: unknown[] }[] = [];
    const executar: Executor = async (lider, texto, params) => {
      chamadas.push({ lider, texto, params });
      return [{ id: 'i', arquivo: null, tema: '', versao: 1, atualizado_em: 't', n: 0, conteudo: {} }];
    };
    const repo = repositorioSql(executar);
    await repo.listar('Fulano');
    await repo.obter('Fulano', 'i');
    await repo.contar('Fulano');
    await repo.criar('Fulano', { conteudo: {}, tema: '' });
    await repo.atualizar('Fulano', 'i', 1, { conteudo: {}, tema: '' });
    await repo.apagar('Fulano', 'i');

    expect(chamadas.length).toBeGreaterThanOrEqual(6);
    for (const c of chamadas) {
      expect(c.lider).toBe('Fulano');
      expect(c.params).toContain('Fulano');
      expect(c.texto).toMatch(/rascunhos_pregacao/);
      expect(c.texto).not.toMatch(/\bpregacoes\b|quebra_gelos/);
      if (!c.texto.startsWith('insert')) expect(c.texto).toMatch(/lider = \$\d/);
    }
  });
});
