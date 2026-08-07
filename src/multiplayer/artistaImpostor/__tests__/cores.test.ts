import { describe, expect, it } from 'vitest';
import { corPorIndice, PALETA_PARTICIPANTES } from '../cores';

describe('corPorIndice', () => {
  it('devolve a cor correspondente ao índice', () => {
    expect(corPorIndice(0)).toBe(PALETA_PARTICIPANTES[0]);
    expect(corPorIndice(1)).toBe(PALETA_PARTICIPANTES[1]);
  });

  it('cicla pela paleta quando o índice excede o tamanho', () => {
    expect(corPorIndice(PALETA_PARTICIPANTES.length)).toBe(PALETA_PARTICIPANTES[0]);
    expect(corPorIndice(PALETA_PARTICIPANTES.length + 2)).toBe(PALETA_PARTICIPANTES[2]);
  });
});
