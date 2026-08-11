import type { Cor } from './types';

const CORES_HEX: Record<Cor, string> = {
  vermelho: '#D92B1F',
  azul: '#0B63C5',
  verde: '#0E8A4F',
};

interface IconeFormaProps {
  cor: Cor;
  tamanho?: number;
  /** Contorno (traço fino, como nas cartas) em vez de preenchido — usado nos pills não-selecionados. */
  contorno?: boolean;
}

/**
 * Mini ícone de forma-por-cor (círculo/losango/triângulo, mesma gramática
 * de `cartaVisual.ts`) reaproveitado nos pills de cor, badge de troféu e
 * avisos (docs/Tela de Jogo Spicy.dc.html) — não é a carta inteira, só o
 * símbolo da família.
 */
export function IconeForma({ cor, tamanho = 12, contorno = false }: IconeFormaProps) {
  const hex = CORES_HEX[cor];
  const estiloBase = { flexShrink: 0 };

  if (cor === 'vermelho') {
    return (
      <div
        style={{
          ...estiloBase,
          width: tamanho,
          height: tamanho,
          borderRadius: '50%',
          border: `1.5px solid ${hex}`,
          background: contorno ? 'none' : hex,
          boxSizing: 'border-box',
        }}
      />
    );
  }
  if (cor === 'azul') {
    return (
      <div
        style={{
          ...estiloBase,
          width: tamanho * 0.85,
          height: tamanho * 0.85,
          border: `1.5px solid ${hex}`,
          background: contorno ? 'none' : hex,
          transform: 'rotate(45deg)',
          boxSizing: 'border-box',
        }}
      />
    );
  }
  return (
    <div
      style={{
        ...estiloBase,
        width: tamanho,
        height: tamanho * 0.85,
        background: hex,
        clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
      }}
    />
  );
}
