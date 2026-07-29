import type { MerchSectionData } from './types';
import styles from './MerchSection.module.css';

/**
 * Diferente de um `componente_tema`: é uma seção própria anexada ao final
 * do documento (após o resumo final), não um bloco dentro de `secoes[]`.
 */
export function MerchSection({ dados }: { dados: MerchSectionData | null | undefined }) {
  if (!dados || dados.itens.length === 0) return null;

  return (
    <div className={styles.secao}>
      {dados.titulo && <div className={styles.titulo}>{dados.titulo}</div>}
      <div className={styles.itens}>
        {dados.itens.map((item, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.icone} aria-hidden="true">
              {item.icone}
            </span>
            <div>
              <div className={styles.itemTitulo}>{item.titulo}</div>
              <div className={styles.itemDescricao}>{item.descricao}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
