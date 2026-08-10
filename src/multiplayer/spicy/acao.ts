import { copiar, declarar, desafiar, passar, type EstadoPartida } from './turno';
import type { Declaracao, Traco } from './types';

/**
 * Forma serializável de uma ação de jogador — o que trafega pelo "correio"
 * do Playroom (ver Organizador.tsx: cada jogador escreve isso no próprio
 * `PlayerState`, host lê via `usePlayersList(true)` e aplica aqui). Fica
 * separado de `turno.ts` pra ter um único ponto de despacho testável sem
 * tocar em Playroom.
 */
export type Acao =
  | {
      tipo: 'declarar';
      cartaId: string;
      declaracao: Declaracao;
      anunciouUltima?: boolean;
      /** Change Your Luck (§5) — até 2 ids de carta da própria mão, só com a variante ativa e valor 5. */
      cartasExtrasParaEnfiar?: string[];
    }
  | { tipo: 'passar' }
  | { tipo: 'desafiar'; traco: Traco }
  /** Copy Cat (§5) — só com a variante ativa; ver `turno.ts#copiar`. */
  | { tipo: 'copiar'; cartaId: string };

export type EventoAcao =
  | { tipo: 'declarar'; avisoSequenciaQuebrada: boolean; esqueceuUltimaCarta: boolean }
  | { tipo: 'passar' }
  | { tipo: 'desafiar'; declaranteVenceu: boolean; cartaRevelada: EstadoPartida['pilhaSpicy'][number] }
  | { tipo: 'copiar' };

export interface ResultadoAcao {
  estado: EstadoPartida;
  evento: EventoAcao;
}

/** Único ponto de despacho: mapeia uma `Acao` pro reducer puro de turno.ts. */
export function aplicarAcao(estado: EstadoPartida, jogadorId: string, acao: Acao): ResultadoAcao {
  switch (acao.tipo) {
    case 'declarar': {
      const r = declarar(
        estado,
        jogadorId,
        acao.cartaId,
        acao.declaracao,
        acao.anunciouUltima,
        acao.cartasExtrasParaEnfiar,
      );
      return {
        estado: r.estado,
        evento: {
          tipo: 'declarar',
          avisoSequenciaQuebrada: r.avisoSequenciaQuebrada,
          esqueceuUltimaCarta: r.esqueceuUltimaCarta,
        },
      };
    }
    case 'passar':
      return { estado: passar(estado, jogadorId), evento: { tipo: 'passar' } };
    case 'desafiar': {
      const r = desafiar(estado, jogadorId, acao.traco);
      return {
        estado: r.estado,
        evento: { tipo: 'desafiar', declaranteVenceu: r.declaranteVenceu, cartaRevelada: r.cartaRevelada },
      };
    }
    case 'copiar': {
      const r = copiar(estado, jogadorId, acao.cartaId);
      return { estado: r.estado, evento: { tipo: 'copiar' } };
    }
  }
}
