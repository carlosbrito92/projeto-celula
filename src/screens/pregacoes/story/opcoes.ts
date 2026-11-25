import type { Theme } from '../../../themes/types';

export type FonteKey = 'serifada' | 'sem_serifa' | 'impacto' | 'manuscrita';
export type FundoKey = 'serie' | 'escuro' | 'claro' | 'ambar' | 'noite' | 'aurora';
export type TamanhoKey = 'p' | 'm' | 'g';

export interface FonteStory {
  key: FonteKey;
  label: string;
  family: string;
  peso: number;
  /** Texto todo em caixa alta (Anton só existe assim por desenho). */
  maiusculo?: boolean;
  googleFontsUrl: string;
}

const GF = 'https://fonts.googleapis.com/css2';

export const FONTES: FonteStory[] = [
  {
    key: 'serifada',
    label: 'Serifada',
    family: "'Cormorant Garamond', serif",
    peso: 600,
    googleFontsUrl: `${GF}?family=Cormorant+Garamond:wght@600&display=swap`,
  },
  {
    key: 'sem_serifa',
    label: 'Moderna',
    family: "'Inter', system-ui, sans-serif",
    peso: 700,
    googleFontsUrl: `${GF}?family=Inter:wght@700&display=swap`,
  },
  {
    key: 'impacto',
    label: 'Impacto',
    family: "'Anton', sans-serif",
    peso: 400,
    maiusculo: true,
    googleFontsUrl: `${GF}?family=Anton&display=swap`,
  },
  {
    key: 'manuscrita',
    label: 'Manuscrita',
    family: "'Kalam', cursive",
    peso: 700,
    googleFontsUrl: `${GF}?family=Kalam:wght@700&display=swap`,
  },
];

export interface FundoStory {
  key: FundoKey;
  label: string;
  /** 1 cor = sólido; 2+ = degradê vertical. `null` em 'serie' (vem do tema). */
  cores: string[] | null;
  texto: string | null;
  destaque: string | null;
}

export const FUNDOS: FundoStory[] = [
  { key: 'serie', label: 'Da série', cores: null, texto: null, destaque: null },
  { key: 'escuro', label: 'Escuro', cores: ['#0a0805'], texto: '#f2ebe0', destaque: '#e8720c' },
  { key: 'claro', label: 'Claro', cores: ['#f4efe6'], texto: '#1c1812', destaque: '#c4570a' },
  { key: 'ambar', label: 'Âmbar', cores: ['#3a1706', '#e8720c'], texto: '#fff7ec', destaque: '#ffd9a8' },
  { key: 'noite', label: 'Noite', cores: ['#0b1026', '#2b2a6b'], texto: '#f1f0ff', destaque: '#9fb4ff' },
  { key: 'aurora', label: 'Aurora', cores: ['#0e2a2a', '#5b2a6e'], texto: '#f4fff9', destaque: '#8ff0c6' },
];

/** Tamanho máximo de partida (px na tela 1080×1920); o texto ainda encolhe sozinho para caber. */
export const TAMANHOS: Record<TamanhoKey, { label: string; maximo: number }> = {
  p: { label: 'P', maximo: 64 },
  m: { label: 'M', maximo: 88 },
  g: { label: 'G', maximo: 116 },
};

export interface OpcoesStory {
  fonte: FonteKey;
  fundo: FundoKey;
  tamanho: TamanhoKey;
}

export const OPCOES_PADRAO: OpcoesStory = { fonte: 'serifada', fundo: 'serie', tamanho: 'm' };

export interface TrechoStory {
  texto: string;
  /** Só versículo. */
  referencia?: string;
  /** Pregação de origem (rodapé). */
  titulo: string;
  pregador?: string | null;
}

export interface PaletaStory {
  fundo: string[];
  texto: string;
  destaque: string;
  rodape: string;
}

export function resolverPaleta(fundo: FundoKey, tema: Theme): PaletaStory {
  const f = FUNDOS.find((x) => x.key === fundo) ?? FUNDOS[0];
  if (!f.cores) {
    return {
      fundo: [tema.cores.bg],
      texto: tema.cores.text,
      destaque: tema.cores.accent1,
      rodape: tema.cores.text,
    };
  }
  return {
    fundo: f.cores,
    texto: f.texto ?? tema.cores.text,
    destaque: f.destaque ?? tema.cores.accent1,
    rodape: f.texto ?? tema.cores.text,
  };
}
