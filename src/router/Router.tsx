import {
  createContext,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Router mínimo para as ~4 rotas do app — evita puxar react-router (e a
// superfície de CVEs do seu modo de framework/RSC, que não usamos) para
// uma necessidade de navegação trivial. Ver CLAUDE.md.

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

const ULTIMA_ROTA_KEY = 'ultimaRota';

/**
 * Só nativo: o WebView do Capacitor não é um browser real navegando entre
 * URLs — quando o processo do app morre (background, memória) e o Android
 * recria a Activity, o WebView recarrega `https://localhost/` do zero,
 * perdendo qualquer path de `pushState` (`window.location.pathname` volta
 * a ser `/`). Confirmado em device físico, 2026-08-14: reload/suspensão do
 * app sempre derrubava o usuário de volta pra Biblioteca, mesmo depois do
 * fix de reidratação do Spicy — porque o Organizador nem chegava a
 * remontar, o roteador inteiro já tinha esquecido a rota. Web/PWA não
 * precisa disso: um reload de página real já preserva a URL sozinho.
 */
function lerRotaInicial(): string {
  const atual = window.location.pathname;
  if (!Capacitor.isNativePlatform() || atual !== '/') return atual;
  const salva = localStorage.getItem(ULTIMA_ROTA_KEY);
  if (!salva) return atual;
  window.history.replaceState({}, '', salva);
  return salva;
}

function persistirRota(to: string): void {
  if (!Capacitor.isNativePlatform()) return;
  localStorage.setItem(ULTIMA_ROTA_KEY, to);
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(lerRotaInicial);

  useEffect(() => {
    persistirRota(path);
  }, [path]);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Capacitor não navega o histórico do WebView sozinho no botão físico de
  // voltar do Android (mudou a partir da v4) — sem isso, o botão fecha o app
  // direto pra home screen em vez de voltar uma tela, mesmo tendo entradas
  // no histórico (pushState de navigate() acima). Não roda em web/PWA — lá o
  // navegador já trata o botão voltar nativamente.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let mounted = true;
    let handle: { remove: () => void } | undefined;
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    }).then((h) => {
      if (mounted) handle = h;
      else h.remove();
    });
    return () => {
      mounted = false;
      handle?.remove();
    };
  }, []);

  const navigate = (to: string) => {
    if (to !== window.location.pathname) {
      window.history.pushState({}, '', to);
    }
    setPath(to);
    window.scrollTo(0, 0);
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter deve ser usado dentro de RouterProvider');
  return ctx;
}

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

/** Sempre intercepta o clique — nunca confia na navegação default do <a>. */
export function Link({ to, children, className }: LinkProps) {
  const { navigate } = useRouter();
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}

/** Casa um path com um padrão tipo "/pregacoes/:id". Retorna os params ou null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    const v = pathParts[i];
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(v);
    } else if (p !== v) {
      return null;
    }
  }
  return params;
}
