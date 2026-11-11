import { useId, useRef, useState } from 'react';
import { TextoComKeywords } from '../../../content/Keyword';
import { formatDataPtBr, parseDataPtBr } from '../../../content/parseData';
import { caminhoTexto, idCampo, lerCaminho, type Caminho } from '../../../editorial/caminho';
import { EXEMPLOS, type ChaveExemplo } from '../../../editorial/exemplos';
import { alternarNegrito } from '../../../editorial/negrito';
import { errosDoCampo, useEditor } from './contexto';
import styles from '../Editor.module.css';

interface PropsCampo {
  caminho: Caminho;
  rotulo: string;
  dica?: string;
  obrigatorio?: boolean;
  /** Mostra "Ver exemplo": onde aparece na leitura + trecho real de pregação. */
  exemplo?: ChaveExemplo;
}

/** "Ver exemplo" — onde o campo aparece e um trecho real (src/editorial/exemplos.ts). */
export function VerExemplo({ chave }: { chave: ChaveExemplo }) {
  const [aberto, setAberto] = useState(false);
  const e = EXEMPLOS[chave];
  return (
    <div className={styles.exemplo}>
      <button type="button" className={styles.exemploBotao} aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        {aberto ? 'Esconder exemplo' : 'Ver exemplo'}
      </button>
      {aberto && (
        <div className={styles.exemploCaixa}>
          <div className={styles.exemploOnde}>{e.onde}</div>
          {e.linhas.map((l, i) => (
            <div key={i} className={styles.exemploLinha}>
              {l.rotulo && <span className={styles.exemploRotulo}>{l.rotulo}: </span>}
              <TextoComKeywords texto={l.texto} />
            </div>
          ))}
          <div className={styles.exemploFonte}>{e.fonte ? `De “${e.fonte}”` : 'Exemplo ilustrativo'}</div>
        </div>
      )}
    </div>
  );
}

function Moldura({
  id,
  rotulo,
  dica,
  obrigatorio,
  exemplo,
  erros,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  obrigatorio?: boolean;
  exemplo?: ChaveExemplo;
  erros: string[];
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.campo} ${erros.length ? styles.campoComErro : ''}`}>
      <div className={styles.rotuloLinha}>
        <label className={styles.rotulo} htmlFor={id}>
          {rotulo}
          {obrigatorio && <span className={styles.obrigatorio}> *</span>}
        </label>
      </div>
      {exemplo && <VerExemplo chave={exemplo} />}
      {children}
      {dica && <div className={styles.dica}>{dica}</div>}
      {erros.map((e) => (
        <div key={e} className={styles.erroCampo}>
          {e}
        </div>
      ))}
    </div>
  );
}

function useCampo(caminho: Caminho) {
  const { conteudo, definir, erros } = useEditor();
  const texto = caminhoTexto(caminho);
  return {
    id: idCampo(caminho),
    valor: lerCaminho(conteudo, caminho),
    mudar: (v: unknown) => definir(caminho, v),
    erros: errosDoCampo(erros, texto).map((e) => (e.caminho === texto ? e.mensagem : `linha ${Number(/\[(\d+)\]$/.exec(e.caminho)?.[1] ?? 0) + 1}: ${e.mensagem}`)),
  };
}

/** Botão "N" que liga/desliga **negrito** na seleção do textarea + prévia de como fica. */
function useNegrito(valor: string, mudar: (v: unknown) => void) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const aplicar = () => {
    const el = ref.current;
    if (!el) return;
    const r = alternarNegrito(valor, el.selectionStart, el.selectionEnd);
    mudar(r.texto);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.inicio, r.fim);
    });
  };
  return { ref, aplicar };
}

function BarraNegrito({ aplicar }: { aplicar: () => void }) {
  return (
    <div className={styles.barraTexto}>
      <button
        type="button"
        className={styles.botaoNegrito}
        aria-label="Negrito"
        title="Negrito: selecione o texto e toque aqui"
        onMouseDown={(e) => e.preventDefault() /* não tira a seleção do textarea */}
        onClick={aplicar}
      >
        N
      </button>
      <span className={styles.dica}>Selecione palavras e toque em N para destacar.</span>
    </div>
  );
}

function Previa({ texto }: { texto: string }) {
  if (!texto.includes('**')) return null;
  return (
    <div className={styles.previa}>
      <span className={styles.exemploRotulo}>Como fica: </span>
      <TextoComKeywords texto={texto} />
    </div>
  );
}

export function CampoTexto({
  caminho,
  rotulo,
  dica,
  obrigatorio,
  exemplo,
  multilinha,
  negrito,
}: PropsCampo & { multilinha?: boolean; negrito?: boolean }) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const v = typeof valor === 'string' ? valor : '';
  const n = useNegrito(v, mudar);
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} obrigatorio={obrigatorio} exemplo={exemplo} erros={erros}>
      {multilinha && negrito && <BarraNegrito aplicar={n.aplicar} />}
      {multilinha ? (
        <textarea id={id} ref={n.ref} className={styles.area} rows={4} value={v} onChange={(e) => mudar(e.target.value)} />
      ) : (
        <input id={id} className={styles.input} value={v} onChange={(e) => mudar(e.target.value)} />
      )}
      {negrito && <Previa texto={v} />}
    </Moldura>
  );
}

/** Lista de textos editada como um item por linha (linhas vazias somem ao enviar). */
export function CampoLinhas({ caminho, rotulo, dica, obrigatorio, exemplo, negrito }: PropsCampo & { negrito?: boolean }) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const linhas = Array.isArray(valor) ? (valor as unknown[]).map((x) => (typeof x === 'string' ? x : '')) : [];
  const texto = linhas.join('\n');
  const n = useNegrito(texto, (t) => mudar(String(t).split('\n')));
  return (
    <Moldura
      id={id}
      rotulo={rotulo}
      dica={dica ?? 'Um item por linha, sem marcador (o app já coloca).'}
      obrigatorio={obrigatorio}
      exemplo={exemplo}
      erros={erros}
    >
      {negrito && <BarraNegrito aplicar={n.aplicar} />}
      <textarea
        id={id}
        ref={n.ref}
        className={styles.area}
        rows={Math.max(3, linhas.length + 1)}
        value={texto}
        onChange={(e) => mudar(e.target.value.split('\n'))}
      />
      {negrito && <Previa texto={texto} />}
    </Moldura>
  );
}

/** Seletor de data nativo; grava no formato PT-BR do schema ("26 de julho de 2026"). */
export function CampoData({ caminho, rotulo }: PropsCampo) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const atual = typeof valor === 'string' ? valor : '';
  const iso = parseDataPtBr(atual);
  // Data em formato livre (ex: "27-28 de maio de 2026") vinda de conteúdo antigo: campo de texto.
  if (atual && !iso) {
    return (
      <Moldura id={id} rotulo={rotulo} erros={erros} dica='Formato: "26 de julho de 2026".'>
        <input id={id} className={styles.input} value={atual} onChange={(e) => mudar(e.target.value)} />
      </Moldura>
    );
  }
  return (
    <Moldura id={id} rotulo={rotulo} erros={erros}>
      <input
        id={id}
        className={styles.input}
        type="date"
        value={iso ?? ''}
        onChange={(e) => mudar(formatDataPtBr(e.target.value) ?? '')}
      />
    </Moldura>
  );
}

export function CampoSelecao({
  caminho,
  rotulo,
  dica,
  opcoes,
}: PropsCampo & { opcoes: { valor: string; nome: string }[] }) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} erros={erros}>
      <select id={id} className={styles.input} value={typeof valor === 'string' ? valor : ''} onChange={(e) => mudar(e.target.value)}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nome}
          </option>
        ))}
      </select>
    </Moldura>
  );
}

/** Campo de texto com sugestões (datalist), ex: séries já cadastradas. */
export function CampoComSugestoes({
  caminho,
  rotulo,
  dica,
  obrigatorio,
  exemplo,
  sugestoes,
}: PropsCampo & { sugestoes: readonly string[] }) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const lista = useId();
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} obrigatorio={obrigatorio} exemplo={exemplo} erros={erros}>
      <input
        id={id}
        className={styles.input}
        list={lista}
        value={typeof valor === 'string' ? valor : ''}
        onChange={(e) => mudar(e.target.value)}
      />
      <datalist id={lista}>
        {sugestoes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </Moldura>
  );
}
