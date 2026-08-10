/**
 * Motor puro do Spicy (Sprint A, docs/spicy-spec.md §7). Sem Playroom/UI aqui —
 * só estruturas de dados e funções determinísticas, testáveis isoladas.
 */

export type Cor = 'vermelho' | 'azul' | 'verde';

export const CORES: readonly Cor[] = ['vermelho', 'azul', 'verde'];

export type TipoCarta = 'numerada' | 'wild_cor' | 'wild_numero' | 'trofeu' | 'fim_do_mundo';

/**
 * `cor`/`valor` só existem em cartas `numerada` — Wilds e especiais não têm
 * traço fixo (ver docs/spicy-spec.md §3.2 e §6.1). Visual (background/shapes/
 * texts) é responsabilidade do Sprint C, não entra aqui.
 */
export interface Carta {
  id: string;
  tipo: TipoCarta;
  cor?: Cor;
  valor?: number;
}

/** O que um jogador diz que a carta jogada é — verdadeiro ou blefe. */
export interface Declaracao {
  cor: Cor;
  valor: number;
}

/**
 * Traço contestado num desafio. 'ambos' só existe no modo especial do Copy
 * Cat (docs/spicy-spec.md §5 "Desafio especial do Copy Cat") — motor de
 * resolução nasce com esse parâmetro desde o início por causa disso.
 */
export type Traco = 'cor' | 'valor' | 'ambos';
