import { createContext, useContext } from 'react';
import type { ProblemaValidacao } from '../../../content/validarPregacao';
import type { Caminho } from '../../../editorial/caminho';
import type { Conteudo } from '../../../editorial/modelo';

export interface ContextoEditor {
  conteudo: Conteudo;
  definir: (caminho: Caminho, valor: unknown) => void;
  aplicar: (f: (c: Conteudo) => Conteudo) => void;
  /** Erros do validador, já filtrados para exibição (vazio até o líder pedir para ver as pendências). */
  erros: ProblemaValidacao[];
}

export const EditorContext = createContext<ContextoEditor | null>(null);

export function useEditor(): ContextoEditor {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor fora do EditorContext');
  return ctx;
}

/** Erros do próprio campo e de itens dentro dele (`itens[2]` cai no campo `itens`). */
export function errosDoCampo(erros: ProblemaValidacao[], caminho: string): ProblemaValidacao[] {
  return erros.filter((e) => e.caminho === caminho || e.caminho.startsWith(`${caminho}[`));
}
