import type { Theme } from './types';

const GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2';

// Paletas/tipografia extraídas de docs/estilos-pregacao.md. Ver esse arquivo
// para origem/racional de cada cor — não duplicar decisões editoriais aqui.

export const PADRAO_MINC: Theme = {
  key: 'padrao-minc',
  nome: 'Padrão MINC',
  cores: {
    bg: '#0a0805',
    surface: '#111009',
    surface2: '#1a1610',
    border: '#2a2318',
    text: '#e8e0d4',
    muted: '#6b5f50',
    accent1: '#e8720c',
    accent2: '#f4b06a',
    'accent-alert': '#f4b06a',
    'accent-dim': '#3d2008',
    'tag-bg': '#1e1008',
  },
  fonteDisplay: {
    family: "'Cormorant Garamond', serif",
    googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  fonteCorpo: { family: "'Inter', system-ui, sans-serif", googleFontsUrl: '' },
  fonteMono: { family: "'JetBrains Mono', monospace", googleFontsUrl: '' },
  pesoDisplay: 600, // Cormorant Garamond carrega 500/600/700
};

export const ESTILO_1_MAIO_SALVACAO: Theme = {
  key: 'estilo-1-maio-salvacao',
  nome: 'Estilo #1 — Maio de Salvação',
  cores: {
    bg: '#0d0610',
    surface: '#160b1a',
    surface2: '#1e1026',
    border: '#2e1a3a',
    text: '#f0eaf8',
    muted: '#8a7299',
    accent1: '#b8e86e',
    accent2: '#8ba7f5',
    'accent-alert': '#e8507a',
    'accent-dim': '#2a3a10',
    'tag-bg': '#2a3a10',
  },
  fonteDisplay: {
    family: "'Cormorant Garamond', serif",
    googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap`,
  },
  fonteCorpo: { family: "'DM Sans', system-ui, sans-serif", googleFontsUrl: '' },
  pesoDisplay: 600, // Cormorant Garamond carrega 400/600/700
};

export const ESTILO_2_RENOVO26: Theme = {
  key: 'estilo-2-renovo26',
  nome: "Estilo #2 — Renovo'26",
  cores: {
    bg: '#080810',
    surface: '#0f0f1a',
    surface2: '#141420',
    border: '#1e1e30',
    text: '#f4f2ff',
    muted: '#6a6888',
    accent1: '#3dd68c',
    accent2: '#f03e8a',
    'accent-alert': '#f5743a',
    'accent-dim': '#0e2e1e',
    'tag-bg': '#0e2e1e',
  },
  fonteDisplay: {
    family: "'Playfair Display', serif",
    googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Sora:wght@300;400;500;600&display=swap`,
  },
  fonteCorpo: { family: "'Sora', system-ui, sans-serif", googleFontsUrl: '' },
  pesoDisplay: 700, // Playfair Display só carrega 700/900 — 600 não existe
};

export const ESTILO_3_CELULA: Theme = {
  key: 'estilo-3-celula',
  nome: 'Estilo #3 — Célula (Jamais Será em Vão)',
  cores: {
    bg: '#09080a',
    surface: '#110f12',
    surface2: '#18151a',
    border: '#241e28',
    text: '#f0eaf5',
    muted: '#6a5e72',
    accent1: '#f0b84a',
    accent2: '#e8d09a',
    'accent-alert': '#c09ae0',
    'accent-dim': '#2e2208',
    'tag-bg': '#2e2208',
  },
  fonteDisplay: {
    family: "'Lora', serif",
    googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap`,
  },
  fonteCorpo: { family: "'DM Sans', system-ui, sans-serif", googleFontsUrl: '' },
  pesoDisplay: 600, // Lora carrega 400/600/700
};

export const ESTILO_4_IGREJAR: Theme = {
  key: 'estilo-4-igrejar',
  nome: 'Estilo #4 — Igrejar',
  cores: {
    bg: '#080808',
    surface: '#0f0f0f',
    surface2: '#161616',
    border: '#242424',
    text: '#f0f0f0',
    muted: '#5a5a5a',
    accent1: '#e84c1e',
    accent2: '#f5825a',
    'accent-alert': '#f5825a',
    'accent-dim': '#2e1008',
    'tag-bg': '#2e1008',
  },
  fonteDisplay: {
    family: "'Barlow Condensed', sans-serif",
    googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&family=Barlow:wght@300;400;500&display=swap`,
  },
  fonteCorpo: { family: "'Barlow', system-ui, sans-serif", googleFontsUrl: '' },
  pesoDisplay: 700, // Barlow Condensed carrega 400/600/700/800 — 700 casa com o tom "condensado bold" da série
  // "Títulos de seção em maiúsculas + itálico (Barlow Condensed 800)" — docs/estilos-pregacao.md
  secaoTitulo: { peso: 800, maiusculo: true, italico: true },
};

export const ESTILO_5B_RELIGIAO_TOXICA: Theme = {
  key: 'estilo-5b-religiao-toxica',
  nome: 'Estilo #5b — Religião Tóxica',
  cores: {
    bg: '#060806',
    surface: '#0a0f0a',
    surface2: '#0f160f',
    border: '#1c2a1c',
    text: '#e8f5ea',
    muted: '#566356',
    accent1: '#39e87a',
    accent2: '#8ff5b4',
    'accent-alert': '#e84fa8',
    'accent-dim': '#0e2e18',
    'tag-bg': '#0e2e18',
  },
  fonteDisplay: { family: "'Anton', sans-serif", googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap` },
  fonteCorpo: { family: "'IBM Plex Sans', system-ui, sans-serif", googleFontsUrl: '' },
  fonteMono: { family: "'IBM Plex Mono', monospace", googleFontsUrl: '' },
  pesoDisplay: 400, // Anton só existe em peso único (400) — já é extra-bold por desenho
  maiusculoDisplay: true, // "Display: Anton — peso único extra-bold, uppercase" — docs/estilos-pregacao.md
};

export const ESTILO_6_UMA_VEZ_SALVO: Theme = {
  key: 'estilo-6-uma-vez-salvo',
  nome: 'Estilo #6 — Uma Vez Salvo, Salvo Para Sempre',
  cores: {
    bg: '#2a2015',
    surface: '#332618',
    surface2: '#3d2e1c',
    border: '#4d3a24',
    text: '#f0e4d0',
    muted: '#8a7358',
    accent1: '#9c1c1c', // --seal
    accent2: '#d4544a', // --seal-soft
    'accent-alert': '#d4544a', // sem cor de alerta própria documentada — reusa seal-soft
    'accent-dim': '#3a1210', // --seal-dim
    'tag-bg': 'rgba(156,28,28,.10)', // --seal-glow, fundo do badge de série
  },
  fonteDisplay: {
    family: "'Kalam', cursive",
    googleFontsUrl: `${GOOGLE_FONTS_BASE}?family=Kalam:wght@700&family=Courier+Prime:wght@400;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap`,
  },
  fonteCorpo: { family: "'IBM Plex Sans', system-ui, sans-serif", googleFontsUrl: '' },
  fonteMono: { family: "'Courier Prime', monospace", googleFontsUrl: '' }, // datilografada, etiqueta/prova
  pesoDisplay: 700, // Kalam só carrega 700 aqui
};

export const THEMES: Record<string, Theme> = {
  [PADRAO_MINC.key]: PADRAO_MINC,
  [ESTILO_1_MAIO_SALVACAO.key]: ESTILO_1_MAIO_SALVACAO,
  [ESTILO_2_RENOVO26.key]: ESTILO_2_RENOVO26,
  [ESTILO_3_CELULA.key]: ESTILO_3_CELULA,
  [ESTILO_4_IGREJAR.key]: ESTILO_4_IGREJAR,
  [ESTILO_5B_RELIGIAO_TOXICA.key]: ESTILO_5B_RELIGIAO_TOXICA,
  [ESTILO_6_UMA_VEZ_SALVO.key]: ESTILO_6_UMA_VEZ_SALVO,
};

// Mapeamento Série -> tema (docs/estilos-pregacao.md). Séries sem entrada
// aqui — incluindo "Avulsa" e qualquer série futura sem tema próprio
// registrado — caem no fallback Padrão MINC.
const SERIE_PARA_TEMA: Record<string, string> = {
  'Religião Tóxica': ESTILO_5B_RELIGIAO_TOXICA.key,
  Igrejar: ESTILO_4_IGREJAR.key,
  'Maio de Salvação': ESTILO_1_MAIO_SALVACAO.key,
  "Renovo'26": ESTILO_2_RENOVO26.key,
  'Uma Vez Salvo, Salvo Para Sempre': ESTILO_6_UMA_VEZ_SALVO.key,
};

// Chaves curtas aceitas em metadados.tema_override (docs/estilos-pregacao.md
// § Resolução de tema) — para pregações "Avulsa" que precisam de um tema
// registrado sem ter uma série própria (ex: resumos de célula → Estilo #3).
const TEMA_OVERRIDE_PARA_CHAVE: Record<string, string> = {
  'Padrão MINC': PADRAO_MINC.key,
  'Estilo #1': ESTILO_1_MAIO_SALVACAO.key,
  'Estilo #2': ESTILO_2_RENOVO26.key,
  'Estilo #3': ESTILO_3_CELULA.key,
  'Estilo #4': ESTILO_4_IGREJAR.key,
  'Estilo #5b': ESTILO_5B_RELIGIAO_TOXICA.key,
  'Estilo #6': ESTILO_6_UMA_VEZ_SALVO.key,
};

export function resolveTema(
  serie: string | null | undefined,
  temaOverride?: string | null,
): Theme {
  if (temaOverride) {
    const overrideKey = TEMA_OVERRIDE_PARA_CHAVE[temaOverride];
    if (overrideKey && THEMES[overrideKey]) return THEMES[overrideKey];
  }
  if (!serie) return PADRAO_MINC;
  const key = SERIE_PARA_TEMA[serie];
  return (key && THEMES[key]) || PADRAO_MINC;
}
