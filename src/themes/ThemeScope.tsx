import type { CSSProperties, ReactNode } from 'react';
import type { Theme } from './types';
import { useGoogleFont } from './useGoogleFont';

interface ThemeScopeProps {
  tema: Theme;
  children: ReactNode;
  className?: string;
  /** Se true, ocupa a área como bloco (ex: tela inteira). Default: true. */
  block?: boolean;
}

/** Aplica as CSS custom properties do tema num wrapper e garante a fonte carregada. */
export function ThemeScope({ tema, children, className, block = true }: ThemeScopeProps) {
  useGoogleFont(tema.fonteDisplay.googleFontsUrl || undefined);
  useGoogleFont(tema.fonteCorpo.googleFontsUrl || undefined);
  useGoogleFont(tema.fonteMono?.googleFontsUrl || undefined);
  useGoogleFont(tema.fonteH1?.googleFontsUrl || undefined);

  const style: CSSProperties & Record<string, string> = {
    '--font-display': tema.fonteDisplay.family,
    '--font-corpo': tema.fonteCorpo.family,
    '--font-mono': tema.fonteMono?.family ?? 'ui-monospace, monospace',
    '--font-h1': tema.fonteH1?.family ?? tema.fonteDisplay.family,
    '--font-h1-weight': String(tema.pesoH1 ?? tema.pesoDisplay),
    '--font-display-weight': String(tema.pesoDisplay),
    '--font-display-transform': tema.maiusculoDisplay ? 'uppercase' : 'none',
    '--secao-titulo-weight': String(tema.secaoTitulo?.peso ?? tema.pesoDisplay),
    '--secao-titulo-transform':
      tema.secaoTitulo?.maiusculo ?? tema.maiusculoDisplay ? 'uppercase' : 'none',
    '--secao-titulo-style': tema.secaoTitulo?.italico ? 'italic' : 'normal',
  };
  for (const [chave, valor] of Object.entries(tema.cores)) {
    style[`--${chave}`] = valor;
  }
  if (block) {
    style.display = 'block';
  }

  return (
    <div className={className} style={style} data-tema={tema.key}>
      {children}
    </div>
  );
}
