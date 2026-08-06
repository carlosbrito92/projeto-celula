import { useEffect, useRef, useState } from 'react';
import { insertCoin, myPlayer, useMultiplayerState } from 'playroomkit';
import { useCountdown } from './useCountdown';

const SEGUNDOS_CONTAGEM = 3;

export function Participante() {
  const [entrou, setEntrou] = useState(false);
  const [nomeEnviado, setNomeEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const [jogoIniciado] = useMultiplayerState('jogoIniciado', false);
  const { fase, restante } = useCountdown(SEGUNDOS_CONTAGEM, jogoIniciado);
  const entrandoRef = useRef(false);

  // Guarda por ref: StrictMode roda efeitos 2x em dev, e insertCoin() não
  // pode ser chamado duas vezes pro mesmo tab (criaria join duplicado).
  useEffect(() => {
    if (entrandoRef.current) return;
    entrandoRef.current = true;
    const sala = new URLSearchParams(window.location.search).get('sala') ?? undefined;
    insertCoin({ skipLobby: true, roomCode: sala }).then(() => setEntrou(true));
  }, []);

  if (!entrou) {
    return <div style={{ padding: 24 }}>Entrando na sala…</div>;
  }

  if (!nomeEnviado) {
    return (
      <form
        style={{ padding: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim()) return;
          myPlayer().setState('nome', nome.trim(), true);
          setNomeEnviado(true);
        }}
      >
        <h1>Qual seu nome?</h1>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          autoFocus
        />
        <button type="submit">Confirmar</button>
      </form>
    );
  }

  if (fase === 'aguardando') {
    return <div style={{ padding: 24 }}>Aguardando o organizador iniciar…</div>;
  }

  if (fase === 'contagem') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Coloque o celular na sua testa…</p>
        <div style={{ fontSize: 64 }}>{restante}</div>
      </div>
    );
  }

  const valor = myPlayer().getState('valor');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Direção confirmada em device físico (2026-08-06) — rotate(90deg)
        // saía ilegível pra quem olha de frente, -90deg é o certo.
        transform: 'rotate(-90deg)',
        transformOrigin: 'center center',
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>
        {valor}
      </div>
    </div>
  );
}
