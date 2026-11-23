import { describe, expect, it } from 'vitest';
import { elegiveisAleatorio, filtrarPorTipo, sortearQuebraGelo } from '../catalogoFiltro';
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

describe('sorteio aleatório', () => {
  const com = (id: string, tipo: QuebraGeloRow['tipo'], conteudo: object = {}) =>
    ({ ...jogo(tipo), id, conteudo }) as QuebraGeloRow;
  const lista = [
    com('a', 'instrucional'),
    com('b', 'instrucional_utilitario'),
    com('jogo', 'instrucional', { jogar_pelo_celular: '/v2/spicy' }),
    com('jogo2', 'instrucional_utilitario', { jogar_pelo_celular: '/v2/quem-sou-eu' }),
    com('ferramenta', 'utilitario'),
  ];

  it('exclui jogos (com "Jogar pelo Celular") e utilitários puros', () => {
    expect(elegiveisAleatorio(lista).map((j) => j.id)).toEqual(['a', 'b']);
  });

  it('escolhe pelo número aleatório, sem estourar o limite', () => {
    expect(sortearQuebraGelo(lista, () => 0)?.id).toBe('a');
    expect(sortearQuebraGelo(lista, () => 0.99)?.id).toBe('b');
    expect(sortearQuebraGelo(lista, () => 1)?.id).toBe('b');
  });

  it('sem candidatos devolve null', () => {
    expect(sortearQuebraGelo([com('x', 'utilitario')])).toBeNull();
  });
});
