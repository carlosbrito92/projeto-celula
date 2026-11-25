import { ajustarTexto } from './layout';
import {
  FONTE_APOIO,
  TAMANHOS,
  resolverFonte,
  resolverPaleta,
  type OpcoesStory,
  type TrechoStory,
} from './opcoes';
import type { Theme } from '../../../themes/types';

export const LARGURA = 1080;
export const ALTURA = 1920;
const MARGEM = 96;
const ALTURA_LINHA = 1.3;

type CtxComEspaco = CanvasRenderingContext2D & { letterSpacing?: string };

function espaco(ctx: CtxComEspaco, px: number) {
  // letterSpacing no canvas: Chromium/Safari recentes. Sem suporte, segue sem espaçamento.
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

/**
 * Desenha a imagem 9×16 (1080×1920): cabeçalho (série + título + meta),
 * selo do tipo de trecho, aspas, o trecho em destaque, atribuição e rodapé.
 * As fontes precisam já estar carregadas (StoryOverlay cuida disso).
 */
export function renderizarStory(
  canvas: HTMLCanvasElement,
  trecho: TrechoStory,
  opcoes: OpcoesStory,
  tema: Theme,
): void {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d') as CtxComEspaco | null;
  if (!ctx) return;

  const fonte = resolverFonte(opcoes.fonte, tema);
  const paleta = resolverPaleta(opcoes.fundo, tema);
  const esquerda = opcoes.alinhamento === 'esquerda';
  const x = esquerda ? MARGEM : LARGURA / 2;
  const larguraUtil = LARGURA - MARGEM * 2;
  ctx.textAlign = esquerda ? 'left' : 'center';
  ctx.textBaseline = 'alphabetic';

  // Fundo
  if (paleta.fundo.length === 1) {
    ctx.fillStyle = paleta.fundo[0];
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, ALTURA);
    paleta.fundo.forEach((cor, i) => g.addColorStop(i / (paleta.fundo.length - 1), cor));
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const fontDisplay = (tamanho: number) => `${fonte.peso} ${tamanho}px ${fonte.family}`;
  const fontApoio = (peso: number, tamanho: number) => `${peso} ${tamanho}px ${FONTE_APOIO}`;
  const caixa = (t: string) => (fonte.maiusculo ? t.toUpperCase() : t);
  const barra = (y: number, largura = 100) => {
    ctx.fillStyle = paleta.destaque;
    ctx.fillRect(esquerda ? MARGEM : LARGURA / 2 - largura / 2, y, largura, 6);
  };

  // Eyebrow: PROJETO CÉLULA · SÉRIE
  ctx.fillStyle = paleta.rodape;
  ctx.globalAlpha = 0.65;
  ctx.font = fontApoio(600, 30);
  espaco(ctx, 5);
  ctx.fillText(
    (trecho.serie ? `PROJETO CÉLULA · ${trecho.serie}` : 'PROJETO CÉLULA').toUpperCase(),
    x,
    150,
    larguraUtil,
  );
  ctx.globalAlpha = 1;
  espaco(ctx, 0);
  barra(176);

  // Título da mensagem (até 2 linhas) + pregador · data
  const titulo = ajustarTexto(caixa(trecho.titulo), larguraUtil, 170, 1.15, 76, 44, (t) => (s) => {
    ctx.font = fontDisplay(t);
    return ctx.measureText(s).width;
  });
  ctx.font = fontDisplay(titulo.tamanho);
  ctx.fillStyle = paleta.texto;
  let y = 290;
  for (const linha of titulo.linhas.slice(0, 2)) {
    ctx.fillText(linha, x, y);
    y += titulo.tamanho * 1.15;
  }
  const meta = [trecho.pregador, trecho.data].filter(Boolean).join(' · ');
  if (meta) {
    ctx.font = fontApoio(600, 34);
    espaco(ctx, 2);
    ctx.globalAlpha = 0.85;
    ctx.fillText(meta, x, y + 14, larguraUtil);
    ctx.globalAlpha = 1;
    espaco(ctx, 0);
    y += 50;
  }

  // Selo do tipo de trecho
  const rotuloSelo = trecho.referencia ? 'Versículo' : 'Frase da mensagem';
  ctx.font = fontApoio(700, 30);
  espaco(ctx, 3);
  const larguraSelo = ctx.measureText(rotuloSelo).width + 64;
  const xSelo = esquerda ? MARGEM : (LARGURA - larguraSelo) / 2;
  const ySelo = y + 40;
  ctx.strokeStyle = paleta.destaque;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(xSelo, ySelo, larguraSelo, 68, 34);
  ctx.stroke();
  ctx.fillStyle = paleta.destaque;
  ctx.textAlign = 'center';
  ctx.fillText(rotuloSelo, xSelo + larguraSelo / 2, ySelo + 45);
  ctx.textAlign = esquerda ? 'left' : 'center';
  espaco(ctx, 0);

  // Aspas
  ctx.fillStyle = paleta.destaque;
  ctx.font = fontDisplay(190);
  ctx.fillText('“', x, ySelo + 68 + 190);

  // Trecho em destaque, ancorado logo abaixo das aspas
  const topoTexto = ySelo + 68 + 190 + 40;
  const alturaMax = 1560 - topoTexto - (trecho.referencia || trecho.pregador ? 100 : 0);
  const ajuste = ajustarTexto(
    caixa(trecho.texto),
    larguraUtil,
    alturaMax,
    ALTURA_LINHA,
    TAMANHOS[opcoes.tamanho].maximo,
    34,
    (t) => (s) => {
      ctx.font = fontDisplay(t);
      return ctx.measureText(s).width;
    },
  );
  ctx.font = fontDisplay(ajuste.tamanho);
  ctx.fillStyle = paleta.texto;
  let yt = topoTexto + ajuste.tamanho;
  for (const linha of ajuste.linhas) {
    ctx.fillText(linha, x, yt);
    yt += ajuste.tamanho * ALTURA_LINHA;
  }

  // Atribuição
  const atribuicao = trecho.referencia ?? trecho.pregador;
  if (atribuicao) {
    ctx.font = fontApoio(600, 40);
    espaco(ctx, 3);
    ctx.fillStyle = trecho.referencia ? paleta.destaque : paleta.rodape;
    ctx.globalAlpha = trecho.referencia ? 1 : 0.8;
    ctx.fillText(`— ${trecho.referencia ?? atribuicao}`, x, yt + 24, larguraUtil);
    ctx.globalAlpha = 1;
    espaco(ctx, 0);
  }

  // Rodapé
  ctx.fillStyle = paleta.rodape;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(MARGEM, 1650, larguraUtil, 2);
  ctx.globalAlpha = 1;
  ctx.font = fontApoio(800, 46);
  espaco(ctx, 6);
  ctx.fillText('PROJETO CÉLULA', x, 1736);
  espaco(ctx, 0);
  barra(1756, 56);
  ctx.globalAlpha = 0.6;
  ctx.font = fontApoio(500, 28);
  espaco(ctx, 2);
  ctx.fillText('Leia a mensagem completa no app', x, 1816);
  espaco(ctx, 0);
  ctx.globalAlpha = 1;
}

export function canvasParaBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
