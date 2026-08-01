import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RouterProvider } from '../Router';

const { addListenerMock, exitAppMock } = vi.hoisted(() => ({
  addListenerMock: vi.fn(),
  exitAppMock: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: addListenerMock,
    exitApp: exitAppMock,
  },
}));

/**
 * Regressão: Capacitor não navega o WebView sozinho no botão físico de
 * voltar do Android (mudou a partir da v4) — sem um listener de 'backButton'
 * registrado explicitamente, o botão fecha o app direto pra home screen em
 * vez de voltar uma tela, mesmo com entradas no histórico.
 */
describe('RouterProvider — botão físico de voltar (Capacitor)', () => {
  beforeEach(() => {
    addListenerMock.mockClear();
    exitAppMock.mockClear();
    addListenerMock.mockImplementation(() => Promise.resolve({ remove: vi.fn() }));
  });

  it('registra listener de backButton em plataforma nativa', async () => {
    render(
      <RouterProvider>
        <div />
      </RouterProvider>,
    );
    await waitFor(() =>
      expect(addListenerMock).toHaveBeenCalledWith('backButton', expect.any(Function)),
    );
  });

  it('canGoBack=true chama history.back(), não App.exitApp()', async () => {
    const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(
      <RouterProvider>
        <div />
      </RouterProvider>,
    );
    await waitFor(() => expect(addListenerMock).toHaveBeenCalled());

    const callback = addListenerMock.mock.calls[0][1] as (data: { canGoBack: boolean }) => void;
    callback({ canGoBack: true });

    expect(historyBackSpy).toHaveBeenCalled();
    expect(exitAppMock).not.toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });

  it('canGoBack=false chama App.exitApp()', async () => {
    render(
      <RouterProvider>
        <div />
      </RouterProvider>,
    );
    await waitFor(() => expect(addListenerMock).toHaveBeenCalled());

    const callback = addListenerMock.mock.calls[0][1] as (data: { canGoBack: boolean }) => void;
    callback({ canGoBack: false });

    expect(exitAppMock).toHaveBeenCalled();
  });
});
