import { describe, expect, it } from 'vitest';
import { calcularPontuacaoFinal, determinarVencedor, verificarFimDePartida } from '../fimDePartida';

describe('verificarFimDePartida', () => {
  const base = { trofeusColetados: { ana: 0, bruno: 0 }, worldsEndRevelada: false, pilhaCompraVazia: false };

  it('jogo em andamento: false', () => {
    expect(verificarFimDePartida(base)).toBe(false);
  });

  it('2º troféu do MESMO jogador: true', () => {
    expect(verificarFimDePartida({ ...base, trofeusColetados: { ana: 2, bruno: 0 } })).toBe(true);
  });

  it('3 troféus (pote esgotado) mas a jogadores diferentes: jogo continua (false)', () => {
    expect(verificarFimDePartida({ ...base, trofeusColetados: { ana: 1, bruno: 1, caio: 1 } })).toBe(false);
  });

  it('monte de compra esgotado: true', () => {
    expect(verificarFimDePartida({ ...base, pilhaCompraVazia: true })).toBe(true);
  });

  it("World's End revelada: true", () => {
    expect(verificarFimDePartida({ ...base, worldsEndRevelada: true })).toBe(true);
  });
});

describe('calcularPontuacaoFinal', () => {
  it('2 troféus: vitória automática, pontuação Infinity', () => {
    const r = calcularPontuacaoFinal({ jogador: 'ana', pontosPilha: 3, trofeus: 2, cartasNaMao: 5 });
    expect(r.vitoriaAutomatica).toBe(true);
    expect(r.pontuacaoFinal).toBe(Infinity);
  });

  it('sem 2 troféus: pontosPilha + 10/troféu - cartasNaMao', () => {
    const r = calcularPontuacaoFinal({ jogador: 'ana', pontosPilha: 12, trofeus: 1, cartasNaMao: 3 });
    expect(r.vitoriaAutomatica).toBe(false);
    expect(r.pontuacaoFinal).toBe(12 + 10 - 3);
  });

  it('sem troféu nenhum: só pontosPilha - cartasNaMao', () => {
    const r = calcularPontuacaoFinal({ jogador: 'ana', pontosPilha: 5, trofeus: 0, cartasNaMao: 2 });
    expect(r.pontuacaoFinal).toBe(3);
  });
});

describe('determinarVencedor', () => {
  it('vitória automática (2 troféus) vence mesmo com pontuação normal maior de outro', () => {
    const r = determinarVencedor([
      { jogador: 'ana', pontosPilha: 100, trofeus: 0, cartasNaMao: 0 },
      { jogador: 'bruno', pontosPilha: 0, trofeus: 2, cartasNaMao: 6 },
    ]);
    expect(r.jogador).toBe('bruno');
    expect(r.vitoriaAutomatica).toBe(true);
  });

  it('sem vitória automática: maior pontuação final vence', () => {
    const r = determinarVencedor([
      { jogador: 'ana', pontosPilha: 10, trofeus: 1, cartasNaMao: 2 },
      { jogador: 'bruno', pontosPilha: 5, trofeus: 0, cartasNaMao: 1 },
    ]);
    expect(r.jogador).toBe('ana');
  });
});
