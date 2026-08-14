import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useJanelaDesafio } from '../useJanelaDesafio';

describe('useJanelaDesafio', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('declaradoEm null: sempre inativa', () => {
    const { result } = renderHook(() => useJanelaDesafio(null));
    expect(result.current.ativa).toBe(false);
    expect(result.current.restanteMs).toBe(0);
  });

  it('logo após declaradoEm ser setado: ativa, restanteMs próximo da duração cheia', () => {
    const agora = Date.now();
    const { result } = renderHook(() => useJanelaDesafio(agora));
    expect(result.current.ativa).toBe(true);
    expect(result.current.restanteMs).toBeGreaterThan(4000);
  });

  it('avançando além dos 5s: fica inativa, restanteMs zera', () => {
    const agora = Date.now();
    const { result } = renderHook(() => useJanelaDesafio(agora));

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    expect(result.current.ativa).toBe(false);
    expect(result.current.restanteMs).toBe(0);
  });

  it('mudança de declaradoEm (nova declaração) reinicia a contagem', () => {
    const primeiraDeclaracao = Date.now();
    const { result, rerender } = renderHook(({ declaradoEm }) => useJanelaDesafio(declaradoEm), {
      initialProps: { declaradoEm: primeiraDeclaracao },
    });

    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(result.current.ativa).toBe(true);
    expect(result.current.restanteMs).toBeLessThanOrEqual(200);

    const segundaDeclaracao = Date.now();
    rerender({ declaradoEm: segundaDeclaracao });

    expect(result.current.ativa).toBe(true);
    expect(result.current.restanteMs).toBeGreaterThan(4000);
  });

  it('duração customizável via segundo argumento', () => {
    const agora = Date.now();
    const { result } = renderHook(() => useJanelaDesafio(agora, 1000));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.ativa).toBe(false);
  });
});
