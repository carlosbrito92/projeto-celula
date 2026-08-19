import type { ResumoCurto } from '../../content/types';
import styles from './ResumoCurtoOverlay.module.css';

export function ResumoCurtoOverlay({
  resumo,
  aoFechar,
}: {
  resumo: ResumoCurto;
  aoFechar: () => void;
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button type="button" className={styles.voltar} onClick={aoFechar} aria-label="Voltar para a leitura completa">
          ←
        </button>
        <div className={styles.headerLabel}>Versão resumida</div>
      </div>

      <div className={styles.corpo}>
        <div className={styles.fraseTema}>{resumo.frase_tema}</div>

        <ol className={styles.pontos}>
          {resumo.pontos.map((ponto, i) => (
            <li key={i} className={styles.pontoItem}>
              <span className={styles.pontoNumero}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.pontoTexto}>{ponto}</span>
            </li>
          ))}
        </ol>

        <div className={styles.versiculoChave}>
          <div className={styles.versiculoChaveTexto}>“{resumo.versiculo_chave.texto}”</div>
          <div className={styles.versiculoChaveReferencia}>{resumo.versiculo_chave.referencia}</div>
        </div>
      </div>

      <button type="button" className={styles.ctaCompleta} onClick={aoFechar}>
        Ler a mensagem completa
      </button>
    </div>
  );
}
