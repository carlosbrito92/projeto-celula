import { useCallback, useRef, useState } from 'react';

/** Nunca usar href="#id" puro — falha em alguns WebViews (docs/estilos-pregacao.md). */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** FAB aparece via IntersectionObserver quando o índice sai inteiramente da viewport. */
export function useIndiceFab() {
  const [fabVisivel, setFabVisivel] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref, não useRef + useEffect([]): a tela de Leitura renderiza um
  // estado de "carregando" antes do índice existir, então o efeito rodaria
  // uma vez com indiceRef.current === null e nunca mais — o observer nunca
  // seria anexado ao elemento real. Callback ref reanexa sempre que o nó
  // monta/desmonta, independente de retornos condicionais no componente.
  const indiceRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => setFabVisivel(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return { indiceRef, fabVisivel };
}
