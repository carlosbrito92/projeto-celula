import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getRoomCode, getState, insertCoin, myPlayer, setState, usePlayersList } from 'playroomkit';
import { Link } from '../../router/Router';
import { QrCode } from '../quemSouEu/QrCode';
import { aplicarAcao, type Acao } from './acao';
import { Jogo, type ProjecaoPublica, type ResultadoDesafioPublico } from './Jogo';
import { ShuffleAnimation } from './ShuffleAnimation';
import {
  montarEstadoInicial,
  reidratarEstado,
  type DadosParaReidratacao,
  type EstadoPartida,
  type OpcoesPartida,
} from './turno';
import type { Carta, Declaracao } from './types';
import { VARIANTES } from './variantes';
import styles from './Organizador.module.css';

type FaseLocal = 'inicializando' | 'reconectando' | 'setup' | 'sala' | 'embaralhando' | 'jogo';

const MINIMO_JOGADORES = 2;
const TROFEUS_NO_POTE = 3;
/**
 * Generoso de propósito (default do SDK não documentado/inspecionado) —
 * cobre bloquear/desbloquear a tela ou um reload rápido sem derrubar a
 * sessão do jogador. Custo de um valor alto: um jogador que realmente saiu
 * fica com a vaga "reservada" por até esse tempo — aceitável no contexto
 * (célula, jogo casual, poucas pessoas).
 */
const RECONNECT_GRACE_PERIOD_MS = 120_000;

// Mesma convenção de src/multiplayer/quemSouEu/Organizador.tsx.
const DOMINIO_PUBLICO = 'https://projeto-celula.vercel.app';

function linkConvite(): string {
  const origem = Capacitor.isNativePlatform() ? DOMINIO_PUBLICO : window.location.origin;
  return `${origem}${window.location.pathname}?sala=${getRoomCode()}`;
}

/**
 * Publica a projeção pública + a mão de cada jogador no Playroom. `s_h4x`
 * (mão) e `s_topo` (carta real no topo da pilha) usam naming não-descritivo
 * de propósito (§2/§6.2 de docs/spicy-spec.md) — mitigação social, não
 * técnica (qualquer um pode inspecionar via devtools, isso só eleva a
 * barreira de "tropeçar sem querer" pra "abrir o console de propósito").
 */
function publicarEstado(
  estado: EstadoPartida,
  jogadores: ReturnType<typeof usePlayersList>,
  resultado: ResultadoDesafioPublico | null,
  avisoSequencia: boolean,
) {
  setState('fase', 'jogo', true);
  setState('jogadores', estado.jogadores, true);
  setState(
    'contagemMaos',
    Object.fromEntries(estado.jogadores.map((id) => [id, estado.maos[id]?.length ?? 0])),
    true,
  );
  setState('jogadorDaVezId', estado.jogadores[estado.indiceDaVez], true);
  setState('declaracaoAtual', estado.declaracaoAtual, true);
  setState('ultimoDeclaranteId', estado.ultimoDeclaranteId, true);
  setState('pilhaSpicyQtd', estado.pilhaSpicy.length, true);
  setState('s_topo', estado.pilhaSpicy.at(-1) ?? null, true);
  setState('trofeusNoPote', estado.trofeusNoPote, true);
  setState('trofeusColetados', estado.trofeusColetados, true);
  setState('jogoEncerrado', estado.jogoEncerrado, true);
  setState('worldsEndRevelada', estado.worldsEndRevelada, true);
  setState('ultimoResultado', resultado, true);
  setState('ultimaDeclaracaoForaDeSequencia', avisoSequencia, true);
  setState('pawHolderId', estado.pawHolderId, true);
  setState('ultimaJogadaEhCopia', estado.ultimaJogadaEhCopia, true);
  // Campos abaixo existem só pra reidratação do host num reload/reconexão
  // (bug real, Carlos) — `pilhaCompraQtd` também alimenta o indicador visual
  // do monte de compra. `s_monte` publica o array inteiro (não só a
  // contagem) porque `comprar()` em turno.ts inspeciona a posição exata do
  // World's End na pilha — ao contrário de `pilhaSpicy`, não dá pra
  // reconstruir com placeholder.
  setState('s_monte', estado.pilhaCompra, true);
  setState('pilhaCompraQtd', estado.pilhaCompra.length, true);
  setState('pontuacoes', estado.pontuacoes, true);
  setState('maoVaziaAguardandoTrofeu', estado.maoVaziaAguardandoTrofeu, true);
  const nomes: Record<string, string> = {};
  for (const jogador of jogadores) {
    jogador.setState('s_h4x', estado.maos[jogador.id] ?? [], true);
    nomes[jogador.id] = jogador.getState('nome') ?? jogador.id;
  }
  setState('nomes', nomes, true);
}

/** Reconstrói `maos` completo lendo o `s_h4x` (mão própria) já publicado por cada jogador — usado na reidratação. */
function lerMaosPublicadas(jogadores: ReturnType<typeof usePlayersList>): Record<string, Carta[]> {
  const maos: Record<string, Carta[]> = {};
  for (const jogador of jogadores) {
    maos[jogador.id] = (jogador.getState('s_h4x') as Carta[] | undefined) ?? [];
  }
  return maos;
}

interface ResultadoProcessamento {
  estado: EstadoPartida;
  resultado: ResultadoDesafioPublico | null;
  avisoSequencia: boolean;
}

/** Único ponto de aplicação — usado tanto pra ação do próprio host quanto pelas da caixa-postal dos participantes. */
function processarAcao(estadoAtual: EstadoPartida, jogadorId: string, acao: Acao): ResultadoProcessamento | null {
  try {
    const declaranteIdAntes = estadoAtual.ultimoDeclaranteId;
    const declaracaoAntes = estadoAtual.declaracaoAtual;
    const r = aplicarAcao(estadoAtual, jogadorId, acao);
    const resultado: ResultadoDesafioPublico | null =
      r.evento.tipo === 'desafiar'
        ? {
            declaranteId: declaranteIdAntes!,
            desafianteId: jogadorId,
            declaranteVenceu: r.evento.declaranteVenceu,
            cartaRevelada: r.evento.cartaRevelada,
            declaracaoContestada: declaracaoAntes!,
          }
        : null;
    const avisoSequencia = r.evento.tipo === 'declarar' && r.evento.avisoSequenciaQuebrada;
    return { estado: r.estado, resultado, avisoSequencia };
  } catch (e) {
    console.warn('Spicy: ação inválida recebida', jogadorId, acao, e);
    return null;
  }
}

export function Organizador() {
  const [faseLocal, setFaseLocal] = useState<FaseLocal>('inicializando');
  const [nome, setNome] = useState('');
  const [varianteId, setVarianteId] = useState<string>('nenhuma');
  const [worldsEndAtiva, setWorldsEndAtiva] = useState(false);
  // Sem default explícito na spec — assumido ligado (ajuda iniciantes sem
  // sequência combinada de antemão); toggle deixa o grupo desligar.
  const [avisoSequenciaAtivo, setAvisoSequenciaAtivo] = useState(true);
  const [estado, setEstado] = useState<EstadoPartida | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoDesafioPublico | null>(null);
  const [avisoSequenciaAtual, setAvisoSequenciaAtual] = useState(false);

  const todosJogadores = usePlayersList(true);
  const participantes = todosJogadores.filter((j) => !j.getState('ehOrganizador'));
  const totalJogadores = participantes.length + 1;

  // Conecta ao Playroom assim que o componente monta — antes só rodava no
  // clique de "Criar sala", então um reload nunca reconectava sozinho (bug
  // real, Carlos). `getState('fase')` é estado de SALA (sobrevive à
  // reconexão via permId/hash de URL do Playroom, independente deste
  // client) — se já for `'jogo'`, é reconexão de partida em andamento:
  // pula setup/sala/embaralhando direto pra reidratação (efeito abaixo).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      await insertCoin({ skipLobby: true, reconnectGracePeriod: RECONNECT_GRACE_PERIOD_MS });
      if (cancelado) return;
      myPlayer().setState('ehOrganizador', true, true);
      setFaseLocal(getState('fase') === 'jogo' ? 'reconectando' : 'setup');
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reidratação: só roda em fase 'reconectando'. Espera `usePlayersList`
  // repovoar TODOS os jogadores que a sala publicada espera antes de
  // reconstruir `EstadoPartida` — evita reidratar com a mão de alguém que
  // ainda não voltou a conectar (mão ficaria vazia por engano). Reexecuta a
  // cada mudança de `todosJogadores` até a condição fechar.
  useEffect(() => {
    if (faseLocal !== 'reconectando') return;
    const jogadoresPublicados = getState('jogadores') as string[] | undefined;
    if (!jogadoresPublicados?.length) return;
    const idsPresentes = new Set(todosJogadores.map((j) => j.id));
    if (jogadoresPublicados.some((id) => !idsPresentes.has(id))) return;

    const varianteAtivaPublicada = (getState('varianteAtiva') as string | null | undefined) ?? null;
    const dados: DadosParaReidratacao = {
      jogadores: jogadoresPublicados,
      jogadorDaVezId: getState('jogadorDaVezId') as string,
      pilhaCompra: (getState('s_monte') as Carta[] | undefined) ?? [],
      pilhaSpicyQtd: (getState('pilhaSpicyQtd') as number | undefined) ?? 0,
      topoPilhaSpicy: (getState('s_topo') as Carta | null | undefined) ?? null,
      declaracaoAtual: (getState('declaracaoAtual') as Declaracao | null | undefined) ?? null,
      ultimoDeclaranteId: (getState('ultimoDeclaranteId') as string | null | undefined) ?? null,
      maos: lerMaosPublicadas(todosJogadores),
      pontuacoes: (getState('pontuacoes') as Record<string, number> | undefined) ?? {},
      trofeusColetados: (getState('trofeusColetados') as Record<string, number> | undefined) ?? {},
      trofeusNoPote: (getState('trofeusNoPote') as number | undefined) ?? TROFEUS_NO_POTE,
      maoVaziaAguardandoTrofeu: (getState('maoVaziaAguardandoTrofeu') as string | null | undefined) ?? null,
      worldsEndRevelada: (getState('worldsEndRevelada') as boolean | undefined) ?? false,
      jogoEncerrado: (getState('jogoEncerrado') as boolean | undefined) ?? false,
      varianteAtiva: varianteAtivaPublicada,
      pawHolderId: (getState('pawHolderId') as string | null | undefined) ?? null,
      ultimaJogadaEhCopia: (getState('ultimaJogadaEhCopia') as boolean | undefined) ?? false,
    };

    const estadoReidratado = reidratarEstado(dados);
    setEstado(estadoReidratado);
    setUltimoResultado((getState('ultimoResultado') as ResultadoDesafioPublico | null | undefined) ?? null);
    setAvisoSequenciaAtual((getState('ultimaDeclaracaoForaDeSequencia') as boolean | undefined) ?? false);
    setVarianteId(varianteAtivaPublicada ?? 'nenhuma');
    setWorldsEndAtiva((getState('worldsEndAtiva') as boolean | undefined) ?? false);
    setAvisoSequenciaAtivo((getState('avisoSequenciaAtivo') as boolean | undefined) ?? true);
    setFaseLocal('jogo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseLocal, todosJogadores]);

  // Reconciliação: aplica a ação pendente (mailbox `s_acao`) de cada
  // participante — o próprio host aplica a sua direto (ver `onAcaoHost`),
  // sem passar por aqui. Precisa testar em 2+ clients reais antes de
  // considerar sólido (mesma cautela de outros hurdles de Playroom do
  // projeto — comportamento reativo do usePlayersList(true) em cadeia
  // nunca foi confirmado em device pra este padrão específico).
  useEffect(() => {
    if (!estado) return;
    let estadoAtual = estado;
    let houveMudanca = false;
    let ultimoRes: ResultadoDesafioPublico | null = null;
    let ultimoAviso = false;

    for (const jogador of todosJogadores) {
      if (jogador.id === myPlayer().id) continue;
      const acao = jogador.getState('s_acao') as Acao | undefined;
      if (!acao) continue;

      const processado = processarAcao(estadoAtual, jogador.id, acao);
      if (processado) {
        estadoAtual = processado.estado;
        ultimoRes = processado.resultado;
        ultimoAviso = processado.avisoSequencia;
        houveMudanca = true;
      }
      jogador.setState('s_acao', null, true);
    }

    if (houveMudanca) {
      setEstado(estadoAtual);
      setUltimoResultado(ultimoRes);
      setAvisoSequenciaAtual(ultimoAviso);
      publicarEstado(estadoAtual, todosJogadores, ultimoRes, ultimoAviso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todosJogadores]);

  // Conexão em si já aconteceu no mount (efeito acima) — aqui só confirma nome/settings e avança.
  const criarSala = () => {
    if (!nome.trim()) return;
    myPlayer().setState('nome', nome.trim(), true);
    setFaseLocal('sala');
  };

  /** Botão "Iniciar" só dispara a animação decorativa — a partida de verdade só monta quando ela termina (`iniciarDeVerdade`). */
  const iniciar = () => {
    if (totalJogadores < MINIMO_JOGADORES) return;
    setFaseLocal('embaralhando');
  };

  const iniciarDeVerdade = () => {
    const todosIds = [myPlayer().id, ...participantes.map((j) => j.id)];
    const varianteEscolhida = varianteId === 'nenhuma' ? null : varianteId;
    const opcoes: OpcoesPartida = { worldsEndAtiva, varianteAtiva: varianteEscolhida };
    const estadoInicial = montarEstadoInicial(todosIds, Math.random, opcoes);

    setState('varianteAtiva', varianteEscolhida, true);
    setState('worldsEndAtiva', worldsEndAtiva, true);
    setState('avisoSequenciaAtivo', avisoSequenciaAtivo, true);

    setEstado(estadoInicial);
    setUltimoResultado(null);
    setAvisoSequenciaAtual(false);
    publicarEstado(estadoInicial, todosJogadores, null, false);
    setFaseLocal('jogo');
  };

  const onAcaoHost = (acao: Acao) => {
    if (!estado) return;
    const processado = processarAcao(estado, myPlayer().id, acao);
    if (!processado) return;
    setEstado(processado.estado);
    setUltimoResultado(processado.resultado);
    setAvisoSequenciaAtual(processado.avisoSequencia);
    publicarEstado(processado.estado, todosJogadores, processado.resultado, processado.avisoSequencia);
  };

  if (faseLocal === 'inicializando' || faseLocal === 'reconectando') {
    return (
      <div className={styles.tela}>
        <div className={styles.titulo}>Reconectando…</div>
      </div>
    );
  }

  if (faseLocal === 'jogo' && estado) {
    const nomes: Record<string, string> = {};
    for (const jogador of todosJogadores) {
      nomes[jogador.id] = jogador.getState('nome') ?? jogador.id;
    }
    const projecao: ProjecaoPublica = {
      jogadores: estado.jogadores,
      contagemMaos: Object.fromEntries(estado.jogadores.map((id) => [id, estado.maos[id]?.length ?? 0])),
      jogadorDaVezId: estado.jogadores[estado.indiceDaVez],
      declaracaoAtual: estado.declaracaoAtual,
      ultimoDeclaranteId: estado.ultimoDeclaranteId,
      pilhaSpicyQtd: estado.pilhaSpicy.length,
      trofeusNoPote: estado.trofeusNoPote,
      trofeusColetados: estado.trofeusColetados,
      jogoEncerrado: estado.jogoEncerrado,
      worldsEndRevelada: estado.worldsEndRevelada,
      ultimoResultado,
      nomes,
      avisoSequenciaAtivo,
      ultimaDeclaracaoForaDeSequencia: avisoSequenciaAtual,
      varianteAtiva: estado.varianteAtiva,
      pawHolderId: estado.pawHolderId,
      ultimaJogadaEhCopia: estado.ultimaJogadaEhCopia,
    };
    return (
      <Jogo meuId={myPlayer().id} minhaMao={estado.maos[myPlayer().id] ?? []} projecao={projecao} onAcao={onAcaoHost} />
    );
  }

  return (
    <div className={styles.tela}>
      <Link to="/quebra-gelos" className={styles.voltar}>
        ←
      </Link>

      {faseLocal === 'setup' && (
        <>
          <div className={styles.titulo}>Spicy</div>
          <input
            className={styles.input}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
          />

          <div className={styles.campo}>
            <label className={styles.campoLabel}>Variante · Spice It Up!</label>
            <select className={styles.select} value={varianteId} onChange={(e) => setVarianteId(e.target.value)}>
              <option value="nenhuma">Nenhuma</option>
              {VARIANTES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>

          <label className={styles.checkboxCampo}>
            <input
              type="checkbox"
              checked={worldsEndAtiva}
              onChange={(e) => setWorldsEndAtiva(e.target.checked)}
            />
            World's End ativa — encerra a partida na hora se sair. Combinem antes.
          </label>

          <label className={styles.checkboxCampo}>
            <input
              type="checkbox"
              checked={avisoSequenciaAtivo}
              onChange={(e) => setAvisoSequenciaAtivo(e.target.checked)}
            />
            Avisar quando alguém declarar fora de sequência
          </label>

          <div className={styles.espacador} />

          <button type="button" className={styles.ctaIniciar} onClick={criarSala} disabled={!nome.trim()}>
            Criar sala
          </button>
          {!nome.trim() && <div className={styles.ajuda}>Preencha seu nome para continuar</div>}
        </>
      )}

      {faseLocal === 'sala' && (
        <>
          <div className={styles.titulo}>Sala criada</div>
          <div className={styles.subtitulo}>
            {varianteId === 'nenhuma' ? 'Nenhuma variante' : VARIANTES.find((v) => v.id === varianteId)?.nome} ·{' '}
            World's End {worldsEndAtiva ? 'ativa' : 'desligada'} · Aviso de sequência{' '}
            {avisoSequenciaAtivo ? 'ligado' : 'desligado'}
          </div>
          <div className={styles.qrBloco}>
            <QrCode valor={linkConvite()} />
          </div>
          <div className={styles.codigo} data-testid="codigo-sala">
            {getRoomCode()}
          </div>
          <div className={styles.contagemLabel}>
            {totalJogadores} JOGADOR{totalJogadores === 1 ? '' : 'ES'}
            {totalJogadores < MINIMO_JOGADORES && ` · MÍNIMO ${MINIMO_JOGADORES}`}
          </div>

          <div className={styles.participantes}>
            <div className={styles.participanteItem}>
              {nome} <span className={styles.participanteTag}>· organizador</span>
            </div>
            {participantes.length === 0 && (
              <div className={styles.vazio}>Aguardando alguém escanear o QR…</div>
            )}
            {participantes.map((jogador) => {
              const nomeJogador = jogador.getState('nome');
              return (
                <div key={jogador.id} className={styles.participanteItem}>
                  {nomeJogador ?? <span className={styles.participanteAguardando}>aguardando nome…</span>}
                </div>
              );
            })}
          </div>

          <div className={styles.espacador} />

          <button
            type="button"
            className={styles.ctaIniciar}
            onClick={iniciar}
            disabled={totalJogadores < MINIMO_JOGADORES}
          >
            Iniciar
          </button>
        </>
      )}

      {faseLocal === 'embaralhando' && (
        <div className={styles.embaralhandoTela}>
          <ShuffleAnimation onConcluido={iniciarDeVerdade} />
          <div className={styles.embaralhandoTitulo}>Embaralhando…</div>
          <div className={styles.embaralhandoSubtitulo}>
            {TROFEUS_NO_POTE} troféus{worldsEndAtiva ? ' · Fim do Mundo' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
