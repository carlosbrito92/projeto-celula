/** Formata segundos totais como "m:ss" (ex: 45 -> "0:45", 125 -> "2:05"). */
export function formatarTempo(segundosTotais: number): string {
  const seguro = Math.max(0, Math.round(segundosTotais));
  const minutos = Math.floor(seguro / 60);
  const segundos = seguro % 60;
  return `${minutos}:${String(segundos).padStart(2, '0')}`;
}
