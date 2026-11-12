import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { usePregacoes } from '../../content/usePregacoes';
import { filterPregacoes } from '../../content/librarySearch';
import {
  capituloCurto,
  corDaPregacao,
  daSerie,
  dataCurta,
  montarInicio,
  pregadorCurto,
  SERIE_AVULSA,
  seriesDoFiltro,
  type Serie,
} from '../../content/inicio';
import { lerUltimaLeitura, marcarRetomar, PROGRESSO_LIDO } from '../../content/ultimaLeitura';
import type { PregacaoRow } from '../../content/types';
import { SermonCard } from './SermonCard';
import { Link } from '../../router/Router';
import { Icon } from '../../icons/Icon';
import styles from './Library.module.css';

// Página inicial (rework 2026-11-12, mock aprovado por Carlos): destaque com o
// tema completo da série, "Continuar lendo", séries agrupadas com os capítulos
// em ordem e "Outras mensagens". Fora do destaque, os cards usam uma
// tipografia só; o tema de cada série aparece só na faixa de cor.

const cor = (c: string) => ({ '--cor': c }) as CSSProperties;

function meta(p: PregacaoRow): string {
  return [pregadorCurto(p.pregador), dataCurta(p.data, p.conteudo?.metadados?.data)].filter(Boolean).join(' · ');
}

function nomeSerie(serie: string): string {
  return serie === SERIE_AVULSA ? 'Avulsas' : serie;
}

function CardSerie({ p, corSerie }: { p: PregacaoRow; corSerie: string }) {
  return (
    <Link to={`/pregacoes/${p.id}`} className={styles.cardSerie}>
      <span className={styles.faixa} style={cor(corSerie)} aria-hidden="true" />
      {capituloCurto(p) && <span className={styles.rotulo}>{capituloCurto(p)}</span>}
      <span className={styles.cardTitulo}>{p.tema}</span>
      <span className={styles.meta}>{meta(p)}</span>
    </Link>
  );
}

function Linha({ p, comSerie = true }: { p: PregacaoRow; comSerie?: boolean }) {
  const cap = capituloCurto(p);
  const serie = p.serie && p.serie !== SERIE_AVULSA ? p.serie : null;
  const rotulo = [comSerie ? serie : null, cap].filter(Boolean).join(' · ');
  return (
    <Link to={`/pregacoes/${p.id}`} className={styles.linha}>
      <span className={styles.marca} style={cor(corDaPregacao(p))} aria-hidden="true" />
      <span className={styles.linhaTexto}>
        {rotulo && <span className={styles.rotulo}>{rotulo}</span>}
        <span className={styles.linhaTitulo}>{p.tema}</span>
        <span className={styles.meta}>{meta(p)}</span>
      </span>
    </Link>
  );
}

function FaixaSerie({ serie, verTodas }: { serie: Serie; verTodas: () => void }) {
  // aria-labelledby é lista de ids separada por espaço: o nome da série não pode ir cru.
  const idTitulo = `serie-${serie.nome.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '-')}`;
  return (
    <section className={styles.secao} aria-labelledby={idTitulo}>
      <div className={styles.secaoTopo}>
        <h2 id={idTitulo} className={styles.secaoTitulo}>
          {serie.nome}
        </h2>
        <button type="button" className={styles.verTodas} onClick={verTodas}>
          {serie.itens.length} mensagens →
        </button>
      </div>
      <div className={styles.trilho}>
        {serie.itens.map((p) => (
          <CardSerie key={p.id} p={p} corSerie={serie.cor} />
        ))}
      </div>
    </section>
  );
}

function ContinuarLendo({ pregacoes }: { pregacoes: PregacaoRow[] }) {
  const ultima = useMemo(() => lerUltimaLeitura(), []);
  const p = ultima && ultima.progresso < PROGRESSO_LIDO ? pregacoes.find((x) => x.id === ultima.id) : undefined;
  if (!ultima || !p) return null;
  const cap = capituloCurto(p);
  const serie = p.serie && p.serie !== SERIE_AVULSA ? p.serie : null;
  return (
    <section className={styles.continuar} aria-labelledby="continuar-lendo">
      <h2 id="continuar-lendo" className={styles.sobretitulo}>
        Continuar lendo
      </h2>
      <Link to={`/pregacoes/${p.id}`} className={styles.continuarCard} onClick={() => marcarRetomar(p.id)}>
        <span className={styles.marcaAlta} style={cor(corDaPregacao(p))} aria-hidden="true" />
        <span className={styles.linhaTexto}>
          {(serie || cap) && <span className={styles.meta}>{[serie, cap].filter(Boolean).join(' · ')}</span>}
          <span className={styles.linhaTitulo}>{p.tema}</span>
          <span
            className={styles.progresso}
            role="progressbar"
            aria-valuenow={ultima.progresso}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${ultima.progresso}% lido`}
          >
            <span style={{ width: `${ultima.progresso}%` }} />
          </span>
          <span className={styles.meta}>
            {ultima.progresso}% lido{ultima.totalPontos > 0 && ` · ponto ${Math.max(1, ultima.ponto)} de ${ultima.totalPontos}`}
          </span>
        </span>
      </Link>
    </section>
  );
}

export function Library() {
  const { pregacoes, erro } = usePregacoes();
  const [termo, setTermo] = useState('');
  const [serie, setSerie] = useState<string | null>(null);

  const filtros = useMemo(() => (pregacoes ? seriesDoFiltro(pregacoes) : []), [pregacoes]);
  const inicio = useMemo(() => (pregacoes ? montarInicio(pregacoes) : null), [pregacoes]);

  const escolherSerie = (s: string | null) => {
    setSerie(s);
    setTermo('');
  };

  let corpo: ReactNode = null;
  if (pregacoes && inicio && pregacoes.length > 0) {
    if (termo.trim()) {
      const achadas = filterPregacoes(pregacoes, termo);
      corpo =
        achadas.length === 0 ? (
          <div className={styles.vazio}>Nada encontrado para "{termo}".</div>
        ) : (
          <section aria-label="Resultado da busca">
            <h2 className={styles.sobretitulo}>{achadas.length === 1 ? '1 resultado' : `${achadas.length} resultados`}</h2>
            <div className={styles.lista}>
              {achadas.map((p) => (
                <Linha key={p.id} p={p} />
              ))}
            </div>
          </section>
        );
    } else if (serie) {
      corpo = (
        <section aria-labelledby="serie-escolhida">
          <h2 id="serie-escolhida" className={styles.secaoTitulo}>
            {nomeSerie(serie)}
          </h2>
          <div className={styles.lista}>
            {daSerie(pregacoes, serie).map((p) => (
              <Linha key={p.id} p={p} comSerie={false} />
            ))}
          </div>
        </section>
      );
    } else {
      corpo = (
        <>
          <div className={styles.topo}>
            {inicio.destaque && (
              <section className={styles.destaque} aria-labelledby="mais-recente">
                <h2 id="mais-recente" className={styles.sobretitulo}>
                  Mais recente
                </h2>
                <SermonCard pregacao={inicio.destaque} destaque />
              </section>
            )}
            <ContinuarLendo pregacoes={pregacoes} />
          </div>
          {inicio.series.map((s) => (
            <FaixaSerie key={s.nome} serie={s} verTodas={() => escolherSerie(s.nome)} />
          ))}
          {inicio.outras.length > 0 && (
            <section className={styles.secao} aria-labelledby="outras-mensagens">
              <h2 id="outras-mensagens" className={styles.secaoTitulo}>
                Outras mensagens
              </h2>
              <div className={styles.lista}>
                {inicio.outras.map((p) => (
                  <Linha key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}
        </>
      );
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Pregações</h1>
        <Link to="/editorial" className={styles.editorial}>
          <span aria-hidden="true">
            <Icon name="pen-line" />
          </span>
          <span className={styles.srOnly}>Painel Editorial</span>
        </Link>
      </div>
      <div className={styles.busca}>
        <label htmlFor="busca-pregacoes" className={styles.srOnly}>
          Buscar
        </label>
        <input
          id="busca-pregacoes"
          className={styles.buscaInput}
          type="search"
          placeholder="Buscar tema, série, pregador"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
      </div>

      {filtros.length > 0 && (
        <nav className={styles.chips} aria-label="Filtrar por série">
          {[null, ...filtros].map((s) => (
            <button
              key={s ?? 'todas'}
              type="button"
              className={styles.chip}
              aria-pressed={serie === s && !termo.trim()}
              onClick={() => escolherSerie(s)}
            >
              {s ? nomeSerie(s) : 'Todas'}
            </button>
          ))}
        </nav>
      )}

      {erro && <div className={styles.vazio}>Não foi possível carregar as pregações.</div>}
      {!erro && pregacoes === null && <div className={styles.vazio}>Carregando…</div>}
      {!erro && pregacoes !== null && pregacoes.length === 0 && <div className={styles.vazio}>Nenhuma pregação cadastrada ainda.</div>}
      {corpo}
    </div>
  );
}
