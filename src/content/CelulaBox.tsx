import type { CelulaBoxData } from './types';
import styles from './CelulaBox.module.css';

/**
 * `.celula-box` do Estilo #3 — nota de rodapé (não de header): quem anotou,
 * quem compartilha, sugestão de uso. Distinto de banner_intro.contextualizacao
 * (enquadramento de abertura). Ver docs/geracao-pregacao.md.
 */
export function CelulaBox({ dados }: { dados: CelulaBoxData | null | undefined }) {
  if (!dados) return null;
  const { anotado_por, compartilhado_por, sugestao_uso } = dados;
  if (!anotado_por && !compartilhado_por && !sugestao_uso) return null;

  return (
    <div className={styles.box}>
      <span className={styles.icone} aria-hidden="true">
        ✦
      </span>
      <p className={styles.texto}>
        {anotado_por && (
          <>
            Resumo preparado a partir das anotações de{' '}
            <strong className={styles.destaque}>{anotado_por}</strong>
          </>
        )}
        {compartilhado_por && (
          <>
            {' '}
            para compartilhamento na célula por{' '}
            <strong className={styles.destaque}>{compartilhado_por}</strong>
          </>
        )}
        {(anotado_por || compartilhado_por) && '. '}
        {sugestao_uso}
      </p>
    </div>
  );
}
