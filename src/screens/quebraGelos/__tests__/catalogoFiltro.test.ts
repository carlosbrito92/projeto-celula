import { describe, expect, it } from 'vitest';
import { filtrarPorTipo } from '../catalogoFiltro';
import type { QuebraGeloRow } from '../../../content/types';

function jogo(tipo: QuebraGeloRow['tipo']): QuebraGeloRow {
  return {
    id: tipo,
    nome: tipo,
    tipo,
    utilitario: null,
    conteudo: {},
    created_at: '',
    updated_at: '',
  };
}

describe('filtrarPorTipo', () => {
  const jogos = [jogo('instrucional'), jogo('instrucional_utilitario'), jogo('utilitario')];

  it('"todos" retorna a lista inteira', () => {
    expect(filtrarPorTipo(jogos, 'todos')).toEqual(jogos);
  });

  it('"leitura" retorna só tipo instrucional', () => {
    expect(filtrarPorTipo(jogos, 'leitura')).toEqual([jogo('instrucional')]);
  });

  it('"sorteio" retorna utilitario e instrucional_utilitario', () => {
    expect(filtrarPorTipo(jogos, 'sorteio')).toEqual([
      jogo('instrucional_utilitario'),
      jogo('utilitario'),
    ]);
  });
});
