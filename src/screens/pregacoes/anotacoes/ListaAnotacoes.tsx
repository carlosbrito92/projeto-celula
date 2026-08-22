import { useState } from 'react';
import type { Secao } from '../../../content/types';
import type { AnotacaoPessoal } from './types';
import type { useAnotacoes } from './useAnotacoes';
import styles from './ListaAnotacoes.module.css';

interface Props {
  secoes: Secao[];
  api: ReturnType<typeof useAnotacoes>;
  aoFechar: () => void;
}

/**
 * Painel único de gestão de anotações pessoais (destaques + notas soltas +
 * órfãos), agrupado por seção — substitui o antigo botão "+ Minha nota
 * nesta seção" sempre visível no meio do fluxo de leitura (achado real:
 * competia com — e escondia — o fluxo principal de seleção→popup). Overlay
 * de tela cheia, mesmo padrão de `Detalhe.tsx`/`ResumoCurtoOverlay`
 * (`position: fixed; inset: 0`, dentro do `ThemeScope` da Leitura).
 */
export function ListaAnotacoes({ secoes, api, aoFechar }: Props) {
  const vazio = api.destaques.length === 0 && api.notasSoltas.length === 0 && api.orfas.length === 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button type="button" className={styles.voltar} onClick={aoFechar}>
          ← Voltar
        </button>
        <div className={styles.titulo}>Minhas anotações</div>
      </div>
      <div className={styles.corpo}>
        {vazio && (
          <div className={styles.vazio}>Nenhuma anotação pessoal ainda nesta pregação.</div>
        )}
        {secoes.map((secao) => (
          <GrupoSecao key={secao.id} secao={secao} api={api} />
        ))}
      </div>
    </div>
  );
}

function GrupoSecao({ secao, api }: { secao: Secao; api: ReturnType<typeof useAnotacoes> }) {
  const destaques = api.destaques.filter((d) => d.secaoId === secao.id);
  const notas = api.notasSoltas.filter((n) => n.secaoId === secao.id);
  const orfas = api.orfas.filter((o) => o.secaoId === secao.id);
  const [criando, setCriando] = useState(false);

  return (
    <div className={styles.grupo}>
      <div className={styles.grupoTitulo}>
        {secao.numero}. {secao.titulo}
      </div>

      {destaques.map((d) => (
        <ItemDestaque key={d.id} destaque={d} api={api} />
      ))}
      {notas.map((n) => (
        <ItemNota key={n.id} nota={n} api={api} />
      ))}
      {orfas.map((o) => (
        <div key={o.id} className={styles.orfa}>
          <div className={styles.orfaAviso}>
            Trecho não encontrado depois de uma atualização da pregação: “{o.textoSelecionado}”
          </div>
          {o.nota && <div className={styles.orfaNota}>{o.nota}</div>}
          <button type="button" className={styles.botaoApagar} onClick={() => api.apagar(o.id)}>
            Remover
          </button>
        </div>
      ))}

      {criando ? (
        <FormularioNota
          valorInicial=""
          onSalvar={(texto) => {
            if (texto) api.criarNotaSolta(secao.id, texto);
            setCriando(false);
          }}
          onCancelar={() => setCriando(false)}
        />
      ) : (
        <button type="button" className={styles.botaoNova} onClick={() => setCriando(true)}>
          + Nota nesta seção
        </button>
      )}
    </div>
  );
}

function ItemDestaque({
  destaque,
  api,
}: {
  destaque: AnotacaoPessoal;
  api: ReturnType<typeof useAnotacoes>;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <FormularioNota
        valorInicial={destaque.nota ?? ''}
        onSalvar={(texto) => {
          api.editarNota(destaque.id, texto);
          setEditando(false);
        }}
        onCancelar={() => setEditando(false)}
        onApagar={() => api.apagar(destaque.id)}
      />
    );
  }

  return (
    <button type="button" className={styles.destaqueItem} onClick={() => setEditando(true)}>
      <div className={styles.destaqueTrecho}>“{destaque.textoSelecionado}”</div>
      {destaque.nota && <div className={styles.destaqueNota}>{destaque.nota}</div>}
    </button>
  );
}

function ItemNota({ nota, api }: { nota: AnotacaoPessoal; api: ReturnType<typeof useAnotacoes> }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <FormularioNota
        valorInicial={nota.nota ?? ''}
        onSalvar={(texto) => {
          api.editarNota(nota.id, texto);
          setEditando(false);
        }}
        onCancelar={() => setEditando(false)}
        onApagar={() => api.apagar(nota.id)}
      />
    );
  }

  return (
    <button type="button" className={styles.nota} onClick={() => setEditando(true)}>
      {nota.nota}
    </button>
  );
}

function FormularioNota({
  valorInicial,
  onSalvar,
  onCancelar,
  onApagar,
}: {
  valorInicial: string;
  onSalvar: (texto: string) => void;
  onCancelar: () => void;
  onApagar?: () => void;
}) {
  const [texto, setTexto] = useState(valorInicial);
  return (
    <div className={styles.form}>
      <textarea
        className={styles.textarea}
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className={styles.acoes}>
        <button type="button" className={styles.botaoPrimario} onClick={() => onSalvar(texto.trim())}>
          Salvar
        </button>
        <button type="button" className={styles.botaoSecundario} onClick={onCancelar}>
          Cancelar
        </button>
        {onApagar && (
          <button type="button" className={styles.botaoApagar} onClick={onApagar}>
            Apagar
          </button>
        )}
      </div>
    </div>
  );
}
