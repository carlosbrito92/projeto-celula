import { Fragment } from 'react';
import styles from './Keyword.module.css';

const BOLD_REGEX = /\*\*(.+?)\*\*/g;

/** Renderiza texto com palavras-chave marcadas `**assim**` em destaque. */
export function TextoComKeywords({ texto }: { texto: string }) {
  const partes: React.ReactNode[] = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  BOLD_REGEX.lastIndex = 0;
  while ((match = BOLD_REGEX.exec(texto))) {
    if (match.index > ultimoIndice) {
      partes.push(texto.slice(ultimoIndice, match.index));
    }
    partes.push(
      <strong key={match.index} className={styles.keyword}>
        {match[1]}
      </strong>,
    );
    ultimoIndice = match.index + match[0].length;
  }
  if (ultimoIndice < texto.length) {
    partes.push(texto.slice(ultimoIndice));
  }

  return (
    <>
      {partes.map((parte, i) => (
        <Fragment key={i}>{parte}</Fragment>
      ))}
    </>
  );
}
