import type { Anotacao } from './types';
import styles from './AnnotationBox.module.css';

export function AnnotationBox({ anotacao }: { anotacao: Anotacao }) {
  return (
    <div className={styles.box}>
      <span aria-hidden="true">✎ </span>
      <span className={styles.autor}>{anotacao.autor}: </span>
      <span className={styles.texto}>{anotacao.texto}</span>
    </div>
  );
}
