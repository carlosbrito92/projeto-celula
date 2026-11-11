import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from '../../router/Router';
import { validarPregacao } from '../../content/validarPregacao';
import { OPCOES_TEMA_OVERRIDE, resolveTema, SERIES_COM_TEMA } from '../../themes/registry';
import { ErroEditorial, obterRascunho, publicar, salvarRascunho, type ResultadoPublicacao } from '../../editorial/api';
import { apagarCache, gravarCache, lerCache } from '../../editorial/cacheLocal';
import { definirCaminho, idCampo, rotuloCaminho, type Caminho } from '../../editorial/caminho';
import { lerCodigo } from '../../editorial/codigoStorage';
import { Icon } from '../../icons/Icon';
import { Previa } from './Previa';
import { baixarTexto, copiarTexto, nomeArquivo } from '../../editorial/arquivos';
import { adicionarPonto, limparParaPublicar, normalizar, semErroDuplicadoDeTitulo, type Conteudo } from '../../editorial/modelo';
import { useAutosave } from '../../editorial/useAutosave';
import { contarPorGrupo, type Grupo } from '../../editorial/navegacao';
import { CampoComSugestoes, CampoData, CampoSelecao, CampoTexto } from './editor/Campos';
import { EditorContext } from './editor/contexto';
import { ResumoLiderEditor } from './editor/ResumoLiderEditor';
import { SecaoEditor } from './editor/SecaoEditor';
import styles from './Editor.module.css';

// Editor guiado (docs/painel-editorial.md §7.2). Gera exatamente
// PregacaoConteudo; o líder nunca vê JSON, id ou numeração.
//   - Validação em tempo real com o mesmo validarPregacao do servidor.
//   - Autosave no servidor com respiro (rate limit) + cache local do que
//     ainda não subiu; conflito de versão nunca sobrescreve em silêncio.
//   - "Enviar para revisão" chama /api/editorial/publicar (abre/atualiza PR).

type EstadoSalvamento = 'salvo' | 'pendente' | 'salvando' | 'erro' | 'conflito';

const ROTULO_SALVAMENTO: Record<EstadoSalvamento, string> = {
  salvo: 'Salvo',
  pendente: 'Alterações não salvas',
  salvando: 'Salvando…',
  erro: 'Erro ao salvar',
  conflito: 'Conflito de versão',
};

/** Leva o foco ao campo do erro, abrindo os <details> no caminho. Sobe para o pai mais próximo que existir. */
function focarCaminho(caminho: string) {
  let atual = caminho;
  while (atual) {
    const el = document.getElementById(idCampo(atual));
    if (el) {
      let d = el.closest('details');
      while (d) {
        d.open = true;
        d = d.parentElement?.closest('details') ?? null;
      }
      el.scrollIntoView({ block: 'center' });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.focus();
      return;
    }
    atual = atual.replace(/(\.[^.[\]]+|\[\d+\])$/, '');
  }
}

/** Abre (ou fecha) todos os <details> do editor. */
function alternarTodos(raiz: HTMLElement | null, abrir: boolean) {
  raiz?.querySelectorAll('details').forEach((d) => {
    d.open = abrir;
  });
}

function IndiceRascunho({
  conteudo,
  pendencias,
  raiz,
}: {
  conteudo: Conteudo;
  pendencias: Map<Grupo, number>;
  raiz: React.RefObject<HTMLDivElement | null>;
}) {
  const itens: { grupo: Grupo; rotulo: string; alvo: string; opcional?: boolean }[] = [
    { grupo: 'metadados', rotulo: 'Dados gerais', alvo: 'metadados' },
    { grupo: 'banner_intro', rotulo: 'Abertura', alvo: 'banner_intro' },
    ...conteudo.secoes.map((s, i) => {
      const t = conteudo.mapa_pontos.find((p) => p.id === s.id)?.titulo || s.titulo;
      return { grupo: `secao:${s.id}` as Grupo, rotulo: `${s.numero || '—'} · ${t || 'Ponto sem título'}`, alvo: `secoes[${i}]` };
    }),
    { grupo: 'resumo_lider', rotulo: 'Resumo do líder', alvo: 'resumo_lider', opcional: !conteudo.resumo_lider },
  ];
  return (
    <nav className={styles.indice} aria-label="Índice do rascunho" id="indice-rascunho">
      <div className={styles.indiceTopo}>
        <span className={styles.secaoTitulo}>Índice</span>
        <span className={styles.linha}>
          <button type="button" className={styles.linkBotao} onClick={() => alternarTodos(raiz.current, false)}>
            Recolher tudo
          </button>
          <button type="button" className={styles.linkBotao} onClick={() => alternarTodos(raiz.current, true)}>
            Abrir tudo
          </button>
        </span>
      </div>
      <ol className={styles.indiceLista}>
        {itens.map((it) => {
          const n = pendencias.get(it.grupo) ?? 0;
          return (
            <li key={it.grupo}>
              <button type="button" className={styles.indiceItem} onClick={() => focarCaminho(it.alvo)}>
                <span className={styles.indiceRotulo}>{it.rotulo}</span>
                <span className={n ? styles.indicePendente : styles.indiceOk}>
                  {it.opcional ? 'opcional' : n ? `falta${n > 1 ? 'm' : ''} ${n}` : '✓'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Copiar/baixar o JSON limpo (§7.3): plano B se o envio falhar, e para conferir. */
function PlanoB({ conteudo, arquivo }: { conteudo: Conteudo; arquivo: string | null }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const json = () => `${JSON.stringify(limparParaPublicar(conteudo), null, 2)}\n`;
  return (
    <details className={styles.planoB}>
      <summary>Copiar ou baixar o JSON</summary>
      <p className={styles.dica}>Se o envio não funcionar, mande o arquivo para o Carlos. Também serve para guardar uma cópia.</p>
      <div className={styles.linha}>
        <button
          type="button"
          className={styles.botaoSecundario}
          onClick={() => void copiarTexto(json()).then((ok) => setAviso(ok ? 'JSON copiado.' : 'Não consegui copiar. Use "Baixar".'))}
        >
          Copiar JSON
        </button>
        <button
          type="button"
          className={styles.botaoSecundario}
          onClick={() => baixarTexto(arquivo ?? nomeArquivo(conteudo.metadados.tema ?? ''), json())}
        >
          Baixar JSON
        </button>
      </div>
      {aviso && (
        <p className={styles.dica} role="status">
          {aviso}
        </p>
      )}
    </details>
  );
}

export function Editor({ id }: { id: string }) {
  const { navigate } = useRouter();
  const codigo = lerCodigo();
  const [fase, setFase] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [conteudo, setConteudo] = useState<Conteudo | null>(null);
  const [revisao, setRevisao] = useState(0);
  const [revisaoSalva, setRevisaoSalva] = useState(0);
  const [salvamento, setSalvamento] = useState<EstadoSalvamento>('salvo');
  const [mensagemSalvamento, setMensagemSalvamento] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [previaAberta, setPreviaAberta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<ResultadoPublicacao | null>(null);
  /** Nome do .json depois do primeiro envio — envios seguintes corrigem o mesmo arquivo. */
  const [arquivoAtual, setArquivoAtual] = useState<string | null>(null);

  // Valores lidos dentro de callbacks assíncronos (sem closure velha).
  const raiz = useRef<HTMLDivElement>(null);
  const versao = useRef(1);
  const arquivo = useRef<string | null>(null);
  const atual = useRef<{ conteudo: Conteudo | null; revisao: number }>({ conteudo: null, revisao: 0 });
  useLayoutEffect(() => {
    atual.current = { conteudo, revisao };
  }, [conteudo, revisao]);
  const definirArquivo = (a: string | null) => {
    arquivo.current = a;
    setArquivoAtual(a);
  };

  useEffect(() => {
    if (!codigo) navigate('/editorial');
  }, [codigo, navigate]);

  useEffect(() => {
    if (!codigo) return;
    let cancelado = false;
    obterRascunho(codigo, id)
      .then((r) => {
        if (cancelado) return;
        versao.current = r.versao;
        definirArquivo(r.arquivo);
        const cache = lerCache(id);
        if (cache && cache.versao === r.versao && JSON.stringify(cache.conteudo) !== JSON.stringify(r.conteudo)) {
          setConteudo(normalizar(cache.conteudo));
          setRevisao(1);
          setSalvamento('pendente');
          setAviso('Recuperamos alterações deste aparelho que ainda não tinham sido salvas.');
        } else {
          if (cache) apagarCache(id);
          setConteudo(normalizar(r.conteudo));
        }
        setFase('pronto');
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        if (e instanceof ErroEditorial && e.status === 401) return navigate('/editorial');
        setErroCarga(e instanceof ErroEditorial ? (e.status === 404 ? 'Rascunho não encontrado.' : e.message) : 'Erro inesperado.');
        setFase('erro');
      });
    return () => {
      cancelado = true;
    };
  }, [codigo, id, navigate]);

  // Cache local do que ainda não subiu (com respiro: não grava ~60KB a cada tecla).
  useEffect(() => {
    if (!conteudo || revisao === revisaoSalva) return;
    const t = setTimeout(() => gravarCache(id, { versao: versao.current, conteudo }), 800);
    return () => clearTimeout(t);
  }, [conteudo, revisao, revisaoSalva, id]);

  const editar = useCallback((f: (c: Conteudo) => Conteudo) => {
    setConteudo((c) => (c ? f(c) : c));
    setRevisao((r) => r + 1);
    setSalvamento((s) => (s === 'conflito' ? s : 'pendente'));
    setEnviado(null);
  }, []);

  const salvar = useCallback(
    async (extra: { arquivo?: string } = {}) => {
      const { conteudo: c, revisao: rev } = atual.current;
      if (!codigo || !c) return;
      setSalvamento('salvando');
      try {
        const nomeArquivo = extra.arquivo ?? arquivo.current;
        const r = await salvarRascunho(codigo, id, {
          conteudo: c,
          versao: versao.current,
          ...(nomeArquivo ? { arquivo: nomeArquivo } : {}),
        });
        versao.current = r.versao;
        definirArquivo(r.arquivo);
        setRevisaoSalva(rev);
        setMensagemSalvamento(null);
        if (rev === atual.current.revisao) {
          apagarCache(id);
          setSalvamento('salvo');
        } else {
          setSalvamento('pendente');
        }
      } catch (e) {
        if (e instanceof ErroEditorial && e.status === 409) {
          setSalvamento('conflito');
          setMensagemSalvamento(e.message);
          const v = e.detalhe.versaoAtual;
          if (typeof v === 'number') versao.current = v;
        } else {
          setSalvamento('erro');
          setMensagemSalvamento(e instanceof ErroEditorial ? e.message : 'Erro inesperado ao salvar.');
        }
      }
    },
    [codigo, id],
  );

  const sujo = revisao !== revisaoSalva;
  const { salvarAgora } = useAutosave({
    sujo: sujo && salvamento !== 'salvando',
    revisao,
    pausado: salvamento === 'conflito',
    salvar,
  });

  const validacao = useMemo(() => {
    if (!conteudo) return null;
    const r = validarPregacao(limparParaPublicar(conteudo));
    return { ...r, erros: semErroDuplicadoDeTitulo(conteudo, r.erros) };
  }, [conteudo]);

  const pendencias = useMemo(
    () => (conteudo && validacao ? contarPorGrupo(conteudo, validacao.erros) : new Map<Grupo, number>()),
    [conteudo, validacao],
  );

  const contexto = useMemo(
    () =>
      conteudo && {
        conteudo,
        definir: (caminho: Caminho, valor: unknown) => editar((c) => definirCaminho(c, caminho, valor)),
        aplicar: editar,
        erros: mostrarErros && validacao ? validacao.erros : [],
      },
    [conteudo, editar, mostrarErros, validacao],
  );

  const enviar = async () => {
    if (!codigo || !conteudo || !validacao) return;
    setMostrarErros(true);
    setErroEnvio(null);
    if (validacao.erros.length > 0) {
      setErroEnvio(`Faltam ${validacao.erros.length} ajuste(s) antes de enviar. Veja a lista abaixo.`);
      return;
    }
    setEnviando(true);
    try {
      const r = await publicar(codigo, limparParaPublicar(conteudo), arquivo.current ?? undefined);
      setEnviado(r);
      definirArquivo(r.arquivo);
      await salvar({ arquivo: r.arquivo }); // grava o nome do arquivo: próximos envios corrigem o mesmo
    } catch (e) {
      if (e instanceof ErroEditorial && e.status === 422 && Array.isArray(e.detalhe.erros)) {
        setErroEnvio('O servidor encontrou problemas na pregação. Veja a lista abaixo.');
      } else {
        setErroEnvio(e instanceof ErroEditorial ? e.message : 'Erro inesperado ao enviar.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const descartarLocal = async () => {
    if (!codigo) return;
    try {
      const r = await obterRascunho(codigo, id);
      apagarCache(id);
      versao.current = r.versao;
      definirArquivo(r.arquivo);
      setConteudo(normalizar(r.conteudo));
      setRevisao(0);
      setRevisaoSalva(0);
      setSalvamento('salvo');
      setMensagemSalvamento(null);
      setAviso(null);
    } catch (e) {
      setMensagemSalvamento(e instanceof ErroEditorial ? e.message : 'Erro inesperado.');
    }
  };

  const fecharPrevia = useCallback(() => setPreviaAberta(false), []);

  if (fase === 'carregando') return <div className={styles.vazio}>Carregando rascunho…</div>;
  if (fase === 'erro' || !conteudo || !contexto || !validacao) {
    return (
      <div className={styles.wrapper}>
        <Link to="/editorial" className={styles.voltar}>
          ← Painel
        </Link>
        <div className={styles.erroBox} role="alert">
          {erroCarga ?? 'Não foi possível abrir o rascunho.'}
        </div>
      </div>
    );
  }

  const meta = conteudo.metadados;
  const tema = resolveTema(meta.serie, meta.tema_override);
  const serieTemTema = SERIES_COM_TEMA.includes(meta.serie);

  return (
    <EditorContext.Provider value={contexto}>
      <div className={`${styles.wrapper} ${previaAberta ? styles.comPrevia : ''}`} ref={raiz}>
        <Link to="/editorial" className={styles.voltar}>
          ← Painel
        </Link>
        <div className={styles.titulo}>{meta.tema || 'Nova pregação'}</div>

        {aviso && (
          <div className={styles.avisoBox} role="status">
            {aviso}
          </div>
        )}

        {salvamento === 'conflito' && (
          <div className={styles.erroBox} role="alert">
            <p>{mensagemSalvamento}</p>
            <div className={styles.linha}>
              <button type="button" className={styles.botaoSecundario} onClick={() => void descartarLocal()}>
                Usar a versão salva
              </button>
              <button
                type="button"
                className={styles.botaoSecundario}
                onClick={() => {
                  setSalvamento('pendente');
                  void salvarAgora();
                }}
              >
                Manter a minha
              </button>
            </div>
          </div>
        )}

        <IndiceRascunho conteudo={conteudo} pendencias={pendencias} raiz={raiz} />

        {arquivoAtual && !enviado && (
          <div className={styles.avisoBox}>
            Correção de uma pregação já enviada: o envio substitui a versão anterior, depois que o Carlos aprovar.
          </div>
        )}

        <details className={styles.grupo} id={idCampo(['metadados'])} open>
          <summary className={styles.grupoTitulo}>Dados gerais</summary>
          <div className={styles.grupoCorpo}>
            <CampoTexto caminho={['metadados', 'tema']} rotulo="Tema (título da pregação)" exemplo="tema" obrigatorio />
            <CampoComSugestoes
              caminho={['metadados', 'serie']}
              rotulo="Série"
              dica='Use "Avulsa" se não fizer parte de uma série.'
              exemplo="serie"
              obrigatorio
              sugestoes={[...SERIES_COM_TEMA, 'Avulsa']}
            />
            {!serieTemTema && (
              <CampoSelecao
                caminho={['metadados', 'tema_override']}
                rotulo="Visual"
                dica="Esta série não tem visual próprio. Escolha um ou use o padrão."
                opcoes={[{ valor: '', nome: 'Padrão MINC' }, ...OPCOES_TEMA_OVERRIDE.filter((o) => o.valor !== 'Padrão MINC')]}
              />
            )}
            <p className={styles.dica}>Visual da leitura: {tema.nome}</p>
            <CampoTexto caminho={['metadados', 'capitulo']} rotulo="Capítulo (opcional)" dica='Ex: "Capítulo 2".' exemplo="capitulo" />
            <CampoData caminho={['metadados', 'data']} rotulo="Data" />
            <CampoTexto caminho={['metadados', 'pregador']} rotulo="Pregador" />
            <CampoTexto caminho={['metadados', 'texto_base']} rotulo="Texto-base" dica="Ex: Efésios 2.8-9" exemplo="texto_base" />
          </div>
        </details>

        <details className={styles.grupo} id={idCampo(['banner_intro'])} open>
          <summary className={styles.grupoTitulo}>Abertura</summary>
          <div className={styles.grupoCorpo}>
            <CampoTexto
              caminho={['banner_intro', 'frase_sintese']}
              rotulo="Frase-síntese"
              dica="A frase que resume a mensagem, em destaque no topo."
              exemplo="frase_sintese"
              obrigatorio
              multilinha
            />
            <CampoTexto
              caminho={['banner_intro', 'contextualizacao']}
              rotulo="Contextualização (opcional)"
              dica='Ex: "Segundo capítulo da série. No episódio anterior…"'
              exemplo="contextualizacao"
              multilinha
            />
            <CampoTexto caminho={['banner_intro', 'versiculo_ancora', 'referencia']} rotulo="Versículo-âncora: referência (opcional)" exemplo="versiculo_ancora" />
            <CampoTexto caminho={['banner_intro', 'versiculo_ancora', 'texto']} rotulo="Versículo-âncora: texto (opcional)" multilinha />
          </div>
        </details>

        <div className={styles.secaoTitulo}>Pontos</div>
        {conteudo.secoes.map((_, s) => (
          <SecaoEditor key={conteudo.secoes[s].id} s={s} total={conteudo.secoes.length} />
        ))}
        <button type="button" className={styles.botaoSecundario} onClick={() => editar(adicionarPonto)}>
          + Adicionar ponto
        </button>

        <ResumoLiderEditor />

        <section className={styles.envio} aria-label="Enviar para revisão">
          {enviado && (
            <div className={styles.avisoBox} role="status">
              Enviado para revisão. Depois que o Carlos aprovar, a pregação aparece no app.{' '}
              <a href={enviado.prUrl} target="_blank" rel="noreferrer">
                Ver pedido de revisão
              </a>
            </div>
          )}
          {erroEnvio && (
            <div className={styles.erroBox} role="alert">
              {erroEnvio}
            </div>
          )}
          {mostrarErros && validacao.erros.length > 0 && (
            <ul className={styles.listaErros}>
              {validacao.erros.map((e, i) => (
                <li key={i}>
                  <button type="button" onClick={() => focarCaminho(e.caminho)}>
                    <strong>{rotuloCaminho(e.caminho) || 'Pregação'}</strong>: {e.mensagem}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {validacao.avisos.length > 0 && (
            <ul className={styles.listaAvisos}>
              {validacao.avisos.map((a, i) => (
                <li key={i}>
                  {rotuloCaminho(a.caminho)}: {a.mensagem}
                </li>
              ))}
            </ul>
          )}
          <PlanoB conteudo={conteudo} arquivo={arquivoAtual} />
        </section>

        <div className={styles.barra}>
          <div className={styles.barraInfo}>
            <span className={`${styles.estado} ${styles[salvamento]}`} title={mensagemSalvamento ?? undefined}>
              {ROTULO_SALVAMENTO[salvamento]}
              {salvamento === 'erro' && (
                <>
                  {' · '}
                  <button type="button" className={styles.linkBotao} onClick={() => void salvarAgora()}>
                    tentar de novo
                  </button>
                </>
              )}
            </span>
            <span className={styles.pendencias}>
              {validacao.erros.length === 0 ? 'Pronta para enviar' : `${validacao.erros.length} pendência(s)`}
            </span>
          </div>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={() => document.getElementById('indice-rascunho')?.scrollIntoView({ block: 'start' })}
          >
            Índice
          </button>
          <button
            type="button"
            className={`${styles.botaoSecundario} ${styles.botaoBarra}`}
            aria-pressed={previaAberta}
            onClick={() => setPreviaAberta((a) => !a)}
          >
            <Icon name="eye" /> Prévia
          </button>
          <button type="button" className={styles.botaoPrimario} disabled={enviando} onClick={() => void enviar()}>
            {enviando ? 'Enviando…' : arquivoAtual ? 'Enviar correção' : 'Enviar para revisão'}
          </button>
        </div>
      </div>
      {previaAberta && <Previa conteudo={conteudo} aoFechar={fecharPrevia} />}
    </EditorContext.Provider>
  );
}
