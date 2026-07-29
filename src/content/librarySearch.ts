import type { PregacaoRow } from './types';

// Faixa Unicode das marcas de acentuação combinantes (U+0300–U+036F), geradas
// por code point em vez de literal na fonte — evita caracteres combinantes
// "soltos" no arquivo-fonte, que ficam ilegíveis/perigosos de editar depois.
const COMBINING_MARKS_REGEX = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

/** Minúsculas + sem acentos, para busca tolerante (ex: "graca" casa "Graça"). */
export function normalize(str: string): string {
  return str.normalize('NFD').replace(COMBINING_MARKS_REGEX, '').toLowerCase();
}

export function filterPregacoes(pregacoes: PregacaoRow[], termo: string): PregacaoRow[] {
  const alvo = normalize(termo.trim());
  if (!alvo) return pregacoes;

  return pregacoes.filter((p) =>
    [p.tema, p.serie, p.pregador]
      .filter((campo): campo is string => Boolean(campo))
      .some((campo) => normalize(campo).includes(alvo)),
  );
}
