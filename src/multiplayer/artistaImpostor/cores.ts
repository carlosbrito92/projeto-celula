/**
 * Paleta fixa pra identificar participante por cor ao longo da partida
 * (Artista Impostor, V2) — referência tanto pra votação digital quanto pra
 * apontar fisicamente, útil quando nomes são difíceis de lembrar/pronunciar.
 * Atribuição é por índice de ordem de entrada, não sorteio (`corPorIndice`
 * é determinística: mesmo índice, mesma cor, sempre).
 */
export const PALETA_PARTICIPANTES: string[] = [
  '#e8720c', // laranja
  '#3dd68c', // verde
  '#f03e8a', // rosa
  '#4a9ef5', // azul
  '#f0b84a', // amarelo
  '#b86ee8', // roxo
  '#e85a4a', // vermelho
  '#4ae8d0', // ciano
];

export function corPorIndice(indice: number): string {
  return PALETA_PARTICIPANTES[indice % PALETA_PARTICIPANTES.length];
}
