import { useEffect, useRef, useState } from 'react';
import { insertCoin, myPlayer, useMultiplayerState } from 'playroomkit';
import { Canvas } from './Canvas';
import { Votacao } from './Votacao';
import { Resultado } from './Resultado';
import styles from './Participante.module.css';

export function Participante() {
  const [entrou, setEntrou] = useState(false);
  const [nomeEnviado, setNomeEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const [rodada] = useMultiplayerState('rodada', 0);
  const [fase] = useMultiplayerState('fase', 'sala');
  const [palavra] = useMultiplayerState('palavra', '');
  // Marca a última rodada cujo papel esse jogador já confirmou ter visto —
  // gate local (toque explícito, sem timer, mesma filosofia da passagem
  // sequencial da V1) que precisa reabrir a cada nova rodada, não só na
  // primeira (`rodada` incrementa a cada "Jogar outra rodada" do organizador).
  const [rodadaConfirmada, setRodadaConfirmada] = useState(0);
  const entrandoRef = useRef(false);

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
        <h1 className={styles.titulo}>Qual seu nome?</h1>
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

  if (rodada === 0) {
    return <div className={styles.tela}>Aguardando o organizador iniciar…</div>;
  }

  if (rodadaConfirmada !== rodada) {
    const papel = myPlayer().getState('papel');
    const souImpostor = papel === 'impostor';
    return (
      <div className={styles.tela}>
        <h1 className={styles.titulo}>{souImpostor ? 'Você é o Impostor!' : 'Seu objeto secreto'}</h1>
        <p className={styles.texto}>
          {souImpostor
            ? 'Você não sabe o que desenhar — observe os outros e finja que sabe, sem levantar suspeita.'
            : `Desenhe: ${palavra}`}
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => setRodadaConfirmada(rodada)}
        >
          Vamos desenhar
        </button>
      </div>
    );
  }

  if (fase === 'votacao') return <Votacao />;
  if (fase === 'resultado') return <Resultado />;

  return (
    <div className={styles.telaCanvas}>
      <Canvas corPropria={myPlayer().getState('cor') ?? null} />
    </div>
  );
}
