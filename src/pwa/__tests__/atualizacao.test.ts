import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { atualizacaoPendente, digitando, iniciarAtualizacao } from '../atualizacao';

type Opcoes = Parameters<Parameters<typeof iniciarAtualizacao>[0]>[0];

let visibilidade: DocumentVisibilityState = 'visible';
function mudarVisibilidade(v: DocumentVisibilityState) {
  visibilidade = v;
  document.dispatchEvent(new Event('visibilitychange'));
}

function montar() {
  let opcoes: Opcoes = {};
  const recarregar = vi.fn();
  const update = vi.fn(async () => undefined);
  iniciarAtualizacao(
    (o) => {
      opcoes = o;
    },
    { recarregar },
  );
  opcoes.onRegisteredSW?.('/sw.js', { update } as unknown as ServiceWorkerRegistration);
  return { novaVersaoAssumiu: () => opcoes.onNeedReload?.(), recarregar, update };
}

describe('atualização do app', () => {
  beforeEach(() => {
    visibilidade = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilidade });
    document.body.innerHTML = '<textarea id="nota"></textarea><input id="busca"><button id="botao">ok</button>';
  });
  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    vi.useRealTimers();
  });

  it('procura versão nova quando o app volta a ficar visível', () => {
    const { update } = montar();
    mudarVisibilidade('hidden');
    expect(update).not.toHaveBeenCalled();
    mudarVisibilidade('visible');
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('sem campo em foco: recarrega assim que a versão nova assume', () => {
    const { novaVersaoAssumiu, recarregar } = montar();
    novaVersaoAssumiu();
    expect(recarregar).toHaveBeenCalledTimes(1);
    expect(atualizacaoPendente()).toBe(false);
  });

  it('escrevendo uma nota: espera o campo perder o foco, mesmo pulando entre campos', () => {
    vi.useFakeTimers();
    const { novaVersaoAssumiu, recarregar } = montar();
    document.getElementById('nota')!.focus();
    novaVersaoAssumiu();
    expect(recarregar).not.toHaveBeenCalled();
    expect(atualizacaoPendente()).toBe(true);

    document.getElementById('busca')!.focus(); // pulou para outro campo
    vi.runAllTimers();
    expect(recarregar).not.toHaveBeenCalled();

    document.getElementById('busca')!.blur();
    vi.runAllTimers();
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('escrevendo e o app vai para segundo plano: recarrega (volta já atualizado)', () => {
    const { novaVersaoAssumiu, recarregar } = montar();
    document.getElementById('nota')!.focus();
    novaVersaoAssumiu();
    mudarVisibilidade('hidden');
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('digitando: só campos de texto contam', () => {
    expect(digitando()).toBe(false);
    document.getElementById('botao')!.focus();
    expect(digitando()).toBe(false);
    document.getElementById('busca')!.focus();
    expect(digitando()).toBe(true);
  });
});
