import { Suspense, lazy } from 'react';
import { RouterProvider, matchPath, useRouter } from './router/Router';
import { ThemeScope } from './themes/ThemeScope';
import { PADRAO_MINC } from './themes/registry';
import { AppShell } from './screens/AppShell';
import { Library } from './screens/pregacoes/Library';
import { Reading } from './screens/pregacoes/Reading';
import { Catalogo as UtilitarioCatalogo } from './screens/utilitarios/Catalogo';
import { UtilitarioScreen } from './screens/utilitarios/UtilitarioScreen';
import { Catalogo as QuebraGeloCatalogo } from './screens/quebraGelos/Catalogo';
import { Detalhe as QuebraGeloDetalhe } from './screens/quebraGelos/Detalhe';

// Lazy: playroomkit sozinho adiciona ~800kB ao bundle — ninguém que usa a V1
// deve baixar isso sem nunca visitar /v2. Code-split mantém o chunk principal
// do tamanho de sempre.
const QuemSouEuLobby = lazy(() =>
  import('./multiplayer/quemSouEu/Lobby').then((m) => ({ default: m.QuemSouEuLobby })),
);
const ArtistaImpostorLobby = lazy(() =>
  import('./multiplayer/artistaImpostor/Lobby').then((m) => ({ default: m.ArtistaImpostorLobby })),
);
const SpicyLobby = lazy(() => import('./multiplayer/spicy/Lobby').then((m) => ({ default: m.SpicyLobby })));

function Screens() {
  const { path } = useRouter();

  const pregacaoParams = matchPath('/pregacoes/:id', path);
  if (pregacaoParams) return <Reading id={pregacaoParams.id} />;

  const jogoParams = matchPath('/quebra-gelos/:id', path);
  if (jogoParams) return <QuebraGeloDetalhe id={jogoParams.id} />;
  if (path === '/quebra-gelos') return <QuebraGeloCatalogo />;

  const utilitarioParams = matchPath('/utilitarios/:id', path);
  if (utilitarioParams) return <UtilitarioScreen id={utilitarioParams.id} />;
  if (path === '/utilitarios') return <UtilitarioCatalogo />;

  return <Library />;
}

// V2 fica fora do AppShell/ThemeScope da V1 (sem tab bar, sem tema definido
// ainda) — protótipo isolado, alcançável só por URL direta enquanto não
// entra no roteamento real do produto.
function Root() {
  const { path } = useRouter();
  if (path === '/v2/quem-sou-eu') {
    return (
      <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
        <QuemSouEuLobby />
      </Suspense>
    );
  }
  if (path === '/v2/artista-impostor') {
    return (
      <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
        <ArtistaImpostorLobby />
      </Suspense>
    );
  }
  if (path === '/v2/spicy') {
    return (
      <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
        <SpicyLobby />
      </Suspense>
    );
  }

  return (
    <ThemeScope tema={PADRAO_MINC}>
      <AppShell>
        <Screens />
      </AppShell>
    </ThemeScope>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <Root />
    </RouterProvider>
  );
}
