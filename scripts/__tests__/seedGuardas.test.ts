import { describe, expect, it } from 'vitest';
import { orfasNoBanco, problemaDeCopiaLocal } from '../seedGuardas';

describe('orfasNoBanco', () => {
  it('lista o que está no banco e não existe localmente', () => {
    expect(orfasNoBanco(['a.json', 'b.json', 'c.json'], ['a.json', 'c.json'])).toEqual(['b.json']);
  });
  it('linha sem arquivo_origem também é sinalizada', () => {
    expect(orfasNoBanco([null, 'a.json'], ['a.json'])).toEqual(['(sem arquivo_origem)']);
  });
  it('nada a apontar quando tudo existe', () => {
    expect(orfasNoBanco(['a.json'], ['a.json', 'novo.json'])).toEqual([]);
  });
});

describe('problemaDeCopiaLocal', () => {
  it('main em dia = sem problema', () => {
    expect(problemaDeCopiaLocal('main', 0)).toBeNull();
  });
  it('fora da main é problema', () => {
    expect(problemaDeCopiaLocal('minha-branch', 0)).toMatch(/minha-branch/);
  });
  it('main atrás da origin é problema e manda dar pull', () => {
    expect(problemaDeCopiaLocal('main', 3)).toMatch(/git pull origin main/);
  });
});
