import { useEffect, useRef, useState } from 'react';
import { insertCoin, myPlayer, useMultiplayerState } from 'playroomkit';
import { useCountdown } from './useCountdown';
import styles from './Participante.module.css';

// 7s (não 3s) — feedback de usuário: 3s era curto demais em aparelhos mais
// lentos pra dar tempo de ler "coloque na testa" e se posicionar.
const SEGUNDOS_CONTAGEM = 7;

// -90deg confirmado em device físico (2026-08-06), mas depende de como o
// aparelho é segurado — feedback de usuário: em outro device/orientação
// ficou errado. Botão de girar (outra pessoa aperta, não o dono, que está
// com o celular na própria testa sem ver a tela) cicla entre as 4 opções.
const ROTACOES = [-90, 0, 90, 180] as const;

export function Participante() {
  const [entrou, setEntrou] = useState(false);
  const [nomeEnviado, setNomeEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const [jogoIniciado] = useMultiplayerState('jogoIniciado', false);
  const { fase, restante } = useCountdown(SEGUNDOS_CONTAGEM, jogoIniciado);
  const [rotacaoIndex, setRotacaoIndex] = useState(0);
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

  if (fase === 'aguardando') {
    return <div className={styles.tela}>Aguardando o organizador iniciar…</div>;
  }

  if (fase === 'contagem') {
    return (
      <div className={styles.tela}>
        <p className={styles.texto}>Coloque o celular na sua testa…</p>
        <div className={styles.contagemNumero}>{restante}</div>
      </div>
    );
  }

  const valor = myPlayer().getState('valor');
  return (
    <div className={styles.telaRevelacao}>
      <div
        className={styles.valorRevelado}
        style={{ transform: `rotate(${ROTACOES[rotacaoIndex]}deg)` }}
      >
        {valor}
      </div>
      <button
        type="button"
        className={styles.botaoRotacionar}
        onClick={() => setRotacaoIndex((i) => (i + 1) % ROTACOES.length)}
        aria-label="Girar texto"
      >
        ⟳
      </button>
    </div>
  );
}
