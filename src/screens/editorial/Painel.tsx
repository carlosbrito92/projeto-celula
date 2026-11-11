import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useRouter } from '../../router/Router';
import { apiGet } from '../../lib/api';
import type { PregacaoRow } from '../../content/types';
import { apagarRascunho, criarRascunho, ErroEditorial, listarRascunhos, mensagemDeErro, type ResumoRascunho } from '../../editorial/api';
import { novaPregacao } from '../../editorial/modelo';
import { esquecerCodigo, lerCodigo, salvarCodigo } from '../../editorial/codigoStorage';
import { derivarStatus, ROTULO_STATUS } from '../../editorial/status';
import { listarCorrigiveis, type PregacaoPublicada } from '../../editorial/publicadas';
import { CorrigirPublicada } from './CorrigirPublicada';
import { GerarComIA } from './GerarComIA';
import styles from './Painel.module.css';

// Painel Editorial — etapa mínima (docs/painel-editorial.md §7.1): entrada por
// código e lista de rascunhos com status derivado. "Nova pregação"/"Editar"
// abrem o editor guiado (§7.2, Editor.tsx); "Gerar com IA" importa o JSON
// que a IA do líder gerou como rascunho novo (§7.3, GerarComIA.tsx);
// "Corrigir pregação publicada" abre o JSON de `main` no editor (§7.5).
// O código só mostra/esconde UI aqui; quem valida é o servidor, a cada request.

type Fase = 'entrada' | 'carregando' | 'lista' | 'erro';

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function formatarData(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : formatoData.format(d);
}

async function pregacoesPublicadas(): Promise<PregacaoRow[]> {
  try {
    return await apiGet<PregacaoRow[]>('/pregacoes');
  } catch {
    return []; // sem a lista pública, nada aparece como "Publicado" — nunca quebra o painel
  }
}

export function Painel() {
  const { navigate } = useRouter();
  const [criando, setCriando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(() => lerCodigo());
  const [fase, setFase] = useState<Fase>(() => (lerCodigo() ? 'carregando' : 'entrada'));
  const [erro, setErro] = useState<string | null>(null);
  const [digitado, setDigitado] = useState('');
  const [rascunhos, setRascunhos] = useState<ResumoRascunho[]>([]);
  const [publicados, setPublicados] = useState<Set<string>>(new Set());
  const [corrigiveis, setCorrigiveis] = useState<PregacaoPublicada[]>([]);
  const [confirmandoApagar, setConfirmandoApagar] = useState<string | null>(null);

  const carregar = useCallback(async (c: string) => {
    setFase('carregando');
    setErro(null);
    try {
      const [lista, linhas] = await Promise.all([listarRascunhos(c), pregacoesPublicadas()]);
      salvarCodigo(c);
      setCodigo(c);
      setRascunhos(lista);
      setPublicados(new Set(linhas.map((l) => l.arquivo_origem).filter((a): a is string => !!a)));
      setCorrigiveis(listarCorrigiveis(linhas));
      setFase('lista');
    } catch (e) {
      const status = e instanceof ErroEditorial ? e.status : -1;
      setErro(e instanceof ErroEditorial ? e.message : mensagemDeErro(-1));
      if (status === 401) {
        esquecerCodigo();
        setCodigo(null);
        setFase('entrada');
      } else {
        setFase('erro');
      }
    }
  }, []);

  useEffect(() => {
    const salvo = lerCodigo();
    if (salvo) void carregar(salvo);
  }, [carregar]);

  const entrar = (e: FormEvent) => {
    e.preventDefault();
    const c = digitado.trim();
    if (!c) return;
    setDigitado('');
    void carregar(c);
  };

  const sair = () => {
    esquecerCodigo();
    setCodigo(null);
    setRascunhos([]);
    setErro(null);
    setFase('entrada');
  };

  const nova = async () => {
    if (!codigo) return;
    setCriando(true);
    setErro(null);
    try {
      const r = await criarRascunho(codigo, novaPregacao());
      navigate(`/editorial/${r.id}`);
    } catch (e) {
      setErro(e instanceof ErroEditorial ? e.message : mensagemDeErro(-1));
      setCriando(false);
    }
  };

  const apagar = async (id: string) => {
    if (!codigo) return;
    setConfirmandoApagar(null);
    try {
      await apagarRascunho(codigo, id);
      setRascunhos((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setErro(e instanceof ErroEditorial ? e.message : mensagemDeErro(-1));
    }
  };

  return (
    <div className={styles.wrapper}>
      <Link to="/" className={styles.voltar}>
        ← Biblioteca
      </Link>
      <div className={styles.titulo}>Painel Editorial</div>

      {fase === 'entrada' && (
        <form className={styles.entrada} onSubmit={entrar}>
          <label className={styles.rotulo} htmlFor="codigo-editorial">
            Código de líder
          </label>
          <input
            id="codigo-editorial"
            className={styles.input}
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
          />
          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}
          <button className={styles.botaoPrimario} type="submit" disabled={!digitado.trim()}>
            Entrar
          </button>
          <p className={styles.ajuda}>O código é pessoal. Peça o seu ao Carlos.</p>
        </form>
      )}

      {fase === 'carregando' && <div className={styles.vazio}>Carregando…</div>}

      {fase === 'erro' && (
        <div className={styles.entrada}>
          <div className={styles.erro} role="alert">
            {erro}
          </div>
          <button className={styles.botaoPrimario} type="button" onClick={() => codigo && void carregar(codigo)}>
            Tentar de novo
          </button>
          <button className={styles.botaoSecundario} type="button" onClick={sair}>
            Sair
          </button>
        </div>
      )}

      {fase === 'lista' && (
        <>
          <div className={styles.barra}>
            <div className={styles.subtitulo}>Seus rascunhos</div>
            <button className={styles.botaoSecundario} type="button" onClick={sair}>
              Sair
            </button>
          </div>

          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}

          <button className={styles.botaoPrimario} type="button" disabled={criando} onClick={() => void nova()}>
            {criando ? 'Criando…' : '+ Nova pregação'}
          </button>
          {codigo && <GerarComIA codigo={codigo} />}
          {codigo && <CorrigirPublicada codigo={codigo} pregacoes={corrigiveis} rascunhos={rascunhos} />}

          {rascunhos.length === 0 ? (
            <div className={styles.vazio}>Nenhum rascunho ainda.</div>
          ) : (
            <ul className={styles.lista}>
              {rascunhos.map((r) => {
                const status = derivarStatus(r, publicados);
                return (
                  <li key={r.id} className={styles.item}>
                    <div className={styles.itemTopo}>
                      <span className={`${styles.status} ${styles[status]}`}>{ROTULO_STATUS[status]}</span>
                      <span className={styles.data}>{formatarData(r.atualizado_em)}</span>
                    </div>
                    <div className={styles.tema}>{r.tema || 'Sem título'}</div>
                    <div className={styles.acoes}>
                      <Link to={`/editorial/${r.id}`} className={styles.botaoSecundario}>
                        Editar
                      </Link>
                      {confirmandoApagar === r.id ? (
                        <>
                          <button className={styles.botaoPerigo} type="button" onClick={() => void apagar(r.id)}>
                            Confirmar exclusão
                          </button>
                          <button className={styles.botaoSecundario} type="button" onClick={() => setConfirmandoApagar(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button className={styles.botaoSecundario} type="button" onClick={() => setConfirmandoApagar(r.id)}>
                          Apagar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
