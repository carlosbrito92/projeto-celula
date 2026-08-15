import { describe, expect, it } from 'vitest';
import { resultadoValido, type ResultadoDesafioPublico } from '../Jogo';

const base: ResultadoDesafioPublico = {
  declaranteId: 'ana',
  desafiantesIds: ['bruno'],
  declaranteVenceu: false,
  cartaRevelada: { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 5 },
  declaracaoContestada: { cor: 'azul', valor: 5 },
  pontosPorDesafiante: { bruno: 1 },
};

describe('resultadoValido', () => {
  it('null: inválido', () => {
    expect(resultadoValido(null)).toBe(false);
  });

  it('objeto completo: válido', () => {
    expect(resultadoValido(base)).toBe(true);
  });

  it('sem desafiantesIds (bug real 2026-08-15, placeholder transitório do Playroom): inválido', () => {
    const r = { ...base, desafiantesIds: undefined } as unknown as ResultadoDesafioPublico;
    expect(resultadoValido(r)).toBe(false);
  });

  it('sem cartaRevelada: inválido', () => {
    const r = { ...base, cartaRevelada: undefined } as unknown as ResultadoDesafioPublico;
    expect(resultadoValido(r)).toBe(false);
  });

  it('sem pontosPorDesafiante: inválido', () => {
    const r = { ...base, pontosPorDesafiante: undefined } as unknown as ResultadoDesafioPublico;
    expect(resultadoValido(r)).toBe(false);
  });
});
