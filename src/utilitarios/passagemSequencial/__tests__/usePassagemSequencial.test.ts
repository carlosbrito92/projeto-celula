import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePassagemSequencial } from '../usePassagemSequencial';

beforeEach(() => {
  localStorage.clear();
});

function iniciarComParticipantes(quantidade: number, nomes: string[] = []) {
  const { result } = renderHook(() => usePassagemSequencial());
  act(() => {
    result.current.setNomes(nomes);
  });
  act(() => {
    result.current.iniciar(quantidade, (participantes) =>
      Object.fromEntries(participantes.map((p, i) => [p, `valor-${i}`])),
    );
  });
  return result;
}

describe('usePassagemSequencial — iniciar() na mesma chamada de setNomes (closure)', () => {
  it('iniciar(quantidade, ...) usa a quantidade explícita, não uma leitura obsoleta do estado', () => {
    const { result } = renderHook(() => usePassagemSequencial());
    act(() => {
      // Regressão: setQuantidade(n) + iniciar() no mesmo handler não refletia
      // a nova quantidade a tempo (closure obsoleta) — achado testando no
      // device físico, "Passe para" aparecia sem nome. iniciar() agora recebe
      // a quantidade como argumento, eliminando a leitura obsoleta.
      result.current.setNomes(['Ana', 'Beto']);
    });
    act(() => {
      result.current.iniciar(2, (participantes) =>
        Object.fromEntries(participantes.map((p) => [p, `valor-${p}`])),
      );
    });
    expect(result.current.participantes).toEqual(['Ana', 'Beto']);
    expect(result.current.participanteAtual).toBe('Ana');
  });
});

describe('usePassagemSequencial', () => {
  it('iniciar() entra na fase passagem, índice 0, sub aguardando', () => {
    const result = iniciarComParticipantes(3);
    expect(result.current.estado).toEqual({ fase: 'passagem', indice: 0, sub: 'aguardando' });
    expect(result.current.participantes).toEqual([
      'Participante 1',
      'Participante 2',
      'Participante 3',
    ]);
  });

  it('revelarAtual() expõe só o valor do participante atual', () => {
    const result = iniciarComParticipantes(3);
    expect(result.current.valorAtual).toBeNull();
    act(() => result.current.revelarAtual());
    expect(result.current.valorAtual).toBe('valor-0');
    expect(result.current.estado).toEqual({ fase: 'passagem', indice: 0, sub: 'revelado' });
  });

  it('pedirConfirmacao()->confirmando e reverNovamente() volta a revelado', () => {
    const result = iniciarComParticipantes(2);
    act(() => result.current.revelarAtual());
    act(() => result.current.pedirConfirmacao());
    expect(result.current.estado).toMatchObject({ sub: 'confirmando' });
    expect(result.current.valorAtual).toBe('valor-0');
    act(() => result.current.reverNovamente());
    expect(result.current.estado).toMatchObject({ sub: 'revelado' });
  });

  it('avancar() percorre todos os participantes e termina em gestao só pela contagem de toques', () => {
    const result = iniciarComParticipantes(3);

    for (let i = 0; i < 3; i++) {
      expect(result.current.estado).toEqual({ fase: 'passagem', indice: i, sub: 'aguardando' });
      act(() => result.current.revelarAtual());
      act(() => result.current.pedirConfirmacao());
      act(() => result.current.avancar());
    }

    expect(result.current.estado).toEqual({ fase: 'gestao' });
  });

  it('avancar() só funciona a partir de confirmando (não avança sem revelar/confirmar antes)', () => {
    const result = iniciarComParticipantes(2);
    act(() => result.current.avancar());
    expect(result.current.estado).toEqual({ fase: 'passagem', indice: 0, sub: 'aguardando' });
  });

  it('na gestão, revelarParaLider(i) alterna só aquele índice', () => {
    const result = iniciarComParticipantes(2);
    for (let i = 0; i < 2; i++) {
      act(() => result.current.revelarAtual());
      act(() => result.current.pedirConfirmacao());
      act(() => result.current.avancar());
    }
    expect(result.current.estado).toEqual({ fase: 'gestao' });
    expect(result.current.revelados).toEqual([false, false]);

    act(() => result.current.revelarParaLider(1));
    expect(result.current.revelados).toEqual([false, true]);
    expect(result.current.valorDe(1)).toBe('valor-1');
    expect(result.current.valorDe(0)).toBe('valor-0');

    act(() => result.current.revelarParaLider(0));
    expect(result.current.revelados).toEqual([true, true]);

    act(() => result.current.revelarParaLider(1));
    expect(result.current.revelados).toEqual([true, false]);
  });

  it('reiniciar() volta tudo para o estado inicial', () => {
    const result = iniciarComParticipantes(2);
    act(() => result.current.reiniciar());
    expect(result.current.estado).toEqual({ fase: 'setup' });
    expect(result.current.quantidade).toBe(0);
    expect(result.current.participantes).toEqual([]);
  });

  it('nomes persistem entre instâncias do hook (widget fechado e reaberto)', () => {
    const { result: primeira } = renderHook(() => usePassagemSequencial());
    act(() => primeira.current.setNomes(['Ana', 'Beto']));

    const { result: segunda } = renderHook(() => usePassagemSequencial());
    expect(segunda.current.nomes).toEqual(['Ana', 'Beto']);
  });

  it('reiniciar() também limpa os nomes persistidos', () => {
    const result = iniciarComParticipantes(2, ['Ana', 'Beto']);
    act(() => result.current.reiniciar());

    const { result: nova } = renderHook(() => usePassagemSequencial());
    expect(nova.current.nomes).toEqual([]);
  });
});
