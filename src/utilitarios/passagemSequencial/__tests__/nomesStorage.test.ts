import { beforeEach, describe, expect, it, vi } from 'vitest';
import { carregarNomes, salvarNomes } from '../nomesStorage';

describe('nomesStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('carregarNomes() retorna [] quando não há nada salvo', () => {
    expect(carregarNomes()).toEqual([]);
  });

  it('salvarNomes() + carregarNomes() faz round-trip', () => {
    salvarNomes(['Ana', 'Beto']);
    expect(carregarNomes()).toEqual(['Ana', 'Beto']);
  });

  it('carregarNomes() ignora JSON inválido, retorna []', () => {
    localStorage.setItem('celula:nomes-participantes', '{não é json válido');
    expect(carregarNomes()).toEqual([]);
  });

  it('carregarNomes() ignora valor salvo que não é array de strings', () => {
    localStorage.setItem('celula:nomes-participantes', JSON.stringify({ nomes: ['Ana'] }));
    expect(carregarNomes()).toEqual([]);
  });

  it('salvarNomes() não lança quando localStorage falha (ex: modo privado/quota)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota excedida');
    });
    expect(() => salvarNomes(['Ana'])).not.toThrow();
    spy.mockRestore();
  });
});
