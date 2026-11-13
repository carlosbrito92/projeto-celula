import { useCallback, useSyncExternalStore } from 'react';
import { assinarDicas, dicaFoiVista, marcarDicaVista } from './dicasStorage';

/**
 * Visibilidade de uma dica derivada só do storage, nunca de estado local: a
 * Leitura troca a árvore inteira ao abrir/fechar o resumo (early return), e o
 * componente da dica remonta. Com estado local, uma dica dispensada voltaria.
 * `id` null = nenhuma dica nesta tela.
 */
export function useDica(id: string | null): { visivel: boolean; dispensar: () => void } {
  const visivel = useSyncExternalStore(assinarDicas, () => id !== null && !dicaFoiVista(id));
  const dispensar = useCallback(() => {
    if (id !== null) marcarDicaVista(id);
  }, [id]);
  return { visivel, dispensar };
}
