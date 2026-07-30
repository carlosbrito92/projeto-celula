import { RouterProvider, matchPath, useRouter } from './router/Router';
import { ThemeScope } from './themes/ThemeScope';
import { PADRAO_MINC } from './themes/registry';
import { AppShell } from './screens/AppShell';
import { ComingSoon } from './screens/ComingSoon';
import { Library } from './screens/pregacoes/Library';
import { Reading } from './screens/pregacoes/Reading';
import { Catalogo as UtilitarioCatalogo } from './screens/utilitarios/Catalogo';
import { UtilitarioScreen } from './screens/utilitarios/UtilitarioScreen';

function Screens() {
  const { path } = useRouter();

  const pregacaoParams = matchPath('/pregacoes/:id', path);
  if (pregacaoParams) return <Reading id={pregacaoParams.id} />;
  if (path === '/quebra-gelos') return <ComingSoon titulo="Quebra-gelos" />;

  const utilitarioParams = matchPath('/utilitarios/:id', path);
  if (utilitarioParams) return <UtilitarioScreen id={utilitarioParams.id} />;
  if (path === '/utilitarios') return <UtilitarioCatalogo />;

  return <Library />;
}

export default function App() {
  return (
    <RouterProvider>
      <ThemeScope tema={PADRAO_MINC}>
        <AppShell>
          <Screens />
        </AppShell>
      </ThemeScope>
    </RouterProvider>
  );
}
