import { describe, expect, it, vi } from 'vitest';
import { identificarLider, parseCodigos } from '../editorialAuth.js';

const A = 'k7q2-m9xv-p4tz-w8hc';
const B = 'z3n8-b6rd-q1fy-t5ka';

describe('parseCodigos', () => {
  it('lê lista nome:codigo separada por ;', () => {
    expect(parseCodigos(`Fulano:${A}; Ciclano de Tal:${B};`)).toEqual([
      { nome: 'Fulano', codigo: A },
      { nome: 'Ciclano de Tal', codigo: B },
    ]);
  });

  it('usa o último ":" como separador (nome pode conter ":")', () => {
    expect(parseCodigos(`Célula: Centro:${A}`)).toEqual([{ nome: 'Célula: Centro', codigo: A }]);
  });

  it('ignora código curto demais ou entrada sem nome, sem logar o código', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseCodigos(`Fraco:1234;:${A};SemCodigo`)).toEqual([]);
    expect(spy.mock.calls.flat().join(' ')).not.toContain('1234');
    spy.mockRestore();
  });

  it('env ausente = nenhum líder (endpoint fica fechado)', () => {
    expect(parseCodigos(undefined)).toEqual([]);
  });
});

describe('identificarLider', () => {
  const lideres = parseCodigos(`Fulano:${A};Ciclano:${B}`);

  it('retorna o nome do dono do código', () => {
    expect(identificarLider(B, lideres)).toBe('Ciclano');
  });

  it('rejeita código errado, vazio ou de tipo inválido', () => {
    expect(identificarLider('k7q2-m9xv-p4tz-w8hX', lideres)).toBeNull();
    expect(identificarLider('', lideres)).toBeNull();
    expect(identificarLider(undefined, lideres)).toBeNull();
    expect(identificarLider([A], lideres)).toBeNull();
  });

  it('código revogado (removido da lista) deixa de valer', () => {
    expect(identificarLider(A, parseCodigos(`Ciclano:${B}`))).toBeNull();
  });
});
