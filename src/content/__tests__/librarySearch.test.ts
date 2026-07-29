import { describe, expect, it } from 'vitest';
import { filterPregacoes, normalize } from '../librarySearch';
import { ordenarPregacoes } from '../usePregacoes';
import type { PregacaoRow } from '../types';

function pregacao(overrides: Partial<PregacaoRow>): PregacaoRow {
  return {
    id: 'id',
    serie: null,
    capitulo: null,
    tema: 'Tema',
    data: null,
    pregador: null,
    texto_base: null,
    modo_origem: null,
    conteudo: { metadados: { serie: '', tema: 'Tema' }, mapa_pontos: [], secoes: [] },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('normalize', () => {
  it('remove acentos e coloca em minúsculas', () => {
    expect(normalize('Graça')).toBe('graca');
    expect(normalize('RELIGIÃO TÓXICA')).toBe('religiao toxica');
  });
});

describe('filterPregacoes', () => {
  const lista = [
    pregacao({ id: '1', tema: 'A Graça Não É o Que Você Pensa', serie: 'Religião Tóxica', pregador: 'Pastor Pedro Estrella' }),
    pregacao({ id: '2', tema: 'De Volta ao Pai', serie: 'Avulsa', pregador: 'Pastor Naor Pedroza' }),
  ];

  it('filtra por tema, ignorando acento', () => {
    expect(filterPregacoes(lista, 'graca').map((p) => p.id)).toEqual(['1']);
  });

  it('filtra por série', () => {
    expect(filterPregacoes(lista, 'toxica').map((p) => p.id)).toEqual(['1']);
  });

  it('filtra por pregador', () => {
    expect(filterPregacoes(lista, 'naor').map((p) => p.id)).toEqual(['2']);
  });

  it('retorna tudo quando o termo é vazio', () => {
    expect(filterPregacoes(lista, '  ')).toEqual(lista);
  });

  it('retorna vazio quando nada bate', () => {
    expect(filterPregacoes(lista, 'inexistente')).toEqual([]);
  });
});

describe('ordenarPregacoes', () => {
  it('ordena por data desc quando ambas têm data', () => {
    const a = pregacao({ id: 'antiga', data: '2026-01-01' });
    const b = pregacao({ id: 'nova', data: '2026-06-01' });
    expect(ordenarPregacoes([a, b]).map((p) => p.id)).toEqual(['nova', 'antiga']);
  });

  it('registro sem data não quebra a ordenação — cai para o fim por data, ordenado por created_at', () => {
    const comData = pregacao({ id: 'com-data', data: '2026-01-01' });
    const semData = pregacao({ id: 'sem-data', data: null, created_at: '2026-05-01T00:00:00Z' });
    const resultado = ordenarPregacoes([semData, comData]);
    expect(resultado.map((p) => p.id)).toEqual(['com-data', 'sem-data']);
  });

  it('duas sem data ordenam por created_at desc', () => {
    const maisAntiga = pregacao({ id: 'a', data: null, created_at: '2026-01-01T00:00:00Z' });
    const maisRecente = pregacao({ id: 'b', data: null, created_at: '2026-06-01T00:00:00Z' });
    expect(ordenarPregacoes([maisAntiga, maisRecente]).map((p) => p.id)).toEqual(['b', 'a']);
  });
});
