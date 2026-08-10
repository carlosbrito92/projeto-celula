import { describe, expect, it } from 'vitest';
import { dividirEmDuasPilhas, intercalarRiffle } from '../riffleShuffle';

describe('dividirEmDuasPilhas', () => {
  it('rng sempre < 0.5: tudo vai pra esquerda', () => {
    const { esquerda, direita } = dividirEmDuasPilhas(['a', 'b', 'c'], () => 0.1);
    expect(esquerda).toEqual(['a', 'b', 'c']);
    expect(direita).toEqual([]);
  });

  it('rng sempre >= 0.5: tudo vai pra direita', () => {
    const { esquerda, direita } = dividirEmDuasPilhas(['a', 'b', 'c'], () => 0.9);
    expect(esquerda).toEqual([]);
    expect(direita).toEqual(['a', 'b', 'c']);
  });

  it('preserva todos os itens, sem perder nem duplicar', () => {
    const itens = Array.from({ length: 20 }, (_, i) => i);
    const { esquerda, direita } = dividirEmDuasPilhas(itens, Math.random);
    expect([...esquerda, ...direita].sort((a, b) => a - b)).toEqual(itens);
  });

  it('lista vazia: duas pilhas vazias', () => {
    const { esquerda, direita } = dividirEmDuasPilhas([], Math.random);
    expect(esquerda).toEqual([]);
    expect(direita).toEqual([]);
  });
});

describe('intercalarRiffle', () => {
  it('rng sempre < 0.5 (favorece esquerda) com pilhas de mesmo tamanho: alterna esquerda/direita', () => {
    const resultado = intercalarRiffle(['e1', 'e2'], ['d1', 'd2'], () => 0.1);
    expect(resultado).toEqual(['e1', 'e2', 'd1', 'd2']);
  });

  it('nunca puxa de pilha vazia — esgota a esquerda primeiro, resto vem da direita mesmo com rng favorecendo esquerda', () => {
    const resultado = intercalarRiffle(['e1'], ['d1', 'd2', 'd3'], () => 0.1);
    expect(resultado).toEqual(['e1', 'd1', 'd2', 'd3']);
  });

  it('pilha esquerda vazia: resultado é só a direita, na ordem', () => {
    expect(intercalarRiffle([], ['d1', 'd2'], Math.random)).toEqual(['d1', 'd2']);
  });

  it('as duas vazias: resultado vazio', () => {
    expect(intercalarRiffle([], [], Math.random)).toEqual([]);
  });

  it('preserva todos os itens das duas pilhas, sem perder nem duplicar, com rng real', () => {
    const esquerda = Array.from({ length: 8 }, (_, i) => `e${i}`);
    const direita = Array.from({ length: 5 }, (_, i) => `d${i}`);
    const resultado = intercalarRiffle(esquerda, direita, Math.random);
    expect(resultado).toHaveLength(13);
    expect(new Set(resultado)).toEqual(new Set([...esquerda, ...direita]));
  });

  it('não muta as pilhas originais', () => {
    const esquerda = ['e1', 'e2'];
    const direita = ['d1'];
    intercalarRiffle(esquerda, direita, () => 0.1);
    expect(esquerda).toEqual(['e1', 'e2']);
    expect(direita).toEqual(['d1']);
  });
});
