import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, useRouter } from '../Router';

const { isNativePlatformMock } = vi.hoisted(() => ({
  isNativePlatformMock: vi.fn(() => false),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: isNativePlatformMock },
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })), exitApp: vi.fn() },
}));

const ULTIMA_ROTA_KEY = 'ultimaRota';

function TelaComRota() {
  const { path, navigate } = useRouter();
  return (
    <div>
      <span data-testid="path">{path}</span>
      <button type="button" onClick={() => navigate('/quebra-gelos')}>
        ir
      </button>
    </div>
  );
}

/**
 * Regressão (device físico, 2026-08-14): processo do app nativo morre em
 * background/memória → Android recria a Activity → WebView do Capacitor
 * recarrega `https://localhost/` do zero, perdendo o path de `pushState`.
 * Usuário sempre caía de volta na Biblioteca, mesmo com o fix de
 * reidratação do Spicy (Organizador nem chegava a remontar). Só nativo —
 * web/PWA já preserva a URL sozinho num reload real.
 */
describe('RouterProvider — persistência de rota (só nativo)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('web/PWA: ignora rota salva, sempre usa window.location.pathname', () => {
    isNativePlatformMock.mockReturnValue(false);
    localStorage.setItem(ULTIMA_ROTA_KEY, '/v2/spicy');
    window.history.replaceState({}, '', '/');

    const { getByTestId } = render(
      <RouterProvider>
        <TelaComRota />
      </RouterProvider>,
    );

    expect(getByTestId('path').textContent).toBe('/');
  });

  it('nativo, boot em "/" com rota salva: restaura a rota salva e atualiza a URL do WebView', () => {
    isNativePlatformMock.mockReturnValue(true);
    localStorage.setItem(ULTIMA_ROTA_KEY, '/v2/spicy');
    window.history.replaceState({}, '', '/');

    const { getByTestId } = render(
      <RouterProvider>
        <TelaComRota />
      </RouterProvider>,
    );

    expect(getByTestId('path').textContent).toBe('/v2/spicy');
    expect(window.location.pathname).toBe('/v2/spicy');
  });

  it('nativo, boot em "/" sem rota salva: fica em "/"', () => {
    isNativePlatformMock.mockReturnValue(true);
    window.history.replaceState({}, '', '/');

    const { getByTestId } = render(
      <RouterProvider>
        <TelaComRota />
      </RouterProvider>,
    );

    expect(getByTestId('path').textContent).toBe('/');
  });

  it('nativo, boot num path real (deep link) diferente de "/": ignora localStorage, usa o path real', () => {
    isNativePlatformMock.mockReturnValue(true);
    localStorage.setItem(ULTIMA_ROTA_KEY, '/v2/spicy');
    window.history.replaceState({}, '', '/quebra-gelos');

    const { getByTestId } = render(
      <RouterProvider>
        <TelaComRota />
      </RouterProvider>,
    );

    expect(getByTestId('path').textContent).toBe('/quebra-gelos');
  });

  it('nativo: navigate() persiste a nova rota no localStorage', () => {
    isNativePlatformMock.mockReturnValue(true);
    window.history.replaceState({}, '', '/');

    const { getByText } = render(
      <RouterProvider>
        <TelaComRota />
      </RouterProvider>,
    );

    fireEvent.click(getByText('ir'));

    expect(localStorage.getItem(ULTIMA_ROTA_KEY)).toBe('/quebra-gelos');
  });

  it('web/PWA: navigate() não escreve no localStorage', () => {
    isNativePlatformMock.mockReturnValue(false);
    window.history.replaceState({}, '', '/');

    const { getByText } = render(
      <RouterProvider>
        <TelaComRota />
      </RouterProvider>,
    );

    fireEvent.click(getByText('ir'));

    expect(localStorage.getItem(ULTIMA_ROTA_KEY)).toBeNull();
  });
});
