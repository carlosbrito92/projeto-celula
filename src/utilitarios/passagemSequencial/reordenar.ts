/**
 * Reordenação por seta (não mais arraste — @dnd-kit/sortable testado em
 * device real e não funcionou de forma confiável em touch; ver hurdle em
 * CLAUDE.md). Lógica pura, separada da UI, mesmo padrão de shuffle.ts/
 * resolverParticipantes.ts.
 */
export function moverPorIndice(itens: string[], indiceOrigem: number, indiceDestino: number): string[] {
  if (
    !Number.isInteger(indiceOrigem) ||
    !Number.isInteger(indiceDestino) ||
    indiceOrigem === indiceDestino ||
    indiceOrigem < 0 ||
    indiceOrigem >= itens.length ||
    indiceDestino < 0 ||
    indiceDestino >= itens.length
  ) {
    return itens;
  }
  const copia = [...itens];
  const [removido] = copia.splice(indiceOrigem, 1);
  copia.splice(indiceDestino, 0, removido);
  return copia;
}
