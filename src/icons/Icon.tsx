// Ícones vendorizados de src/icons/lucide/ — ver src/icons/README.md.
const svgs = import.meta.glob<string>('./lucide/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const REGISTRY: Record<string, string> = {};
for (const [path, svg] of Object.entries(svgs)) {
  const nome = path.replace('./lucide/', '').replace('.svg', '');
  REGISTRY[nome] = svg;
}

export type IconName =
  | 'drama'
  | 'palette'
  | 'user-search'
  | 'shopping-cart'
  | 'book-open'
  | 'eye'
  | 'sofa'
  | 'sparkle'
  | 'satellite-dish'
  | 'timer'
  | 'shuffle'
  | 'users-round'
  | 'dices'
  | 'pen-line'
  | 'file-down';

interface IconProps {
  name: string;
  className?: string;
}

/** Ícone desconhecido não quebra a renderização (retorna null, console.warn em dev) — mesmo padrão de ComponenteTemaRenderer para variante desconhecida. */
export function Icon({ name, className }: IconProps) {
  const svg = REGISTRY[name];
  if (!svg) {
    if (import.meta.env.DEV) {
      console.warn(`Icon: nome desconhecido "${name}" — ignorado.`);
    }
    return null;
  }
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
