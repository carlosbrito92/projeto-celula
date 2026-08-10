import { useEffect, useRef, useState } from 'react';
import { insertCoin, myPlayer, useMultiplayerState } from 'playroomkit';
import type { Acao } from './acao';
import { Jogo, type ProjecaoPublica, type ResultadoDesafioPublico } from './Jogo';
import type { Carta, Declaracao } from './types';
import styles from './Participante.module.css';

export function Participante() {
  const [entrou, setEntrou] = useState(false);
  const [nomeEnviado, setNomeEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const entrandoRef = useRef(false);

  const [fase] = useMultiplayerState('fase', 'sala');
  const [jogadorDaVezId] = useMultiplayerState('jogadorDaVezId', '');
  const [declaracaoAtual] = useMultiplayerState<Declaracao | null>('declaracaoAtual', null);
  const [pilhaSpicyQtd] = useMultiplayerState('pilhaSpicyQtd', 0);
  const [trofeusNoPote] = useMultiplayerState('trofeusNoPote', 3);
  const [trofeusColetados] = useMultiplayerState<Record<string, number>>('trofeusColetados', {});
  const [jogoEncerrado] = useMultiplayerState('jogoEncerrado', false);
  const [worldsEndRevelada] = useMultiplayerState('worldsEndRevelada', false);
  const [ultimoResultado] = useMultiplayerState<ResultadoDesafioPublico | null>('ultimoResultado', null);
  const [avisoSequenciaAtivo] = useMultiplayerState('avisoSequenciaAtivo', true);
  const [ultimaDeclaracaoForaDeSequencia] = useMultiplayerState('ultimaDeclaracaoForaDeSequencia', false);
  const [nomes] = useMultiplayerState<Record<string, string>>('nomes', {});

  useEffect(() => {
    if (entrandoRef.current) return;
    entrandoRef.current = true;
    const sala = new URLSearchParams(window.location.search).get('sala') ?? undefined;
    insertCoin({ skipLobby: true, roomCode: sala }).then(() => setEntrou(true));
  }, []);

  if (!entrou) {
    return <div className={styles.tela}>Entrando na sala…</div>;
  }

  if (!nomeEnviado) {
    return (
      <form
        className={styles.tela}
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
    );
  }

  if (fase !== 'jogo') {
    return <div className={styles.tela}>Aguardando o organizador iniciar…</div>;
  }

  // Não é hook — lê o valor corrente a cada re-render (disparado pelos
  // useMultiplayerState acima, ex: jogadorDaVezId muda a cada ação). Mesmo
  // padrão de quemSouEu/Participante.tsx pro campo `papel`.
  const minhaMao = (myPlayer().getState('s_h4x') as Carta[] | undefined) ?? [];

  const projecao: ProjecaoPublica = {
    jogadorDaVezId,
    declaracaoAtual,
    pilhaSpicyQtd,
    trofeusNoPote,
    trofeusColetados,
    jogoEncerrado,
    worldsEndRevelada,
    ultimoResultado,
    nomes,
    avisoSequenciaAtivo,
    ultimaDeclaracaoForaDeSequencia,
  };

  const enviarAcao = (acao: Acao) => {
    myPlayer().setState('s_acao', acao, true);
  };

  return (
    <div className={styles.telaJogo}>
      <Jogo meuId={myPlayer().id} minhaMao={minhaMao} projecao={projecao} onAcao={enviarAcao} />
    </div>
  );
}
