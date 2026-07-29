import { describe, expect, it } from 'vitest';
import { formatDataPtBr, parseDataPtBr } from '../parseData';

describe('parseDataPtBr', () => {
  it('converte data com dia de dois dígitos', () => {
    expect(parseDataPtBr('26 de julho de 2026')).toBe('2026-07-26');
  });

  it('converte data com dia de um dígito, preenchendo com zero', () => {
    expect(parseDataPtBr('5 de julho de 2026')).toBe('2026-07-05');
  });

  it('converte mês com cedilha', () => {
    expect(parseDataPtBr('1 de março de 2026')).toBe('2026-03-01');
  });

  it('retorna null para entrada vazia ou ausente', () => {
    expect(parseDataPtBr('')).toBeNull();
    expect(parseDataPtBr(undefined)).toBeNull();
    expect(parseDataPtBr(null)).toBeNull();
  });

  it('retorna null para formato não reconhecido, sem lançar', () => {
    expect(parseDataPtBr('data desconhecida')).toBeNull();
    expect(parseDataPtBr('2026-07-26')).toBeNull();
  });
});

describe('formatDataPtBr', () => {
  it('converte ISO de volta para PT-BR', () => {
    expect(formatDataPtBr('2026-07-26')).toBe('26 de julho de 2026');
  });

  it('retorna null para entrada inválida', () => {
    expect(formatDataPtBr(null)).toBeNull();
    expect(formatDataPtBr('26 de julho de 2026')).toBeNull();
  });
});
