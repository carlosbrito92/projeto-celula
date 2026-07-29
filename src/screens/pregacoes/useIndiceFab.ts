import { useEffect, useRef, useState } from 'react';

/** Nunca usar href="#id" puro — falha em alguns WebViews (docs/estilos-pregacao.md). */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** FAB aparece via IntersectionObserver quando o índice sai da viewport. */
export function useIndiceFab() {
  const indiceRef = useRef<HTMLDivElement>(null);
  const [fabVisivel, setFabVisivel] = useState(false);

  useEffect(() => {
    const el = indiceRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFabVisivel(!entry.isIntersecting),
      { rootMargin: '0px 0px -80% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { indiceRef, fabVisivel };
}
