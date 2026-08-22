import { useState, type CSSProperties } from 'react';
import type { useAnotacoes } from './useAnotacoes';
import styles from './AnotacaoPopover.module.css';

export type PopoverEstado =
  | {
      tipo: 'nova';
      secaoId: string;
      unidade: string;
      offsetInicio: number;
      offsetFim: number;
      textoSelecionado: string;
      rect: DOMRect;
    }
  | { tipo: 'editar'; id: string; rect: DOMRect };

interface Props {
  estado: PopoverEstado;
  api: ReturnType<typeof useAnotacoes>;
  aoFechar: () => void;
}

/**
 * Popover de "grifar trecho" (seleção nova) ou "editar/apagar" (destaque já
 * existente) — o pai monta este componente com `key` derivada do alvo
 * (secaoId+unidade+offsets, ou id), então o `useState` abaixo sempre nasce
 * limpo por alvo, sem precisar de useEffect pra resetar o campo de nota.
 */
export function AnotacaoPopover({ estado, api, aoFechar }: Props) {
  const notaExistente = estado.tipo === 'editar' ? api.destaques.find((d) => d.id === estado.id)?.nota : undefined;
  const [nota, setNota] = useState(notaExistente ?? '');
  const [erro, setErro] = useState<string | null>(null);

  const style: CSSProperties = {
    top: Math.min(estado.rect.bottom + 8, window.innerHeight - 180),
    left: Math.max(8, Math.min(estado.rect.left, window.innerWidth - 280)),
  };

  function grifar() {
    if (estado.tipo !== 'nova') return;
    const resultado = api.criarDestaque(
      estado.secaoId,
      estado.unidade,
      estado.offsetInicio,
      estado.offsetFim,
      estado.textoSelecionado,
      nota.trim() || undefined,
    );
    if (!resultado.ok) {
      setErro('Esse trecho se sobrepõe a um destaque já existente.');
      return;
    }
    window.getSelection()?.removeAllRanges();
    aoFechar();
  }

  function salvarNota() {
    if (estado.tipo !== 'editar') return;
    api.editarNota(estado.id, nota.trim());
    aoFechar();
  }

  function apagar() {
    if (estado.tipo !== 'editar') return;
    api.apagar(estado.id);
    aoFechar();
  }

  return (
    <div className={styles.backdrop} onClick={aoFechar}>
      <div className={styles.popover} style={style} onClick={(e) => e.stopPropagation()}>
        {estado.tipo === 'nova' && <div className={styles.trecho}>“{estado.textoSelecionado}”</div>}
        <textarea
          className={styles.textarea}
          placeholder="Nota pessoal (opcional)"
          autoFocus
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        {erro && <div className={styles.erro}>{erro}</div>}
        <div className={styles.acoes}>
          {estado.tipo === 'nova' ? (
            <>
              <button type="button" className={styles.botaoPrimario} onClick={grifar}>
                Grifar
              </button>
              <button type="button" className={styles.botaoSecundario} onClick={aoFechar}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.botaoPrimario} onClick={salvarNota}>
                Salvar
              </button>
              <button type="button" className={styles.botaoPerigo} onClick={apagar}>
                Apagar destaque
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
