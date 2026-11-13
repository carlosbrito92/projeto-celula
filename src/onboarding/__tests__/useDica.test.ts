import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDica } from '../useDica';
import { dicaFoiVista, limparDicasVistas, marcarDicaVista } from '../dicasStorage';

describe('useDica', () => {
  beforeEach(() => localStorage.clear());

  it('fica visível enquanto o id não foi visto', () => {
    const { result } = renderHook(() => useDica('leitura-aa-v1'));
    expect(result.current.visivel).toBe(true);
  });

  it('id null nunca fica visível', () => {
    const { result } = renderHook(() => useDica(null));
    expect(result.current.visivel).toBe(false);
  });

  it('dispensar grava no storage e esconde', () => {
    const { result } = renderHook(() => useDica('leitura-aa-v1'));
    act(() => result.current.dispensar());
    expect(result.current.visivel).toBe(false);
    expect(dicaFoiVista('leitura-aa-v1')).toBe(true);
  });

  it('reage a marcações feitas fora do hook (ex.: usar o recurso apontado)', () => {
    const { result } = renderHook(() => useDica('leitura-aa-v1'));
    act(() => marcarDicaVista('leitura-aa-v1'));
    expect(result.current.visivel).toBe(false);
  });

  it('volta a aparecer depois de limpar ("Rever as dicas")', () => {
    marcarDicaVista('leitura-aa-v1');
    const { result } = renderHook(() => useDica('leitura-aa-v1'));
    expect(result.current.visivel).toBe(false);
    act(() => limparDicasVistas());
    expect(result.current.visivel).toBe(true);
  });

  it('visibilidade vem do storage: remontar depois de dispensar não traz a dica de volta', () => {
    const primeiro = renderHook(() => useDica('leitura-aa-v1'));
    act(() => primeiro.result.current.dispensar());
    primeiro.unmount();
    const segundo = renderHook(() => useDica('leitura-aa-v1'));
    expect(segundo.result.current.visivel).toBe(false);
  });
});
