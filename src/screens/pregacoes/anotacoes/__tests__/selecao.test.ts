import { describe, expect, it } from 'vitest';
import { capturarSelecao } from '../selecao';

function montarContainer(html: string): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

describe('capturarSelecao', () => {
  it('seleção simples num único nó de texto', () => {
    const container = montarContainer('A graça é livre.');
    const textNode = container.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 7);

    expect(capturarSelecao(container, range)).toEqual({
      offsetInicio: 2,
      offsetFim: 7,
      textoSelecionado: 'graça',
    });
  });

  it('seleção atravessando um nó em negrito (<strong>) — offset soma todos os nós', () => {
    const container = montarContainer('A <strong>graça</strong> é livre.');
    const strongText = container.querySelector('strong')!.firstChild!;
    const range = document.createRange();
    range.setStart(strongText, 0);
    range.setEnd(strongText, 5);

    expect(capturarSelecao(container, range)).toEqual({
      offsetInicio: 2,
      offsetFim: 7,
      textoSelecionado: 'graça',
    });
  });

  it('seleção colapsada (clique simples, sem arrastar) retorna null', () => {
    const container = montarContainer('A graça é livre.');
    const textNode = container.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 2);

    expect(capturarSelecao(container, range)).toBeNull();
  });

  it('range fora do container retorna null', () => {
    const container = montarContainer('Dentro.');
    const outro = montarContainer('Fora.');
    const range = document.createRange();
    range.setStart(outro.firstChild!, 0);
    range.setEnd(outro.firstChild!, 4);

    expect(capturarSelecao(container, range)).toBeNull();
  });
});
