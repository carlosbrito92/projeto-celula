import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { resolveTema } from '../../themes/registry';
import { usePregacao } from '../../content/usePregacoes';
import { formatDataPtBr } from '../../content/parseData';
import { BlockRenderer } from '../../content/BlockRenderer';
import { ComponenteTemaRenderer } from '../../content/ComponenteTemaRenderer';
import { AnnotationBox } from '../../content/AnnotationBox';
import { MerchSection } from '../../content/MerchSection';
import { useIndiceFab, scrollToId } from './useIndiceFab';
import styles from './Reading.module.css';

const RESUMO_ID = 'resumo-final';

export function Reading({ id }: { id: string }) {
  const { pregacao, erro, carregando } = usePregacao(id);
  const { indiceRef, fabVisivel } = useIndiceFab();

  if (carregando) {
    return <div className={styles.footer}>Carregando…</div>;
  }
  if (erro || !pregacao) {
    return <div className={styles.footer}>Pregação não encontrada.</div>;
  }

  const tema = resolveTema(pregacao.serie);
  const { conteudo } = pregacao;
  const dataExibicao = formatDataPtBr(pregacao.data) ?? conteudo.metadados.data;

  return (
    <ThemeScope tema={tema}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <Link to="/" className={styles.voltar}>
            ←
          </Link>
          <div className={styles.headerInfo}>
            <div className={styles.headerTitulo}>{pregacao.tema}</div>
            <div className={styles.headerMeta}>
              {pregacao.pregador && <span>{pregacao.pregador}</span>}
              {pregacao.pregador && dataExibicao && <span>·</span>}
              {dataExibicao && <span>{dataExibicao}</span>}
              {pregacao.texto_base && <span>· {pregacao.texto_base}</span>}
            </div>
          </div>
        </div>

        {pregacao.serie && <span className={styles.badge}>{pregacao.serie}</span>}

        {conteudo.banner_intro?.componente_tema && (
          <ComponenteTemaRenderer
            bloco={{ tipo: 'componente_tema', ...conteudo.banner_intro.componente_tema }}
          />
        )}

        {conteudo.banner_intro?.contextualizacao && (
          <div className={styles.bannerContextualizacao}>
            {conteudo.banner_intro.contextualizacao}
          </div>
        )}

        {conteudo.banner_intro && (
          <div className={styles.banner}>{conteudo.banner_intro.frase_sintese}</div>
        )}

        <div id="indice" ref={indiceRef}>
          <div className={styles.indiceLabel}>Índice</div>
          <div className={styles.indiceGrid}>
            {conteudo.mapa_pontos.map((ponto) => (
              <button
                key={ponto.id}
                type="button"
                className={styles.indiceCard}
                onClick={() => scrollToId(ponto.id)}
              >
                <span className={styles.indiceNumero}>{ponto.numero}</span>
                <span className={styles.indiceTitulo}>{ponto.titulo}</span>
              </button>
            ))}
            {conteudo.resumo_final && conteudo.resumo_final.length > 0 && (
              <button
                type="button"
                className={styles.indiceCard}
                onClick={() => scrollToId(RESUMO_ID)}
              >
                <span className={styles.indiceNumero}>↓</span>
                <span className={styles.indiceTitulo}>Resumo final</span>
              </button>
            )}
          </div>
        </div>

        <div className={styles.secoes}>
          {conteudo.secoes.map((secao) => (
            <div key={secao.id} id={secao.id} className={styles.secao}>
              <div className={styles.secaoHeader}>
                {secao.sec_eyebrow && (
                  <div className={styles.secaoEyebrow}>{secao.sec_eyebrow}</div>
                )}
                <div className={styles.secaoTopo}>
                  <span className={styles.secaoNumero}>{secao.numero}</span>
                  <span className={styles.secaoBarra} />
                </div>
                <div className={styles.secaoTitulo}>{secao.titulo}</div>
                {secao.referencias && (
                  <div className={styles.secaoReferencias}>{secao.referencias}</div>
                )}
              </div>
              <div className={styles.secaoCorpo}>
                {secao.corpo.map((bloco, i) => (
                  <BlockRenderer key={i} bloco={bloco} />
                ))}
              </div>
              {secao.anotacoes && secao.anotacoes.length > 0 && (
                <div className={styles.secaoAnotacoes}>
                  {secao.anotacoes.map((anotacao, i) => (
                    <AnnotationBox key={i} anotacao={anotacao} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {conteudo.resumo_final && conteudo.resumo_final.length > 0 && (
          <div id={RESUMO_ID} className={styles.resumo}>
            <div className={styles.indiceLabel}>Resumo final</div>
            <ul className={styles.resumoLista}>
              {conteudo.resumo_final.map((item, i) => (
                <li key={i} className={styles.resumoItem}>
                  <div>{item.ponto}</div>
                  {item.versiculo_ancora && (
                    <div className={styles.resumoAncora}>{item.versiculo_ancora}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <MerchSection dados={conteudo.merch_section} />

        <div className={styles.footer}>
          {pregacao.pregador}
          {pregacao.pregador && dataExibicao && ' · '}
          {dataExibicao}
        </div>

        {fabVisivel && (
          <button
            type="button"
            className={styles.fab}
            onClick={() => scrollToId('indice')}
          >
            ☰ Índice
          </button>
        )}
      </div>
    </ThemeScope>
  );
}
