import { describe, expect, it } from 'vitest';
import { atribuir, embaralhar, escolherUm } from '../shuffle';

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

describe('atribuir', () => {
  it('atribui os valores embaralhados 1:1, determinístico com rng fixa', () => {
    const resultado = atribuir(['A', 'B', 'C', 'D'], ['w', 'x', 'y', 'z'], () => 0);
    expect(resultado).toEqual({ A: 'x', B: 'y', C: 'z', D: 'w' });
  });

  it('cada participante recebe um valor distinto (sem perda/duplicação) com rng real', () => {
    const participantes = ['A', 'B', 'C', 'D', 'E'];
    const valores = ['v1', 'v2', 'v3', 'v4', 'v5'];
    const resultado = atribuir(participantes, valores, Math.random);
    expect(Object.keys(resultado).sort()).toEqual(participantes.sort());
    expect(Object.values(resultado).sort()).toEqual(valores.sort());
  });

  it('suporta valores repetidos (caso de fichas de papéis múltiplos, ex: "Cidadão" x3)', () => {
    const participantes = ['A', 'B', 'C', 'D'];
    const fichas = ['Detetive', 'Cidadão', 'Cidadão', 'Cidadão'];
    const resultado = atribuir(participantes, fichas, Math.random);
    const valoresAtribuidos = Object.values(resultado).sort();
    expect(valoresAtribuidos).toEqual(['Cidadão', 'Cidadão', 'Cidadão', 'Detetive']);
  });
});
