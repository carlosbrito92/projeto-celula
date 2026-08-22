import { Fragment, useEffect, useRef } from 'react';
import { mesclarSegmentos } from '../../../content/segmentos';
import { capturarSelecao } from './selecao';
import { useAnotacaoContext } from './AnotacaoContext';
import styles from './UnidadeAnotavel.module.css';

const DEBOUNCE_MS = 300;

interface Props {
  secaoId: string;
  unidade: string;
  texto: string;
}

/**
 * Substitui TextoComKeywords dentro de secao.corpo — mesma renderização de
 * negrito, mas também mescla destaques pessoais e captura seleção de texto
 * livre quando o modo de anotação está ativo (ver spec anotações pessoais).
 *
 * Gatilho é `selectionchange` (documento inteiro, debounced) — não
 * `mouseup`/`touchend` no container. Achado real (2026-08-22, teste ao vivo
 * de Carlos): em touch, depois do toque-e-segura o usuário ajusta a seleção
 * arrastando as alças nativas do SO, que ficam fora do nosso elemento —
 * `touchend` no span nunca dispara de novo com a seleção final ajustada.
 * `selectionchange` cobre mouse e touch igual (dispara a cada ajuste de
 * alça também) — debounce evita abrir o popover a cada pixel de arraste, só
 * quando a seleção "assenta".
 */
export function UnidadeAnotavel({ secaoId, unidade, texto }: Props) {
  const ctx = useAnotacaoContext();
  const ref = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destaques = ctx?.destaquesPorUnidade(secaoId, unidade) ?? [];
  const segmentos = mesclarSegmentos(texto, destaques);
  const modoAnotacao = ctx?.modoAnotacao ?? false;

  useEffect(() => {
    if (!modoAnotacao) return;

    function aoMudarSelecao() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (!ctx || !ref.current) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const capturada = capturarSelecao(ref.current, range);
        if (!capturada) return;
        ctx.iniciarSelecao({ secaoId, unidade, ...capturada, rect: range.getBoundingClientRect() });
      }, DEBOUNCE_MS);
    }

    document.addEventListener('selectionchange', aoMudarSelecao);
    return () => {
      document.removeEventListener('selectionchange', aoMudarSelecao);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // ctx fica de fora de propósito: iniciarSelecao só fecha sobre setState
    // estável (ver Reading.tsx), uma referência "velha" de ctx aqui não
    // muda comportamento nenhum — reanexar o listener a cada render (ctx é
    // um objeto novo a cada vez) seria custo sem benefício real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoAnotacao, secaoId, unidade]);

  return (
    <span ref={ref} className={modoAnotacao ? styles.anotavel : undefined}>
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
