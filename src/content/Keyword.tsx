import { Fragment } from 'react';
import { mesclarSegmentos } from './segmentos';
import styles from './Keyword.module.css';

/** Renderiza texto com palavras-chave marcadas `**assim**` em destaque. */
export function TextoComKeywords({ texto }: { texto: string }) {
  const segmentos = mesclarSegmentos(texto);

  return (
    <>
      {segmentos.map((seg, i) => (
        <Fragment key={i}>
          {seg.negrito ? (
            <strong className={styles.keyword}>{seg.texto}</strong>
          ) : (
            seg.texto
          )}
        </Fragment>
      ))}
    </>
  );
}
