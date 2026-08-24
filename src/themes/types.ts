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
  /**
   * Opcional — fonte exclusiva do header h1 (título da pregação), quando o
   * tema quer uma "assinatura" visual mais expressiva que fonteDisplay sem
   * vazar pro resto do documento (ex: Estilo #6, brush manuscrito só no h1
   * — ver docs/estilos-pregacao.md). Ausente: h1 cai em fonteDisplay, igual
   * a todo tema que não define isso.
   */
  fonteH1?: ThemeFont;
  /** Peso de fonteH1 (mesma regra de pesoDisplay — precisa ser carregado). Ausente: cai em pesoDisplay. */
  pesoH1?: number;
  /**
   * Peso usado em títulos/destaques (var(--font-display-weight)) — precisa
   * ser um peso que a família de fonteDisplay realmente tem carregado
   * (ver wght@ na googleFontsUrl). Nunca hardcodar font-weight junto de
   * var(--font-display) no CSS: fontes de peso único (ex: Anton, só 400)
   * silenciosamente caem pra fonte de sistema em vez de sintetizar bold
   * quando o peso pedido não existe — foi exatamente esse o bug do
   * Estilo #5b. Obrigatório para forçar essa checagem a cada tema novo.
   */
  pesoDisplay: number;
  /**
   * Caixa alta na fonte de display (ex: Anton no Estilo #5b, que só existe
   * em uppercase por desenho — ver docs/estilos-pregacao.md). Aplica-se a
   * todo título em --font-display. Default: false (não seta o CSS var).
   */
  maiusculoDisplay?: boolean;
  /**
   * Override específico para títulos de seção (.secaoTitulo), quando o tema
   * documenta um tratamento mais pesado/distinto do resto do display (ex:
   * Estilo #4 — "Títulos de seção em maiúsculas + itálico, Barlow Condensed
   * 800", diferente do pesoDisplay geral do tema). Campos ausentes herdam do
   * geral (peso -> pesoDisplay, maiusculo -> maiusculoDisplay, itálico -> não).
   */
  secaoTitulo?: {
    peso?: number;
    maiusculo?: boolean;
    italico?: boolean;
  };
}
