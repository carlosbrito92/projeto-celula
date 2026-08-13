import type { Rng } from '../../utilitarios/shuffle';
import { criarBaralhoEmbaralhado } from './baralho';
import { resolverDesafio } from './desafio';
import { verificarFimDePartida } from './fimDePartida';
import { quebraSequencia } from './sequencia';
import type { Carta, Declaracao, Traco } from './types';

const MAO_INICIAL = 6;
const MAX_EXTRAS_CHANGE_YOUR_LUCK = 2;

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
  /** Variante "Spice It Up!" ativa nesta partida (§5) — só 1 por vez (§4), ou `null`. */
  varianteAtiva: string | null;
  /**
   * Spice Raider (§5): jogador que declarou um 4 e reivindicou a pilha
   * atual. Resolvido na próxima carta jogada de fato (declarar/copiar,
   * `passar` não conta) por `resolverReivindicacaoRaider`.
   */
  pawHolderId: string | null;
  /**
   * Copy Cat (§5): true quando a carta no topo da pilha entrou via `copiar`
   * (não `declarar`) — desafiar essa jogada específica usa modo 'ambos' os
   * traços automaticamente, sem escolha do desafiante (ver `desafiar`).
   */
  ultimaJogadaEhCopia: boolean;
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
  /** Id de `variantes.ts` (ex: 'we_love_chili') ou `null`/omitido — só 1 por partida (§4). */
  varianteAtiva?: string | null;
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
    varianteAtiva: opcoes.varianteAtiva ?? null,
    pawHolderId: null,
    ultimaJogadaEhCopia: false,
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
    worldsEndRevelada: estado.worldsEndRevelada,
    pilhaCompraVazia: estado.pilhaCompra.length === 0,
  });
  return jogoEncerrado === estado.jogoEncerrado ? estado : { ...estado, jogoEncerrado };
}

/**
 * Última carta jogada (mão vazia) sobrevive sem desafio até a próxima ação
 * de outro jogador (declarar/passar/copiar "enterra" a jogada; ver
 * `desafiar` para o caminho onde ela É desafiada) → jogador puxa mão nova
 * de `MAO_INICIAL` cartas pra continuar jogando, e ganha 1 Troféu do pote
 * SE ainda sobrar (pote tem só 3 — Carlos, 2026-08-10/2026-08-13). Pote
 * esgotado (3 já distribuídos, mesmo que a jogadores diferentes) NÃO
 * impede a mão nova nem encerra o jogo sozinho — a partida segue até o
 * monte de compra esgotar (ver `fimDePartida.ts`); só fica sem prêmio de
 * troféu daí em diante.
 */
function resolverPendenciaUltimaCarta(estado: EstadoPartida): EstadoPartida {
  const jogador = estado.maoVaziaAguardandoTrofeu;
  if (!jogador) {
    return { ...estado, maoVaziaAguardandoTrofeu: null };
  }

  const { compradas, restante, fimDoMundoRevelada } = comprar(estado.pilhaCompra, MAO_INICIAL);
  const ganhaTrofeu = estado.trofeusNoPote > 0;

  return comFimDeJogoAtualizado({
    ...estado,
    maoVaziaAguardandoTrofeu: null,
    pilhaCompra: restante,
    maos: { ...estado.maos, [jogador]: compradas },
    trofeusNoPote: ganhaTrofeu ? estado.trofeusNoPote - 1 : estado.trofeusNoPote,
    trofeusColetados: ganhaTrofeu
      ? { ...estado.trofeusColetados, [jogador]: estado.trofeusColetados[jogador] + 1 }
      : estado.trofeusColetados,
    worldsEndRevelada: estado.worldsEndRevelada || fimDoMundoRevelada,
  });
}

/**
 * Spice Raider (§5): se há uma reivindicação pendente (`pawHolderId`),
 * resolve ANTES de processar a próxima carta jogada de fato (`declarar`/
 * `copiar` chamam isso; `passar` não, porque "passe não conta" §5) — o
 * Raider fica com toda a pilha atual como pontos, pilha zera, e a carta
 * prestes a ser jogada começa uma pilha nova sozinha (efeito automático de
 * já rodar isso antes do push da nova carta).
 */
function resolverReivindicacaoRaider(estado: EstadoPartida): EstadoPartida {
  if (!estado.pawHolderId) return estado;
  if (estado.pilhaSpicy.length === 0) {
    return { ...estado, pawHolderId: null };
  }
  const raiderId = estado.pawHolderId;
  const pontos = estado.pilhaSpicy.length;
  return {
    ...estado,
    pawHolderId: null,
    pilhaSpicy: [],
    declaracaoAtual: null,
    ultimoDeclaranteId: null,
    pontuacoes: { ...estado.pontuacoes, [raiderId]: estado.pontuacoes[raiderId] + pontos },
  };
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
 *
 * `cartasExtrasParaEnfiar` é o mecanismo do Change Your Luck (§5, valor 5):
 * até 2 ids de carta da própria mão, enfiadas embaixo da carta principal na
 * pilha (imunes a desafio — nunca são o topo, então `desafiar` nunca as
 * inspeciona) e repostas por compra do monte. Só válido com a variante
 * `change_your_luck` ativa e `declaracao.valor === 5`; lança erro fora
 * desse contexto (uso indevido, não uma jogada "errada" tolerável).
 */
export function declarar(
  estadoOriginal: EstadoPartida,
  jogadorId: string,
  cartaId: string,
  declaracao: Declaracao,
  anunciouUltima = false,
  cartasExtrasParaEnfiar: string[] = [],
): ResultadoDeclarar {
  let estado = resolverPendenciaUltimaCarta(estadoOriginal);
  estado = resolverReivindicacaoRaider(estado);
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

  const avisoSequenciaQuebrada = quebraSequencia(estado.declaracaoAtual, declaracao, estado.varianteAtiva);
  let maoRestante = mao.filter((c) => c.id !== cartaId);
  let pilhaCompra = estado.pilhaCompra;
  let worldsEndRevelada = estado.worldsEndRevelada;
  let cartasParaPilha: Carta[] = [carta];

  if (cartasExtrasParaEnfiar.length > 0) {
    if (estado.varianteAtiva !== 'change_your_luck') {
      throw new Error('Cartas extras só são válidas com a variante Change Your Luck ativa');
    }
    if (declaracao.valor !== 5) {
      throw new Error('Cartas extras só podem ser enfiadas junto de uma declaração de valor 5');
    }
    if (cartasExtrasParaEnfiar.length > MAX_EXTRAS_CHANGE_YOUR_LUCK) {
      throw new Error(`No máximo ${MAX_EXTRAS_CHANGE_YOUR_LUCK} cartas extras`);
    }
    const extras = cartasExtrasParaEnfiar.map((id) => {
      const c = maoRestante.find((carta2) => carta2.id === id);
      if (!c) throw new Error(`Carta extra ${id} não está na mão de ${jogadorId}`);
      return c;
    });
    maoRestante = maoRestante.filter((c) => !cartasExtrasParaEnfiar.includes(c.id));
    cartasParaPilha = [...extras, carta];

    const { compradas, restante, fimDoMundoRevelada } = comprar(pilhaCompra, extras.length);
    maoRestante = [...maoRestante, ...compradas];
    pilhaCompra = restante;
    worldsEndRevelada = worldsEndRevelada || fimDoMundoRevelada;
  }

  const maoFinal = maoRestante;

  const estadoNovo: EstadoPartida = {
    ...estado,
    pilhaCompra,
    worldsEndRevelada,
    maos: { ...estado.maos, [jogadorId]: maoFinal },
    pilhaSpicy: [...estado.pilhaSpicy, ...cartasParaPilha],
    declaracaoAtual: declaracao,
    ultimoDeclaranteId: jogadorId,
    maoVaziaAguardandoTrofeu: maoFinal.length === 0 ? jogadorId : null,
    ultimaJogadaEhCopia: false,
    pawHolderId: estado.varianteAtiva === 'spice_raider' && declaracao.valor === 4 ? jogadorId : estado.pawHolderId,
    indiceDaVez: proximoIndice(estado),
  };

  return { estado: comFimDeJogoAtualizado(estadoNovo), avisoSequenciaQuebrada, esqueceuUltimaCarta: false };
}

/** Jogador da vez passa sem jogar carta — pilha/declaração atual não mudam. Spice Raider: "passe não conta" (§5), não resolve a reivindicação. */
export function passar(estadoOriginal: EstadoPartida, jogadorId: string): EstadoPartida {
  const estado = resolverPendenciaUltimaCarta(estadoOriginal);
  validarVez(estado, jogadorId);
  return { ...estado, indiceDaVez: proximoIndice(estado) };
}

export interface ResultadoCopiar {
  estado: EstadoPartida;
  avisoSequenciaQuebrada: false;
  esqueceuUltimaCarta: false;
}

/**
 * Copy Cat (§5): `jogadorId` (qualquer um, menos quem fez a última
 * declaração) joga `cartaId` da própria mão replicando exatamente a
 * declaração atual (mesma cor+valor) — "rouba" a vez. Turno segue para a
 * esquerda de quem copiou; cópia de uma cópia é permitida (só olha o
 * `ultimoDeclaranteId` corrente, sem limite de cadeia).
 */
export function copiar(estadoOriginal: EstadoPartida, jogadorId: string, cartaId: string): ResultadoCopiar {
  let estado = resolverPendenciaUltimaCarta(estadoOriginal);
  estado = resolverReivindicacaoRaider(estado);

  if (estado.varianteAtiva !== 'copy_cat') {
    throw new Error('Copiar só é válido com a variante Copy Cat ativa');
  }
  if (estado.pilhaSpicy.length === 0 || estado.declaracaoAtual === null || estado.ultimoDeclaranteId === null) {
    throw new Error('Não há declaração pendente para copiar');
  }
  if (jogadorId === estado.ultimoDeclaranteId) {
    throw new Error('Não é possível copiar a própria jogada');
  }

  const mao = estado.maos[jogadorId];
  const carta = mao.find((c) => c.id === cartaId);
  if (!carta) throw new Error(`Carta ${cartaId} não está na mão de ${jogadorId}`);
  const maoRestante = mao.filter((c) => c.id !== cartaId);

  const indiceCopiador = estado.jogadores.indexOf(jogadorId);

  const estadoNovo: EstadoPartida = {
    ...estado,
    maos: { ...estado.maos, [jogadorId]: maoRestante },
    pilhaSpicy: [...estado.pilhaSpicy, carta],
    ultimoDeclaranteId: jogadorId,
    ultimaJogadaEhCopia: true,
    maoVaziaAguardandoTrofeu: maoRestante.length === 0 ? jogadorId : null,
    indiceDaVez: (indiceCopiador + 1) % estado.jogadores.length,
  };

  return {
    estado: comFimDeJogoAtualizado(estadoNovo),
    avisoSequenciaQuebrada: false,
    esqueceuUltimaCarta: false,
  };
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
 *
 * `ultimaJogadaEhCopia` (Copy Cat, §5) força `traco` para 'ambos',
 * ignorando o que foi passado — "o desafiante só diz 'Errado!', sem
 * escolher traço" (§5, "Desafio especial do Copy Cat"). `varianteAtiva`
 * também é repassado pra `resolverDesafio` (Turn It Up, 6↔9). Qualquer
 * reivindicação pendente do Spice Raider (`pawHolderId`) é descartada ao
 * desafiar — a pilha em disputa muda de mãos via desafio, não sobra nada
 * pro Raider reivindicar depois (decisão própria, não-especificada na spec).
 */
export function desafiar(estado: EstadoPartida, desafianteId: string, traco: Traco): ResultadoDesafio {
  if (estado.pilhaSpicy.length === 0 || estado.declaracaoAtual === null || estado.ultimoDeclaranteId === null) {
    throw new Error('Não há declaração pendente para desafiar');
  }

  const tracoEfetivo: Traco = estado.ultimaJogadaEhCopia ? 'ambos' : traco;
  const cartaRevelada = estado.pilhaSpicy[estado.pilhaSpicy.length - 1];
  const declaranteId = estado.ultimoDeclaranteId;
  const declaranteVenceu = resolverDesafio(
    cartaRevelada,
    estado.declaracaoAtual,
    tracoEfetivo,
    estado.varianteAtiva,
  );

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
    pawHolderId: null,
    ultimaJogadaEhCopia: false,
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
