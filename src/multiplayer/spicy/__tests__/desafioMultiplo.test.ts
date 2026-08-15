import { describe, expect, it } from 'vitest';
import { desafiar, montarEstadoInicial, podeDesafiarAgora, resolverDesafioMultiplo, type EstadoPartida } from '../turno';
import type { Carta } from '../types';

const cartasCompra = (n: number, prefixo = 'compra'): Carta[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefixo}_${i}`, tipo: 'numerada', cor: 'verde', valor: 4 }));

function estadoComPilha(jogadores: string[], cartaTopo: Carta, pilhaCompra: Carta[]): EstadoPartida {
  const base = montarEstadoInicial(jogadores, () => 0.5);
  return {
    ...base,
    pilhaSpicy: [cartaTopo],
    declaracaoAtual: { cor: 'vermelho', valor: 5 },
    ultimoDeclaranteId: jogadores[0],
    indiceDaVez: 1,
    declaradoEm: Date.now(),
    pilhaCompra,
  };
}

describe('resolverDesafioMultiplo', () => {
  it('equivalência com desafiar() (1 desafiante só)', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 }; // blefe (cor não bate)
    const estado = estadoComPilha(['ana', 'bruno'], cartaReal, cartasCompra(8));

    const viaWrapper = desafiar(estado, 'bruno', 'cor');
    const viaMultiplo = resolverDesafioMultiplo(estado, [{ jogadorId: 'bruno', traco: 'cor' }]);

    expect(viaMultiplo.declaranteVenceu).toBe(viaWrapper.declaranteVenceu);
    expect(viaMultiplo.cartaRevelada).toEqual(viaWrapper.cartaRevelada);
    expect(viaMultiplo.estado).toEqual(viaWrapper.estado);
  });

  it('declarante venceu, 2 desafiantes simultâneos: ambos compram 2 cartas CADA (não 2 no total), declarante fica com os pontos', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 5 }; // declarante disse a verdade
    const estado = estadoComPilha(['ana', 'bruno', 'caio'], cartaReal, cartasCompra(8));

    const r = resolverDesafioMultiplo(estado, [
      { jogadorId: 'bruno', traco: 'cor' },
      { jogadorId: 'caio', traco: 'cor' },
    ]);

    expect(r.declaranteVenceu).toBe(true);
    expect(r.estado.maos.bruno).toHaveLength(estado.maos.bruno.length + 2);
    expect(r.estado.maos.caio).toHaveLength(estado.maos.caio.length + 2);
    expect(r.estado.pontuacoes.ana).toBe(1); // pilha tinha 1 carta
    expect(r.estado.pontuacoes.bruno).toBe(0);
    expect(r.estado.pontuacoes.caio).toBe(0);
  });

  it('desafiantes venceram, pilha divide exato (4 cartas, 2 desafiantes): 2 pontos cada, sem puxar carta extra do monte', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 }; // blefe
    const base = montarEstadoInicial(['ana', 'bruno', 'caio'], () => 0.5);
    const pilhaCompra = cartasCompra(8);
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [cartasCompra(1, 'p')[0], cartasCompra(1, 'p2')[0], cartasCompra(1, 'p3')[0], cartaReal],
      declaracaoAtual: { cor: 'vermelho', valor: 5 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
      declaradoEm: Date.now(),
      pilhaCompra,
    };

    const r = resolverDesafioMultiplo(estado, [
      { jogadorId: 'bruno', traco: 'cor' },
      { jogadorId: 'caio', traco: 'cor' },
    ]);

    expect(r.declaranteVenceu).toBe(false);
    expect(r.pontosPorDesafiante).toEqual({ bruno: 2, caio: 2 });
    expect(r.estado.pontuacoes.bruno).toBe(2);
    expect(r.estado.pontuacoes.caio).toBe(2);
    expect(r.estado.pilhaCompra).toHaveLength(pilhaCompra.length - 2); // só o compra-2 padrão do declarante, nada extra pra dividir
  });

  it('desafiantes venceram, pilha NÃO divide exato (1 carta, 2 desafiantes): puxa 1 do monte, 2 pontos totais, 1 cada — exemplo do Carlos', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 }; // blefe
    const estado = estadoComPilha(['ana', 'bruno', 'caio'], cartaReal, cartasCompra(8));

    const r = resolverDesafioMultiplo(estado, [
      { jogadorId: 'bruno', traco: 'cor' },
      { jogadorId: 'caio', traco: 'cor' },
    ]);

    expect(r.declaranteVenceu).toBe(false);
    expect(r.pontosPorDesafiante).toEqual({ bruno: 1, caio: 1 });
    expect(r.estado.pontuacoes.bruno).toBe(1);
    expect(r.estado.pontuacoes.caio).toBe(1);
    // declarante come 2 (punição padrão) + 1 puxada pra fechar a divisão = 3 cartas saem do monte.
    expect(r.estado.pilhaCompra).toHaveLength(8 - 3);
  });

  it('desafiantes venceram, pilha não divide, 3 desafiantes, monte quase vazio: divide o que der, sobra pros primeiros, não trava', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 }; // blefe
    // pilha=1 ponto, 3 desafiantes — precisaria de +2 cartas do monte pra virar 3 (múltiplo de 3), mas só sobra 1 depois do compra-2 do declarante.
    const estado = estadoComPilha(['ana', 'bruno', 'caio', 'davi'], cartaReal, cartasCompra(3));

    const r = resolverDesafioMultiplo(estado, [
      { jogadorId: 'bruno', traco: 'cor' },
      { jogadorId: 'caio', traco: 'cor' },
      { jogadorId: 'davi', traco: 'cor' },
    ]);

    expect(r.declaranteVenceu).toBe(false);
    expect(r.estado.pilhaCompra).toHaveLength(0); // monte esgotou tentando completar a divisão
    const totalDistribuido = Object.values(r.pontosPorDesafiante).reduce((a, b) => a + b, 0);
    expect(totalDistribuido).toBeGreaterThan(0);
    expect(r.pontosPorDesafiante.bruno).toBeGreaterThanOrEqual(r.pontosPorDesafiante.davi); // sobra pros que chegaram primeiro
  });

  it('traço usado é o do primeiro desafiante do grupo, mesmo com outro traço divergente depois', () => {
    // Carta real bate no VALOR (5) mas não na COR (verde vs vermelho declarado).
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'verde', valor: 5 };
    const estado = estadoComPilha(['ana', 'bruno', 'caio'], cartaReal, cartasCompra(8));

    // bruno (primeiro) desafia por 'valor' (declarante venceria nesse traço); caio desafia por 'cor' (desafiante venceria).
    const r = resolverDesafioMultiplo(estado, [
      { jogadorId: 'bruno', traco: 'valor' },
      { jogadorId: 'caio', traco: 'cor' },
    ]);

    expect(r.declaranteVenceu).toBe(true); // resolvido pelo traço de bruno (primeiro), não o de caio
  });
});

describe('podeDesafiarAgora', () => {
  const base3 = montarEstadoInicial(['ana', 'bruno', 'caio'], () => 0.5);
  const base2 = montarEstadoInicial(['ana', 'bruno'], () => 0.5);

  it('fora da vez: sempre true, independente da quantidade de jogadores', () => {
    const estado3: EstadoPartida = { ...base3, indiceDaVez: 1, declaradoEm: null };
    expect(podeDesafiarAgora(estado3, 'ana')).toBe(true);
    expect(podeDesafiarAgora(estado3, 'caio')).toBe(true);

    const estado2: EstadoPartida = { ...base2, indiceDaVez: 1, declaradoEm: null };
    expect(podeDesafiarAgora(estado2, 'ana')).toBe(true);
  });

  it('na vez, 3+ jogadores: sempre false', () => {
    const estado: EstadoPartida = { ...base3, indiceDaVez: 1, declaradoEm: Date.now() };
    expect(podeDesafiarAgora(estado, 'bruno')).toBe(false);
  });

  it('na vez, 2 jogadores, dentro dos 5s: true', () => {
    const agora = Date.now();
    const estado: EstadoPartida = { ...base2, indiceDaVez: 1, declaradoEm: agora };
    expect(podeDesafiarAgora(estado, 'bruno', agora + 1000)).toBe(true);
  });

  it('na vez, 2 jogadores, depois dos 5s: false', () => {
    const agora = Date.now();
    const estado: EstadoPartida = { ...base2, indiceDaVez: 1, declaradoEm: agora };
    expect(podeDesafiarAgora(estado, 'bruno', agora + 5001)).toBe(false);
  });

  it('na vez, 2 jogadores, declaradoEm null (nunca houve declaração): false', () => {
    const estado: EstadoPartida = { ...base2, indiceDaVez: 1, declaradoEm: null };
    expect(podeDesafiarAgora(estado, 'bruno')).toBe(false);
  });

  it('desafiar() lança erro quando podeDesafiarAgora é false', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 5 };
    const estado = estadoComPilha(['ana', 'bruno', 'caio'], cartaReal, cartasCompra(8));
    // 3 jogadores, bruno na própria vez — nunca pode desafiar.
    expect(() => desafiar(estado, 'bruno', 'cor')).toThrow();
  });

  it('declarante não pode desafiar a própria declaração, mesmo já fora da vez (bug 2026-08-14)', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 5 };
    // estadoComPilha: ultimoDeclaranteId = 'ana', indiceDaVez = 1 ('bruno') — turno já passou de ana.
    const estado = estadoComPilha(['ana', 'bruno', 'caio'], cartaReal, cartasCompra(8));
    expect(podeDesafiarAgora(estado, 'ana')).toBe(false);
    expect(() => desafiar(estado, 'ana', 'cor')).toThrow();
  });
});
