import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutosave } from '../useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  const montar = (salvar: () => Promise<void>) =>
    renderHook((p: { sujo: boolean; revisao: number; pausado?: boolean }) => useAutosave({ ...p, salvar }), {
      initialProps: { sujo: false, revisao: 0 } as { sujo: boolean; revisao: number; pausado?: boolean },
    });

  it('não salva sem alteração', () => {
    const salvar = vi.fn(async () => {});
    montar(salvar);
    act(() => vi.advanceTimersByTime(60000));
    expect(salvar).not.toHaveBeenCalled();
  });

  it('espera 4s depois da última edição; cada edição reinicia a espera', () => {
    const salvar = vi.fn(async () => {});
    const h = montar(salvar);
    h.rerender({ sujo: true, revisao: 1 });
    act(() => vi.advanceTimersByTime(3000));
    h.rerender({ sujo: true, revisao: 2 });
    act(() => vi.advanceTimersByTime(3000));
    expect(salvar).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    expect(salvar).toHaveBeenCalledTimes(1);
  });

  it('nunca salva duas vezes em menos de 15s (rate limit)', async () => {
    const salvar = vi.fn(async () => {});
    const h = montar(salvar);
    h.rerender({ sujo: true, revisao: 1 });
    await act(async () => vi.advanceTimersByTime(4000));
    expect(salvar).toHaveBeenCalledTimes(1);
    h.rerender({ sujo: false, revisao: 1 });
    h.rerender({ sujo: true, revisao: 2 });
    await act(async () => vi.advanceTimersByTime(14000));
    expect(salvar).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(salvar).toHaveBeenCalledTimes(2);
  });

  it('digitação contínua não adia para sempre: salva em até 30s', () => {
    const salvar = vi.fn(async () => {});
    const h = montar(salvar);
    for (let r = 1; r <= 15; r++) {
      h.rerender({ sujo: true, revisao: r });
      act(() => vi.advanceTimersByTime(2000));
    }
    expect(salvar).toHaveBeenCalledTimes(1);
  });

  it('pausado (conflito) não salva', () => {
    const salvar = vi.fn(async () => {});
    const h = montar(salvar);
    h.rerender({ sujo: true, revisao: 1, pausado: true });
    act(() => vi.advanceTimersByTime(60000));
    expect(salvar).not.toHaveBeenCalled();
  });

  it('aba indo para segundo plano salva na hora', () => {
    const salvar = vi.fn(async () => {});
    const h = montar(salvar);
    h.rerender({ sujo: true, revisao: 1 });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(salvar).toHaveBeenCalledTimes(1);
  });
});
