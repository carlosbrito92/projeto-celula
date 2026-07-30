import { useRouter } from '../../router/Router';
import { useUtilitarioCatalogo } from '../../content/useQuebraGelos';
import type { UtilitarioCatalogoConteudo } from '../../content/types';
import { SorteioAtribuicao } from '../../utilitarios/sorteioAtribuicao/SorteioAtribuicao';
import { SorteioPapel } from '../../utilitarios/sorteioPapel/SorteioPapel';
import { Cronometro } from '../../utilitarios/cronometro/Cronometro';
import styles from './Catalogo.module.css';

export function UtilitarioScreen({ id }: { id: string }) {
  const { navigate } = useRouter();
  const { utilitario, erro, carregando } = useUtilitarioCatalogo(id);
  const aoFechar = () => navigate('/utilitarios');

  if (erro) return <div className={styles.vazio}>Não foi possível carregar este utilitário.</div>;
  if (carregando || !utilitario) return <div className={styles.vazio}>Carregando…</div>;

  const conteudo = utilitario.conteudo as UtilitarioCatalogoConteudo;

  switch (conteudo.utilitario_tipo) {
    case 'sorteio_atribuicao':
      return <SorteioAtribuicao aoFechar={aoFechar} />;
    case 'sorteio_papel':
      return <SorteioPapel aoFechar={aoFechar} />;
    case 'cronometro':
      return <Cronometro aoFechar={aoFechar} />;
    default:
      return <div className={styles.vazio}>Utilitário desconhecido.</div>;
  }
}
