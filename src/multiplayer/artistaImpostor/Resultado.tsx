import { usePlayersList, useMultiplayerState } from 'playroomkit';
import { apurarResultado } from './votos';
import styles from './Resultado.module.css';

interface ResultadoProps {
  /** Presente só na tela do organizador — participante só acompanha. */
  onNovaRodada?: () => void;
}

export function Resultado({ onNovaRodada }: ResultadoProps) {
  const [palavra] = useMultiplayerState('palavra', '');
  const todosJogadores = usePlayersList(true);
  const participantes = todosJogadores.filter((j) => !j.getState('ehOrganizador'));
  const impostor = participantes.find((j) => j.getState('papel') === 'impostor');

  if (!impostor) {
    return <div className={styles.wrapper}>Apurando…</div>;
  }

  const votos = participantes.map((j) => j.getState('votoEm') as string | undefined);
  const resultado = apurarResultado(votos, impostor.id);

  return (
    <div className={styles.wrapper}>
      <div className={styles.titulo}>
        {resultado.impostorEncontrado ? 'O grupo encontrou o impostor!' : 'O impostor escapou!'}
      </div>
      <div className={styles.revelacao}>
        Impostor:{' '}
        <span style={{ color: impostor.getState('cor') }}>{impostor.getState('nome')}</span>
      </div>
      {palavra && <div className={styles.palavra}>Objeto da rodada: {palavra}</div>}

      <div className={styles.contagem}>
        {participantes.map((j) => (
          <div key={j.id} className={styles.contagemItem}>
            <span style={{ color: j.getState('cor') }}>{j.getState('nome')}</span>
            <span className={styles.contagemValor}>{resultado.contagemPorId[j.id] ?? 0} voto(s)</span>
          </div>
        ))}
      </div>

      {onNovaRodada && (
        <button type="button" className={styles.ctaNovaRodada} onClick={onNovaRodada}>
          Jogar outra rodada
        </button>
      )}
    </div>
  );
}
