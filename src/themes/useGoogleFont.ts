import { useEffect } from 'react';

// Contagem de referências por URL — várias ThemeScope podem usar o mesmo
// tema (ex: vários cards da mesma série na Biblioteca); só remove o <link>
// quando o último consumidor desmonta.
const refCounts = new Map<string, number>();
const linkElements = new Map<string, HTMLLinkElement>();

/** Injeta (ou reaproveita) um <link> de Google Fonts enquanto o componente estiver montado. */
export function useGoogleFont(url: string | undefined): void {
  useEffect(() => {
    if (!url) return;

    const count = refCounts.get(url) ?? 0;
    refCounts.set(url, count + 1);

    if (!linkElements.has(url)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      linkElements.set(url, link);
    }

    return () => {
      const remaining = (refCounts.get(url) ?? 1) - 1;
      refCounts.set(url, remaining);
      if (remaining <= 0) {
        linkElements.get(url)?.remove();
        linkElements.delete(url);
        refCounts.delete(url);
      }
    };
  }, [url]);
}
