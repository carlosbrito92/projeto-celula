// Botão de negrito do editor: liga/desliga `**…**` em volta da seleção do
// textarea, no mesmo formato que o app já renderiza (TextoComKeywords).

export interface EdicaoTexto {
  texto: string;
  inicio: number;
  fim: number;
}

const MARCA = '**';
const EXEMPLO = 'palavra';

export function alternarNegrito(texto: string, inicio: number, fim: number): EdicaoTexto {
  let a = Math.min(inicio, fim);
  let b = Math.max(inicio, fim);
  // Espaços nas pontas da seleção ficam fora das marcas ("** palavra **" não vira negrito).
  while (a < b && /\s/.test(texto[a])) a += 1;
  while (b > a && /\s/.test(texto[b - 1])) b -= 1;

  // Seleção já envolvida por ** (por fora ou incluindo as marcas): remove.
  if (texto.slice(a - 2, a) === MARCA && texto.slice(b, b + 2) === MARCA) {
    return { texto: texto.slice(0, a - 2) + texto.slice(a, b) + texto.slice(b + 2), inicio: a - 2, fim: b - 2 };
  }
  const sel = texto.slice(a, b);
  if (sel.length >= 4 && sel.startsWith(MARCA) && sel.endsWith(MARCA)) {
    return { texto: texto.slice(0, a) + sel.slice(2, -2) + texto.slice(b), inicio: a, fim: b - 4 };
  }

  // Nada selecionado: insere um exemplo já selecionado para o líder digitar por cima.
  const miolo = sel || EXEMPLO;
  return {
    texto: `${texto.slice(0, a)}${MARCA}${miolo}${MARCA}${texto.slice(b)}`,
    inicio: a + 2,
    fim: a + 2 + miolo.length,
  };
}
