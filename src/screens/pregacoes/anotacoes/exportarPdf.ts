/**
 * Exporta a pregação renderizada (com destaques/notas pessoais visíveis)
 * como PDF de página única — rasteriza o DOM inteiro (html2canvas, único
 * jeito viável de capturar fielmente tema/CSS custom properties) e embute
 * como imagem num PDF do mesmo tamanho (jsPDF). Ver spec de anotações
 * pessoais §Exportar como PDF: V1 exporta a tela como está, sem recorte.
 *
 * `html2canvas`/`jspdf` importados dinamicamente — juntos passam de 400KB
 * minificados, peso desproporcional pra quem nunca clica em exportar (router
 * do projeto não faz code-split por rota, ver CLAUDE.md — sem isso os dois
 * entrariam no chunk principal, carregado por todo mundo sempre).
 *
 * Download via `pdf.save()` (blob + `<a download>` interno do jsPDF) —
 * confiável em web/PWA; comportamento em WebView Capacitor nativo ainda não
 * testado em device físico (ver CLAUDE.md, pendência registrada).
 */
export async function exportarPdf(elemento: HTMLElement, nomeArquivo: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(elemento, { scale: 2, useCORS: true });
  const imagem = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    unit: 'px',
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imagem, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${nomeArquivo}.pdf`);
}
