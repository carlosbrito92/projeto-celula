/**
 * Condições de fim de partida e pontuação final (docs/spicy-spec.md §4).
 *
 * `trofeusColetados`/`trofeusNoPote` são escritos por `turno.ts`
 * (`resolverPendenciaUltimaCarta`/`desafiar`) — mecânica real: jogador que
 * joga a última carta da mão e não é desafiado (ou é desafiado e vence)
 * ganha 1 Troféu do pote e puxa mão nova, pra tentar o 2º Troféu (Carlos,
 * 2026-08-10). Este módulo só consome os contadores já corretos, não decide
 * como eles mudam.
 */

export interface SinalFimDePartida {
  trofeusColetados: Record<string, number>;
  trofeusNoPote: number;
  worldsEndRevelada: boolean;
}

/** 2º troféu de alguém, último troféu do pote, ou World's End revelada. */
export function verificarFimDePartida(sinal: SinalFimDePartida): boolean {
  if (sinal.worldsEndRevelada) return true;
  if (sinal.trofeusNoPote <= 0) return true;
  return Object.values(sinal.trofeusColetados).some((n) => n >= 2);
}

export interface JogadorPontuacao {
  jogador: string;
  /** Pontos já acumulados vencendo pilhas (1 ponto/carta, ver turno.ts). */
  pontosPilha: number;
  trofeus: number;
  cartasNaMao: number;
}

export interface ResultadoFinal {
  jogador: string;
  pontuacaoFinal: number;
  vitoriaAutomatica: boolean;
}

/** 2 troféus = vitória automática; senão, pontosPilha + 10/troféu − cartasNaMao. */
export function calcularPontuacaoFinal(j: JogadorPontuacao): ResultadoFinal {
  if (j.trofeus >= 2) {
    return { jogador: j.jogador, pontuacaoFinal: Infinity, vitoriaAutomatica: true };
  }
  return {
    jogador: j.jogador,
    pontuacaoFinal: j.pontosPilha + j.trofeus * 10 - j.cartasNaMao,
    vitoriaAutomatica: false,
  };
}

/** Vitória automática (2 troféus) sempre vence; senão, maior pontuação final. */
export function determinarVencedor(jogadores: JogadorPontuacao[]): ResultadoFinal {
  const resultados = jogadores.map(calcularPontuacaoFinal);
  const automatico = resultados.find((r) => r.vitoriaAutomatica);
  if (automatico) return automatico;
  return resultados.reduce((melhor, atual) =>
    atual.pontuacaoFinal > melhor.pontuacaoFinal ? atual : melhor,
  );
}
