import { createContext, useContext } from 'react';

export interface StoryContextValue {
  /** Abre o editor de imagem com o trecho (texto já sem marcação de negrito). */
  abrirStory: (trecho: { texto: string; referencia?: string }) => void;
}

// `null` = árvore sem provider (prévia do editor editorial): o botão some.
export const StoryContext = createContext<StoryContextValue | null>(null);

export function useStoryContext(): StoryContextValue | null {
  return useContext(StoryContext);
}
