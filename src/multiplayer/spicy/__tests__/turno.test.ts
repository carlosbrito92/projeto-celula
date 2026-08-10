import { describe, expect, it } from 'vitest';
import { copiar, declarar, desafiar, montarEstadoInicial, passar, type EstadoPartida } from '../turno';
import type { Carta } from '../types';

const cartasCompraGenericas = (n: number, prefixo = 'compra'): Carta[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefixo}_${i}`, tipo: 'numerada', cor: 'verde', valor: 4 }));

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

describe('variante spice_raider', () => {
  it('declarar valor 4 marca pawHolderId', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'spice_raider' });
    const cartaId = estado.maos.ana[0].id;
    const r = declarar(estado, 'ana', cartaId, { cor: 'vermelho', valor: 4 });
    expect(r.estado.pawHolderId).toBe('ana');
    expect(r.estado.pilhaSpicy).toHaveLength(1);
  });

  it('próxima carta jogada de fato resolve: Raider fica com a pilha, nova pilha só com a carta nova', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'spice_raider' });
    const carta4 = base.maos.ana[0];
    const cartaBruno = base.maos.bruno[0];
    const estado: EstadoPartida = {
      ...base,
      maos: { ...base.maos, ana: base.maos.ana.filter((c) => c.id !== carta4.id) },
      pilhaSpicy: [carta4],
      declaracaoAtual: { cor: 'vermelho', valor: 4 },
      ultimoDeclaranteId: 'ana',
      pawHolderId: 'ana',
      indiceDaVez: 1,
    };

    const r = declarar(estado, 'bruno', cartaBruno.id, { cor: 'azul', valor: 1 });

    expect(r.estado.pontuacoes.ana).toBe(1);
    expect(r.estado.pawHolderId).toBeNull();
    expect(r.estado.pilhaSpicy).toEqual([cartaBruno]);
    expect(r.estado.declaracaoAtual).toEqual({ cor: 'azul', valor: 1 });
  });

  it('passar NÃO resolve a reivindicação ("passe não conta")', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'spice_raider' });
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [base.maos.ana[0]],
      declaracaoAtual: { cor: 'vermelho', valor: 4 },
      ultimoDeclaranteId: 'ana',
      pawHolderId: 'ana',
      indiceDaVez: 1,
    };

    const novo = passar(estado, 'bruno');
    expect(novo.pawHolderId).toBe('ana');
    expect(novo.pilhaSpicy).toHaveLength(1);
    expect(novo.pontuacoes.ana).toBe(0);
  });

  it('desafiar descarta a reivindicação pendente (pilha muda de mãos via desafio, não via Raider)', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'spice_raider' });
    const carta4: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 4 };
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [carta4],
      declaracaoAtual: { cor: 'vermelho', valor: 4 },
      ultimoDeclaranteId: 'ana',
      pawHolderId: 'ana',
      indiceDaVez: 1,
    };

    const r = desafiar(estado, 'bruno', 'cor');
    expect(r.estado.pawHolderId).toBeNull();
    // ana venceu o desafio (cor bate) — ganha os pontos por desafio normal, não pelo Raider.
    expect(r.declaranteVenceu).toBe(true);
    expect(r.estado.pontuacoes.ana).toBe(1);
  });
});

describe('variante change_your_luck', () => {
  it('declarar valor 5 com 2 cartas extras: mão perde as 3, ganha 2 de compra; pilha recebe 3 (extras embaixo, principal no topo)', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'change_your_luck' });
    const pilhaCompra = cartasCompraGenericas(4);
    const [principal, extra1, extra2, ...restoMao] = base.maos.ana;
    const estado: EstadoPartida = { ...base, maos: { ...base.maos, ana: [principal, extra1, extra2, ...restoMao] }, pilhaCompra };

    const r = declarar(estado, 'ana', principal.id, { cor: 'vermelho', valor: 5 }, false, [
      extra1.id,
      extra2.id,
    ]);

    expect(r.estado.pilhaSpicy).toEqual([extra1, extra2, principal]);
    expect(r.estado.pilhaCompra).toEqual(pilhaCompra.slice(2));
    expect(r.estado.maos.ana).toEqual([...restoMao, ...pilhaCompra.slice(0, 2)]);
  });

  it('cartas extras imunes a desafio — desafio só revela a carta do topo (a principal)', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'change_your_luck' });
    const extra: Carta = { id: 'extra', tipo: 'numerada', cor: 'azul', valor: 9 };
    const principal: Carta = { id: 'principal', tipo: 'numerada', cor: 'vermelho', valor: 5 };
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [extra, principal],
      declaracaoAtual: { cor: 'vermelho', valor: 5 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
    };

    const r = desafiar(estado, 'bruno', 'cor');
    expect(r.cartaRevelada).toEqual(principal);
  });

  it('sem a variante ativa: cartas extras lançam erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const [principal, extra1] = estado.maos.ana;
    expect(() =>
      declarar(estado, 'ana', principal.id, { cor: 'vermelho', valor: 5 }, false, [extra1.id]),
    ).toThrow();
  });

  it('variante ativa mas valor declarado != 5: erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'change_your_luck' });
    const [principal, extra1] = estado.maos.ana;
    expect(() =>
      declarar(estado, 'ana', principal.id, { cor: 'vermelho', valor: 6 }, false, [extra1.id]),
    ).toThrow();
  });

  it('mais de 2 cartas extras: erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'change_your_luck' });
    const [principal, e1, e2, e3] = estado.maos.ana;
    expect(() =>
      declarar(estado, 'ana', principal.id, { cor: 'vermelho', valor: 5 }, false, [e1.id, e2.id, e3.id]),
    ).toThrow();
  });

  it('carta extra que não está na mão: erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'change_your_luck' });
    const principal = estado.maos.ana[0];
    expect(() =>
      declarar(estado, 'ana', principal.id, { cor: 'vermelho', valor: 5 }, false, ['carta_inexistente']),
    ).toThrow();
  });
});

describe('variante copy_cat', () => {
  function estadoComDeclaracaoPendente(varianteAtiva: string | null = 'copy_cat'): EstadoPartida {
    const base = montarEstadoInicial(['ana', 'bruno', 'caio'], () => 0.5, { varianteAtiva });
    const cartaAna = base.maos.ana[0];
    return {
      ...base,
      maos: { ...base.maos, ana: base.maos.ana.filter((c) => c.id !== cartaAna.id) },
      pilhaSpicy: [cartaAna],
      declaracaoAtual: { cor: 'vermelho', valor: 7 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
    };
  }

  it('sem a variante ativa: copiar lança erro', () => {
    const estado = estadoComDeclaracaoPendente(null);
    const cartaId = estado.maos.bruno[0].id;
    expect(() => copiar(estado, 'bruno', cartaId)).toThrow();
  });

  it('sem declaração pendente: erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'copy_cat' });
    const cartaId = estado.maos.bruno[0].id;
    expect(() => copiar(estado, 'bruno', cartaId)).toThrow();
  });

  it('copiar a própria jogada: erro', () => {
    const estado = estadoComDeclaracaoPendente();
    const cartaId = estado.maos.ana[0].id;
    expect(() => copiar(estado, 'ana', cartaId)).toThrow();
  });

  it('cópia válida: replica a declaração atual, some com 1 carta da mão do copiador, vez vai pra esquerda dele', () => {
    const estado = estadoComDeclaracaoPendente();
    const cartaBruno = estado.maos.bruno[0];

    const r = copiar(estado, 'bruno', cartaBruno.id);

    expect(r.estado.declaracaoAtual).toEqual({ cor: 'vermelho', valor: 7 });
    expect(r.estado.pilhaSpicy).toHaveLength(2);
    expect(r.estado.pilhaSpicy[1]).toEqual(cartaBruno);
    expect(r.estado.ultimoDeclaranteId).toBe('bruno');
    expect(r.estado.ultimaJogadaEhCopia).toBe(true);
    expect(r.estado.maos.bruno).not.toContainEqual(cartaBruno);
    // 3 jogadores: ana(0), bruno(1), caio(2) — vez vai pra caio (esquerda de bruno).
    expect(r.estado.indiceDaVez).toBe(2);
  });

  it('cópia de cópia: outro jogador pode copiar a cópia', () => {
    const estado = estadoComDeclaracaoPendente();
    const cartaBruno = estado.maos.bruno[0];
    const r1 = copiar(estado, 'bruno', cartaBruno.id);

    const cartaCaio = r1.estado.maos.caio[0];
    const r2 = copiar(r1.estado, 'caio', cartaCaio.id);

    expect(r2.estado.ultimoDeclaranteId).toBe('caio');
    expect(r2.estado.pilhaSpicy).toHaveLength(3);
  });

  it('desafiar uma cópia: traço passado é ignorado, força "ambos" (§5)', () => {
    const estado = estadoComDeclaracaoPendente();
    // Carta real bate na cor declarada (vermelho) mas NÃO no valor (7 vs 3) —
    // se o traço 'cor' pedido pelo desafiante fosse respeitado, declarante venceria;
    // com 'ambos' forçado, precisa bater os dois, então desafiante vence.
    const cartaBrunoReal: Carta = { id: 'b1', tipo: 'numerada', cor: 'vermelho', valor: 3 };
    const comCopia: EstadoPartida = {
      ...estado,
      maos: { ...estado.maos, bruno: [cartaBrunoReal, ...estado.maos.bruno.slice(1)] },
    };
    const rCopia = copiar(comCopia, 'bruno', cartaBrunoReal.id);
    expect(rCopia.estado.ultimaJogadaEhCopia).toBe(true);

    const rDesafio = desafiar(rCopia.estado, 'caio', 'cor');
    expect(rDesafio.declaranteVenceu).toBe(false);
  });

  it('desafiar limpa ultimaJogadaEhCopia', () => {
    const estado = estadoComDeclaracaoPendente();
    const cartaBruno = estado.maos.bruno[0];
    const rCopia = copiar(estado, 'bruno', cartaBruno.id);
    const rDesafio = desafiar(rCopia.estado, 'caio', 'cor');
    expect(rDesafio.estado.ultimaJogadaEhCopia).toBe(false);
  });
});

describe('integração — varianteAtiva chega em declarar/desafiar', () => {
  it('we_love_chili: declarar 1-3 em vermelho no meio da pilha não aciona aviso de sequência', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'we_love_chili' });
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [{ id: 'x', tipo: 'numerada', cor: 'azul', valor: 6 }],
      declaracaoAtual: { cor: 'azul', valor: 6 },
      ultimoDeclaranteId: 'bruno',
      indiceDaVez: 0,
    };
    const cartaId = estado.maos.ana[0].id;
    const r = declarar(estado, 'ana', cartaId, { cor: 'vermelho', valor: 2 });
    expect(r.avisoSequenciaQuebrada).toBe(false);
  });

  it('turn_it_up: desafio de valor aceita 6 declarado com carta real 9', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5, { varianteAtiva: 'turn_it_up' });
    const cartaReal: Carta = { id: 'x', tipo: 'numerada', cor: 'vermelho', valor: 9 };
    const estado: EstadoPartida = {
      ...base,
      pilhaSpicy: [cartaReal],
      declaracaoAtual: { cor: 'vermelho', valor: 6 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
    };
    const r = desafiar(estado, 'bruno', 'valor');
    expect(r.declaranteVenceu).toBe(true);
  });
});
