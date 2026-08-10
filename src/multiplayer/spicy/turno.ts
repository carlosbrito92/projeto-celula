import type { Rng } from '../../utilitarios/shuffle';
import { criarBaralhoEmbaralhado } from './baralho';
import { resolverDesafio } from './desafio';
import { verificarFimDePartida } from './fimDePartida';
import { quebraSequencia } from './sequencia';
import type { Carta, Declaracao, Traco } from './types';

const MAO_INICIAL = 6;

/**
 * Cartas do fundo da pilha de compra "reservadas" por jogador antes de
 * inserir o World's End — ex: 2 jogadores → carta entra a 10 do fundo.
 * Sem tabela oficial (carta física traz o número, não documentado em
 * texto); valor de referência, ajustar em playtesting — mesmo espírito da
 * distribuição de §3.1.
 */
const PROFUNDIDADE_FIM_DO_MUNDO_POR_JOGADOR = 5;

export interface EstadoPartida {
  jogadores: string[];
  indiceDaVez: number;
  pilhaCompra: Carta[];
  /** Topo = último elemento. */
  pilhaSpicy: Carta[];
  declaracaoAtual: Declaracao | null;
  ultimoDeclaranteId: string | null;
  maos: Record<string, Carta[]>;
  pontuacoes: Record<string, number>;
  trofeusColetados: Record<string, number>;
  trofeusNoPote: number;
  /**
   * Jogador que acabou de jogar a última carta da mão e ainda não teve essa
   * jogada nem desafiada nem "enterrada" por uma declaração/passe seguinte —
   * ver `resolverPendenciaUltimaCarta`. Nunca mais de um pendente por vez:
   * a pendência sempre se resolve na própria próxima ação de outro jogador.
   */
  maoVaziaAguardandoTrofeu: string | null;
  worldsEndRevelada: boolean;
  jogoEncerrado: boolean;
}

export interface OpcoesPartida {
  /**
   * Padrão desligado — "normalmente não usada" nos jogos (Carlos, 2026-08-10).
   * Motivo de design, não só preferência: em sessões casuais com vários
   * reembaralhamentos, a chance dela sair cedo sobe bastante e derruba a
   * partida sem aviso. TOGGLE DE SETUP, mesmo tratamento da variante Spice
   * It Up! (§4/§9 de docs/spicy-spec.md) — quando a UI mínima de setup for
   * construída (Sprint A, próxima etapa), isso precisa de opção visível pro
   * organizador antes do `insertCoin`, não pode ficar só como este default
   * interno de `false`.
   */
  worldsEndAtiva?: boolean;
}

function inserirFimDoMundo(pilhaCompra: Carta[], numJogadores: number, fimDoMundo: Carta): Carta[] {
  const profundidade = numJogadores * PROFUNDIDADE_FIM_DO_MUNDO_POR_JOGADOR;
  const indice = Math.max(0, pilhaCompra.length - profundidade);
  return [...pilhaCompra.slice(0, indice), fimDoMundo, ...pilhaCompra.slice(indice)];
}

export function montarEstadoInicial(
  jogadores: string[],
  rng: Rng = Math.random,
  opcoes: OpcoesPartida = {},
): EstadoPartida {
  const baralhoCompleto = criarBaralhoEmbaralhado(rng);
  const fimDoMundo = baralhoCompleto.find((c) => c.tipo === 'fim_do_mundo')!;
  const semFimDoMundo = baralhoCompleto.filter((c) => c.tipo !== 'fim_do_mundo');

  const maos: Record<string, Carta[]> = {};
  let indice = 0;
  for (const jogador of jogadores) {
    maos[jogador] = semFimDoMundo.slice(indice, indice + MAO_INICIAL);
    indice += MAO_INICIAL;
  }

  let pilhaCompra = semFimDoMundo.slice(indice);
  if (opcoes.worldsEndAtiva) {
    pilhaCompra = inserirFimDoMundo(pilhaCompra, jogadores.length, fimDoMundo);
  }

  return {
    jogadores,
    indiceDaVez: 0,
    pilhaCompra,
    pilhaSpicy: [],
    declaracaoAtual: null,
    ultimoDeclaranteId: null,
    maos,
    pontuacoes: Object.fromEntries(jogadores.map((j) => [j, 0])),
    trofeusColetados: Object.fromEntries(jogadores.map((j) => [j, 0])),
    trofeusNoPote: 3,
    maoVaziaAguardandoTrofeu: null,
    worldsEndRevelada: false,
    jogoEncerrado: false,
  };
}

function proximoIndice(estado: EstadoPartida): number {
  return (estado.indiceDaVez + 1) % estado.jogadores.length;
}

function validarVez(estado: EstadoPartida, jogadorId: string): void {
  if (estado.jogadores[estado.indiceDaVez] !== jogadorId) {
    throw new Error(`Não é a vez de ${jogadorId}`);
  }
}

function comFimDeJogoAtualizado(estado: EstadoPartida): EstadoPartida {
  const jogoEncerrado = verificarFimDePartida({
    trofeusColetados: estado.trofeusColetados,
    trofeusNoPote: estado.trofeusNoPote,
    worldsEndRevelada: estado.worldsEndRevelada,
  });
  return jogoEncerrado === estado.jogoEncerrado ? estado : { ...estado, jogoEncerrado };
}

/**
 * Última carta jogada (mão vazia) sobrevive sem desafio até a próxima ação
 * de outro jogador (declarar/passar "enterra" a jogada; ver `desafiar` para
 * o caminho onde ela É desafiada) → jogador ganha 1 Troféu do pote e puxa
 * uma mão nova de `MAO_INICIAL` cartas pra continuar tentando o 2º troféu
 * (Carlos, 2026-08-10). Pote esgotado nesse meio-tempo: pendência só limpa,
 * sem prêmio — não deveria ser alcançável (pote esgotado já encerra o jogo),
 * guarda defensiva.
 */
function resolverPendenciaUltimaCarta(estado: EstadoPartida): EstadoPartida {
  const jogador = estado.maoVaziaAguardandoTrofeu;
  if (!jogador || estado.trofeusNoPote <= 0) {
    return { ...estado, maoVaziaAguardandoTrofeu: null };
  }

  const { compradas, restante, fimDoMundoRevelada } = comprar(estado.pilhaCompra, MAO_INICIAL);

  return comFimDeJogoAtualizado({
    ...estado,
    maoVaziaAguardandoTrofeu: null,
    pilhaCompra: restante,
    maos: { ...estado.maos, [jogador]: compradas },
    trofeusNoPote: estado.trofeusNoPote - 1,
    trofeusColetados: { ...estado.trofeusColetados, [jogador]: estado.trofeusColetados[jogador] + 1 },
    worldsEndRevelada: estado.worldsEndRevelada || fimDoMundoRevelada,
  });
}

export interface ResultadoDeclarar {
  estado: EstadoPartida;
  /** Aviso não-bloqueante (§4) — a jogada acontece de qualquer forma. */
  avisoSequenciaQuebrada: boolean;
  /**
   * Jogador tinha 1 carta na mão e não confirmou "última carta" — jogada
   * NÃO acontece, carta permanece na mão, turno passa (§4, regra oficial:
   * "deve recolher e passar").
   */
  esqueceuUltimaCarta: boolean;
}

/**
 * Declara e joga `cartaId` da mão de `jogadorId`, alegando `declaracao`.
 * `anunciouUltima` só importa quando a mão do jogador tem exatamente 1
 * carta antes da jogada (§4) — ignorado nos demais casos.
 */
export function declarar(
  estadoOriginal: EstadoPartida,
  jogadorId: string,
  cartaId: string,
  declaracao: Declaracao,
  anunciouUltima = false,
): ResultadoDeclarar {
  const estado = resolverPendenciaUltimaCarta(estadoOriginal);
  validarVez(estado, jogadorId);
  const mao = estado.maos[jogadorId];
  if (mao.length === 1 && !anunciouUltima) {
    return {
      estado: { ...estado, indiceDaVez: proximoIndice(estado) },
      avisoSequenciaQuebrada: false,
      esqueceuUltimaCarta: true,
    };
  }

  const carta = mao.find((c) => c.id === cartaId);
  if (!carta) throw new Error(`Carta ${cartaId} não está na mão de ${jogadorId}`);

  const avisoSequenciaQuebrada = quebraSequencia(estado.declaracaoAtual, declaracao);
  const maoRestante = mao.filter((c) => c.id !== cartaId);

  const estadoNovo: EstadoPartida = {
    ...estado,
    maos: { ...estado.maos, [jogadorId]: maoRestante },
    pilhaSpicy: [...estado.pilhaSpicy, carta],
    declaracaoAtual: declaracao,
    ultimoDeclaranteId: jogadorId,
    maoVaziaAguardandoTrofeu: maoRestante.length === 0 ? jogadorId : null,
    indiceDaVez: proximoIndice(estado),
  };

  return { estado: estadoNovo, avisoSequenciaQuebrada, esqueceuUltimaCarta: false };
}

/** Jogador da vez passa sem jogar carta — pilha/declaração atual não mudam. */
export function passar(estadoOriginal: EstadoPartida, jogadorId: string): EstadoPartida {
  const estado = resolverPendenciaUltimaCarta(estadoOriginal);
  validarVez(estado, jogadorId);
  return { ...estado, indiceDaVez: proximoIndice(estado) };
}

export interface ResultadoDesafio {
  estado: EstadoPartida;
  declaranteVenceu: boolean;
  cartaRevelada: Carta;
}

/**
 * Qualquer jogador pode desafiar enquanto houver carta no topo da pilha
 * (§4) — não precisa ser a vez de quem desafia.
 *
 * Vencedor fica com a pilha como pontos (1 ponto/carta, §4); perdedor
 * compra 2 cartas. Próximo turno vai para o jogador seguinte ao perdedor
 * (ordem normal) — spec não define explicitamente quem joga a seguir;
 * escolha documentada aqui, ajustável se divergir do jogo físico.
 *
 * Se a carta desafiada era a última da mão do declarante
 * (`maoVaziaAguardandoTrofeu`) e ele vence, também ganha o Troféu + mão nova
 * (mesma regra do caminho não-desafiado, ver `resolverPendenciaUltimaCarta`).
 */
export function desafiar(estado: EstadoPartida, desafianteId: string, traco: Traco): ResultadoDesafio {
  if (estado.pilhaSpicy.length === 0 || estado.declaracaoAtual === null || estado.ultimoDeclaranteId === null) {
    throw new Error('Não há declaração pendente para desafiar');
  }

  const cartaRevelada = estado.pilhaSpicy[estado.pilhaSpicy.length - 1];
  const declaranteId = estado.ultimoDeclaranteId;
  const declaranteVenceu = resolverDesafio(cartaRevelada, estado.declaracaoAtual, traco);

  const vencedorId = declaranteVenceu ? declaranteId : desafianteId;
  const perdedorId = declaranteVenceu ? desafianteId : declaranteId;

  const pontosGanhos = estado.pilhaSpicy.length;
  const { compradas: cartasCompradas, restante: pilhaCompraRestante, fimDoMundoRevelada } = comprar(
    estado.pilhaCompra,
    2,
  );

  const indicePerdedor = estado.jogadores.indexOf(perdedorId);

  let estadoNovo: EstadoPartida = {
    ...estado,
    pilhaCompra: pilhaCompraRestante,
    pilhaSpicy: [],
    declaracaoAtual: null,
    ultimoDeclaranteId: null,
    maoVaziaAguardandoTrofeu: null,
    maos: {
      ...estado.maos,
      [perdedorId]: [...estado.maos[perdedorId], ...cartasCompradas],
    },
    pontuacoes: {
      ...estado.pontuacoes,
      [vencedorId]: estado.pontuacoes[vencedorId] + pontosGanhos,
    },
    worldsEndRevelada: estado.worldsEndRevelada || fimDoMundoRevelada,
    indiceDaVez: (indicePerdedor + 1) % estado.jogadores.length,
  };

  if (declaranteVenceu && estado.maoVaziaAguardandoTrofeu === declaranteId) {
    estadoNovo = resolverPendenciaUltimaCarta({ ...estadoNovo, maoVaziaAguardandoTrofeu: declaranteId });
  }

  return { estado: comFimDeJogoAtualizado(estadoNovo), declaranteVenceu, cartaRevelada };
}

interface ResultadoCompra {
  compradas: Carta[];
  restante: Carta[];
  /**
   * World's End nunca vai pra mão de ninguém (§4) — se aparecer entre as
   * cartas compradas, a compra para ali (cartas depois dela na pilha não
   * são tocadas) e o jogo encerra.
   */
  fimDoMundoRevelada: boolean;
}

function comprar(pilhaCompra: Carta[], quantidade: number): ResultadoCompra {
  const compradas: Carta[] = [];
  for (let i = 0; i < quantidade && i < pilhaCompra.length; i++) {
    const carta = pilhaCompra[i];
    if (carta.tipo === 'fim_do_mundo') {
      return { compradas, restante: pilhaCompra.slice(i + 1), fimDoMundoRevelada: true };
    }
    compradas.push(carta);
  }
  return { compradas, restante: pilhaCompra.slice(compradas.length), fimDoMundoRevelada: false };
}
