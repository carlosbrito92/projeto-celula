import { describe, expect, it } from 'vitest';
import { formatarTempo } from '../formatarTempo';

describe('formatarTempo', () => {
  it.each([
    [0, '0:00'],
    [45, '0:45'],
    [60, '1:00'],
    [125, '2:05'],
  ])('formatarTempo(%i) === %s', (segundos, esperado) => {
    expect(formatarTempo(segundos)).toBe(esperado);
  });

  it('nunca fica negativo', () => {
    expect(formatarTempo(-5)).toBe('0:00');
  });
});
