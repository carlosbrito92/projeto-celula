import { useState } from 'react';
import type { AnotacaoPessoal } from './types';
import type { useAnotacoes } from './useAnotacoes';
import styles from './SecaoNotas.module.css';

interface Props {
  secaoId: string;
  api: ReturnType<typeof useAnotacoes>;
}

/**
 * Notas pessoais "soltas" da seção (sem destaque de texto associado) +
 * destaques órfãos dessa seção (trecho não localizado após recalibração —
 * ver resolverDestaque). Área própria, separada de `secao.anotacoes`
 * (`AnnotationBox`), que é conteúdo editorial da pregação, não pessoal.
 */
export function SecaoNotas({ secaoId, api }: Props) {
  const [criando, setCriando] = useState(false);
  const notas = api.notasSoltas.filter((n) => n.secaoId === secaoId);
  const orfas = api.orfas.filter((o) => o.secaoId === secaoId);

  if (notas.length === 0 && orfas.length === 0 && !criando) {
    return (
      <button type="button" className={styles.botaoNova} onClick={() => setCriando(true)}>
        + Minha nota nesta seção
      </button>
    );
  }

  return (
    <div className={styles.wrapper}>
      {notas.map((nota) => (
        <NotaSolta key={nota.id} nota={nota} api={api} />
      ))}
      {orfas.map((orfa) => (
        <div key={orfa.id} className={styles.orfa}>
          <div className={styles.orfaAviso}>
            Trecho não encontrado depois de uma atualização da pregação: “{orfa.textoSelecionado}”
          </div>
          {orfa.nota && <div className={styles.orfaNota}>{orfa.nota}</div>}
          <button type="button" className={styles.botaoApagar} onClick={() => api.apagar(orfa.id)}>
            Remover
          </button>
        </div>
      ))}
      {criando ? (
        <FormularioNota
          valorInicial=""
          onSalvar={(texto) => {
            if (texto) api.criarNotaSolta(secaoId, texto);
            setCriando(false);
          }}
          onCancelar={() => setCriando(false)}
        />
      ) : (
        <button type="button" className={styles.botaoNova} onClick={() => setCriando(true)}>
          + Minha nota nesta seção
        </button>
      )}
    </div>
  );
}

function NotaSolta({ nota, api }: { nota: AnotacaoPessoal; api: ReturnType<typeof useAnotacoes> }) {
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
