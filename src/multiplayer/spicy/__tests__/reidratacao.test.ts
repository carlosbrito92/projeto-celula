import { describe, expect, it } from 'vitest';
import {
  declarar,
  desafiar,
  montarEstadoInicial,
  reidratarEstado,
  type DadosParaReidratacao,
  type EstadoPartida,
} from '../turno';

/** Simula o que `Organizador.tsx`/`publicarEstado` publicaria no Playroom a partir de um `EstadoPartida` real. */
function publicarComoDados(estado: EstadoPartida): DadosParaReidratacao {
  return {
    jogadores: estado.jogadores,
    jogadorDaVezId: estado.jogadores[estado.indiceDaVez],
    pilhaCompra: estado.pilhaCompra,
    pilhaSpicyQtd: estado.pilhaSpicy.length,
    topoPilhaSpicy: estado.pilhaSpicy.at(-1) ?? null,
    declaracaoAtual: estado.declaracaoAtual,
    ultimoDeclaranteId: estado.ultimoDeclaranteId,
    maos: estado.maos,
    pontuacoes: estado.pontuacoes,
    trofeusColetados: estado.trofeusColetados,
    trofeusNoPote: estado.trofeusNoPote,
    maoVaziaAguardandoTrofeu: estado.maoVaziaAguardandoTrofeu,
    worldsEndRevelada: estado.worldsEndRevelada,
    jogoEncerrado: estado.jogoEncerrado,
    varianteAtiva: estado.varianteAtiva,
    pawHolderId: estado.pawHolderId,
    ultimaJogadaEhCopia: estado.ultimaJogadaEhCopia,
    declaradoEm: estado.declaradoEm,
  };
}

describe('reidratarEstado', () => {
  it('reconstrói indiceDaVez a partir de jogadorDaVezId', () => {
    const estado = montarEstadoInicial(['ana', 'bruno', 'caio'], () => 0.5);
    const reidratado = reidratarEstado(publicarComoDados({ ...estado, indiceDaVez: 2 }));
    expect(reidratado.indiceDaVez).toBe(2);
    expect(reidratado.jogadores[reidratado.indiceDaVez]).toBe('caio');
  });

  it('jogadorDaVezId que não está em jogadores: lança erro', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const dados = publicarComoDados(estado);
    expect(() => reidratarEstado({ ...dados, jogadorDaVezId: 'fantasma' })).toThrow();
  });

  it('pilhaSpicyQtd > 0 com topoPilhaSpicy null: lança erro (dado corrompido)', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const dados = publicarComoDados(estado);
    expect(() => reidratarEstado({ ...dados, pilhaSpicyQtd: 3, topoPilhaSpicy: null })).toThrow();
  });

  it('pilhaSpicyQtd 0: pilhaSpicy reconstruída vazia', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const reidratado = reidratarEstado(publicarComoDados(estado));
    expect(reidratado.pilhaSpicy).toEqual([]);
  });

  it('pilhaSpicy reconstruída: length bate com pilhaSpicyQtd, último elemento é exatamente o topo real', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const r1 = declarar(estado, 'ana', estado.maos.ana[0].id, { cor: 'vermelho', valor: 2 });
    const r2 = declarar(r1.estado, 'bruno', r1.estado.maos.bruno[0].id, { cor: 'azul', valor: 3 });

    const reidratado = reidratarEstado(publicarComoDados(r2.estado));

    expect(reidratado.pilhaSpicy).toHaveLength(2);
    expect(reidratado.pilhaSpicy.at(-1)).toEqual(r2.estado.pilhaSpicy.at(-1));
  });

  it('estado reidratado aceita declarar() normalmente em seguida — placeholders no meio não quebram a jogada', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const r1 = declarar(estado, 'ana', estado.maos.ana[0].id, { cor: 'vermelho', valor: 2 });

    const reidratado = reidratarEstado(publicarComoDados(r1.estado));
    const r2 = declarar(reidratado, 'bruno', reidratado.maos.bruno[0].id, { cor: 'azul', valor: 3 });

    expect(r2.estado.pilhaSpicy).toHaveLength(2);
  });

  it('estado reidratado aceita desafiar() e revela a carta real de topo — equivalente ao caminho não-reidratado', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const r1 = declarar(estado, 'ana', estado.maos.ana[0].id, { cor: 'vermelho', valor: 999 }); // blefe garantido (valor fora do baralho)

    const reidratado = reidratarEstado(publicarComoDados(r1.estado));

    const desafioOriginal = desafiar(r1.estado, 'bruno', 'valor');
    const desafioReidratado = desafiar(reidratado, 'bruno', 'valor');

    expect(desafioReidratado.declaranteVenceu).toBe(false);
    expect(desafioReidratado.declaranteVenceu).toBe(desafioOriginal.declaranteVenceu);
    expect(desafioReidratado.cartaRevelada).toEqual(desafioOriginal.cartaRevelada);
    expect(desafioReidratado.estado.pontuacoes).toEqual(desafioOriginal.estado.pontuacoes);
  });
});
