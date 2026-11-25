import { describe, expect, it } from 'vitest';
import { ajustarTexto, quebrarLinhas } from '../layout';

// 1 caractere = 10px
const medirCom = (tamanho: number) => (t: string) => t.length * tamanho;

describe('quebrarLinhas', () => {
  it('quebra por palavra respeitando a largura', () => {
    expect(quebrarLinhas('um dois tres quatro', 90, (t) => t.length * 10)).toEqual([
      'um dois',
      'tres',
      'quatro',
    ]);
  });
  it('palavra maior que a largura fica sozinha, sem loop', () => {
    expect(quebrarLinhas('a supercalifragilistico b', 50, (t) => t.length * 10)).toEqual([
      'a',
      'supercalifragilistico',
      'b',
    ]);
  });
  it('texto vazio não gera linhas', () => {
    expect(quebrarLinhas('   ', 100, (t) => t.length)).toEqual([]);
  });
});

describe('ajustarTexto', () => {
  const texto = 'palavra '.repeat(20).trim();
  it('usa o maior tamanho que cabe', () => {
    const r = ajustarTexto(texto, 1000, 5000, 1.2, 40, 20, medirCom);
    expect(r.tamanho).toBe(40);
  });
  it('reduz quando não cabe e respeita a altura', () => {
    const r = ajustarTexto(texto, 1000, 600, 1.2, 60, 20, medirCom);
    expect(r.tamanho).toBeLessThan(60);
    expect(r.linhas.length * r.tamanho * 1.2).toBeLessThanOrEqual(600);
  });
  it('devolve o mínimo quando nada cabe', () => {
    expect(ajustarTexto(texto, 1000, 10, 1.2, 60, 20, medirCom).tamanho).toBe(20);
  });
});
