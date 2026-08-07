import { myPlayer, usePlayersList } from 'playroomkit';
import styles from './Votacao.module.css';

/**
 * Votação digital opcional (Artista Impostor, V2) — cada participante toca
 * na cor/nome de quem acha impostor, no próprio celular. `votoEm` é
 * individual (`myPlayer().setState`), nunca exibido publicamente aqui —
 * só o resultado agregado aparece em `Resultado.tsx`.
 */
export function Votacao() {
  const todosJogadores = usePlayersList(true);
  const participantes = todosJogadores.filter((j) => !j.getState('ehOrganizador'));
  const eu = myPlayer();
  const votoAtual = eu.getState('votoEm');

  return (
    <div className={styles.wrapper}>
      <div className={styles.titulo}>Quem é o impostor?</div>
      <div className={styles.subtitulo}>
        {votoAtual
          ? 'Voto registrado — pode trocar se mudar de ideia.'
          : 'Toque em alguém, ou combinem a votação na conversa mesmo.'}
      </div>
      <div className={styles.lista}>
        {participantes
          .filter((j) => j.id !== eu.id)
          .map((j) => {
            const nome = j.getState('nome') ?? '—';
            const cor = j.getState('cor') ?? '#888';
            const selecionado = votoAtual === j.id;
            return (
              <button
                key={j.id}
                type="button"
                className={selecionado ? `${styles.item} ${styles.itemSelecionado}` : styles.item}
                style={{ borderColor: cor }}
                onClick={() => eu.setState('votoEm', j.id, true)}
              >
                <span className={styles.bolinha} style={{ background: cor }} />
                {nome}
              </button>
            );
          })}
      </div>
    </div>
  );
}
