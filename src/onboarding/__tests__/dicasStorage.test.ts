import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assinarDicas,
  carregarDicasVistas,
  dicaFoiVista,
  limparDicasVistas,
  marcarDicaVista,
} from '../dicasStorage';

const CHAVE = 'celula:dicas-vistas';

describe('dicasStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('começa sem nenhuma dica vista', () => {
    expect(carregarDicasVistas()).toEqual([]);
    expect(dicaFoiVista('leitura-aa-v1')).toBe(false);
  });

  it('grava o id como array JSON na chave celula:dicas-vistas', () => {
    marcarDicaVista('leitura-aa-v1');
    expect(JSON.parse(localStorage.getItem(CHAVE)!)).toEqual(['leitura-aa-v1']);
    expect(dicaFoiVista('leitura-aa-v1')).toBe(true);
  });

  it('não duplica um id já visto', () => {
    marcarDicaVista('leitura-aa-v1');
    marcarDicaVista('leitura-aa-v1');
    marcarDicaVista('leitura-anotacoes-v1');
    expect(carregarDicasVistas()).toEqual(['leitura-aa-v1', 'leitura-anotacoes-v1']);
  });

  it('ignora conteúdo corrompido ou fora do formato', () => {
    localStorage.setItem(CHAVE, '{nao é json');
    expect(carregarDicasVistas()).toEqual([]);
    localStorage.setItem(CHAVE, JSON.stringify({ a: 1 }));
    expect(carregarDicasVistas()).toEqual([]);
    localStorage.setItem(CHAVE, JSON.stringify(['ok-v1', 3, null]));
    expect(carregarDicasVistas()).toEqual(['ok-v1']);
  });

  it('limparDicasVistas esvazia tudo', () => {
    marcarDicaVista('leitura-aa-v1');
    limparDicasVistas();
    expect(carregarDicasVistas()).toEqual([]);
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('localStorage indisponível não quebra leitura nem escrita', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(carregarDicasVistas()).toEqual([]);
    expect(() => marcarDicaVista('leitura-aa-v1')).not.toThrow();
    expect(() => limparDicasVistas()).not.toThrow();
  });

  it('avisa quem assina a cada marcação e limpeza, até cancelar', () => {
    const ouvinte = vi.fn();
    const cancelar = assinarDicas(ouvinte);
    marcarDicaVista('leitura-aa-v1');
    limparDicasVistas();
    expect(ouvinte).toHaveBeenCalledTimes(2);
    cancelar();
    marcarDicaVista('leitura-aa-v1');
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });
});
