import type { PregacaoConteudo } from '../../content/types';
import { BlockRenderer } from '../../content/BlockRenderer';
import { ComponenteTemaRenderer } from '../../content/ComponenteTemaRenderer';
import { AnnotationBox } from '../../content/AnnotationBox';
import { MerchSection } from '../../content/MerchSection';
import { CelulaBox } from '../../content/CelulaBox';
import { Icon } from '../../icons/Icon';
import { scrollToId } from './useLeituraNav';
import styles from './Reading.module.css';

// Corpo da Leitura (do selo da série ao rodapé), sem header sticky, trilha,
// anotações nem navegação inferior. Compartilhado pela tela de Leitura e pela
// prévia do editor (src/screens/editorial/Previa.tsx): a prévia mostra
// exatamente o que o leitor vai ver, sem uma segunda implementação para manter.

export const RESUMO_ID = 'resumo-final';

export function ConteudoLeitura({
  serie,
  conteudo,
  pregador,
  dataExibicao,
  aoAbrirResumo,
}: {
  serie: string | null | undefined;
  conteudo: PregacaoConteudo;
  pregador: string | null | undefined;
  dataExibicao: string | null | undefined;
  /** Ausente = sem resumo para abrir (o botão "Ler versão resumida" some). */
  aoAbrirResumo?: () => void;
}) {
  const temResumo = (conteudo.resumo_final?.length ?? 0) > 0;
  return (
    <>
      {serie && <span className={styles.badge}>{serie}</span>}

      {conteudo.banner_intro?.componente_tema && (
        <ComponenteTemaRenderer
          bloco={{
            tipo: 'componente_tema',
            ...conteudo.banner_intro.componente_tema,
          }}
        />
      )}

      {conteudo.banner_intro?.contextualizacao && (
        <div className={styles.bannerContextualizacao}>{conteudo.banner_intro.contextualizacao}</div>
      )}

      {conteudo.banner_intro && <div className={styles.banner}>{conteudo.banner_intro.frase_sintese}</div>}

      {conteudo.banner_intro?.versiculo_ancora && (
        <div className={styles.versiculoAncora}>
          <div className={styles.versiculoAncoraTexto}>“{conteudo.banner_intro.versiculo_ancora.texto}”</div>
          <div className={styles.versiculoAncoraReferencia}>{conteudo.banner_intro.versiculo_ancora.referencia}</div>
        </div>
      )}

      {aoAbrirResumo && (
        // Restaurado: o PR #64 trocou o CTA por um <button> sem estilo (classe inexistente).
        <button type="button" className={styles.resumoCurtoCta} onClick={aoAbrirResumo}>
          <Icon name="book-open" />
          <div className={styles.resumoCurtoCtaTextos}>
            <div className={styles.resumoCurtoCtaEyebrow}>Sem tempo para o texto completo?</div>
            <div className={styles.resumoCurtoCtaTitulo}>Ler versão resumida</div>
          </div>
        </button>
      )}

      <div id="indice">
        <div className={styles.indiceLabel}>Índice</div>
        <div className={styles.indiceGrid}>
          {conteudo.mapa_pontos.map((ponto) =>
            ponto.pendente ? (
              <div key={ponto.id} className={`${styles.indiceCard} ${styles.indiceCardPendente}`}>
                <span className={styles.indiceNumero}>{ponto.numero}</span>
                <span className={styles.indiceTitulo}>{ponto.titulo}</span>
              </div>
            ) : (
              <button key={ponto.id} type="button" className={styles.indiceCard} onClick={() => scrollToId(ponto.id)}>
                <span className={styles.indiceNumero}>{ponto.numero}</span>
                <span className={styles.indiceTitulo}>{ponto.titulo}</span>
              </button>
            ),
          )}
          {temResumo && (
            <button type="button" className={styles.indiceCard} onClick={() => scrollToId(RESUMO_ID)}>
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
              {secao.sec_eyebrow && <div className={styles.secaoEyebrow}>{secao.sec_eyebrow}</div>}
              <div className={styles.secaoTopo}>
                <span className={styles.secaoNumero}>{secao.numero}</span>
                <span className={styles.secaoBarra} />
              </div>
              <div className={styles.secaoTitulo}>{secao.titulo}</div>
              {secao.referencias && <div className={styles.secaoReferencias}>{secao.referencias}</div>}
            </div>
            <div className={styles.secaoCorpo}>
              {secao.corpo.map((bloco, i) => (
                <BlockRenderer key={i} bloco={bloco} secaoId={secao.id} blocoIndex={i} />
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

      {temResumo && (
        <div id={RESUMO_ID} className={styles.resumo}>
          <div className={styles.indiceLabel}>Resumo final</div>
          <ul className={styles.resumoLista}>
            {conteudo.resumo_final!.map((item, i) => (
              <li key={i} className={styles.resumoItem}>
                <div>{item.ponto}</div>
                {item.versiculo_ancora && <div className={styles.resumoAncora}>{item.versiculo_ancora}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <MerchSection dados={conteudo.merch_section} />

      <CelulaBox dados={conteudo.celula_box} />

      {conteudo.banner_intro?.aviso_proxima_serie && (
        <div className={styles.avisoProximaSerie}>
          <span className={styles.avisoProximaSerieIcone} aria-hidden="true">
            ✦
          </span>
          <span>{conteudo.banner_intro.aviso_proxima_serie.texto}</span>
        </div>
      )}

      <div className={styles.footer}>
        {pregador}
        {pregador && dataExibicao && ' · '}
        {dataExibicao}
      </div>
    </>
  );
}
