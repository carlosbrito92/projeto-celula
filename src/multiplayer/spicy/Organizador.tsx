import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getRoomCode, insertCoin, myPlayer, setState, usePlayersList } from 'playroomkit';
import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { PADRAO_MINC } from '../../themes/registry';
import { QrCode } from '../quemSouEu/QrCode';
import { aplicarAcao, type Acao } from './acao';
import { Jogo, type ProjecaoPublica, type ResultadoDesafioPublico } from './Jogo';
import { montarEstadoInicial, type EstadoPartida, type OpcoesPartida } from './turno';
import { VARIANTES } from './variantes';
import styles from './Organizador.module.css';

type FaseLocal = 'setup' | 'sala' | 'jogo';

const MINIMO_JOGADORES = 2;

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
  setState('jogadorDaVezId', estado.jogadores[estado.indiceDaVez], true);
  setState('declaracaoAtual', estado.declaracaoAtual, true);
  setState('pilhaSpicyQtd', estado.pilhaSpicy.length, true);
  setState('s_topo', estado.pilhaSpicy.at(-1) ?? null, true);
  setState('trofeusNoPote', estado.trofeusNoPote, true);
  setState('trofeusColetados', estado.trofeusColetados, true);
  setState('jogoEncerrado', estado.jogoEncerrado, true);
  setState('worldsEndRevelada', estado.worldsEndRevelada, true);
  setState('ultimoResultado', resultado, true);
  setState('ultimaDeclaracaoForaDeSequencia', avisoSequencia, true);
  const nomes: Record<string, string> = {};
  for (const jogador of jogadores) {
    jogador.setState('s_h4x', estado.maos[jogador.id] ?? [], true);
    nomes[jogador.id] = jogador.getState('nome') ?? jogador.id;
  }
  setState('nomes', nomes, true);
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
    const r = aplicarAcao(estadoAtual, jogadorId, acao);
    const resultado: ResultadoDesafioPublico | null =
      r.evento.tipo === 'desafiar'
        ? {
            declaranteId: declaranteIdAntes!,
            desafianteId: jogadorId,
            declaranteVenceu: r.evento.declaranteVenceu,
            cartaRevelada: r.evento.cartaRevelada,
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
  const [faseLocal, setFaseLocal] = useState<FaseLocal>('setup');
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

  const criarSala = async () => {
    if (!nome.trim()) return;
    await insertCoin({ skipLobby: true });
    myPlayer().setState('ehOrganizador', true, true);
    myPlayer().setState('nome', nome.trim(), true);
    setFaseLocal('sala');
  };

  const iniciar = () => {
    if (totalJogadores < MINIMO_JOGADORES) return;
    const todosIds = [myPlayer().id, ...participantes.map((j) => j.id)];
    const opcoes: OpcoesPartida = { worldsEndAtiva };
    const estadoInicial = montarEstadoInicial(todosIds, Math.random, opcoes);

    setState('varianteAtiva', varianteId === 'nenhuma' ? null : varianteId, true);
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

  if (faseLocal === 'jogo' && estado) {
    const nomes: Record<string, string> = {};
    for (const jogador of todosJogadores) {
      nomes[jogador.id] = jogador.getState('nome') ?? jogador.id;
    }
    const projecao: ProjecaoPublica = {
      jogadorDaVezId: estado.jogadores[estado.indiceDaVez],
      declaracaoAtual: estado.declaracaoAtual,
      pilhaSpicyQtd: estado.pilhaSpicy.length,
      trofeusNoPote: estado.trofeusNoPote,
      trofeusColetados: estado.trofeusColetados,
      jogoEncerrado: estado.jogoEncerrado,
      worldsEndRevelada: estado.worldsEndRevelada,
      ultimoResultado,
      nomes,
      avisoSequenciaAtivo,
      ultimaDeclaracaoForaDeSequencia: avisoSequenciaAtual,
    };
    return (
      <Jogo meuId={myPlayer().id} minhaMao={estado.maos[myPlayer().id] ?? []} projecao={projecao} onAcao={onAcaoHost} />
    );
  }

  return (
    <ThemeScope tema={PADRAO_MINC} className={styles.shell}>
      <div className={styles.wrapper}>
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

            <label className={styles.campo}>
              Variante "Spice It Up!"
              <select value={varianteId} onChange={(e) => setVarianteId(e.target.value)}>
                <option value="nenhuma">Nenhuma</option>
                {VARIANTES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.checkboxCampo}>
              <input
                type="checkbox"
                checked={worldsEndAtiva}
                onChange={(e) => setWorldsEndAtiva(e.target.checked)}
              />
              World's End ativa (encerra a partida na hora se sair — combinem antes)
            </label>

            <label className={styles.checkboxCampo}>
              <input
                type="checkbox"
                checked={avisoSequenciaAtivo}
                onChange={(e) => setAvisoSequenciaAtivo(e.target.checked)}
              />
              Avisar quando alguém declarar fora de sequência
            </label>

            <button type="button" className={styles.ctaIniciar} onClick={criarSala} disabled={!nome.trim()}>
              Criar sala
            </button>
          </>
        )}

        {faseLocal === 'sala' && (
          <>
            <div className={styles.titulo}>Sala criada</div>
            <div className={styles.subtitulo}>
              Variante: {varianteId === 'nenhuma' ? 'nenhuma' : VARIANTES.find((v) => v.id === varianteId)?.nome} ·
              World's End: {worldsEndAtiva ? 'ativa' : 'desligada'} · Aviso de sequência:{' '}
              {avisoSequenciaAtivo ? 'ligado' : 'desligado'}
            </div>
            <div className={styles.qrBloco}>
              <QrCode valor={linkConvite()} />
            </div>
            <div className={styles.codigo}>
              Código <span className={styles.codigoValor} data-testid="codigo-sala">{getRoomCode()}</span>
            </div>

            <div className={styles.participantes}>
              <div className={styles.participantesLabel}>
                {totalJogadores} jogador(es) — {nome} (você)
                {totalJogadores < MINIMO_JOGADORES && ` — mínimo ${MINIMO_JOGADORES}`}
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
      </div>
    </ThemeScope>
  );
}
