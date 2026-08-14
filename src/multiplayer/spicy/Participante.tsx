import { useEffect, useRef, useState } from 'react';
import { insertCoin, myPlayer, useMultiplayerState } from 'playroomkit';
import type { Acao } from './acao';
import { Jogo, type ProjecaoPublica, type ResultadoDesafioPublico } from './Jogo';
import type { Carta, Declaracao } from './types';
import styles from './Participante.module.css';

/** Mesmo valor de `Organizador.tsx` (não compartilhado — é um número só, não vale a pena importar entre os dois). */
const RECONNECT_GRACE_PERIOD_MS = 120_000;

export function Participante() {
  const [entrou, setEntrou] = useState(false);
  const [nomeEnviado, setNomeEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const entrandoRef = useRef(false);

  const [fase] = useMultiplayerState('fase', 'sala');
  const [jogadores] = useMultiplayerState<string[]>('jogadores', []);
  const [contagemMaos] = useMultiplayerState<Record<string, number>>('contagemMaos', {});
  const [jogadorDaVezId] = useMultiplayerState('jogadorDaVezId', '');
  const [declaracaoAtual] = useMultiplayerState<Declaracao | null>('declaracaoAtual', null);
  const [ultimoDeclaranteId] = useMultiplayerState<string | null>('ultimoDeclaranteId', null);
  const [pilhaSpicyQtd] = useMultiplayerState('pilhaSpicyQtd', 0);
  const [pilhaCompraQtd] = useMultiplayerState('pilhaCompraQtd', 0);
  const [trofeusNoPote] = useMultiplayerState('trofeusNoPote', 3);
  const [trofeusColetados] = useMultiplayerState<Record<string, number>>('trofeusColetados', {});
  const [pontuacoes] = useMultiplayerState<Record<string, number>>('pontuacoes', {});
  const [declaradoEm] = useMultiplayerState<number | null>('declaradoEm', null);
  const [jogoEncerrado] = useMultiplayerState('jogoEncerrado', false);
  const [worldsEndRevelada] = useMultiplayerState('worldsEndRevelada', false);
  const [ultimoResultado] = useMultiplayerState<ResultadoDesafioPublico | null>('ultimoResultado', null);
  const [avisoSequenciaAtivo] = useMultiplayerState('avisoSequenciaAtivo', true);
  const [ultimaDeclaracaoForaDeSequencia] = useMultiplayerState('ultimaDeclaracaoForaDeSequencia', false);
  const [nomes] = useMultiplayerState<Record<string, string>>('nomes', {});
  const [varianteAtiva] = useMultiplayerState<string | null>('varianteAtiva', null);
  const [pawHolderId] = useMultiplayerState<string | null>('pawHolderId', null);
  const [ultimaJogadaEhCopia] = useMultiplayerState('ultimaJogadaEhCopia', false);

  useEffect(() => {
    if (entrandoRef.current) return;
    entrandoRef.current = true;
    const sala = new URLSearchParams(window.location.search).get('sala') ?? undefined;
    insertCoin({ skipLobby: true, roomCode: sala, reconnectGracePeriod: RECONNECT_GRACE_PERIOD_MS }).then(() => {
      setEntrou(true);
      // Reconexão (permId persistido) — nome já foi enviado antes do reload/suspensão, não redigita.
      const nomeSalvo = myPlayer().getState('nome') as string | undefined;
      if (nomeSalvo) {
        setNome(nomeSalvo);
        setNomeEnviado(true);
      }
    });
  }, []);

  if (!entrou) {
    return (
      <div className={styles.tela}>
        <div className={styles.cartaoCentral}>
          <div className={styles.entrandoTitulo}>Entrando na sala…</div>
          <div className={styles.barraProgresso}>
            <div className={styles.barraProgressoPreenchida} />
          </div>
        </div>
      </div>
    );
  }

  if (!nomeEnviado) {
    return (
      <div className={styles.tela}>
        <form
          className={styles.cartaoCentral}
          onSubmit={(e) => {
            e.preventDefault();
            if (!nome.trim()) return;
            myPlayer().setState('nome', nome.trim(), true);
            setNomeEnviado(true);
          }}
        >
          <h1 className={styles.titulo}>Spicy</h1>
          <input
            className={styles.input}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            autoFocus
          />
          <button type="submit" className={styles.cta}>
            Confirmar
          </button>
        </form>
      </div>
    );
  }

  if (fase !== 'jogo') {
    return (
      <div className={styles.tela}>
        <div className={styles.cartaoCentral}>
          <div className={styles.entrandoTitulo}>Aguardando o organizador iniciar…</div>
        </div>
      </div>
    );
  }

  // Não é hook — lê o valor corrente a cada re-render (disparado pelos
  // useMultiplayerState acima, ex: jogadorDaVezId muda a cada ação). Mesmo
  // padrão de quemSouEu/Participante.tsx pro campo `papel`.
  const minhaMao = (myPlayer().getState('s_h4x') as Carta[] | undefined) ?? [];

  const projecao: ProjecaoPublica = {
    jogadores,
    contagemMaos,
    jogadorDaVezId,
    declaracaoAtual,
    ultimoDeclaranteId,
    pilhaSpicyQtd,
    pilhaCompraQtd,
    trofeusNoPote,
    trofeusColetados,
    pontuacoes,
    jogoEncerrado,
    worldsEndRevelada,
    ultimoResultado,
    declaradoEm,
    nomes,
    avisoSequenciaAtivo,
    ultimaDeclaracaoForaDeSequencia,
    varianteAtiva,
    pawHolderId,
    ultimaJogadaEhCopia,
  };

  const enviarAcao = (acao: Acao) => {
    myPlayer().setState('s_acao', acao, true);
  };

  return <Jogo meuId={myPlayer().id} minhaMao={minhaMao} projecao={projecao} onAcao={enviarAcao} />;
}
