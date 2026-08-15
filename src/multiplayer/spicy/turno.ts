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
  /**
   * `Date.now()` de quando a declaração/cópia atual entrou na pilha — usado
   * só por `podeDesafiarAgora` (regra "não pode desafiar na própria vez",
   * exceto janela de 5s em partidas de 2 jogadores). `null` quando não há
   * declaração pendente.
   */
  declaradoEm: number | null;
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
    declaradoEm: null,
  };
}

/**
 * Cartas do meio de `pilhaSpicy` nunca são publicadas no Playroom (sigilo —
 * ver `Organizador.tsx`/`publicarEstado`) — reidratação preenche com esse
 * placeholder opaco. Nunca inspecionado por conteúdo: todo consumidor em
 * `turno.ts` só lê `.length`/último elemento de `pilhaSpicy`. Cuidado se um
 * dia a pilha passar a renderizar cartas do meio na UI (hoje só mostra
 * placeholder genérico + `s_topo`, Sprint D) — esse `id` fixo colidiria como
 * `layoutId` do Framer Motion em `FlippableCard`.
 */
const CARTA_PLACEHOLDER_REIDRATACAO: Carta = { id: '__reidratado__', tipo: 'numerada', cor: 'vermelho', valor: 1 };

export interface DadosParaReidratacao {
  jogadores: string[];
  jogadorDaVezId: string;
  pilhaCompra: Carta[];
  pilhaSpicyQtd: number;
  topoPilhaSpicy: Carta | null;
  declaracaoAtual: Declaracao | null;
  ultimoDeclaranteId: string | null;
  maos: Record<string, Carta[]>;
  pontuacoes: Record<string, number>;
  trofeusColetados: Record<string, number>;
  trofeusNoPote: number;
  maoVaziaAguardandoTrofeu: string | null;
  worldsEndRevelada: boolean;
  jogoEncerrado: boolean;
  varianteAtiva: string | null;
  pawHolderId: string | null;
  ultimaJogadaEhCopia: boolean;
  declaradoEm: number | null;
}

/**
 * Reconstrói `EstadoPartida` a partir do que foi publicado no Playroom —
 * usado quando o host recarrega a página/app com uma partida em andamento
 * (bug real reportado por Carlos: hoje `estado` é `useState` puramente
 * local em `Organizador.tsx`, sem esse caminho de recuperação, e um reload
 * do host trava o jogo pra todo mundo). `indiceDaVez` é sempre derivado de
 * `jogadorDaVezId` (nunca publicado separado) pra não existirem duas fontes
 * de verdade divergentes.
 */
export function reidratarEstado(dados: DadosParaReidratacao): EstadoPartida {
  const indiceDaVez = dados.jogadores.indexOf(dados.jogadorDaVezId);
  if (indiceDaVez === -1) {
    throw new Error(`Reidratação inválida: jogadorDaVezId "${dados.jogadorDaVezId}" não está em jogadores`);
  }
  if (dados.pilhaSpicyQtd > 0 && dados.topoPilhaSpicy === null) {
    throw new Error('Reidratação inválida: pilhaSpicyQtd > 0 mas topoPilhaSpicy é null');
  }

  const pilhaSpicy: Carta[] =
    dados.pilhaSpicyQtd === 0
      ? []
      : [
          ...Array.from({ length: dados.pilhaSpicyQtd - 1 }, () => CARTA_PLACEHOLDER_REIDRATACAO),
          dados.topoPilhaSpicy!,
        ];

  return {
    jogadores: dados.jogadores,
    indiceDaVez,
    pilhaCompra: dados.pilhaCompra,
    pilhaSpicy,
    declaracaoAtual: dados.declaracaoAtual,
    ultimoDeclaranteId: dados.ultimoDeclaranteId,
    maos: dados.maos,
    pontuacoes: dados.pontuacoes,
    trofeusColetados: dados.trofeusColetados,
    trofeusNoPote: dados.trofeusNoPote,
    maoVaziaAguardandoTrofeu: dados.maoVaziaAguardandoTrofeu,
    worldsEndRevelada: dados.worldsEndRevelada,
    jogoEncerrado: dados.jogoEncerrado,
    varianteAtiva: dados.varianteAtiva,
    pawHolderId: dados.pawHolderId,
    ultimaJogadaEhCopia: dados.ultimaJogadaEhCopia,
    declaradoEm: dados.declaradoEm,
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
    declaradoEm: null,
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
  agora: number = Date.now(),
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
    declaradoEm: agora,
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
export function copiar(
  estadoOriginal: EstadoPartida,
  jogadorId: string,
  cartaId: string,
  agora: number = Date.now(),
): ResultadoCopiar {
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
    declaradoEm: agora,
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

const JANELA_DESAFIO_VEZ_MS = 5000;

/**
 * "Não pode desafiar na própria vez" (Carlos, regra do jogo físico não
 * implementada até 2026-08-13) — exceto janela de 5s após a declaração,
 * SÓ em partidas de exatamente 2 jogadores (com 3+, sempre existe outro
 * jogador disponível pra desafiar antes da vez voltar pra quem declarou;
 * com 2, o segundo jogador é sempre "o próximo a jogar", então precisa de
 * uma janela explícita ou nunca teria chance real de desafiar). Predicado
 * puro — não lança, só responde se `desafianteId` pode desafiar agora.
 *
 * Também nunca deixa o próprio declarante desafiar a própria declaração —
 * bug real achado em 2026-08-14 (testado ao vivo contra produção): `declarar()`
 * já avança `indiceDaVez` pro próximo jogador na mesma ação, então logo depois
 * de declarar o autor deixa de estar "na vez" e, sem esse guard, passava a
 * satisfazer a regra acima como qualquer outro jogador. Mesmo tipo de trava
 * que `copiar()` já tinha pro caso análogo (`jogadorId === ultimoDeclaranteId`).
 */
export function podeDesafiarAgora(estado: EstadoPartida, desafianteId: string, agora: number = Date.now()): boolean {
  if (desafianteId === estado.ultimoDeclaranteId) return false;
  const ehSuaVez = estado.jogadores[estado.indiceDaVez] === desafianteId;
  if (!ehSuaVez) return true;
  if (estado.jogadores.length !== 2) return false;
  return estado.declaradoEm !== null && agora - estado.declaradoEm <= JANELA_DESAFIO_VEZ_MS;
}

export interface DesafianteSimultaneo {
  jogadorId: string;
  traco: Traco;
}

export interface ResultadoDesafioMultiplo {
  estado: EstadoPartida;
  declaranteVenceu: boolean;
  cartaRevelada: Carta;
  /** Presente só quando os desafiantes venceram — id → pontos que cada um ganhou. */
  pontosPorDesafiante: Record<string, number>;
}

/**
 * Resolve um episódio de desafio com 1+ desafiantes simultâneos (regra
 * "on the fly" do grupo do Carlos — 2+ jogadores desafiando a mesma
 * declaração dentro de uma janela técnica de detecção de ~300ms, ver
 * `Organizador.tsx`). Esta função NÃO valida turno/janela por desafiante
 * individual (`podeDesafiarAgora`) nem agrupa por tempo — quem chama já
 * filtrou/bufferizou o grupo; aqui só resolve o episódio.
 *
 * Traço usado: o do PRIMEIRO desafiante do array (`desafiantes[0]`) — spec
 * não define o que fazer com traços divergentes entre desafiantes
 * simultâneos, escolha própria.
 *
 * Declarante venceu: TODOS os desafiantes perdem, cada um compra 2 cartas
 * individualmente (extensão da regra de 1 desafiante — spec só define esse
 * caso).
 *
 * Desafiantes venceram: pontos da pilha (1/carta) divididos igualmente; se
 * não dividir exato, puxa carta(s) extra do monte até completar um
 * múltiplo do número de desafiantes (exemplo do Carlos: pilha=1, 2
 * desafiantes → puxa +1 do monte, 2 pontos totais, 1 cada). Se o monte não
 * tiver cartas suficientes pra completar a divisão exata, divide o que der
 * sem travar — sobra vai pros desafiantes que chegaram primeiro.
 *
 * Vencedor fica com a pilha como pontos (1 ponto/carta, §4); perdedor(es)
 * compra(m) 2 cartas. Próximo turno vai para o jogador seguinte ao(s)
 * perdedor(es) (ordem normal) — spec não define explicitamente quem joga a
 * seguir; com múltiplos perdedores (declarante venceu), usa o primeiro
 * desafiante do grupo como âncora — escolha própria, ajustável.
 *
 * Se a carta desafiada era a última da mão do declarante
 * (`maoVaziaAguardandoTrofeu`) e ele vence, também ganha o Troféu + mão nova
 * (mesma regra do caminho não-desafiado, ver `resolverPendenciaUltimaCarta`).
 *
 * `ultimaJogadaEhCopia` (Copy Cat, §5) força o traço pra 'ambos',
 * ignorando o que foi passado — "o desafiante só diz 'Errado!', sem
 * escolher traço" (§5, "Desafio especial do Copy Cat"). `varianteAtiva`
 * também é repassado pra `resolverDesafio` (Turn It Up, 6↔9). Qualquer
 * reivindicação pendente do Spice Raider (`pawHolderId`) é descartada ao
 * desafiar — a pilha em disputa muda de mãos via desafio, não sobra nada
 * pro Raider reivindicar depois (decisão própria, não-especificada na spec).
 */
export function resolverDesafioMultiplo(
  estado: EstadoPartida,
  desafiantes: DesafianteSimultaneo[],
): ResultadoDesafioMultiplo {
  if (estado.pilhaSpicy.length === 0 || estado.declaracaoAtual === null || estado.ultimoDeclaranteId === null) {
    throw new Error('Não há declaração pendente para desafiar');
  }
  if (desafiantes.length === 0) {
    throw new Error('resolverDesafioMultiplo precisa de ao menos 1 desafiante');
  }

  const tracoEfetivo: Traco = estado.ultimaJogadaEhCopia ? 'ambos' : desafiantes[0].traco;
  const cartaRevelada = estado.pilhaSpicy[estado.pilhaSpicy.length - 1];
  const declaranteId = estado.ultimoDeclaranteId;
  const declaranteVenceu = resolverDesafio(cartaRevelada, estado.declaracaoAtual, tracoEfetivo, estado.varianteAtiva);

  let pilhaCompra = estado.pilhaCompra;
  let worldsEndRevelada = estado.worldsEndRevelada;
  let maos = estado.maos;
  let pontuacoes = estado.pontuacoes;
  const pontosPorDesafiante: Record<string, number> = {};
  const pontosDaPilha = estado.pilhaSpicy.length;
  let perdedorAncoraId: string;

  if (declaranteVenceu) {
    for (const d of desafiantes) {
      const { compradas, restante, fimDoMundoRevelada } = comprar(pilhaCompra, 2);
      pilhaCompra = restante;
      worldsEndRevelada = worldsEndRevelada || fimDoMundoRevelada;
      maos = { ...maos, [d.jogadorId]: [...maos[d.jogadorId], ...compradas] };
    }
    pontuacoes = { ...pontuacoes, [declaranteId]: pontuacoes[declaranteId] + pontosDaPilha };
    perdedorAncoraId = desafiantes[0].jogadorId;
  } else {
    // Declarante blefou e foi pego — come 2 cartas (mesma punição do caso de 1 desafiante), independente de quantos desafiantes venceram junto.
    const { compradas, restante, fimDoMundoRevelada } = comprar(pilhaCompra, 2);
    pilhaCompra = restante;
    worldsEndRevelada = worldsEndRevelada || fimDoMundoRevelada;
    maos = { ...maos, [declaranteId]: [...maos[declaranteId], ...compradas] };

    const n = desafiantes.length;
    let total = pontosDaPilha;
    while (total % n !== 0) {
      const { compradas, restante, fimDoMundoRevelada } = comprar(pilhaCompra, 1);
      pilhaCompra = restante;
      worldsEndRevelada = worldsEndRevelada || fimDoMundoRevelada;
      if (compradas.length === 0) break; // monte esgotou no meio da divisão — divide o que der, não trava
      total += 1;
    }
    const parteBase = Math.floor(total / n);
    const resto = total % n; // só > 0 se o monte esgotou antes de completar a divisão exata
    pontuacoes = { ...pontuacoes };
    desafiantes.forEach((d, i) => {
      const pontos = parteBase + (i < resto ? 1 : 0); // sobra vai pros desafiantes que chegaram primeiro
      pontuacoes[d.jogadorId] = pontuacoes[d.jogadorId] + pontos;
      pontosPorDesafiante[d.jogadorId] = pontos;
    });
    perdedorAncoraId = declaranteId;
  }

  const indicePerdedorAncora = estado.jogadores.indexOf(perdedorAncoraId);

  let estadoNovo: EstadoPartida = {
    ...estado,
    pilhaCompra,
    pilhaSpicy: [],
    declaracaoAtual: null,
    ultimoDeclaranteId: null,
    declaradoEm: null,
    maoVaziaAguardandoTrofeu: null,
    pawHolderId: null,
    ultimaJogadaEhCopia: false,
    maos,
    pontuacoes,
    worldsEndRevelada,
    indiceDaVez: (indicePerdedorAncora + 1) % estado.jogadores.length,
  };

  if (declaranteVenceu && estado.maoVaziaAguardandoTrofeu === declaranteId) {
    estadoNovo = resolverPendenciaUltimaCarta({ ...estadoNovo, maoVaziaAguardandoTrofeu: declaranteId });
  }

  return { estado: comFimDeJogoAtualizado(estadoNovo), declaranteVenceu, cartaRevelada, pontosPorDesafiante };
}

/** Wrapper de 1 desafiante só, em cima de `resolverDesafioMultiplo` — valida `podeDesafiarAgora` antes de resolver. */
export function desafiar(
  estado: EstadoPartida,
  desafianteId: string,
  traco: Traco,
  agora: number = Date.now(),
): ResultadoDesafio {
  if (estado.pilhaSpicy.length === 0 || estado.declaracaoAtual === null || estado.ultimoDeclaranteId === null) {
    throw new Error('Não há declaração pendente para desafiar');
  }
  if (!podeDesafiarAgora(estado, desafianteId, agora)) {
    throw new Error(`${desafianteId} não pode desafiar agora — é a vez dele jogar/passar`);
  }
  const r = resolverDesafioMultiplo(estado, [{ jogadorId: desafianteId, traco }]);
  return { estado: r.estado, declaranteVenceu: r.declaranteVenceu, cartaRevelada: r.cartaRevelada };
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
