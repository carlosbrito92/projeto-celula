import { describe, expect, it } from 'vitest';
import { calcularPosicaoFan } from '../fanLayout';

describe('calcularPosicaoFan', () => {
  it('mão de 1 carta: sem rotação nem deslocamento', () => {
    expect(calcularPosicaoFan(0, 1)).toEqual({ rotacaoDeg: 0, deslocamentoY: 0 });
  });

  it('carta central de uma mão ímpar (5): reta, no topo do arco', () => {
    expect(calcularPosicaoFan(2, 5)).toEqual({ rotacaoDeg: 0, deslocamentoY: 0 });
  });

  it('cartas nas pontas giram mais e descem mais que as do meio', () => {
    const ponta = calcularPosicaoFan(0, 5);
    const meio = calcularPosicaoFan(2, 5);
    expect(Math.abs(ponta.rotacaoDeg)).toBeGreaterThan(Math.abs(meio.rotacaoDeg));
    expect(ponta.deslocamentoY).toBeGreaterThan(meio.deslocamentoY);
  });

  it('simetria: cartas espelhadas em torno do centro têm rotação oposta e mesmo deslocamento', () => {
    const total = 6;
    for (let i = 0; i < total; i++) {
      const espelhado = total - 1 - i;
      const a = calcularPosicaoFan(i, total);
      const b = calcularPosicaoFan(espelhado, total);
      expect(a.rotacaoDeg).toBeCloseTo(-b.rotacaoDeg, 5);
      expect(a.deslocamentoY).toBe(b.deslocamentoY);
    }
  });

  it('mão par (6): as duas cartas centrais têm rotação oposta pequena, mesmo deslocamento', () => {
    const centro1 = calcularPosicaoFan(2, 6);
    const centro2 = calcularPosicaoFan(3, 6);
    expect(centro1.rotacaoDeg).toBeCloseTo(-centro2.rotacaoDeg, 5);
    expect(centro1.deslocamentoY).toBe(centro2.deslocamentoY);
  });

  it('deslocamentoY nunca é negativo (cartas só descem em relação ao centro, nunca sobem)', () => {
    for (let total = 1; total <= 8; total++) {
      for (let i = 0; i < total; i++) {
        expect(calcularPosicaoFan(i, total).deslocamentoY).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
