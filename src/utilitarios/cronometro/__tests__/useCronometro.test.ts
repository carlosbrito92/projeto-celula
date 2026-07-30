import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCronometro } from '../useCronometro';

describe('useCronometro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia com o preset informado', () => {
    const { result } = renderHook(() => useCronometro(60));
    expect(result.current.segundosRestantes).toBe(60);
    expect(result.current.rodando).toBe(false);
  });

  it('escolherPreset() atualiza o preset e reseta os segundos restantes', () => {
    const { result } = renderHook(() => useCronometro(60));
    act(() => result.current.escolherPreset(30));
    expect(result.current.preset).toBe(30);
    expect(result.current.segundosRestantes).toBe(30);
  });

  it('iniciarOuPausar() decrementa a cada segundo enquanto rodando', () => {
    const { result } = renderHook(() => useCronometro(10));
    act(() => result.current.iniciarOuPausar());
    expect(result.current.rodando).toBe(true);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.segundosRestantes).toBe(7);
  });

  it('pausar impede o decremento', () => {
    const { result } = renderHook(() => useCronometro(10));
    act(() => result.current.iniciarOuPausar()); // inicia
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.segundosRestantes).toBe(8);

    act(() => result.current.iniciarOuPausar()); // pausa
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.segundosRestantes).toBe(8);
    expect(result.current.rodando).toBe(false);
  });

  it('zerar() volta ao preset e para o cronômetro', () => {
    const { result } = renderHook(() => useCronometro(10));
    act(() => result.current.iniciarOuPausar());
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.segundosRestantes).toBe(6);

    act(() => result.current.zerar());
    expect(result.current.segundosRestantes).toBe(10);
    expect(result.current.rodando).toBe(false);
  });

  it('nunca fica negativo — para em 0 e desliga rodando', () => {
    const { result } = renderHook(() => useCronometro(3));
    act(() => result.current.iniciarOuPausar());
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.segundosRestantes).toBe(0);
    expect(result.current.rodando).toBe(false);
  });
});
