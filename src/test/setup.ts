import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom não implementa IntersectionObserver — stub inofensivo para que
// componentes que o usam (ex: useIndiceFab) montem sem quebrar em teste.
// Testes que precisam simular interseção substituem via vi.stubGlobal.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error stub simplificado só para ambiente de teste
  globalThis.IntersectionObserver = IntersectionObserverStub;
}

// jsdom não implementa scrollIntoView — sem isso, nem dá pra fazer
// `vi.spyOn(Element.prototype, 'scrollIntoView')` (a propriedade precisa existir).
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom não implementa Range.getBoundingClientRect/getClientRects (usado pra
// posicionar o popover de anotação pessoal perto da seleção de texto real —
// ver UnidadeAnotavel). Sem stub, qualquer teste que simule seleção de texto
// quebra com "range.getBoundingClientRect is not a function".
if (typeof Range.prototype.getBoundingClientRect === 'undefined') {
  const rectVazio = () => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON() {
      return this;
    },
  });
  Range.prototype.getBoundingClientRect = rectVazio as typeof Range.prototype.getBoundingClientRect;
  Range.prototype.getClientRects = (() => []) as unknown as typeof Range.prototype.getClientRects;
}
