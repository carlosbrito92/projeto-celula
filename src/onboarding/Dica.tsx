import styles from './Dica.module.css';

interface DicaProps {
  texto: string;
  aoEntender: () => void;
  /** Posição e seta: cada tela define por CSS ao lado do botão alvo, sem medir o DOM. */
  className?: string;
}

/** Balão não modal (sem scrim, sem foco preso). Some com "Entendi" ou quando a pessoa usa o recurso. */
export function Dica({ texto, aoEntender, className }: DicaProps) {
  return (
    <div className={`${styles.dica} ${className ?? ''}`} role="status">
      <p className={styles.texto}>{texto}</p>
      <button type="button" className={styles.entendi} onClick={aoEntender}>
        Entendi
      </button>
    </div>
  );
}
