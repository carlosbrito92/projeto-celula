import { arrayMove } from '@dnd-kit/sortable';

/**
 * Lógica pura de reordenação por arraste — separada do wiring do dnd-kit
 * (DndContext/sensors) pra ser testável sem simular gestos de ponteiro em
 * jsdom. Os ids em ListaChips são o índice de cada item convertido pra
 * string, então mover por id é o mesmo que mover por índice.
 */
export function moverPorIndice(itens: string[], idOrigem: string, idDestino: string): string[] {
  const de = Number(idOrigem);
  const para = Number(idDestino);
  if (!Number.isInteger(de) || !Number.isInteger(para) || de === para) return itens;
  if (de < 0 || de >= itens.length || para < 0 || para >= itens.length) return itens;
  return arrayMove(itens, de, para);
}
