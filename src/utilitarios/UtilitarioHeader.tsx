import styles from './UtilitarioHeader.module.css';

/** Header compartilhado pelos 3 widgets: rótulo mono + fechar — docs/mock-aprovado-v2.html §Utilitários. */
export function UtilitarioHeader({ rotulo, aoFechar }: { rotulo: string; aoFechar: () => void }) {
  return (
    <div className={styles.header}>
      <div className={styles.rotulo}>{rotulo}</div>
      <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
        ✕
      </button>
    </div>
  );
}
