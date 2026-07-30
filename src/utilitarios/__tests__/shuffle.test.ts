import { describe, expect, it } from 'vitest';
import { embaralhar, escolherUm } from '../shuffle';

describe('embaralhar', () => {
  it('produz uma permutação determinística dada uma rng fixa', () => {
    expect(embaralhar([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });

  it('não muta o array original', () => {
    const original = [1, 2, 3];
    embaralhar(original, () => 0);
    expect(original).toEqual([1, 2, 3]);
  });

  it('preserva todos os elementos, sem perda nem duplicação', () => {
    const original = ['a', 'b', 'c', 'd', 'e'];
    const resultado = embaralhar(original, Math.random);
    expect([...resultado].sort()).toEqual([...original].sort());
    expect(resultado).toHaveLength(original.length);
  });

  it('lida com array vazio ou de um item sem quebrar', () => {
    expect(embaralhar([], () => 0)).toEqual([]);
    expect(embaralhar(['só'], () => 0)).toEqual(['só']);
  });
});

describe('escolherUm', () => {
  it('escolhe o índice certo dada uma rng fixa', () => {
    const itens = ['a', 'b', 'c'];
    expect(escolherUm(itens, () => 0)).toBe('a');
    expect(escolherUm(itens, () => 0.5)).toBe('b');
    expect(escolherUm(itens, () => 0.99)).toBe('c');
  });
});
