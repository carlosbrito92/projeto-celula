import { describe, expect, it } from 'vitest';
import { moverPorIndice } from '../reordenar';

describe('moverPorIndice', () => {
  it('move um item do início pro fim', () => {
    expect(moverPorIndice(['Ana', 'Beto', 'Carla'], 0, 2)).toEqual(['Beto', 'Carla', 'Ana']);
  });

  it('move um item do fim pro início', () => {
    expect(moverPorIndice(['Ana', 'Beto', 'Carla'], 2, 0)).toEqual(['Carla', 'Ana', 'Beto']);
  });

  it('move um item pra posição imediatamente seguinte', () => {
    expect(moverPorIndice(['Ana', 'Beto', 'Carla'], 0, 1)).toEqual(['Beto', 'Ana', 'Carla']);
  });

  it('origem igual a destino não muda a lista', () => {
    const lista = ['Ana', 'Beto', 'Carla'];
    expect(moverPorIndice(lista, 1, 1)).toBe(lista);
  });

  it('índice fora dos limites não muda a lista (defensivo — botões desabilitados nas pontas evitam isso na prática)', () => {
    const lista = ['Ana', 'Beto'];
    expect(moverPorIndice(lista, 0, 5)).toBe(lista);
    expect(moverPorIndice(lista, -1, 0)).toBe(lista);
  });

  it('índice não inteiro não muda a lista', () => {
    const lista = ['Ana', 'Beto'];
    expect(moverPorIndice(lista, 0.5, 1)).toBe(lista);
  });
});
