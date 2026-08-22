const LARGURA_A4_PT = 595;
const ALTURA_A4_PT = 842;

export interface FatiaPagina {
  offsetY: number;
  altura: number;
}

/** Fatia uma altura total em pedaços de no máximo `alturaFatiaPx`, do início ao fim, sem sobra nem loop infinito (`alturaFatiaPx` <= 0 vira 1 pra sempre progredir). */
export function calcularFatiasPagina(alturaTotalPx: number, alturaFatiaPx: number): FatiaPagina[] {
  const passo = Math.max(1, alturaFatiaPx);
  const fatias: FatiaPagina[] = [];
  let offsetY = 0;
  while (offsetY < alturaTotalPx) {
    const altura = Math.min(passo, alturaTotalPx - offsetY);
    fatias.push({ offsetY, altura });
    offsetY += altura;
  }
  return fatias;
}

/**
 * Exporta a pregação renderizada (com destaques/notas pessoais visíveis)
 * como PDF paginado — rasteriza o DOM inteiro (html2canvas, único jeito
 * viável de capturar fielmente tema/CSS custom properties) e fatia o
 * resultado em páginas A4 reais (não 1 página gigante do tamanho do scroll
 * inteiro — arquivo de ~88MB numa pregação normal, inviável pra
 * compartilhar/guardar). JPEG em vez de PNG (perda imperceptível em texto,
 * arquivo bem menor).
 *
 * `html2canvas`/`jspdf` importados dinamicamente — juntos passam de 400KB
 * minificados, peso desproporcional pra quem nunca clica em exportar (router
 * do projeto não faz code-split por rota, ver CLAUDE.md — sem isso os dois
 * entrariam no chunk principal, carregado por todo mundo sempre).
 *
 * `elementosParaOcultar` (header sticky, nav inferior fixo) precisa ser
 * escondido antes da captura e restaurado depois — html2canvas não trata
 * `position: sticky`/`fixed` como fixo de verdade num elemento mais alto que
 * a viewport, resultando na barra "congelada" na posição de scroll do
 * momento do clique, duplicada/sobreposta no meio da imagem exportada.
 * `visibility: hidden` (não `display: none`) evita reflow do resto do
 * conteúdo durante a captura.
 *
 * Download via `pdf.save()` (blob + `<a download>` interno do jsPDF) —
 * confiável em web/PWA; comportamento em WebView Capacitor nativo ainda não
 * testado em device físico (ver CLAUDE.md, pendência registrada).
 */
export async function exportarPdf(
  elemento: HTMLElement,
  nomeArquivo: string,
  elementosParaOcultar: HTMLElement[] = [],
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const visibilidadeOriginal = elementosParaOcultar.map((el) => el.style.visibility);
  for (const el of elementosParaOcultar) {
    el.style.visibility = 'hidden';
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(elemento, { scale: 1.5, useCORS: true });
  } finally {
    elementosParaOcultar.forEach((el, i) => {
      el.style.visibility = visibilidadeOriginal[i];
    });
  }

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const escala = LARGURA_A4_PT / canvas.width;
  const alturaFatiaPx = Math.floor(ALTURA_A4_PT / escala);
  const fatias = calcularFatiasPagina(canvas.height, alturaFatiaPx);

  const canvasFatia = document.createElement('canvas');
  canvasFatia.width = canvas.width;
  const ctxFatia = canvasFatia.getContext('2d');
  if (!ctxFatia) return;

  fatias.forEach(({ offsetY, altura }, i) => {
    canvasFatia.height = altura;
    ctxFatia.clearRect(0, 0, canvasFatia.width, altura);
    ctxFatia.drawImage(canvas, 0, offsetY, canvas.width, altura, 0, 0, canvas.width, altura);

    if (i > 0) pdf.addPage();
    pdf.addImage(
      canvasFatia.toDataURL('image/jpeg', 0.85),
      'JPEG',
      0,
      0,
      LARGURA_A4_PT,
      altura * escala,
    );
  });

  pdf.save(`${nomeArquivo}.pdf`);
}
