import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToId, useScrollProgress, useSecaoAtiva } from '../useLeituraNav';

class FakeIntersectionObserver {
  static instancias: FakeIntersectionObserver[] = [];
  callback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  observados: Element[] = [];

  constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
    this.callback = callback;
    FakeIntersectionObserver.instancias.push(this);
  }
  observe(el: Element) {
    this.observados.push(el);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }

  emitir(id: string, isIntersecting: boolean, intersectionRatio: number) {
    const target = this.observados.find((el) => el.id === id)!;
    this.callback([{ target, isIntersecting, intersectionRatio }]);
  }
}

describe('scrollToId', () => {
  it('chama scrollIntoView com behavior smooth e block start', () => {
    document.body.innerHTML = '<div id="alvo"></div>';
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    scrollToId('alvo');
    expect(spy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    spy.mockRestore();
  });

  it('não quebra quando o id não existe no DOM', () => {
    document.body.innerHTML = '';
    expect(() => scrollToId('nao-existe')).not.toThrow();
  });
});

describe('useSecaoAtiva', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeIntersectionObserver.instancias = [];
    document.body.innerHTML = '';
  });

  it('começa em 0 antes de qualquer callback de interseção', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const { result } = renderHook(() => useSecaoAtiva(['a', 'b']));
    expect(result.current).toBe(0);
  });

  it('muda para o índice do id com maior intersectionRatio', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const { result } = renderHook(() => useSecaoAtiva(['a', 'b']));

    act(() => {
      FakeIntersectionObserver.instancias[0].emitir('a', true, 0.4);
    });
    expect(result.current).toBe(0);

    act(() => {
      FakeIntersectionObserver.instancias[0].emitir('b', true, 0.9);
    });
    expect(result.current).toBe(1);
  });

  it('ignora entries que saíram da viewport (isIntersecting false zera o ratio)', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const { result } = renderHook(() => useSecaoAtiva(['a', 'b']));

    act(() => {
      FakeIntersectionObserver.instancias[0].emitir('b', true, 0.9);
    });
    expect(result.current).toBe(1);

    act(() => {
      FakeIntersectionObserver.instancias[0].emitir('b', false, 0);
      FakeIntersectionObserver.instancias[0].emitir('a', true, 0.3);
    });
    expect(result.current).toBe(0);
  });

  it('não observa nada quando ids está vazio', () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    renderHook(() => useSecaoAtiva([]));
    expect(FakeIntersectionObserver.instancias.length).toBe(0);
  });
});

describe('useScrollProgress', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna 0 quando o conteúdo não excede a viewport (scrollHeight === clientHeight)', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 500,
      configurable: true,
    });
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it('recalcula via requestAnimationFrame no evento de scroll', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 0,
      configurable: true,
      writable: true,
    });

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});

    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);

    act(() => {
      (document.documentElement as unknown as { scrollTop: number }).scrollTop = 250;
      window.dispatchEvent(new Event('scroll'));
      rafCallback?.(0);
    });

    expect(result.current).toBe(50);
  });
});
