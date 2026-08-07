export interface Categoria {
  nome: string;
  palavras: string[];
}

/**
 * Bancos de objetos/palavras por categoria pro Artista Impostor (V2) —
 * um só é sorteado por rodada (`escolherUm`, `src/utilitarios/shuffle.ts`),
 * compartilhado por quem "sabe a palavra"; o impostor não recebe nenhum.
 * Mesmo critério de adequação do Quem Sou Eu (`multiplayer/quemSouEu/categorias.ts`).
 */
export const CATEGORIAS: Categoria[] = [
  {
    nome: 'Objetos do dia a dia',
    palavras: [
      'Guarda-chuva',
      'Escova de dentes',
      'Óculos',
      'Relógio',
      'Chave',
      'Carteira',
      'Mochila',
      'Cadeira',
      'Travesseiro',
      'Panela',
      'Colher',
      'Tesoura',
      'Escada',
      'Lâmpada',
      'Espelho',
      'Vassoura',
    ],
  },
  {
    nome: 'Animais',
    palavras: [
      'Elefante',
      'Girafa',
      'Leão',
      'Pinguim',
      'Polvo',
      'Coruja',
      'Camaleão',
      'Canguru',
      'Tartaruga',
      'Golfinho',
      'Morcego',
      'Zebra',
      'Coala',
      'Flamingo',
      'Ouriço',
      'Rinoceronte',
    ],
  },
  {
    nome: 'Lugares',
    palavras: [
      'Praia',
      'Igreja',
      'Escola',
      'Zoológico',
      'Aeroporto',
      'Floresta',
      'Deserto',
      'Hospital',
      'Biblioteca',
      'Fazenda',
      'Estádio',
      'Cachoeira',
      'Castelo',
      'Cinema',
      'Mercado',
      'Montanha',
    ],
  },
];
