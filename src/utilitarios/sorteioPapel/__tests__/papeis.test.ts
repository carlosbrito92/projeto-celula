import { describe, expect, it } from 'vitest';
import { gerarFichas, somaQuantidades } from '../papeis';

describe('somaQuantidades', () => {
  it('soma as quantidades de todos os papéis', () => {
    expect(
      somaQuantidades([
        { nome: 'Detetive', quantidade: 1 },
        { nome: 'Assassino', quantidade: 1 },
        { nome: 'Cidadão', quantidade: 3 },
      ]),
    ).toBe(5);
  });

  it('lista vazia soma 0', () => {
    expect(somaQuantidades([])).toBe(0);
  });
});

describe('gerarFichas', () => {
  it('expande cada papel em N fichas repetidas, na ordem dos papéis', () => {
    expect(
      gerarFichas([
        { nome: 'Detetive', quantidade: 1 },
        { nome: 'Cidadão', quantidade: 3 },
      ]),
    ).toEqual(['Detetive', 'Cidadão', 'Cidadão', 'Cidadão']);
  });

  it('papel com quantidade 0 não gera fichas', () => {
    expect(gerarFichas([{ nome: 'Fantasma', quantidade: 0 }])).toEqual([]);
  });

  it('quantidade negativa não quebra — trata como 0', () => {
    expect(gerarFichas([{ nome: 'X', quantidade: -2 }])).toEqual([]);
  });
});
