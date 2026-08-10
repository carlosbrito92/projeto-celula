import { describe, expect, it } from 'vitest';
import { aplicarAcao } from '../acao';
import { montarEstadoInicial } from '../turno';

describe('aplicarAcao', () => {
  it('declarar: despacha pro reducer de turno, evento carrega os flags de declarar', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaId = estado.maos.ana[0].id;

    const r = aplicarAcao(estado, 'ana', {
      tipo: 'declarar',
      cartaId,
      declaracao: { cor: 'vermelho', valor: 2 },
    });

    expect(r.evento).toEqual({ tipo: 'declarar', avisoSequenciaQuebrada: false, esqueceuUltimaCarta: false });
    expect(r.estado.pilhaSpicy).toHaveLength(1);
    expect(r.estado.indiceDaVez).toBe(1);
  });

  it('passar: avança a vez, evento é só o tipo', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const r = aplicarAcao(estado, 'ana', { tipo: 'passar' });
    expect(r.evento).toEqual({ tipo: 'passar' });
    expect(r.estado.indiceDaVez).toBe(1);
  });

  it('desafiar: despacha pro reducer, evento carrega vencedor e carta revelada', () => {
    const base = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaReal = { id: 'x', tipo: 'numerada' as const, cor: 'vermelho' as const, valor: 5 };
    const estado = {
      ...base,
      pilhaSpicy: [cartaReal],
      declaracaoAtual: { cor: 'vermelho' as const, valor: 5 },
      ultimoDeclaranteId: 'ana',
      indiceDaVez: 1,
    };

    const r = aplicarAcao(estado, 'bruno', { tipo: 'desafiar', traco: 'cor' });

    expect(r.evento).toEqual({ tipo: 'desafiar', declaranteVenceu: true, cartaRevelada: cartaReal });
    expect(r.estado.pontuacoes.ana).toBe(1);
  });

  it('jogador fora da vez tentando declarar: erro propaga (quem chama decide o que fazer)', () => {
    const estado = montarEstadoInicial(['ana', 'bruno'], () => 0.5);
    const cartaId = estado.maos.bruno[0].id;
    expect(() =>
      aplicarAcao(estado, 'bruno', { tipo: 'declarar', cartaId, declaracao: { cor: 'vermelho', valor: 1 } }),
    ).toThrow();
  });
});
