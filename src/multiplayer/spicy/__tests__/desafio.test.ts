import { describe, expect, it } from 'vitest';
import { resolverDesafio, verificarTraco } from '../desafio';
import type { Carta, Declaracao } from '../types';

const carta = (parcial: Partial<Carta>): Carta => ({ id: 'x', tipo: 'numerada', ...parcial });
const declaracao = (parcial: Partial<Declaracao>): Declaracao => ({
  cor: 'vermelho',
  valor: 5,
  ...parcial,
});

describe('verificarTraco — carta numerada', () => {
  it('traço cor: bate quando declarado === real', () => {
    const real = carta({ cor: 'vermelho', valor: 5 });
    expect(verificarTraco(real, declaracao({ cor: 'vermelho' }), 'cor')).toBe(true);
    expect(verificarTraco(real, declaracao({ cor: 'azul' }), 'cor')).toBe(false);
  });

  it('traço valor: bate quando declarado === real', () => {
    const real = carta({ cor: 'vermelho', valor: 5 });
    expect(verificarTraco(real, declaracao({ valor: 5 }), 'valor')).toBe(true);
    expect(verificarTraco(real, declaracao({ valor: 9 }), 'valor')).toBe(false);
  });

  it('traço ambos: só true se cor E valor batem', () => {
    const real = carta({ cor: 'verde', valor: 3 });
    expect(verificarTraco(real, declaracao({ cor: 'verde', valor: 3 }), 'ambos')).toBe(true);
    expect(verificarTraco(real, declaracao({ cor: 'verde', valor: 4 }), 'ambos')).toBe(false);
    expect(verificarTraco(real, declaracao({ cor: 'azul', valor: 3 }), 'ambos')).toBe(false);
  });
});

describe('verificarTraco — wild_cor (cobre valor, falha cor)', () => {
  const real = carta({ tipo: 'wild_cor', cor: undefined, valor: undefined });

  it('traço valor: sempre true, qualquer declaração', () => {
    expect(verificarTraco(real, declaracao({ valor: 1 }), 'valor')).toBe(true);
    expect(verificarTraco(real, declaracao({ valor: 10 }), 'valor')).toBe(true);
  });

  it('traço cor: sempre false', () => {
    expect(verificarTraco(real, declaracao({ cor: 'vermelho' }), 'cor')).toBe(false);
    expect(verificarTraco(real, declaracao({ cor: 'verde' }), 'cor')).toBe(false);
  });

  it('traço ambos: sempre false (cor sempre falha)', () => {
    expect(verificarTraco(real, declaracao({}), 'ambos')).toBe(false);
  });
});

describe('verificarTraco — wild_numero (cobre cor, falha valor)', () => {
  const real = carta({ tipo: 'wild_numero', cor: undefined, valor: undefined });

  it('traço cor: sempre true, qualquer declaração', () => {
    expect(verificarTraco(real, declaracao({ cor: 'azul' }), 'cor')).toBe(true);
    expect(verificarTraco(real, declaracao({ cor: 'verde' }), 'cor')).toBe(true);
  });

  it('traço valor: sempre false', () => {
    expect(verificarTraco(real, declaracao({ valor: 2 }), 'valor')).toBe(false);
    expect(verificarTraco(real, declaracao({ valor: 8 }), 'valor')).toBe(false);
  });

  it('traço ambos: sempre false (valor sempre falha)', () => {
    expect(verificarTraco(real, declaracao({}), 'ambos')).toBe(false);
  });
});

describe('verificarTraco — trofeu/fim_do_mundo fora do escopo de declaração', () => {
  it('nunca bate em nenhum traço', () => {
    const trofeu = carta({ tipo: 'trofeu', cor: undefined, valor: undefined });
    const fimDoMundo = carta({ tipo: 'fim_do_mundo', cor: undefined, valor: undefined });
    expect(verificarTraco(trofeu, declaracao({}), 'cor')).toBe(false);
    expect(verificarTraco(trofeu, declaracao({}), 'valor')).toBe(false);
    expect(verificarTraco(fimDoMundo, declaracao({}), 'cor')).toBe(false);
    expect(verificarTraco(fimDoMundo, declaracao({}), 'valor')).toBe(false);
  });
});

describe('verificarTraco — variante turn_it_up (6↔9 equivalentes no traço valor)', () => {
  it('declarado 9, carta real 6: vence o traço valor com a variante ligada', () => {
    const real = carta({ cor: 'vermelho', valor: 6 });
    expect(verificarTraco(real, declaracao({ valor: 9 }), 'valor', 'turn_it_up')).toBe(true);
  });

  it('declarado 6, carta real 9: também vence (bidirecional)', () => {
    const real = carta({ cor: 'vermelho', valor: 9 });
    expect(verificarTraco(real, declaracao({ valor: 6 }), 'valor', 'turn_it_up')).toBe(true);
  });

  it('sem a variante ligada, 9 declarado com carta real 6 é blefe normal', () => {
    const real = carta({ cor: 'vermelho', valor: 6 });
    expect(verificarTraco(real, declaracao({ valor: 9 }), 'valor')).toBe(false);
  });

  it('não afeta outros valores (ex: declarado 9, carta real 3)', () => {
    const real = carta({ cor: 'vermelho', valor: 3 });
    expect(verificarTraco(real, declaracao({ valor: 9 }), 'valor', 'turn_it_up')).toBe(false);
  });

  it('não afeta o traço cor', () => {
    const real = carta({ cor: 'azul', valor: 6 });
    expect(verificarTraco(real, declaracao({ cor: 'vermelho', valor: 9 }), 'cor', 'turn_it_up')).toBe(
      false,
    );
  });
});

describe('resolverDesafio', () => {
  it('declarante vence quando a declaração está correta no traço contestado', () => {
    const real = carta({ cor: 'vermelho', valor: 7 });
    expect(resolverDesafio(real, declaracao({ cor: 'vermelho', valor: 1 }), 'cor')).toBe(true);
  });

  it('desafiante vence quando a declaração é blefe no traço contestado', () => {
    const real = carta({ cor: 'vermelho', valor: 7 });
    expect(resolverDesafio(real, declaracao({ cor: 'azul', valor: 7 }), 'cor')).toBe(false);
  });
});
