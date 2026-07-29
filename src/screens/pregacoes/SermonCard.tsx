import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { resolveTema } from '../../themes/registry';
import { formatDataPtBr } from '../../content/parseData';
import type { PregacaoRow } from '../../content/types';
import styles from './SermonCard.module.css';

interface SermonCardProps {
  pregacao: PregacaoRow;
  destaque?: boolean;
}

export function SermonCard({ pregacao, destaque = false }: SermonCardProps) {
  const tema = resolveTema(pregacao.serie);
  const dataExibicao = formatDataPtBr(pregacao.data) ?? pregacao.conteudo.metadados.data;
  const fraseSintese = pregacao.conteudo.banner_intro?.frase_sintese;

  return (
    <ThemeScope tema={tema}>
      <Link
        to={`/pregacoes/${pregacao.id}`}
        className={`${styles.card} ${destaque ? styles.destaque : styles.compacto}`}
      >
        {pregacao.serie && <span className={styles.badge}>{pregacao.serie}</span>}
        <div className={styles.titulo}>{pregacao.tema}</div>
        {destaque && fraseSintese && <div className={styles.sintese}>{fraseSintese}</div>}
        <div className={styles.rodape}>
          {pregacao.pregador && <span className={styles.pregador}>{pregacao.pregador}</span>}
          {pregacao.pregador && dataExibicao && <span>·</span>}
          {dataExibicao && <span>{dataExibicao}</span>}
        </div>
      </Link>
    </ThemeScope>
  );
}
