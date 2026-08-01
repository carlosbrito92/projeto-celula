import type { VercelResponse } from '@vercel/node';

/**
 * Dado público, somente leitura — sem downside de segurança em liberar
 * qualquer origem. Necessário porque o app roda empacotado via Capacitor
 * (WebView nunca é servido do domínio Vercel) e via PWA/browser.
 */
export function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}
