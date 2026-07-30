/**
 * Resolve os rótulos de exibição dos participantes a partir da quantidade
 * informada e dos nomes opcionais (ordem física real de passagem, decidida
 * pelo líder — docs/spec-privacidade-sorteio.md). Nomes ausentes/insuficientes
 * viram "Participante N", nunca quebrando por falta de nome.
 */
export function resolverParticipantes(quantidade: number, nomes: string[] = []): string[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const nome = nomes[i]?.trim();
    return nome || `Participante ${i + 1}`;
  });
}
