import { useState } from 'react';
import { Link } from '../../router/Router';
import { Icon } from '../../icons/Icon';
import { limparDicasVistas } from '../../onboarding/dicasStorage';
import { CARDS_COMO_USAR } from './comoUsar';
import styles from './ComoUsar.module.css';

export function ComoUsar() {
  const [dicasLimpas, setDicasLimpas] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.cabecalho}>
        <Link to="/" className={styles.voltar}>
          <span aria-hidden="true">←</span>
          <span className={styles.srOnly}>Voltar</span>
        </Link>
        <h1 className={styles.titulo}>Como usar</h1>
      </div>

      <div className={styles.cards}>
        {CARDS_COMO_USAR.map((card) => (
          <article key={card.id} className={styles.card} aria-labelledby={`como-usar-${card.id}`}>
            <div className={styles.cardTopo}>
              <span className={styles.icone} aria-hidden="true">
                <Icon name={card.icone} />
              </span>
              <h2 id={`como-usar-${card.id}`} className={styles.cardTitulo}>
                {card.titulo}
              </h2>
            </div>
            <ul className={styles.passos}>
              {card.passos.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className={styles.rodape}>
        <button
          type="button"
          className={styles.reverDicas}
          onClick={() => {
            limparDicasVistas();
            setDicasLimpas(true);
          }}
        >
          Rever as dicas
        </button>
        <p className={styles.confirmacao} role="status">
          {dicasLimpas ? 'Pronto. As dicas aparecem de novo na próxima pregação que você abrir.' : ''}
        </p>
      </div>
    </div>
  );
}
