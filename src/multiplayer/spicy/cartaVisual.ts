import type { Carta, Cor } from './types';

/**
 * Tradução `Carta` (motor, Sprint A) → dado visual `shapes[]`/`texts[]`
 * (docs/spicy-spec.md §6.1/§6.1.1, mock aprovado `docs/Baralho Spicy.dc.html`).
 * Pura, sem React/SVG aqui — `Card.tsx` (Sprint D) é quem itera esses arrays.
 * ViewBox de referência: 200×300, cantos raio 16.
 */

export interface FormaCirculo {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

export interface FormaRetangulo {
  type: 'rect';
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  width: number;
  height: number;
  rotate?: number;
  rx?: number;
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

export interface FormaPoligono {
  type: 'polygon';
  points: [number, number][];
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

export interface FormaLinha {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth?: number;
}

export type Forma = FormaCirculo | FormaRetangulo | FormaPoligono | FormaLinha;

export interface TextoVisual {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  fillOpacity?: number;
  fontWeight?: number;
  /** Rótulos de canto ("COR"/"Nº"/"TROFÉU"/"FIM") usam mono; resto usa a fonte de exibição padrão. */
  fontFamily?: 'mono';
  anchor?: 'start' | 'middle' | 'end';
  baseline?: 'central';
  rotate?: number;
}

export interface CartaVisual {
  background: string;
  border: string;
  shapes: Forma[];
  texts: TextoVisual[];
}

const CINZA_ROTULO = '#8A857C';
const DOURADO = '#C7A15A';

const CORES_HEX: Record<Cor, string> = {
  vermelho: '#D92B1F',
  azul: '#0B63C5',
  verde: '#0E8A4F',
};

/** Forma central (atrás do número grande) + par de marcas de canto, por cor da família. */
function formasDaCor(cor: Cor): { central: Forma; cantoTopo: Forma; cantoBase: Forma } {
  const hex = CORES_HEX[cor];
  switch (cor) {
    case 'vermelho':
      return {
        central: { type: 'circle', cx: 100, cy: 150, r: 77, fill: 'none', stroke: hex, strokeOpacity: 0.32, strokeWidth: 1.5 },
        cantoTopo: { type: 'circle', cx: 176, cy: 24, r: 6, fill: 'none', stroke: hex, strokeWidth: 2 },
        cantoBase: { type: 'circle', cx: 24, cy: 276, r: 6, fill: 'none', stroke: hex, strokeWidth: 2 },
      };
    case 'azul':
      return {
        central: {
          type: 'rect', cx: 100, cy: 150, width: 120, height: 120, rotate: 45, rx: 8,
          fill: 'none', stroke: hex, strokeOpacity: 0.32, strokeWidth: 1.5,
        },
        cantoTopo: { type: 'rect', cx: 176, cy: 24, width: 11, height: 11, rotate: 45, fill: 'none', stroke: hex, strokeWidth: 2 },
        cantoBase: { type: 'rect', cx: 24, cy: 276, width: 11, height: 11, rotate: 45, fill: 'none', stroke: hex, strokeWidth: 2 },
      };
    case 'verde':
      return {
        central: {
          type: 'polygon', points: [[100, 83], [184, 229], [16, 229]],
          fill: 'none', stroke: hex, strokeOpacity: 0.32, strokeWidth: 1.5,
        },
        cantoTopo: { type: 'polygon', points: [[176, 19], [182, 30], [170, 30]], fill: 'none', stroke: hex, strokeWidth: 2 },
        cantoBase: { type: 'polygon', points: [[24, 281], [30, 270], [18, 270]], fill: 'none', stroke: hex, strokeWidth: 2 },
      };
  }
}

function cartaNumerada(cor: Cor, valor: number): CartaVisual {
  const hex = CORES_HEX[cor];
  const { central, cantoTopo, cantoBase } = formasDaCor(cor);
  return {
    background: '#FFFFFF',
    border: '#E6E2DA',
    shapes: [central, cantoTopo, cantoBase],
    texts: [
      { content: String(valor), x: 100, y: 150, fontSize: 104, fill: hex, fontWeight: 800, anchor: 'middle', baseline: 'central' },
      { content: String(valor), x: 15, y: 35, fontSize: 22, fill: hex, fontWeight: 700 },
      { content: String(valor), x: 185, y: 265, fontSize: 22, fill: hex, fontWeight: 700, anchor: 'end', rotate: 180 },
    ],
  };
}

/** Literais copiados de docs/spicy-spec.md §6.1.1 — mesma fonte de verdade, não recalculados. */
const WILD_COLOR: CartaVisual = {
  background: '#FFFFFF',
  border: '#E6E2DA',
  shapes: [
    { type: 'circle', cx: 100, cy: 114, r: 39, fill: '#D92B1F', fillOpacity: 0.1, stroke: '#D92B1F', strokeOpacity: 0.55, strokeWidth: 1.5 },
    { type: 'rect', cx: 64, cy: 183, width: 56, height: 56, rotate: 45, fill: '#0B63C5', fillOpacity: 0.1, stroke: '#0B63C5', strokeOpacity: 0.55, strokeWidth: 1.5 },
    { type: 'polygon', points: [[133, 153], [170, 217], [96, 217]], fill: '#0E8A4F', fillOpacity: 0.1, stroke: '#0E8A4F', strokeOpacity: 0.55, strokeWidth: 1.5 },
    { type: 'circle', cx: 19, cy: 17, r: 4, fill: '#D92B1F' },
    { type: 'rect', cx: 32, cy: 17, width: 8, height: 8, rotate: 45, fill: '#0B63C5' },
    { type: 'polygon', points: [[45, 13], [50, 21], [40, 21]], fill: '#0E8A4F' },
    { type: 'circle', cx: 154, cy: 283, r: 4, fill: '#D92B1F' },
    { type: 'rect', cx: 167, cy: 283, width: 8, height: 8, rotate: 45, fill: '#0B63C5' },
    { type: 'polygon', points: [[180, 278], [185, 286], [175, 286]], fill: '#0E8A4F' },
  ],
  texts: [
    { content: 'COR', x: 184, y: 22, fontSize: 11, fontWeight: 500, fill: CINZA_ROTULO, fontFamily: 'mono', anchor: 'end' },
    { content: 'COR', x: 16, y: 278, fontSize: 11, fontWeight: 500, fill: CINZA_ROTULO, fontFamily: 'mono', rotate: 180 },
  ],
};

const WILD_NUMBER: CartaVisual = {
  background: '#FFFFFF',
  border: '#E6E2DA',
  shapes: [
    { type: 'circle', cx: 100, cy: 150, r: 77, fill: 'none', stroke: '#1C1B19', strokeOpacity: 0.22, strokeWidth: 1.5 },
    { type: 'line', x1: 100.0, y1: 73.0, x2: 100.0, y2: 86.0, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 145.3, y1: 88.7, x2: 137.6, y2: 98.2, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 173.2, y1: 126.2, x2: 160.9, y2: 130.2, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 173.2, y1: 173.8, x2: 160.9, y2: 169.8, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 145.3, y1: 211.3, x2: 137.6, y2: 201.8, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 100.0, y1: 227.0, x2: 100.0, y2: 214.0, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 54.7, y1: 211.3, x2: 62.4, y2: 201.8, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 26.8, y1: 173.8, x2: 39.1, y2: 169.8, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 26.8, y1: 126.2, x2: 39.1, y2: 130.2, stroke: '#1C1B19', strokeWidth: 2 },
    { type: 'line', x1: 54.7, y1: 88.7, x2: 62.4, y2: 98.2, stroke: '#1C1B19', strokeWidth: 2 },
  ],
  texts: [
    { content: '1–10', x: 100, y: 150, fontSize: 52, fill: '#1C1B19', fontWeight: 800, anchor: 'middle', baseline: 'central' },
    { content: '*', x: 15, y: 35, fontSize: 20, fill: '#1C1B19', fontWeight: 700 },
    { content: '*', x: 185, y: 265, fontSize: 20, fill: '#1C1B19', fontWeight: 700, anchor: 'end', rotate: 180 },
    { content: 'Nº', x: 184, y: 22, fontSize: 11, fontWeight: 500, fill: CINZA_ROTULO, fontFamily: 'mono', anchor: 'end' },
    { content: 'Nº', x: 16, y: 278, fontSize: 11, fontWeight: 500, fill: CINZA_ROTULO, fontFamily: 'mono', rotate: 180 },
  ],
};

const TROPHY: CartaVisual = {
  background: '#1C1B19',
  border: '#1C1B19',
  shapes: [
    { type: 'circle', cx: 100, cy: 150, r: 75, fill: 'none', stroke: DOURADO, strokeOpacity: 0.55, strokeWidth: 1.5 },
    { type: 'polygon', points: [[100, 103], [148, 187], [52, 187]], fill: DOURADO },
    { type: 'rect', cx: 100, cy: 202, width: 56, height: 5, rx: 3, fill: DOURADO },
    { type: 'polygon', points: [[23, 15], [30, 27], [16, 27]], fill: DOURADO },
    { type: 'polygon', points: [[177, 273], [184, 285], [170, 285]], fill: DOURADO },
  ],
  texts: [
    { content: 'TROFÉU', x: 184, y: 22, fontSize: 11, fontWeight: 500, fill: DOURADO, fontFamily: 'mono', anchor: 'end' },
    { content: 'TROFÉU', x: 16, y: 278, fontSize: 11, fontWeight: 500, fill: DOURADO, fontFamily: 'mono', rotate: 180 },
  ],
};

const WORLDS_END: CartaVisual = {
  background: '#1F3A3D',
  border: '#1F3A3D',
  shapes: [
    { type: 'rect', x: 0, y: 147, width: 200, height: 6, fill: '#E8E4DC' },
    { type: 'rect', cx: 100, cy: 150, width: 132, height: 132, rx: 4, fill: 'none', stroke: '#E8E4DC', strokeOpacity: 0.45, strokeWidth: 1.5 },
    { type: 'rect', cx: 100, cy: 150, width: 52, height: 52, rx: 2, fill: '#1F3A3D', stroke: '#E8E4DC', strokeOpacity: 0.45, strokeWidth: 1.5 },
    { type: 'rect', x: 16, y: 15, width: 12, height: 12, fill: '#E8E4DC' },
    { type: 'rect', x: 172, y: 273, width: 12, height: 12, fill: '#E8E4DC' },
  ],
  texts: [
    { content: 'FIM', x: 184, y: 22, fontSize: 11, fontWeight: 500, fill: '#E8E4DC', fillOpacity: 0.8, fontFamily: 'mono', anchor: 'end' },
    { content: 'FIM', x: 16, y: 278, fontSize: 11, fontWeight: 500, fill: '#E8E4DC', fillOpacity: 0.8, fontFamily: 'mono', rotate: 180 },
  ],
};

export const VERSO: CartaVisual = {
  background: '#0D0C0B',
  border: '#0D0C0B',
  shapes: [
    { type: 'circle', cx: 100, cy: 150, r: 75, fill: 'none', stroke: DOURADO, strokeOpacity: 0.35, strokeWidth: 1.5 },
    { type: 'circle', cx: 100, cy: 150, r: 59, fill: 'none', stroke: DOURADO, strokeOpacity: 0.55, strokeWidth: 1.5 },
    { type: 'circle', cx: 71, cy: 150, r: 9, fill: 'none', stroke: DOURADO, strokeWidth: 2 },
    { type: 'rect', cx: 100, cy: 150, width: 16, height: 16, rotate: 45, fill: 'none', stroke: DOURADO, strokeWidth: 2 },
    { type: 'polygon', points: [[129, 141], [139, 158], [119, 158]], fill: DOURADO },
  ],
  texts: [{ content: 'SPICY', x: 100, y: 274, fontSize: 11, fill: DOURADO, fontFamily: 'mono', anchor: 'middle' }],
};

/**
 * Traduz uma `Carta` do motor (Sprint A) pro dado visual (§6.1/§6.1.1).
 * `revelada = false` sempre retorna o verso (`VERSO`), independente do tipo
 * real — quem decide se uma carta deve mostrar a face é o chamador
 * (ex: mão do próprio jogador vs. mão alheia, carta virada na pilha).
 */
export function cartaParaVisual(carta: Carta, revelada = true): CartaVisual {
  if (!revelada) return VERSO;

  switch (carta.tipo) {
    case 'numerada':
      return cartaNumerada(carta.cor!, carta.valor!);
    case 'wild_cor':
      return WILD_COLOR;
    case 'wild_numero':
      return WILD_NUMBER;
    case 'trofeu':
      return TROPHY;
    case 'fim_do_mundo':
      return WORLDS_END;
  }
}
