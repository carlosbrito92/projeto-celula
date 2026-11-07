import type { VercelResponse } from '@vercel/node';

/**
 * Origem liberada (`*`) em toda rota: o app roda empacotado via Capacitor
 * (WebView nunca é servido do domínio Vercel) e via PWA/browser.
 *
 * Rotas de leitura: dado público, sem downside. Rota editorial (POST): `*`
 * também é seguro porque a autenticação é um header explícito
 * (X-Editorial-Codigo), não cookie — nenhum site de terceiro consegue agir
 * em nome do líder sem já conhecer o código.
 */
export function setCors(
  res: VercelResponse,
  opcoes: { metodos?: string; headers?: string } = {},
): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', opcoes.metodos ?? 'GET, OPTIONS');
  if (opcoes.headers) res.setHeader('Access-Control-Allow-Headers', opcoes.headers);
}
