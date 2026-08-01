import { Link } from '../router/Router';
import { Icon } from '../icons/Icon';
import styles from './CatalogCard.module.css';

interface CatalogCardProps {
  to: string;
  icone?: string;
  titulo: string;
  meta?: string;
}

/** Card compartilhado por Quebra-gelos e Utilitários — docs/mock-aprovado-v2.html §Módulo 2/3. */
export function CatalogCard({ to, icone, titulo, meta }: CatalogCardProps) {
  return (
    <Link to={to} className={styles.card}>
      {icone && (
        <div className={styles.icone}>
          <Icon name={icone} />
        </div>
      )}
      <div className={styles.titulo}>{titulo}</div>
      {meta && <div className={styles.meta}>{meta}</div>}
    </Link>
  );
}
