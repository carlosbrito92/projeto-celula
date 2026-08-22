import { afterEach, describe, expect, it } from 'vitest';
import { carregarAnotacoes, salvarAnotacoes } from '../storage';
import type { AnotacaoPessoal } from '../types';

afterEach(() => {
  localStorage.clear();
});

describe('storage de anotações pessoais', () => {
  it('sem nada salvo, retorna array vazio', () => {
    expect(carregarAnotacoes('preg-1')).toEqual([]);
  });

  it('salva e recarrega', () => {
    const anotacoes: AnotacaoPessoal[] = [
      {
        id: 'a1',
        secaoId: 'sec-1',
        unidade: '0',
        offsetInicio: 0,
        offsetFim: 5,
        textoSelecionado: 'graça',
        criadoEm: '2026-08-22T00:00:00.000Z',
      },
    ];
    salvarAnotacoes('preg-1', anotacoes);
    expect(carregarAnotacoes('preg-1')).toEqual(anotacoes);
  });

  it('escopo por pregação — não mistura', () => {
    salvarAnotacoes('preg-1', [
      { id: 'a1', secaoId: 'sec-1', criadoEm: '2026-08-22T00:00:00.000Z', nota: 'x' },
    ]);
    expect(carregarAnotacoes('preg-2')).toEqual([]);
  });

  it('JSON inválido não quebra, retorna vazio', () => {
    localStorage.setItem('celula:anotacoes:preg-1', '{isso não é json');
    expect(carregarAnotacoes('preg-1')).toEqual([]);
  });
});
