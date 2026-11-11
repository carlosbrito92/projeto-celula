import { useId } from 'react';
import { formatDataPtBr, parseDataPtBr } from '../../../content/parseData';
import { caminhoTexto, idCampo, lerCaminho, type Caminho } from '../../../editorial/caminho';
import { errosDoCampo, useEditor } from './contexto';
import styles from '../Editor.module.css';

interface PropsCampo {
  caminho: Caminho;
  rotulo: string;
  dica?: string;
  obrigatorio?: boolean;
}

function Moldura({
  id,
  rotulo,
  dica,
  obrigatorio,
  erros,
  children,
}: { id: string; rotulo: string; dica?: string; obrigatorio?: boolean; erros: string[]; children: React.ReactNode }) {
  return (
    <div className={`${styles.campo} ${erros.length ? styles.campoComErro : ''}`}>
      <label className={styles.rotulo} htmlFor={id}>
        {rotulo}
        {obrigatorio && <span className={styles.obrigatorio}> *</span>}
      </label>
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

export function CampoTexto({ caminho, rotulo, dica, obrigatorio, multilinha }: PropsCampo & { multilinha?: boolean }) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const v = typeof valor === 'string' ? valor : '';
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} obrigatorio={obrigatorio} erros={erros}>
      {multilinha ? (
        <textarea id={id} className={styles.area} rows={4} value={v} onChange={(e) => mudar(e.target.value)} />
      ) : (
        <input id={id} className={styles.input} value={v} onChange={(e) => mudar(e.target.value)} />
      )}
    </Moldura>
  );
}

/** Lista de textos editada como um item por linha (linhas vazias somem ao enviar). */
export function CampoLinhas({ caminho, rotulo, dica, obrigatorio }: PropsCampo) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const linhas = Array.isArray(valor) ? (valor as unknown[]).map((x) => (typeof x === 'string' ? x : '')) : [];
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica ?? 'Um item por linha, sem marcador (o app já coloca).'} obrigatorio={obrigatorio} erros={erros}>
      <textarea
        id={id}
        className={styles.area}
        rows={Math.max(3, linhas.length + 1)}
        value={linhas.join('\n')}
        onChange={(e) => mudar(e.target.value.split('\n'))}
      />
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
export function CampoComSugestoes({ caminho, rotulo, dica, obrigatorio, sugestoes }: PropsCampo & { sugestoes: readonly string[] }) {
  const { id, valor, mudar, erros } = useCampo(caminho);
  const lista = useId();
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} obrigatorio={obrigatorio} erros={erros}>
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
