import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { resolveTema } from '../../themes/registry';
import { usePregacao } from '../../content/usePregacoes';
import { formatDataPtBr } from '../../content/parseData';
import { consumirRetomar, lerUltimaLeitura, PROGRESSO_MINIMO, salvarUltimaLeitura } from '../../content/ultimaLeitura';
import { Icon } from '../../icons/Icon';
import { scrollToId, useScrollProgress, useSecaoAtiva } from './useLeituraNav';
import { ResumoCurtoOverlay } from './ResumoCurtoOverlay';
import { ConteudoLeitura, RESUMO_ID } from './ConteudoLeitura';
import { useAnotacoes } from './anotacoes/useAnotacoes';
import { AnotacaoContext, type SelecaoNova } from './anotacoes/AnotacaoContext';
import { AnotacaoPopover, type PopoverEstado } from './anotacoes/AnotacaoPopover';
import { ListaAnotacoes } from './anotacoes/ListaAnotacoes';
import { exportarPdf } from './anotacoes/exportarPdf';
import { Dica } from '../../onboarding/Dica';
import { useDica } from '../../onboarding/useDica';
import { marcarDicaVista } from '../../onboarding/dicasStorage';
import { DICA_AA, DICA_ANOTACOES, TEXTO_DICA, useDicaDaAbertura } from '../../onboarding/dicasLeitura';
import styles from './Reading.module.css';

const ESCALAS_FONTE = [1, 1.15, 1.3];

const CLASSE_DICA = {
  [DICA_AA]: styles.dicaAa,
  [DICA_ANOTACOES]: styles.dicaAnotacoes,
};

export function Reading({ id }: { id: string }) {
  const { pregacao, erro, carregando } = usePregacao(id);
  const [escalaIndex, setEscalaIndex] = useState(0);
  const [resumoCurtoAberto, setResumoCurtoAberto] = useState(false);
  const [popoverEstado, setPopoverEstado] = useState<PopoverEstado | null>(null);
  const [listaAnotacoesAberta, setListaAnotacoesAberta] = useState(false);
  const [exportando, setExportando] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headerStickyRef = useRef<HTMLDivElement>(null);
  const navInferiorRef = useRef<HTMLElement>(null);

  // Hooks precisam rodar sempre, antes dos returns condicionais abaixo (carregando/erro)
  // — mesma disciplina do useIndiceFab que este hook substitui.
  const secoes = pregacao?.conteudo.secoes ?? [];
  const temResumo = (pregacao?.conteudo.resumo_final?.length ?? 0) > 0;
  const anotacoes = useAnotacoes(id, secoes);

  const pontosNavegaveis = useMemo(() => {
    const base = secoes.map((s) => ({ id: s.id, numero: s.numero, titulo: s.titulo }));
    if (temResumo) {
      base.push({ id: RESUMO_ID, numero: '↓', titulo: 'Resumo final' });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secoes, temResumo]);

  const idsNavegaveis = useMemo(() => pontosNavegaveis.map((p) => p.id), [pontosNavegaveis]);
  const ativoIndex = useSecaoAtiva(idsNavegaveis, resumoCurtoAberto);
  const progresso = useScrollProgress();

  // Dica de uso: uma por abertura, só com o conteúdo carregado. A escolha fica
  // aqui (o Reading não desmonta com o resumo aberto); a visibilidade vem do
  // storage (useDica), porque a árvore abaixo remonta.
  const dicaDaAbertura = useDicaDaAbertura(id, !!pregacao);
  const dica = useDica(dicaDaAbertura);

  // "Continuar lendo" da página inicial (src/content/ultimaLeitura.ts): grava a
  // cada 5% de rolagem ou troca de ponto, e só depois que o leitor começou a ler.
  const pronta = !!pregacao;
  const degrau = Math.floor(progresso / 5);
  useEffect(() => {
    if (!pronta || progresso < PROGRESSO_MINIMO) return;
    salvarUltimaLeitura({
      id,
      progresso: Math.round(progresso),
      pontoId: idsNavegaveis[ativoIndex] ?? null,
      ponto: Math.min(ativoIndex + 1, secoes.length),
      totalPontos: secoes.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pronta, degrau, ativoIndex]);

  // Aberta por "Continuar lendo": volta ao ponto onde o leitor parou.
  useEffect(() => {
    if (!pronta || !consumirRetomar(id)) return;
    const pontoId = lerUltimaLeitura()?.id === id ? lerUltimaLeitura()?.pontoId : null;
    if (pontoId) requestAnimationFrame(() => scrollToId(pontoId));
  }, [id, pronta]);

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

  const anotacaoContextValue = {
    modoAnotacao: anotacoes.modoAnotacao,
    destaquesPorUnidade: anotacoes.destaquesPorUnidade,
    iniciarSelecao: (selecao: SelecaoNova) => setPopoverEstado({ tipo: 'nova', ...selecao }),
    abrirDestaque: (destaqueId: string, rect: DOMRect) =>
      setPopoverEstado({ tipo: 'editar', id: destaqueId, rect }),
  };

  const popoverChave = !popoverEstado
    ? null
    : popoverEstado.tipo === 'nova'
      ? `nova:${popoverEstado.secaoId}:${popoverEstado.unidade}:${popoverEstado.offsetInicio}:${popoverEstado.offsetFim}`
      : `editar:${popoverEstado.id}`;

  const resumoParaExibir = conteudo.resumo_lider ?? conteudo.resumo_curto;

  if (resumoCurtoAberto && resumoParaExibir) {
    return (
      <ResumoCurtoOverlay
        resumo={resumoParaExibir}
        aoFechar={() => setResumoCurtoAberto(false)}
      />
    );
  }

  if (listaAnotacoesAberta) {
    return (
      <ThemeScope tema={tema}>
        <ListaAnotacoes
          secoes={secoes}
          api={anotacoes}
          aoFechar={() => setListaAnotacoesAberta(false)}
        />
      </ThemeScope>
    );
  }

  return (
    <ThemeScope tema={tema}>
      <AnotacaoContext.Provider value={anotacaoContextValue}>
      <div
        ref={wrapperRef}
        className={styles.wrapper}
        style={{ '--leitura-escala': ESCALAS_FONTE[escalaIndex] } as CSSProperties}
      >
        <div ref={headerStickyRef} className={styles.headerSticky}>
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
            <div className={styles.headerAcoes}>
              <button
                type="button"
                className={styles.botaoFonte}
                aria-label="Ajustar tamanho da fonte de leitura"
                onClick={() => {
                  setEscalaIndex((i) => (i + 1) % ESCALAS_FONTE.length);
                  marcarDicaVista(DICA_AA);
                }}
              >
                Aa
              </button>
              <button
                type="button"
                className={`${styles.botaoIcone} ${anotacoes.modoAnotacao ? styles.botaoIconeAtivo : ''}`}
                aria-label={
                  anotacoes.modoAnotacao ? 'Desativar modo de anotação' : 'Ativar modo de anotação'
                }
                aria-pressed={anotacoes.modoAnotacao}
                onClick={() => {
                  anotacoes.alternarModoAnotacao();
                  marcarDicaVista(DICA_ANOTACOES);
                }}
              >
                <Icon name="pen-line" />
              </button>
              <button
                type="button"
                className={styles.botaoIcone}
                aria-label="Ver minhas anotações"
                onClick={() => setListaAnotacoesAberta(true)}
              >
                <Icon name="notebook-pen" />
              </button>
              <button
                type="button"
                className={styles.botaoIcone}
                aria-label="Exportar pregação como PDF"
                disabled={exportando}
                onClick={async () => {
                  if (!wrapperRef.current) return;
                  setExportando(true);
                  try {
                    const ocultar = [headerStickyRef.current, navInferiorRef.current].filter(
                      (el): el is HTMLElement => el !== null,
                    );
                    await exportarPdf(wrapperRef.current, pregacao.tema, ocultar);
                  } finally {
                    setExportando(false);
                  }
                }}
              >
                <Icon name="file-down" />
              </button>
            </div>
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

          {/* Dentro do header sticky de propósito: o export de PDF oculta o
              header (visibility), então a dica some junto; e fica fora do
              conteúdo anotável, sem tocar na seleção de texto. */}
          {dica.visivel && dicaDaAbertura && (
            <Dica
              texto={TEXTO_DICA[dicaDaAbertura]}
              aoEntender={dica.dispensar}
              className={CLASSE_DICA[dicaDaAbertura]}
            />
          )}
        </div>

        {anotacoes.modoAnotacao && (
          <div className={styles.hintAnotacao}>
            Modo de anotação ativo — selecione um trecho de texto pra grifar. Toque na caneta de
            novo pra sair.
          </div>
        )}

        <ConteudoLeitura
          serie={pregacao.serie}
          conteudo={conteudo}
          pregador={pregacao.pregador}
          dataExibicao={dataExibicao}
          aoAbrirResumo={resumoParaExibir ? () => setResumoCurtoAberto(true) : undefined}
        />

        {(anterior || proximo) && (
          <nav ref={navInferiorRef} className={styles.navInferior} aria-label="Navegação entre tópicos">
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
      {popoverEstado && (
        <AnotacaoPopover
          key={popoverChave}
          estado={popoverEstado}
          api={anotacoes}
          aoFechar={() => setPopoverEstado(null)}
        />
      )}
      </AnotacaoContext.Provider>
    </ThemeScope>
  );
}
