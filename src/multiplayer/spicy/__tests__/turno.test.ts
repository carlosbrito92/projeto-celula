import { describe, expect, it } from 'vitest';
import { declarar, desafiar, montarEstadoInicial, passar, type EstadoPartida } from '../turno';
import type { Carta } from '../types';

describe('montarEstadoInicial', () => {
  it('distribui 6 cartas por jogador, resto vai pra pilha de compra', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    expect(estado.maos.ana).toHaveLength(6);
    expect(estado.maos.bruno).toHaveLength(6);
    expect(estado.pilhaCompra).toHaveLength(109 - 12);
  });

  it('World\'s End não entra na partida (TBD, ver comentário em turno.ts)', () => {
    const estado = montarEstadoInicial(['ana', 'bruno', 'caio'], () => 0.5);
    const todasAsCartas = [...estado.pilhaCompra, ...Object.values(estado.maos).flat()];
    expect(todasAsCartas.some((c) => c.tipo === 'fim_do_mundo')).toBe(false);
  });

  it('estado inicial: vez do primeiro jogador, sem pilha spicy, pontuação zerada', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    expect(estado.indiceDaVez).toBe(0);
    expect(estado.pilhaSpicy).toEqual([]);
    expect(estado.declaracaoAtual).toBeNull();
    expect(estado.pontuacoes).toEqual({ ana: 0, bruno: 0 });
    expect(estado.trofeusNoPote).toBe(3);
    expect(estado.jogoEncerrado).toBe(false);
  });
});

describe('declarar', () => {
  it('jogada válida: move carta da mão pra pilha, seta declaração, avança vez', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaId = estado.maos.ana[0].id;
    const r = declarar(estado, 'ana', cartaId, { cor: 'vermelho', valor: 2 });

    expect(r.esqueceuUltimaCarta).toBe(false);
    expect(r.avisoSequenciaQuebrada).toBe(false);
    expect(r.estado.maos.ana).toHaveLength(5);
    expect(r.estado.pilhaSpicy).toHaveLength(1);
    expect(r.estado.pilhaSpicy[0].id).toBe(cartaId);
    expect(r.estado.declaracaoAtual).toEqual({ cor: 'vermelho', valor: 2 });
    expect(r.estado.ultimoDeclaranteId).toBe('ana');
    expect(r.estado.indiceDaVez).toBe(1);
  });

  it('declaração fora de sequência: aviso true, jogada acontece mesmo assim', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaId = estado.maos.ana[0].id;
    const r = declarar(estado, 'ana', cartaId, { cor: 'azul', valor: 9 });
    expect(r.avisoSequenciaQuebrada).toBe(true);
    expect(r.estado.pilhaSpicy).toHaveLength(1);
  });

  it('fora da vez: lança erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaId = estado.maos.bruno[0].id;
    expect(() => declarar(estado, 'bruno', cartaId, { cor: 'vermelho', valor: 1 })).toThrow();
  });

  it('carta que não está na mão: lança erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    expect(() => declarar(estado, 'ana', 'carta_inexistente', { cor: 'vermelho', valor: 1 })).toThrow();
  });

  it('última carta sem anunciar: jogada não acontece, vira passe forçado', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const unicaCarta = base.maos.ana[0];
    const estado: EstadoPartida = { ...base, maos: { ...base.maos, ana: [unicaCarta] } };

    const r = declarar(estado, 'ana', unicaCarta.id, { cor: 'vermelho', valor: 1 });
    expect(r.esqueceuUltimaCarta).toBe(true);
    expect(r.estado.maos.ana).toEqual([unicaCarta]);
    expect(r.estado.pilhaSpicy).toEqual([]);
    expect(r.estado.indiceDaVez).toBe(1);
  });

  it('última carta anunciada: joga normalmente, mão fica vazia', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const unicaCarta = base.maos.ana[0];
    const estado: EstadoPartida = { ...base, maos: { ...base.maos, ana: [unicaCarta] } };

    const r = declarar(estado, 'ana', unicaCarta.id, { cor: 'vermelho', valor: 1 }, true);
    expect(r.esqueceuUltimaCarta).toBe(false);
    expect(r.estado.maos.ana).toEqual([]);
    expect(r.estado.pilhaSpicy).toHaveLength(1);
    expect(r.estado.maoVaziaAguardandoTrofeu).toBe('ana');
  });
});

describe('passar', () => {
  it('avança a vez sem tocar pilha/declaração', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const novo = passar(estado, 'ana');
    expect(novo.indiceDaVez).toBe(1);
    expect(novo.pilhaSpicy).toEqual(estado.pilhaSpicy);
    expect(novo.maos).toEqual(estado.maos);
  });

  it('fora da vez: lança erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    expect(() => passar(estado, 'bruno')).toThrow();
  });
});

describe('desafiar', () => {
  function estadoComPilha(cartaTopo: Carta): EstadoPartida {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    return {
      ...base,
      pilhaSpicy: [cartaTopo],
      declaracaoAtual: { cor: 'vermelho', valor: 5 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
    };
  }

  it('sem declaração pendente: lança erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    expect(() => desafiar(estado, 'bruno', 'cor')).toThrow();
  });

  it('declarante correto: vence, fica com pontos; desafiante compra 2 e joga a seguir', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 5 };
    const estado = estadoComPilha(cartaReal);
    const pilhaCompraAntes = estado.pilhaCompra.slice(0, 2);

    const r = desafiar(estado, 'bruno', 'cor');

    expect(r.declaranteVenceu).toBe(true);
    expect(r.cartaRevelada).toEqual(cartaReal);
    expect(r.estado.pontuacoes.ana).toBe(1);
    expect(r.estado.pontuacoes.bruno).toBe(0);
    expect(r.estado.maos.bruno).toEqual([...estado.maos.bruno, ...pilhaCompraAntes]);
    expect(r.estado.pilhaSpicy).toEqual([]);
    expect(r.estado.declaracaoAtual).toBeNull();
    expect(r.estado.ultimoDeclaranteId).toBeNull();
    expect(r.estado.indiceDaVez).toBe(0);
  });

  it('declarante blefou: desafiante vence, declarante compra 2', () => {
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 };
    const estado = estadoComPilha(cartaReal);
    const pilhaCompraAntes = estado.pilhaCompra.slice(0, 2);

    const r = desafiar(estado, 'bruno', 'cor');

    expect(r.declaranteVenceu).toBe(false);
    expect(r.estado.pontuacoes.bruno).toBe(1);
    expect(r.estado.pontuacoes.ana).toBe(0);
    expect(r.estado.maos.ana).toEqual([...estado.maos.ana, ...pilhaCompraAntes]);
    expect(r.estado.indiceDaVez).toBe(1);
  });
});

describe('troféu por última carta (§4 + Carlos, 2026-08-10)', () => {
  const cartasCompra = (n: number): Carta[] =>
    Array.from({ length: n }, (_, i) => ({ id: `compra_${i}`, tipo: 'numerada', cor: 'verde', valor: 4 }));

  it('não desafiada: "enterrada" pela próxima ação (passar) — ganha troféu + mão nova de 6', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const pilhaCompra = cartasCompra(8);
    const estado: EstadoPartida = {
      ...base,
      maos: { ...base.maos, ana: [] },
      maoVaziaAguardandoTrofeu: 'ana',
      indiceDaVez: 1,
      pilhaCompra,
    };

    const novo = passar(estado, 'bruno');

    expect(novo.maos.ana).toEqual(pilhaCompra.slice(0, 6));
    expect(novo.pilhaCompra).toEqual(pilhaCompra.slice(6));
    expect(novo.trofeusColetados.ana).toBe(1);
    expect(novo.trofeusNoPote).toBe(2);
    expect(novo.maoVaziaAguardandoTrofeu).toBeNull();
    expect(novo.jogoEncerrado).toBe(false);
  });

  it('não desafiada: "enterrada" por uma nova declaração — mesmo efeito', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const pilhaCompra = cartasCompra(8);
    const estado: EstadoPartida = {
      ...base,
      maos: { ...base.maos, ana: [] },
      maoVaziaAguardandoTrofeu: 'ana',
      indiceDaVez: 1,
      pilhaCompra,
    };
    const cartaId = estado.maos.bruno[0].id;

    const r = declarar(estado, 'bruno', cartaId, { cor: 'vermelho', valor: 2 });

    expect(r.estado.maos.ana).toEqual(pilhaCompra.slice(0, 6));
    expect(r.estado.trofeusColetados.ana).toBe(1);
    expect(r.estado.maoVaziaAguardandoTrofeu).toBeNull();
  });

  it('desafiada e declarante vence: ganha troféu + pontos da pilha + mão nova de 6', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 5 };
    const pilhaCompra = cartasCompra(10);
    const estado: EstadoPartida = {
      ...base,
      maos: { ...base.maos, ana: [] },
      pilhaSpicy: [cartaReal],
      declaracaoAtual: { cor: 'vermelho', valor: 5 },
      ultimoDeclaranteId: 'ana',
      maoVaziaAguardandoTrofeu: 'ana',
      indiceDaVez: 1,
      pilhaCompra,
    };

    const r = desafiar(estado, 'bruno', 'cor');

    expect(r.declaranteVenceu).toBe(true);
    expect(r.estado.pontuacoes.ana).toBe(1);
    expect(r.estado.maos.bruno).toEqual([...estado.maos.bruno, ...pilhaCompra.slice(0, 2)]);
    expect(r.estado.maos.ana).toEqual(pilhaCompra.slice(2, 8));
    expect(r.estado.pilhaCompra).toEqual(pilhaCompra.slice(8));
    expect(r.estado.trofeusColetados.ana).toBe(1);
    expect(r.estado.trofeusNoPote).toBe(2);
    expect(r.estado.maoVaziaAguardandoTrofeu).toBeNull();
  });

  it('desafiada e declarante perde: sem troféu, só o compra-2 padrão', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 };
    const pilhaCompra = cartasCompra(8);
    const estado: EstadoPartida = {
      ...base,
      maos: { ...base.maos, ana: [] },
      pilhaSpicy: [cartaReal],
      declaracaoAtual: { cor: 'vermelho', valor: 5 },
      ultimoDeclaranteId: 'ana',
      maoVaziaAguardandoTrofeu: 'ana',
      indiceDaVez: 1,
      pilhaCompra,
    };

    const r = desafiar(estado, 'bruno', 'cor');

    expect(r.declaranteVenceu).toBe(false);
    expect(r.estado.maos.ana).toEqual(pilhaCompra.slice(0, 2));
    expect(r.estado.trofeusColetados.ana).toBe(0);
    expect(r.estado.maoVaziaAguardandoTrofeu).toBeNull();
  });

  it('2º troféu do mesmo jogador encerra o jogo', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const estado: EstadoPartida = {
      ...base,
      maos: { ...base.maos, ana: [] },
      maoVaziaAguardandoTrofeu: 'ana',
      trofeusColetados: { ana: 1, bruno: 0 },
      indiceDaVez: 1,
      pilhaCompra: cartasCompra(8),
    };

    const novo = passar(estado, 'bruno');
    expect(novo.trofeusColetados.ana).toBe(2);
    expect(novo.jogoEncerrado).toBe(true);
  });
});

describe("World's End (toggle de setup, Carlos, 2026-08-10)", () => {
  it('desligado por padrão: nunca entra na pilha de compra nem nas mãos', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const todasAsCartas = [...estado.pilhaCompra, ...Object.values(estado.maos).flat()];
    expect(todasAsCartas.some((c) => c.tipo === 'fim_do_mundo')).toBe(false);
  });

  it('ligado: entra no fundo da pilha de compra, a uma profundidade proporcional ao nº de jogadores', () => {
    const semToggle = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const comToggle = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { worldsEndAtiva: true });

    expect(comToggle.pilhaCompra).toHaveLength(semToggle.pilhaCompra.length + 1);
    const indiceEsperado = semToggle.pilhaCompra.length - 2 * 5;
    expect(comToggle.pilhaCompra[indiceEsperado].tipo).toBe('fim_do_mundo');
    expect(comToggle.pilhaCompra.slice(0, indiceEsperado)).toEqual(
      semToggle.pilhaCompra.slice(0, indiceEsperado),
    );
    expect(comToggle.pilhaCompra.slice(indiceEsperado + 1)).toEqual(
      semToggle.pilhaCompra.slice(indiceEsperado),
    );
    expect(comToggle.maos).toEqual(semToggle.maos);
  });

  it('revelada durante uma compra: jogo encerra, carta não vai pra mão de ninguém', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'azul', valor: 5 };
    const c1: Carta = { id: 'c1', tipo: 'numerada', cor: 'verde', valor: 1 };
    const fimDoMundo: Carta = { id: 'fim', tipo: 'fim_do_mundo' };
    const c3: Carta = { id: 'c3', tipo: 'numerada', cor: 'verde', valor: 3 };
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [cartaReal],
      declaracaoAtual: { cor: 'vermelho', valor: 5 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
      pilhaCompra: [c1, fimDoMundo, c3],
    };

    const r = desafiar(estado, 'bruno', 'cor');

    expect(r.estado.maos.ana).toEqual([...estado.maos.ana, c1]);
    expect(r.estado.maos.ana).not.toContainEqual(fimDoMundo);
    expect(r.estado.pilhaCompra).toEqual([c3]);
    expect(r.estado.worldsEndRevelada).toBe(true);
    expect(r.estado.jogoEncerrado).toBe(true);
  });
});
