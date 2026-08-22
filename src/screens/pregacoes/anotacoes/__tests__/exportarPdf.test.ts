import { describe, expect, it } from 'vitest';
import { calcularFatiasPagina } from '../exportarPdf';

describe('calcularFatiasPagina', () => {
  it('altura menor que uma fatia — 1 página só', () => {
    expect(calcularFatiasPagina(500, 842)).toEqual([{ offsetY: 0, altura: 500 }]);
  });

  it('altura exatamente múltipla da fatia — sem sobra', () => {
    expect(calcularFatiasPagina(1684, 842)).toEqual([
      { offsetY: 0, altura: 842 },
      { offsetY: 842, altura: 842 },
    ]);
  });

  it('altura com resto — última fatia menor', () => {
    expect(calcularFatiasPagina(2000, 842)).toEqual([
      { offsetY: 0, altura: 842 },
      { offsetY: 842, altura: 842 },
      { offsetY: 1684, altura: 316 },
    ]);
  });

  it('pregação real longa (equivalente ao PDF de 20000px do bug) gera várias páginas, não 1 gigante', () => {
    const fatias = calcularFatiasPagina(20000, 842);
    expect(fatias.length).toBeGreaterThan(20);
    expect(fatias.every((f) => f.altura <= 842)).toBe(true);
    expect(fatias.reduce((soma, f) => soma + f.altura, 0)).toBe(20000);
  });

  it('alturaFatiaPx inválida (<=0) não trava em loop infinito — vira passo mínimo de 1', () => {
    const fatias = calcularFatiasPagina(5, 0);
    expect(fatias).toEqual([
      { offsetY: 0, altura: 1 },
      { offsetY: 1, altura: 1 },
      { offsetY: 2, altura: 1 },
      { offsetY: 3, altura: 1 },
      { offsetY: 4, altura: 1 },
    ]);
  });

  it('altura total zero — nenhuma fatia', () => {
    expect(calcularFatiasPagina(0, 842)).toEqual([]);
  });
});
