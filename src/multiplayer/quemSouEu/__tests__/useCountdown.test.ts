import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from '../useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('começa em "aguardando" enquanto ativar é false', () => {
    const { result } = renderHook(() => useCountdown(3, false));
    expect(result.current.fase).toBe('aguardando');
    expect(result.current.restante).toBe(3);
  });

  it('entra em "contagem" assim que ativar vira true', () => {
    const { result, rerender } = renderHook(({ ativar }) => useCountdown(3, ativar), {
      initialProps: { ativar: false },
    });
    rerender({ ativar: true });
    expect(result.current.fase).toBe('contagem');
    expect(result.current.restante).toBe(3);
  });

  it('decrementa 1 por segundo até chegar em "revelado"', () => {
    const { result, rerender } = renderHook(({ ativar }) => useCountdown(2, ativar), {
      initialProps: { ativar: false },
    });
    rerender({ ativar: true });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.fase).toBe('contagem');
    expect(result.current.restante).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.fase).toBe('revelado');
  });

  it('não decrementa enquanto ativar é false', () => {
    const { result } = renderHook(() => useCountdown(3, false));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.fase).toBe('aguardando');
    expect(result.current.restante).toBe(3);
  });

  it('fica em "revelado" e não volta pra trás depois de chegar lá', () => {
    const { result, rerender } = renderHook(({ ativar }) => useCountdown(1, ativar), {
      initialProps: { ativar: true },
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.fase).toBe('revelado');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.fase).toBe('revelado');
    rerender({ ativar: true });
    expect(result.current.fase).toBe('revelado');
  });
});
