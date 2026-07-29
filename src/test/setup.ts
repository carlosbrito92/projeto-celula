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
