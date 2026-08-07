import { describe, expect, it } from 'vitest';
import { apurarResultado } from '../votos';

describe('apurarResultado', () => {
  it('maioria simples aponta o vencedor certo', () => {
    const r = apurarResultado(['a', 'a', 'b'], 'a');
    expect(r.vencedorId).toBe('a');
    expect(r.contagemPorId).toEqual({ a: 2, b: 1 });
    expect(r.impostorEncontrado).toBe(true);
  });

  it('impostor escapa quando maioria vota em outra pessoa', () => {
    const r = apurarResultado(['b', 'b', 'a'], 'a');
    expect(r.vencedorId).toBe('b');
    expect(r.impostorEncontrado).toBe(false);
  });

  it('empate não conta como decisão do grupo', () => {
    const r = apurarResultado(['a', 'b'], 'a');
    expect(r.vencedorId).toBeNull();
    expect(r.impostorEncontrado).toBe(false);
  });

  it('votos undefined (quem pulou a votação digital) são ignorados', () => {
    const r = apurarResultado(['a', undefined, 'a', undefined], 'a');
    expect(r.vencedorId).toBe('a');
    expect(r.contagemPorId).toEqual({ a: 2 });
  });

  it('sem nenhum voto, não há vencedor', () => {
    const r = apurarResultado([], 'a');
    expect(r.vencedorId).toBeNull();
    expect(r.impostorEncontrado).toBe(false);
  });
});
