import { useUtilitariosCatalogo } from '../../content/useQuebraGelos';
import type { UtilitarioCatalogoConteudo } from '../../content/types';
import { CatalogCard } from '../CatalogCard';
import styles from './Catalogo.module.css';

export function Catalogo() {
  const { utilitarios, erro } = useUtilitariosCatalogo();

  return (
    <div className={styles.wrapper}>
      <div className={styles.titulo}>Utilitários</div>

      {erro && <div className={styles.vazio}>Não foi possível carregar os utilitários.</div>}
      {!erro && utilitarios === null && <div className={styles.vazio}>Carregando…</div>}
      {!erro && utilitarios !== null && utilitarios.length === 0 && (
        <div className={styles.vazio}>Nenhum utilitário cadastrado ainda.</div>
      )}

      {utilitarios && utilitarios.length > 0 && (
        <div className={styles.grid}>
          {utilitarios.map((u) => {
            const conteudo = u.conteudo as UtilitarioCatalogoConteudo;
            return (
              <CatalogCard
                key={u.id}
                to={`/utilitarios/${u.id}`}
                icone={conteudo.icone}
                titulo={u.nome}
                meta={conteudo.descricao_curta}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
