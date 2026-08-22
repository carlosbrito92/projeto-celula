// Mescla marcação **negrito** (Keyword.tsx original) com destaques pessoais
// (grifos de anotação, coordenadas em texto renderizado/limpo, sem `**`) num
// único array de segmentos pra renderizar. Ver spec de anotações pessoais —
// destaque pode cair total/parcialmente dentro de um trecho em negrito.

export interface SpanTexto {
  inicio: number;
  fim: number;
}

export interface DestaqueSpan extends SpanTexto {
  id: string;
  temNota: boolean;
}

export interface SegmentoTexto {
  texto: string;
  negrito: boolean;
  destaque: DestaqueSpan | null;
}

const BOLD_REGEX = /\*\*(.+?)\*\*/g;

/** Remove marcadores `**` de negrito, retornando o texto limpo (mesma string que a UI renderiza) + os spans em negrito, já em coordenadas do texto limpo. */
export function limparNegrito(texto: string): { textoLimpo: string; spans: SpanTexto[] } {
  const regex = new RegExp(BOLD_REGEX);
  let textoLimpo = '';
  const spans: SpanTexto[] = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto))) {
    if (match.index > ultimoIndice) {
      textoLimpo += texto.slice(ultimoIndice, match.index);
    }
    const inicio = textoLimpo.length;
    textoLimpo += match[1];
    spans.push({ inicio, fim: textoLimpo.length });
    ultimoIndice = match.index + match[0].length;
  }
  if (ultimoIndice < texto.length) {
    textoLimpo += texto.slice(ultimoIndice);
  }
  return { textoLimpo, spans };
}

/**
 * Fatia o texto (com marcação `**negrito**`) em segmentos, cada um sabendo se
 * está em negrito e/ou dentro de um destaque pessoal. Destaques não se
 * sobrepõem entre si (garantido na criação, ver useAnotacoes) — no máximo um
 * destaque por segmento.
 */
export function mesclarSegmentos(texto: string, destaques: DestaqueSpan[] = []): SegmentoTexto[] {
  const { textoLimpo, spans: boldSpans } = limparNegrito(texto);
  const tamanho = textoLimpo.length;

  const pontos = new Set<number>([0, tamanho]);
  for (const s of boldSpans) {
    pontos.add(Math.max(0, Math.min(tamanho, s.inicio)));
    pontos.add(Math.max(0, Math.min(tamanho, s.fim)));
  }
  for (const d of destaques) {
    pontos.add(Math.max(0, Math.min(tamanho, d.inicio)));
    pontos.add(Math.max(0, Math.min(tamanho, d.fim)));
  }
  const ordenados = [...pontos].sort((a, b) => a - b);

  const segmentos: SegmentoTexto[] = [];
  for (let i = 0; i < ordenados.length - 1; i++) {
    const inicio = ordenados[i];
    const fim = ordenados[i + 1];
    if (inicio === fim) continue;
    const negrito = boldSpans.some((s) => inicio >= s.inicio && fim <= s.fim);
    const destaque = destaques.find((d) => inicio >= d.inicio && fim <= d.fim) ?? null;
    segmentos.push({ texto: textoLimpo.slice(inicio, fim), negrito, destaque });
  }
  return segmentos;
}
