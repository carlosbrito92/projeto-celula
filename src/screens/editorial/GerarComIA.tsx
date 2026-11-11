import { useState, type ChangeEvent } from 'react';
import { useRouter } from '../../router/Router';
import { criarRascunho, ErroEditorial, mensagemDeErro } from '../../editorial/api';
import { baixarTexto, copiarTexto } from '../../editorial/arquivos';
import { extrairJson } from '../../editorial/importar';
import { normalizar } from '../../editorial/modelo';
import { MODELO_PEDIDO, montarPrompt } from '../../editorial/promptIA';
import { SERIES_COM_TEMA } from '../../themes/registry';
import styles from './Painel.module.css';

// Gerar a pregação na IA de preferência do líder e trazer o JSON para um
// rascunho novo. O prompt é docs/geracao-pregacao.md (o mesmo que Carlos usa),
// carregado só quando pedido: são ~28 KB que a maioria nunca abre.

async function carregarPrompt(): Promise<string> {
  const { default: doc } = await import('../../../docs/geracao-pregacao.md?raw');
  return montarPrompt(doc, SERIES_COM_TEMA);
}

export function GerarComIA({ codigo }: { codigo: string }) {
  const { navigate } = useRouter();
  const [aviso, setAviso] = useState<{ passo: number; texto: string } | null>(null);
  const [colado, setColado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  /** Aviso ao lado do botão que o gerou (o painel é comprido no celular). */
  const avisar = (passo: number, texto: string) => {
    const novo = { passo, texto };
    setAviso(novo);
    setTimeout(() => setAviso((a) => (a === novo ? null : a)), 4000);
  };
  const avisoDo = (passo: number) =>
    aviso?.passo === passo && (
      <div className={styles.aviso} role="status">
        {aviso.texto}
      </div>
    );

  const copiarPrompt = async () => {
    const ok = await copiarTexto(await carregarPrompt());
    avisar(1, ok ? 'Prompt copiado. Cole na conversa com a IA.' : 'Não consegui copiar. Use "Baixar prompt".');
  };

  const baixarPrompt = async () => baixarTexto('prompt-pregacao.md', await carregarPrompt(), 'text/markdown');

  const copiarModelo = async () => {
    const ok = await copiarTexto(MODELO_PEDIDO);
    avisar(2, ok ? 'Modelo copiado.' : 'Não consegui copiar. Selecione o texto e copie à mão.');
  };

  const lerArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setColado(await arquivo.text());
    setErro(null);
  };

  const importar = async () => {
    const r = extrairJson(colado);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setErro(null);
    setImportando(true);
    try {
      const criado = await criarRascunho(codigo, normalizar(r.conteudo));
      navigate(`/editorial/${criado.id}`);
    } catch (e) {
      setErro(e instanceof ErroEditorial ? e.message : mensagemDeErro(-1));
      setImportando(false);
    }
  };

  return (
    <details className={styles.ia}>
      <summary className={styles.iaTitulo}>Gerar com IA / importar JSON</summary>
      <div className={styles.iaCorpo}>
        <p className={styles.ajuda}>
          Use a IA que preferir (ChatGPT, Gemini, Claude…). Ela monta a pregação a partir da transcrição ou das suas anotações, e você revisa e
          completa aqui antes de enviar.
        </p>

        <div className={styles.passo}>
          <div className={styles.passoTitulo}>1. Copie o prompt e cole numa conversa nova com a IA</div>
          <div className={styles.acoes}>
            <button type="button" className={styles.botaoSecundario} onClick={() => void copiarPrompt()}>
              Copiar prompt
            </button>
            <button type="button" className={styles.botaoSecundario} onClick={() => void baixarPrompt()}>
              Baixar prompt (.md)
            </button>
          </div>
          {avisoDo(1)}
        </div>

        <div className={styles.passo}>
          <div className={styles.passoTitulo}>2. Na mesma conversa, mande os dados da pregação e a transcrição ou anotações</div>
          <pre className={styles.modelo}>{MODELO_PEDIDO}</pre>
          <div className={styles.acoes}>
            <button type="button" className={styles.botaoSecundario} onClick={() => void copiarModelo()}>
              Copiar modelo
            </button>
          </div>
          {avisoDo(2)}
        </div>

        <div className={styles.passo}>
          <label className={styles.passoTitulo} htmlFor="json-importado">
            3. Cole aqui a resposta da IA (ou escolha o arquivo .json)
          </label>
          <textarea
            id="json-importado"
            className={styles.areaJson}
            value={colado}
            spellCheck={false}
            placeholder='{ "metadados": { ... }, ... }'
            onChange={(e) => {
              setColado(e.target.value);
              setErro(null);
            }}
          />
          <input className={styles.arquivo} type="file" accept=".json,.txt,application/json,text/plain" aria-label="Arquivo JSON" onChange={(e) => void lerArquivo(e)} />
          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}
          <button type="button" className={styles.botaoPrimario} disabled={importando || !colado.trim()} onClick={() => void importar()}>
            {importando ? 'Importando…' : 'Importar como rascunho novo'}
          </button>
          <p className={styles.ajuda}>O que faltar ou estiver fora do formato aparece como pendência no editor, para você corrigir.</p>
        </div>
      </div>
    </details>
  );
}
