import { useGoogleFont } from '../../themes/useGoogleFont';
import { cartaParaVisual, type Forma, type TextoVisual } from './cartaVisual';
import type { Carta } from './types';

// Mesmas fontes do mock aprovado (docs/Baralho Spicy.dc.html).
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=JetBrains+Mono:wght@500&display=swap';
const FONTE_DISPLAY = "'Archivo', Helvetica, sans-serif";
const FONTE_MONO = "'JetBrains Mono', monospace";

function renderForma(forma: Forma, i: number) {
  switch (forma.type) {
    case 'circle':
      return (
        <circle
          key={i}
          cx={forma.cx}
          cy={forma.cy}
          r={forma.r}
          fill={forma.fill}
          fillOpacity={forma.fillOpacity}
          stroke={forma.stroke}
          strokeOpacity={forma.strokeOpacity}
          strokeWidth={forma.strokeWidth}
        />
      );
    case 'rect': {
      const largura = forma.width;
      const altura = forma.height;
      const cx = forma.cx ?? (forma.x ?? 0) + largura / 2;
      const cy = forma.cy ?? (forma.y ?? 0) + altura / 2;
      const x = forma.x ?? cx - largura / 2;
      const y = forma.y ?? cy - altura / 2;
      return (
        <rect
          key={i}
          x={x}
          y={y}
          width={largura}
          height={altura}
          rx={forma.rx}
          fill={forma.fill}
          fillOpacity={forma.fillOpacity}
          stroke={forma.stroke}
          strokeOpacity={forma.strokeOpacity}
          strokeWidth={forma.strokeWidth}
          transform={forma.rotate ? `rotate(${forma.rotate} ${cx} ${cy})` : undefined}
        />
      );
    }
    case 'polygon':
      return (
        <polygon
          key={i}
          points={forma.points.map(([x, y]) => `${x},${y}`).join(' ')}
          fill={forma.fill}
          fillOpacity={forma.fillOpacity}
          stroke={forma.stroke}
          strokeOpacity={forma.strokeOpacity}
          strokeWidth={forma.strokeWidth}
        />
      );
    case 'line':
      return (
        <line
          key={i}
          x1={forma.x1}
          y1={forma.y1}
          x2={forma.x2}
          y2={forma.y2}
          stroke={forma.stroke}
          strokeWidth={forma.strokeWidth}
        />
      );
  }
}

function renderTexto(t: TextoVisual, i: number) {
  const mono = t.fontFamily === 'mono';
  return (
    <text
      key={i}
      x={t.x}
      y={t.y}
      fontSize={t.fontSize}
      fill={t.fill}
      fillOpacity={t.fillOpacity}
      fontWeight={t.fontWeight}
      fontFamily={mono ? FONTE_MONO : FONTE_DISPLAY}
      letterSpacing={mono ? '0.08em' : undefined}
      textAnchor={t.anchor}
      dominantBaseline={t.baseline === 'central' ? 'central' : undefined}
      transform={t.rotate ? `rotate(${t.rotate} ${t.x} ${t.y})` : undefined}
    >
      {t.content}
    </text>
  );
}

export interface CardProps {
  carta: Carta;
  /** false = mostra o verso, independente do tipo real da carta. */
  revelada?: boolean;
  className?: string;
}

/**
 * Renderizador SVG genérico do baralho (Sprint D, docs/spicy-spec.md §7) —
 * itera `shapes[]`/`texts[]` de `cartaParaVisual`, sem lógica de jogo aqui
 * dentro. ViewBox 200×300 fixo (§6.1); quem posiciona/dimensiona na tela é
 * o CSS do componente pai.
 */
export function Card({ carta, revelada = true, className }: CardProps) {
  useGoogleFont(GOOGLE_FONTS_URL);
  const visual = cartaParaVisual(carta, revelada);

  return (
    <svg viewBox="0 0 200 300" className={className} style={{ display: 'block', width: '100%', height: '100%' }}>
      <rect
        x={0.75}
        y={0.75}
        width={198.5}
        height={298.5}
        rx={16}
        fill={visual.background}
        stroke={visual.border}
        strokeWidth={1.5}
      />
      {visual.shapes.map(renderForma)}
      {visual.texts.map(renderTexto)}
    </svg>
  );
}
