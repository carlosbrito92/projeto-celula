import { describe, expect, it } from 'vitest';
import { formatarDuracao, formatarIdade, formatarJogadores } from '../metaFormat';

describe('formatarJogadores', () => {
  it('formata faixa min-max', () => {
    expect(formatarJogadores({ min: 4, max: 8 })).toBe('4–8 jogadores');
  });

  it('sem max, formata "N+ jogadores"', () => {
    expect(formatarJogadores({ min: 4 })).toBe('4+ jogadores');
  });

  it('ausente retorna null', () => {
    expect(formatarJogadores(undefined)).toBeNull();
  });
});

describe('formatarIdade', () => {
  it('formata idade mínima', () => {
    expect(formatarIdade(10)).toBe('10+');
  });

  it('ausente retorna null', () => {
    expect(formatarIdade(undefined)).toBeNull();
  });
});

describe('formatarDuracao', () => {
  it('formata minutos', () => {
    expect(formatarDuracao(15)).toBe('15 min');
  });

  it('ausente retorna null', () => {
    expect(formatarDuracao(undefined)).toBeNull();
  });
});
