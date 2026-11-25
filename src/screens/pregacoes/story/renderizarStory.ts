import { ajustarTexto } from './layout';
import { FONTES, TAMANHOS, resolverPaleta, type OpcoesStory, type TrechoStory } from './opcoes';
import type { Theme } from '../../../themes/types';

export const LARGURA = 1080;
export const ALTURA = 1920;
const MARGEM = 100;
const ALTURA_LINHA = 1.28;

/** Desenha a imagem 9×16 (1080×1920) no canvas. As fontes precisam já estar carregadas. */
export function renderizarStory(
  canvas: HTMLCanvasElement,
  trecho: TrechoStory,
  opcoes: OpcoesStory,
  tema: Theme,
): void {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fonte = FONTES.find((f) => f.key === opcoes.fonte) ?? FONTES[0];
  const paleta = resolverPaleta(opcoes.fundo, tema);

  // Fundo
  if (paleta.fundo.length === 1) {
    ctx.fillStyle = paleta.fundo[0];
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, ALTURA);
    paleta.fundo.forEach((cor, i) => g.addColorStop(i / (paleta.fundo.length - 1), cor));
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const larguraTexto = LARGURA - MARGEM * 2;
  const ehVersiculo = !!trecho.referencia;
  const texto = fonte.maiusculo ? trecho.texto.toUpperCase() : trecho.texto;
  const corpo = ehVersiculo ? `“${texto}”` : texto;

  // Texto principal, centralizado verticalmente na faixa útil
  const topoFaixa = 420;
  const alturaFaixa = 1000;
  const fontCom = (tamanho: number) => `${fonte.peso} ${tamanho}px ${fonte.family}`;
  const ajuste = ajustarTexto(
    corpo,
    larguraTexto,
    alturaFaixa,
    ALTURA_LINHA,
    TAMANHOS[opcoes.tamanho].maximo,
    36,
    (tamanho) => (t) => {
      ctx.font = fontCom(tamanho);
      return ctx.measureText(t).width;
    },
  );

  ctx.font = fontCom(ajuste.tamanho);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = paleta.texto;
  const alturaBloco = ajuste.linhas.length * ajuste.tamanho * ALTURA_LINHA;
  let y = topoFaixa + (alturaFaixa - alturaBloco) / 2 + ajuste.tamanho;
  for (const linha of ajuste.linhas) {
    ctx.fillText(linha, LARGURA / 2, y);
    y += ajuste.tamanho * ALTURA_LINHA;
  }
  const fimTexto = y - ajuste.tamanho * ALTURA_LINHA + ajuste.tamanho * 0.4;

  // Filete + referência (só versículo)
  ctx.fillStyle = paleta.destaque;
  ctx.fillRect(LARGURA / 2 - 48, topoFaixa - 70, 96, 6);
  if (ehVersiculo) {
    ctx.font = `600 44px ${FONTES[1].family}`;
    ctx.fillStyle = paleta.destaque;
    ctx.fillText((trecho.referencia ?? '').toUpperCase(), LARGURA / 2, fimTexto + 90);
  }

  // Rodapé: pregação, pregador, app
  ctx.fillStyle = paleta.rodape;
  ctx.globalAlpha = 0.85;
  ctx.font = `600 36px ${FONTES[1].family}`;
  const origem = trecho.pregador ? `${trecho.titulo} · ${trecho.pregador}` : trecho.titulo;
  const linhasOrigem = ajustarTexto(origem, larguraTexto, 120, 1.3, 36, 26, (tam) => (t) => {
    ctx.font = `600 ${tam}px ${FONTES[1].family}`;
    return ctx.measureText(t).width;
  });
  ctx.font = `600 ${linhasOrigem.tamanho}px ${FONTES[1].family}`;
  linhasOrigem.linhas.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l, LARGURA / 2, 1600 + i * linhasOrigem.tamanho * 1.3);
  });
  ctx.globalAlpha = 0.6;
  ctx.font = `600 30px ${FONTES[1].family}`;
  ctx.fillText('PROJETO CÉLULA', LARGURA / 2, 1720);
  ctx.globalAlpha = 1;
}

export function canvasParaBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
