// Copiar e baixar texto no navegador. O Clipboard API exige contexto seguro e
// às vezes permissão (WebView); o fallback com textarea + execCommand cobre o
// resto. Download via <a download> não foi testado no app nativo (mesma
// pendência do PDF das anotações, CLAUDE.md): por isso "Copiar" vem primeiro.

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // cai no fallback
  }
  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

export function baixarTexto(nome: string, texto: string, tipo = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([texto], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nome de arquivo a partir do tema (mesma ideia de slugArquivo em api/_lib/github.ts). */
export function nomeArquivo(tema: string, extensao = 'json'): string {
  const base = tema
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `${base || 'pregacao'}.${extensao}`;
}
