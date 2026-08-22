import type { Bloco } from './types';
import { UnidadeAnotavel } from '../screens/pregacoes/anotacoes/UnidadeAnotavel';
import { ComponenteTemaRenderer } from './ComponenteTemaRenderer';
import styles from './BlockRenderer.module.css';

interface Props {
  bloco: Bloco;
  secaoId: string;
  blocoIndex: number;
}

export function BlockRenderer({ bloco, secaoId, blocoIndex }: Props) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return (
        <p className={styles.paragrafo}>
          <UnidadeAnotavel secaoId={secaoId} unidade={String(blocoIndex)} texto={bloco.texto} />
        </p>
      );

    case 'versiculo':
      return (
        <div className={styles.versiculo}>
          <div className={styles.versiculoTexto}>
            “<UnidadeAnotavel secaoId={secaoId} unidade={String(blocoIndex)} texto={bloco.texto} />”
          </div>
          <div className={styles.versiculoReferencia}>{bloco.referencia}</div>
        </div>
      );

    case 'callout':
      return (
        <div className={styles.callout}>
          <UnidadeAnotavel secaoId={secaoId} unidade={String(blocoIndex)} texto={bloco.texto} />
        </div>
      );

    case 'frase_chave':
      return (
        <div className={styles.fraseChave}>
          <UnidadeAnotavel secaoId={secaoId} unidade={String(blocoIndex)} texto={bloco.texto} />
        </div>
      );

    case 'lista':
      return (
        <ul className={styles.lista}>
          {bloco.itens.map((item, i) => (
            <li key={i} className={styles.listaItem}>
              <UnidadeAnotavel secaoId={secaoId} unidade={`${blocoIndex}:${i}`} texto={item} />
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
