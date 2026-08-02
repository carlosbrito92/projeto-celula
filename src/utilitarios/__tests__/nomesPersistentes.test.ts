import { describe, expect, it, vi } from 'vitest';
import { lerNomesPersistidos, salvarNomesPersistidos } from '../nomesPersistentes';

describe('nomesPersistentes', () => {
  it('retorna lista vazia quando nada foi salvo ainda', () => {
    expect(lerNomesPersistidos()).toEqual([]);
  });

  it('salva e relê a mesma lista', () => {
    salvarNomesPersistidos(['Ana', 'Bruno', 'Carla']);
    expect(lerNomesPersistidos()).toEqual(['Ana', 'Bruno', 'Carla']);
  });

  it('uma nova chamada de salvar sobrescreve a lista anterior', () => {
    salvarNomesPersistidos(['Ana']);
    salvarNomesPersistidos(['Bruno', 'Carla']);
    expect(lerNomesPersistidos()).toEqual(['Bruno', 'Carla']);
  });

  it('lista vazia é um valor salvo válido (limpar nomes persiste a limpeza)', () => {
    salvarNomesPersistidos(['Ana']);
    salvarNomesPersistidos([]);
    expect(lerNomesPersistidos()).toEqual([]);
  });

  it('dado corrompido no localStorage não quebra a leitura — degrada pra lista vazia', () => {
    localStorage.setItem('projeto-celula:nomes-participantes', '{ isso não é json válido');
    expect(lerNomesPersistidos()).toEqual([]);
  });

  it('valor salvo que não é array de strings degrada pra lista vazia', () => {
    localStorage.setItem('projeto-celula:nomes-participantes', JSON.stringify({ nome: 'Ana' }));
    expect(lerNomesPersistidos()).toEqual([]);
  });

  it('não quebra quando localStorage.setItem lança (quota excedida/modo privado)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded');
    });
    expect(() => salvarNomesPersistidos(['Ana'])).not.toThrow();
    spy.mockRestore();
  });
});
