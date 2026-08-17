import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { resolveTema } from '../../themes/registry';
import { usePregacao } from '../../content/usePregacoes';
import { formatDataPtBr } from '../../content/parseData';
import { BlockRenderer } from '../../content/BlockRenderer';
import { ComponenteTemaRenderer } from '../../content/ComponenteTemaRenderer';
import { AnnotationBox } from '../../content/AnnotationBox';
import { MerchSection } from '../../content/MerchSection';
import { CelulaBox } from '../../content/CelulaBox';
import { scrollToId, useScrollProgress, useSecaoAtiva } from './useLeituraNav';
import styles from './Reading.module.css';

const RESUMO_ID = 'resumo-final';
const ESCALAS_FONTE = [1, 1.15, 1.3];

export function Reading({ id }: { id: string }) {
  const { pregacao, erro, carregando } = usePregacao(id);
  const [escalaIndex, setEscalaIndex] = useState(0);

  // Hooks precisam rodar sempre, antes dos returns condicionais abaixo (carregando/erro)
  // — mesma disciplina do useIndiceFab que este hook substitui.
  const secoes = pregacao?.conteudo.secoes ?? [];
  const temResumo = (pregacao?.conteudo.resumo_final?.length ?? 0) > 0;

  const pontosNavegaveis = useMemo(() => {
    const base = secoes.map((s) => ({ id: s.id, numero: s.numero, titulo: s.titulo }));
    if (temResumo) {
      base.push({ id: RESUMO_ID, numero: '↓', titulo: 'Resumo final' });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secoes, temResumo]);

  const idsNavegaveis = useMemo(() => pontosNavegaveis.map((p) => p.id), [pontosNavegaveis]);
  const ativoIndex = useSecaoAtiva(idsNavegaveis);
  const progresso = useScrollProgress();

  if (carregando) {
    return <div className={styles.footer}>Carregando…</div>;
  }
  if (erro || !pregacao) {
    return <div className={styles.footer}>Pregação não encontrada.</div>;
  }

  const tema = resolveTema(pregacao.serie, pregacao.conteudo.metadados.tema_override);
  const { conteudo } = pregacao;
  const dataExibicao = formatDataPtBr(pregacao.data) ?? conteudo.metadados.data;

  const anterior = pontosNavegaveis[ativoIndex - 1] ?? null;
  const proximo = pontosNavegaveis[ativoIndex + 1] ?? null;

  return (
    <ThemeScope tema={tema}>
      <div
        className={styles.wrapper}
        style={{ '--leitura-escala': ESCALAS_FONTE[escalaIndex] } as CSSProperties}
      >
        <div className={styles.headerSticky}>
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
            <button
              type="button"
              className={styles.botaoFonte}
              aria-label="Ajustar tamanho da fonte de leitura"
              onClick={() => setEscalaIndex((i) => (i + 1) % ESCALAS_FONTE.length)}
            >
              Aa
            </button>
          </div>

          {conteudo.mapa_pontos.length > 0 && (
            <nav className={styles.trilha} aria-label="Trilha de tópicos">
              {conteudo.mapa_pontos.map((ponto) => {
                const indexNav = idsNavegaveis.indexOf(ponto.id);
                const ativo = indexNav !== -1 && indexNav === ativoIndex;
                return ponto.pendente ? (
                  <div key={ponto.id} className={`${styles.chip} ${styles.chipPendente}`}>
                    <span className={styles.chipNumero}>{ponto.numero}</span>
                    <span className={styles.chipTitulo}>{ponto.titulo}</span>
                  </div>
                ) : (
                  <button
                    key={ponto.id}
                    type="button"
                    className={`${styles.chip} ${ativo ? styles.chipAtivo : ''}`}
                    onClick={() => scrollToId(ponto.id)}
                  >
                    <span className={styles.chipNumero}>{ponto.numero}</span>
                    <span className={styles.chipTitulo}>{ponto.titulo}</span>
                  </button>
                );
              })}
              {temResumo && (
                <button
                  type="button"
                  className={`${styles.chip} ${
                    ativoIndex === idsNavegaveis.length - 1 ? styles.chipAtivo : ''
                  }`}
                  onClick={() => scrollToId(RESUMO_ID)}
                >
                  <span className={styles.chipNumero}>↓</span>
                  <span className={styles.chipTitulo}>Resumo final</span>
                </button>
              )}
            </nav>
          )}

          <div className={styles.progressoBarra}>
            <div className={styles.progressoPreenchimento} style={{ width: `${progresso}%` }} />
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

        {conteudo.banner_intro?.versiculo_ancora && (
          <div className={styles.versiculoAncora}>
            <div className={styles.versiculoAncoraTexto}>
              “{conteudo.banner_intro.versiculo_ancora.texto}”
            </div>
            <div className={styles.versiculoAncoraReferencia}>
              {conteudo.banner_intro.versiculo_ancora.referencia}
            </div>
          </div>
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
                <button
                  key={ponto.id}
                  type="button"
                  className={styles.indiceCard}
                  onClick={() => scrollToId(ponto.id)}
                >
                  <span className={styles.indiceNumero}>{ponto.numero}</span>
                  <span className={styles.indiceTitulo}>{ponto.titulo}</span>
                </button>
              ),
            )}
            {temResumo && (
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

        {temResumo && (
          <div id={RESUMO_ID} className={styles.resumo}>
            <div className={styles.indiceLabel}>Resumo final</div>
            <ul className={styles.resumoLista}>
              {conteudo.resumo_final!.map((item, i) => (
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
          {pregacao.pregador}
          {pregacao.pregador && dataExibicao && ' · '}
          {dataExibicao}
        </div>

        {(anterior || proximo) && (
          <nav className={styles.navInferior} aria-label="Navegação entre tópicos">
            <button
              type="button"
              className={styles.navBotao}
              aria-label="Tópico anterior"
              disabled={!anterior}
              onClick={() => anterior && scrollToId(anterior.id)}
            >
              ‹
            </button>
            <div className={styles.navCentro}>
              {proximo ? (
                <>
                  <span className={styles.navLabel}>Próximo · Tópico {proximo.numero}</span>
                  <span className={styles.navTitulo}>{proximo.titulo}</span>
                </>
              ) : (
                <span className={styles.navLabel}>Fim da mensagem</span>
              )}
            </div>
            <button
              type="button"
              className={styles.navBotao}
              aria-label="Próximo tópico"
              disabled={!proximo}
              onClick={() => proximo && scrollToId(proximo.id)}
            >
              ›
            </button>
          </nav>
        )}
      </div>
    </ThemeScope>
  );
}
