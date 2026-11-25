import type { Theme } from '../../../themes/types';
import {
  ESTILO_2_RENOVO26,
  ESTILO_3_CELULA,
  ESTILO_4_IGREJAR,
  ESTILO_5B_RELIGIAO_TOXICA,
  ESTILO_6_UMA_VEZ_SALVO,
  ESTILO_7_MARANATA,
  PADRAO_MINC,
} from '../../../themes/registry';

export type FonteKey = string;
export type Alinhamento = 'esquerda' | 'centro';
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

/** Fonte de display de um tema, com o peso que ele realmente carrega. */
function deTema(key: string, label: string, t: Theme): FonteStory {
  return {
    key,
    label,
    family: t.fonteDisplay.family,
    peso: t.pesoDisplay,
    maiusculo: t.maiusculoDisplay,
    googleFontsUrl: t.fonteDisplay.googleFontsUrl,
  };
}

/** Fonte da série da pregação — default, sempre a primeira opção. */
export const FONTE_SERIE = 'serie';

/**
 * Fontes já usadas no app (uma por família, tiradas do registro de temas —
 * nada de fonte nova): o peso e a URL vêm do próprio tema, então sempre
 * existem de verdade no Google Fonts (ver pesosDisponiveis em registry.test).
 */
export const FONTES_APP: FonteStory[] = [
  deTema('cormorant', 'Cormorant', PADRAO_MINC),
  deTema('playfair', 'Playfair', ESTILO_2_RENOVO26),
  deTema('lora', 'Lora', ESTILO_3_CELULA),
  deTema('barlow', 'Barlow', ESTILO_4_IGREJAR),
  deTema('anton', 'Anton', ESTILO_5B_RELIGIAO_TOXICA),
  deTema('gloock', 'Gloock', ESTILO_7_MARANATA),
  {
    key: 'kalam',
    label: 'Kalam',
    family: ESTILO_6_UMA_VEZ_SALVO.fonteH1?.family ?? "'Kalam', cursive",
    peso: ESTILO_6_UMA_VEZ_SALVO.pesoH1 ?? 700,
    googleFontsUrl: ESTILO_6_UMA_VEZ_SALVO.fonteDisplay.googleFontsUrl,
  },
  {
    key: 'inter',
    label: 'Inter',
    family: PADRAO_MINC.fonteCorpo.family,
    peso: 600,
    googleFontsUrl: PADRAO_MINC.fonteDisplay.googleFontsUrl,
  },
];

export function resolverFonte(key: FonteKey, tema: Theme): FonteStory {
  if (key === FONTE_SERIE) return { ...deTema(FONTE_SERIE, 'Da série', tema) };
  return FONTES_APP.find((f) => f.key === key) ?? deTema(FONTE_SERIE, 'Da série', tema);
}

/** Fonte de apoio (eyebrow, rodapé, metadados): a de corpo do app. */
export const FONTE_APOIO = "'Inter', system-ui, sans-serif";
export const FONTE_APOIO_URL = PADRAO_MINC.fonteDisplay.googleFontsUrl;

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
  alinhamento: Alinhamento;
  /** Itálico com espaçamento largo entre letras (estilo editorial). */
  italico: boolean;
  fundo: FundoKey;
  tamanho: TamanhoKey;
}

export const OPCOES_PADRAO: OpcoesStory = {
  fonte: FONTE_SERIE,
  alinhamento: 'esquerda',
  italico: false,
  fundo: 'serie',
  tamanho: 'm',
};

export interface TrechoStory {
  texto: string;
  /** Só versículo. */
  referencia?: string;
  /** Pregação de origem. */
  titulo: string;
  pregador?: string | null;
  serie?: string | null;
  data?: string | null;
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
