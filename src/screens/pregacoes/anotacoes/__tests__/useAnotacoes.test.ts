import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAnotacoes } from '../useAnotacoes';
import type { Secao } from '../../../../content/types';

const secoes: Secao[] = [
  {
    id: 'sec-1',
    numero: '1',
    titulo: 'Primeira seção',
    corpo: [
      { tipo: 'paragrafo', texto: 'A graça é livre para todos.' },
      { tipo: 'lista', itens: ['Primeiro item', 'Segundo item'] },
    ],
  },
];

afterEach(() => {
  localStorage.clear();
});

describe('useAnotacoes', () => {
  it('cria destaque e resolve com offset intacto', () => {
    const { result } = renderHook(() => useAnotacoes('preg-1', secoes));

    act(() => {
      result.current.criarDestaque('sec-1', '0', 2, 7, 'graça');
    });

    expect(result.current.destaques).toHaveLength(1);
    expect(result.current.destaques[0]).toMatchObject({
      secaoId: 'sec-1',
      unidade: '0',
      offsetInicio: 2,
      offsetFim: 7,
    });
    expect(result.current.orfas).toHaveLength(0);
  });

  it('rejeita destaque sobreposto na mesma unidade', () => {
    const { result } = renderHook(() => useAnotacoes('preg-2', secoes));

    act(() => {
      result.current.criarDestaque('sec-1', '0', 2, 7, 'graça');
    });
    let resposta: ReturnType<typeof result.current.criarDestaque> | undefined;
    act(() => {
      resposta = result.current.criarDestaque('sec-1', '0', 4, 10, 'aça é l');
    });

    expect(resposta).toEqual({ ok: false, erro: 'sobreposto' });
    expect(result.current.destaques).toHaveLength(1);
  });

  it('permite destaque em item de lista (unidade composta)', () => {
    const { result } = renderHook(() => useAnotacoes('preg-3', secoes));

    act(() => {
      result.current.criarDestaque('sec-1', '1:1', 0, 7, 'Segundo');
    });

    expect(result.current.destaques).toHaveLength(1);
    expect(result.current.destaques[0].unidade).toBe('1:1');
  });

  it('nota solta de seção não exige unidade/offset', () => {
    const { result } = renderHook(() => useAnotacoes('preg-4', secoes));

    act(() => {
      result.current.criarNotaSolta('sec-1', 'Lembrar de comentar isso na célula.');
    });

    expect(result.current.notasSoltas).toHaveLength(1);
    expect(result.current.destaques).toHaveLength(0);
  });

  it('apagar remove a anotação', () => {
    const { result } = renderHook(() => useAnotacoes('preg-5', secoes));
    let id = '';
    act(() => {
      const r = result.current.criarDestaque('sec-1', '0', 2, 7, 'graça');
      if (r.ok) id = r.id;
    });
    act(() => {
      result.current.apagar(id);
    });
    expect(result.current.destaques).toHaveLength(0);
  });

  it('persiste em localStorage entre montagens (mesma pregação)', () => {
    const primeira = renderHook(() => useAnotacoes('preg-6', secoes));
    act(() => {
      primeira.result.current.criarDestaque('sec-1', '0', 2, 7, 'graça');
    });
    primeira.unmount();

    const segunda = renderHook(() => useAnotacoes('preg-6', secoes));
    expect(segunda.result.current.destaques).toHaveLength(1);
  });

  it('destaque sobrevive a reflow do texto (offset realinha)', () => {
    const { result } = renderHook(() => useAnotacoes('preg-7', secoes));
    act(() => {
      result.current.criarDestaque('sec-1', '0', 2, 7, 'graça');
    });

    const secoesAtualizadas: Secao[] = [
      {
        ...secoes[0],
        corpo: [
          { tipo: 'paragrafo', texto: 'Só que a graça é livre para todos, sempre.' },
          secoes[0].corpo[1],
        ],
      },
    ];
    const { result: resultAtualizado } = renderHook(() => useAnotacoes('preg-7', secoesAtualizadas));

    expect(resultAtualizado.current.destaques).toHaveLength(1);
    expect(resultAtualizado.current.destaques[0].offsetInicio).toBe(9);
    expect(resultAtualizado.current.orfas).toHaveLength(0);
  });

  it('destaque vira órfão quando o trecho some do conteúdo', () => {
    const { result } = renderHook(() => useAnotacoes('preg-8', secoes));
    act(() => {
      result.current.criarDestaque('sec-1', '0', 2, 7, 'graça');
    });

    const secoesReescritas: Secao[] = [
      {
        ...secoes[0],
        corpo: [{ tipo: 'paragrafo', texto: 'Texto totalmente diferente agora.' }, secoes[0].corpo[1]],
      },
    ];
    const { result: resultReescrito } = renderHook(() => useAnotacoes('preg-8', secoesReescritas));

    expect(resultReescrito.current.destaques).toHaveLength(0);
    expect(resultReescrito.current.orfas).toHaveLength(1);
  });
});
