// URL absoluta hardcoded — mesma convenção do antigo anon key do Supabase
// (config pública, sem valor de sigilo, não precisa de env var). Necessário:
// o Capacitor WebView nunca é servido a partir do domínio Vercel, então um
// path relativo quebraria especificamente no build empacotado.
const API_BASE_URL = 'https://projeto-celula.vercel.app/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path} respondeu ${res.status}`);
  }
  return res.json() as Promise<T>;
}
