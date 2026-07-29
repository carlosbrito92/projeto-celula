export interface ThemeFont {
  /** Nome da família, como usado em font-family. */
  family: string;
  /** URL do Google Fonts CSS (para injeção sob demanda). */
  googleFontsUrl: string;
}

/**
 * Chaves padronizadas que todo tema preenche, para que os componentes
 * genéricos (stage, diagnostico, etc.) funcionem em qualquer tema sem
 * precisar saber qual está ativo. Viram custom properties `--{chave}`.
 */
export type CorSlot =
  | 'bg'
  | 'surface'
  | 'surface2'
  | 'border'
  | 'text'
  | 'muted'
  | 'accent1'
  | 'accent2'
  | 'accent-alert'
  | 'accent-dim'
  | 'tag-bg';

export interface Theme {
  key: string;
  nome: string;
  cores: Record<CorSlot, string>;
  fonteDisplay: ThemeFont;
  fonteCorpo: ThemeFont;
  /** Opcional — usado para labels/badges/metadados. Fallback: monoespaçada do sistema. */
  fonteMono?: ThemeFont;
}
