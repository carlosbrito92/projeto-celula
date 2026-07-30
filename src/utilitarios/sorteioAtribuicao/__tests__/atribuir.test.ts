import { describe, expect, it } from 'vitest';
import { atribuir } from '../atribuir';

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
});
