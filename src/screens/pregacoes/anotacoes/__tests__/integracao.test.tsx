import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockRenderer } from '../../../../content/BlockRenderer';
import type { Secao } from '../../../../content/types';
import { AnotacaoContext } from '../AnotacaoContext';
import { AnotacaoPopover, type PopoverEstado } from '../AnotacaoPopover';
import { useAnotacoes } from '../useAnotacoes';

const secoes: Secao[] = [
  {
    id: 'sec-1',
    numero: '1',
    titulo: 'Primeira seção',
    corpo: [{ tipo: 'paragrafo', texto: 'A graça é livre para todos.' }],
  },
];

function Harness() {
  const api = useAnotacoes('preg-integracao', secoes);
  const [popover, setPopover] = useState<PopoverEstado | null>(null);
  const chave = !popover
    ? null
    : popover.tipo === 'nova'
      ? `nova:${popover.offsetInicio}:${popover.offsetFim}`
      : `editar:${popover.id}`;

  return (
    <AnotacaoContext.Provider
      value={{
        modoAnotacao: api.modoAnotacao,
        destaquesPorUnidade: api.destaquesPorUnidade,
        iniciarSelecao: (s) => setPopover({ tipo: 'nova', ...s }),
        abrirDestaque: (id, rect) => setPopover({ tipo: 'editar', id, rect }),
      }}
    >
      <button type="button" onClick={api.alternarModoAnotacao}>
        alternar modo
      </button>
      <BlockRenderer bloco={secoes[0].corpo[0]} secaoId="sec-1" blocoIndex={0} />
      {popover && (
        <AnotacaoPopover key={chave} estado={popover} api={api} aoFechar={() => setPopover(null)} />
      )}
    </AnotacaoContext.Provider>
  );
}

// Depois de um destaque, o texto fica quebrado em múltiplos nós (negrito,
// <mark>...) — acha o nó de texto certo pra um offset global, mesma lógica
// (invertida) do offsetNoContainer de selecao.ts.
function localizarPonto(container: Node, offsetGlobal: number): { node: Node; offset: number } {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let restante = offsetGlobal;
  let node = walker.nextNode();
  while (node) {
    const tamanho = node.textContent?.length ?? 0;
    if (restante <= tamanho) return { node, offset: restante };
    restante -= tamanho;
    node = walker.nextNode();
  }
  throw new Error(`offset ${offsetGlobal} fora do texto de ${container}`);
}

// Gatilho de captura é `selectionchange` (documento inteiro, debounced 300ms
// em UnidadeAnotavel), não mais mouseup/touchend no container — achado real
// de device físico, ver UnidadeAnotavel.tsx. Os `await screen.findByText`
// depois desta chamada absorvem o debounce sozinhos (polling, timeout
// default de 1000ms > 300ms).
function selecionarTrecho(container: HTMLElement, inicio: number, fim: number) {
  const span = container.querySelector('p span')!;
  const pontoInicio = localizarPonto(span, inicio);
  const pontoFim = localizarPonto(span, fim);
  const range = document.createRange();
  range.setStart(pontoInicio.node, pontoInicio.offset);
  range.setEnd(pontoFim.node, pontoFim.offset);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
}

describe('fluxo de anotação pessoal (integração)', () => {
  it('grifar um trecho selecionado cria um <mark>', async () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByText('alternar modo'));

    act(() => {
      selecionarTrecho(container, 2, 7); // "graça"
    });

    expect(await screen.findByText('“graça”')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Grifar'));

    expect(container.querySelector('mark')).not.toBeNull();
    expect(container.querySelector('mark')!.textContent).toBe('graça');
  });

  it('tocar num destaque existente abre popover de edição, salvar nota reflete no <mark>', async () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByText('alternar modo'));
    act(() => {
      selecionarTrecho(container, 2, 7);
    });
    fireEvent.click(await screen.findByText('Grifar'));

    fireEvent.click(container.querySelector('mark')!);
    const textarea = await screen.findByPlaceholderText('Nota pessoal (opcional)');
    fireEvent.change(textarea, { target: { value: 'Vale lembrar disso na célula.' } });
    fireEvent.click(screen.getByText('Salvar'));

    expect(container.querySelector('mark')!.className).toMatch(/destaqueComNota/);
  });

  it('destaque sobreposto é rejeitado com mensagem de erro', async () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByText('alternar modo'));

    act(() => {
      selecionarTrecho(container, 2, 7); // "graça"
    });
    fireEvent.click(await screen.findByText('Grifar'));

    act(() => {
      selecionarTrecho(container, 4, 10); // sobrepõe "graça"
    });
    fireEvent.click(await screen.findByText('Grifar'));

    expect(
      await screen.findByText('Esse trecho se sobrepõe a um destaque já existente.'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('mark')).toHaveLength(1);
  });
});
