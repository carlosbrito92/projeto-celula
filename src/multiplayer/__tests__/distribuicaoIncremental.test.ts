import { describe, expect, it } from 'vitest';
import { criarDistribuidorIncremental } from '../distribuicaoIncremental';

describe('criarDistribuidorIncremental', () => {
  it('embaralha uma vez na criação — proximo() segue a ordem embaralhada, determinístico com rng fixa', () => {
    const distribuidor = criarDistribuidorIncremental(['a', 'b', 'c', 'd'], () => 0);
    expect(distribuidor.proximo()).toBe('b');
    expect(distribuidor.proximo()).toBe('c');
    expect(distribuidor.proximo()).toBe('d');
    expect(distribuidor.proximo()).toBe('a');
  });

  it('cada proximo() remove o valor do topo — nunca entrega o mesmo valor duas vezes', () => {
    const distribuidor = criarDistribuidorIncremental(['v1', 'v2', 'v3'], Math.random);
    const entregues = [distribuidor.proximo(), distribuidor.proximo(), distribuidor.proximo()];
    expect(entregues.sort()).toEqual(['v1', 'v2', 'v3']);
  });

  it('restantes() reflete quantos valores ainda não foram entregues', () => {
    const distribuidor = criarDistribuidorIncremental(['a', 'b', 'c'], () => 0);
    expect(distribuidor.restantes()).toBe(3);
    distribuidor.proximo();
    expect(distribuidor.restantes()).toBe(2);
    distribuidor.proximo();
    distribuidor.proximo();
    expect(distribuidor.restantes()).toBe(0);
  });

  it('pool esgotado: proximo() retorna undefined em vez de repetir ou quebrar', () => {
    const distribuidor = criarDistribuidorIncremental(['único'], () => 0);
    expect(distribuidor.proximo()).toBe('único');
    expect(distribuidor.proximo()).toBeUndefined();
    expect(distribuidor.proximo()).toBeUndefined();
    expect(distribuidor.restantes()).toBe(0);
  });

  it('lista vazia: proximo() já nasce esgotado, sem quebrar', () => {
    const distribuidor = criarDistribuidorIncremental<string>([], () => 0);
    expect(distribuidor.proximo()).toBeUndefined();
    expect(distribuidor.restantes()).toBe(0);
  });

  it('não muta o array de valores original', () => {
    const original = ['a', 'b', 'c'];
    const distribuidor = criarDistribuidorIncremental(original, () => 0);
    distribuidor.proximo();
    expect(original).toEqual(['a', 'b', 'c']);
  });

  it('suporta valores repetidos (mesma categoria com nomes duplicados)', () => {
    const distribuidor = criarDistribuidorIncremental(['Rainha', 'Rainha', 'Rei'], Math.random);
    const entregues = [distribuidor.proximo(), distribuidor.proximo(), distribuidor.proximo()];
    expect(entregues.sort()).toEqual(['Rainha', 'Rainha', 'Rei']);
  });
});
