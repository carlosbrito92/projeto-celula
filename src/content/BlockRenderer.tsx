import type { Bloco } from './types';
import { TextoComKeywords } from './Keyword';
import { ComponenteTemaRenderer } from './ComponenteTemaRenderer';
import styles from './BlockRenderer.module.css';

export function BlockRenderer({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return (
        <p className={styles.paragrafo}>
          <TextoComKeywords texto={bloco.texto} />
        </p>
      );

    case 'versiculo':
      return (
        <div className={styles.versiculo}>
          <div className={styles.versiculoTexto}>“{bloco.texto}”</div>
          <div className={styles.versiculoReferencia}>{bloco.referencia}</div>
        </div>
      );

    case 'callout':
      return (
        <div className={styles.callout}>
          <TextoComKeywords texto={bloco.texto} />
        </div>
      );

    case 'frase_chave':
      return (
        <div className={styles.fraseChave}>
          <TextoComKeywords texto={bloco.texto} />
        </div>
      );

    case 'lista':
      return (
        <ul className={styles.lista}>
          {bloco.itens.map((item, i) => (
            <li key={i} className={styles.listaItem}>
              <TextoComKeywords texto={item} />
            </li>
          ))}
        </ul>
      );

    case 'componente_tema':
      return <ComponenteTemaRenderer bloco={bloco} />;

    default:
      return null;
  }
}
