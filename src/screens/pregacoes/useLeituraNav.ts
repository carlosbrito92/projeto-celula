import { useEffect, useRef, useState } from 'react';

/** Nunca usar href="#id" puro — falha em alguns WebViews (docs/estilos-pregacao.md). */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Substitui o antigo `useIndiceFab` — em vez de um botão flutuante condicional,
 * a Leitura Contínua precisa saber a qualquer momento qual seção ocupa a maior
 * parte da viewport, pra destacar o chip certo na trilha sticky e calcular o
 * alvo do nav inferior (anterior/próximo). Um único IntersectionObserver com
 * múltiplos degraus de threshold observa todos os ids passados; a cada
 * callback, o id com maior intersectionRatio (entre os que estão
 * intersectando) vira o índice ativo.
 *
 * `ids` é lido via `join('|')` como dependência do efeito — a lista de ids
 * (seções da pregação) é estável entre renders da mesma pregação carregada,
 * mas muda de [] para a lista real assim que `usePregacao` resolve.
 *
 * `chaveRemontagem` é um segundo gatilho opcional para o efeito, independente
 * do conteúdo de `ids`: cobre o caso em que a árvore que contém os elementos
 * observados desmonta e remonta (ex: `ResumoCurtoOverlay` da Leitura substitui
 * o conteúdo principal por completo, depois volta) sem que a lista de ids em
 * si mude. Sem esse gatilho, o efeito nunca reexecuta (`ids.join('|')`
 * idêntico), o observer antigo fica apontando para nós de DOM já removidos, e
 * a trilha/nav inferior congelam no último `ativoIndex` até a pregação ser
 * recarregada do zero. Achado real: 2026-08-19, ao adicionar o overlay de
 * resumo_curto.
 */
export function useSecaoAtiva(ids: string[], chaveRemontagem: unknown = null): number {
  const [ativoIndex, setAtivoIndex] = useState(0);
  const ratiosRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (ids.length === 0) return;

    const elementos = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elementos.length === 0) return;

    ratiosRef.current = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratiosRef.current.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }

        let maiorId: string | null = null;
        let maiorRatio = 0;
        for (const [id, ratio] of ratiosRef.current) {
          if (ratio > maiorRatio) {
            maiorRatio = ratio;
            maiorId = id;
          }
        }

        if (maiorId) {
          const index = ids.indexOf(maiorId);
          if (index !== -1) setAtivoIndex(index);
        }
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    elementos.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|'), chaveRemontagem]);

  return ativoIndex;
}

/**
 * Progresso de leitura (0–100) pela posição de scroll do documento. Listener
 * de scroll passivo + requestAnimationFrame — não setInterval, mesma lição já
 * registrada em CLAUDE.md sobre bateria/WebView Capacitor (polling do Artista
 * Impostor): rAF sincroniza com a taxa de tela e pausa sozinho fora de foco.
 */
export function useScrollProgress(): number {
  const [progresso, setProgresso] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const calcular = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      setProgresso(max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0);
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(calcular);
      }
    };

    calcular();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return progresso;
}
