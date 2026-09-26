import type { Bloco } from './types';
import { UnidadeAnotavel } from '../screens/pregacoes/anotacoes/UnidadeAnotavel';
import { ComponenteTemaRenderer } from './ComponenteTemaRenderer';
import { TextoComKeywords } from './Keyword';
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

    case 'subtitulo':
      return <h3 className={styles.subtitulo}>{bloco.texto}</h3>;

    case 'citacao':
      return (
        <blockquote className={styles.citacao}>
          <div className={styles.citacaoTexto}>
            “<TextoComKeywords texto={bloco.texto} />”
          </div>
          <div className={styles.citacaoAutor}>— {bloco.autor}</div>
        </blockquote>
      );

    case 'glossario':
      return (
        <div className={styles.glossario}>
          <div className={styles.glossarioTermo}>{bloco.termo}</div>
          <div className={styles.glossarioEtimologia}>
            <TextoComKeywords texto={bloco.etimologia} />
          </div>
          <div className={styles.glossarioSignificado}>
            <TextoComKeywords texto={bloco.significado_no_texto} />
          </div>
          {bloco.uso_indevido && (
            <div className={styles.glossarioUsoIndevido}>
              <span className={styles.glossarioUsoIndevidoLabel}>Uso indevido comum</span>
              <TextoComKeywords texto={bloco.uso_indevido} />
            </div>
          )}
        </div>
      );

    case 'pergunta':
      return (
        <div className={styles.pergunta}>
          <TextoComKeywords texto={bloco.texto} />
        </div>
      );

    case 'resposta':
      return (
        <div className={styles.resposta}>
          <TextoComKeywords texto={bloco.texto} />
        </div>
      );

    default:
      return null;
  }
}
