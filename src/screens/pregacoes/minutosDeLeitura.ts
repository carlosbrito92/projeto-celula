/** Estimativa de leitura do resumo, mostrada no CTA da Leitura. */
const PALAVRAS_POR_MINUTO = 200;

/** Estimativa de leitura (min, mínimo 1) a partir de todo texto do resumo. */
export function minutosDeLeitura(resumo: unknown): number {
  const palavras = JSON.stringify(resumo ?? '')
    .replace(/"[a-z_]+":/g, ' ') // nomes de campo não contam
    .split(/\s+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p)).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}
