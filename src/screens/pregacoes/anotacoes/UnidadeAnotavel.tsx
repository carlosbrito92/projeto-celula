import { Fragment, useRef } from 'react';
import { mesclarSegmentos } from '../../../content/segmentos';
import { capturarSelecao } from './selecao';
import { useAnotacaoContext } from './AnotacaoContext';
import styles from './UnidadeAnotavel.module.css';

interface Props {
  secaoId: string;
  unidade: string;
  texto: string;
}

/**
 * Substitui TextoComKeywords dentro de secao.corpo — mesma renderização de
 * negrito, mas também mescla destaques pessoais e captura seleção de texto
 * livre quando o modo de anotação está ativo (ver spec anotações pessoais).
 */
export function UnidadeAnotavel({ secaoId, unidade, texto }: Props) {
  const ctx = useAnotacaoContext();
  const ref = useRef<HTMLSpanElement>(null);
  const destaques = ctx?.destaquesPorUnidade(secaoId, unidade) ?? [];
  const segmentos = mesclarSegmentos(texto, destaques);

  function aoSoltarSelecao() {
    if (!ctx?.modoAnotacao || !ref.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const capturada = capturarSelecao(ref.current, range);
    if (!capturada) return;
    ctx.iniciarSelecao({ secaoId, unidade, ...capturada, rect: range.getBoundingClientRect() });
  }

  return (
    <span
      ref={ref}
      className={ctx?.modoAnotacao ? styles.anotavel : undefined}
      onMouseUp={aoSoltarSelecao}
      onTouchEnd={aoSoltarSelecao}
    >
      {segmentos.map((seg, i) => {
        const conteudo = seg.negrito ? <strong>{seg.texto}</strong> : seg.texto;
        if (!seg.destaque) {
          return <Fragment key={i}>{conteudo}</Fragment>;
        }
        const { id, temNota } = seg.destaque;
        return (
          <mark
            key={i}
            className={`${styles.destaque} ${temNota ? styles.destaqueComNota : ''}`}
            onClick={(e) => {
              if (!ctx) return;
              ctx.abrirDestaque(id, (e.target as HTMLElement).getBoundingClientRect());
            }}
          >
            {conteudo}
          </mark>
        );
      })}
    </span>
  );
}
