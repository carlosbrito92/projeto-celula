import { describe, expect, it } from 'vitest';
import { quebraSequencia } from '../sequencia';
import type { Declaracao } from '../types';

const d = (valor: number, cor: Declaracao['cor'] = 'vermelho'): Declaracao => ({ cor, valor });

describe('quebraSequencia — início de pilha (anterior null)', () => {
  it('1, 2 ou 3 são válidos', () => {
    expect(quebraSequencia(null, d(1))).toBe(false);
    expect(quebraSequencia(null, d(2))).toBe(false);
    expect(quebraSequencia(null, d(3))).toBe(false);
  });

  it('4+ quebra sequência', () => {
    expect(quebraSequencia(null, d(4))).toBe(true);
    expect(quebraSequencia(null, d(10))).toBe(true);
  });
});

describe('quebraSequencia — meio de pilha', () => {
  it('valor igual ou maior, mesma cor: não quebra', () => {
    expect(quebraSequencia(d(3), d(3))).toBe(false);
    expect(quebraSequencia(d(3), d(7))).toBe(false);
  });

  it('valor menor: quebra', () => {
    expect(quebraSequencia(d(5), d(2))).toBe(true);
  });

  it('cor diferente: quebra, mesmo com valor crescente', () => {
    expect(quebraSequencia(d(3, 'vermelho'), d(4, 'azul'))).toBe(true);
  });

  it('reset após 10: volta pra 1-3 não quebra', () => {
    expect(quebraSequencia(d(10), d(1))).toBe(false);
    expect(quebraSequencia(d(10), d(3))).toBe(false);
  });

  it('após 10, valor fora de 1-3 quebra (não é reset válido, nem crescente)', () => {
    expect(quebraSequencia(d(10), d(5))).toBe(true);
  });
});
