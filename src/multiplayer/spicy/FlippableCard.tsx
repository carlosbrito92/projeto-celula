import { motion } from 'motion/react';
import { Card } from './Card';
import type { Carta } from './types';

export interface FlippableCardProps {
  carta: Carta;
  /** false = mostra o verso. */
  revelada: boolean;
  className?: string;
  onClick?: () => void;
  /** Leve destaque visual (ex: carta escolhida na mão antes de confirmar). */
  selecionada?: boolean;
}

/**
 * Flip via CSS 3D (`perspective`/`backfaceVisibility`/`rotateY`) — mesma
 * técnica do mock original — envolto num `motion.div` só pelo `layoutId`:
 * a mesma carta (`carta.id`) renderizada em containers-pai diferentes entre
 * renders (mão → pilha → vencedor) é interpolada automaticamente pelo
 * Framer Motion (técnica FLIP), sem cálculo manual de coordenadas (Sprint D,
 * docs/spicy-pesquisa-visual-animacao.md §2.2).
 */
export function FlippableCard({ carta, revelada, className, onClick, selecionada }: FlippableCardProps) {
  return (
    <motion.div
      layoutId={carta.id}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      data-testid={onClick ? `carta-${carta.id}` : undefined}
      className={className}
      style={{ cursor: onClick ? 'pointer' : undefined, perspective: 800 }}
      animate={{ scale: selecionada ? 1.06 : 1, y: selecionada ? -8 : 0 }}
      transition={{ layout: { duration: 0.35, ease: 'easeInOut' }, default: { duration: 0.15 } }}
    >
      <motion.div
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: revelada ? 0 : 180 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <Card carta={carta} revelada />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <Card carta={carta} revelada={false} />
        </div>
      </motion.div>
    </motion.div>
  );
}
