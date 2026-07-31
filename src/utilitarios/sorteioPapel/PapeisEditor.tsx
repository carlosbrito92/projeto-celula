import { useState } from 'react';
import { somaQuantidades, type PapelConfig } from './papeis';
import styles from './PapeisEditor.module.css';

interface PapeisEditorProps {
  papeis: PapelConfig[];
  onChange: (papeis: PapelConfig[]) => void;
  totalParticipantes: number;
}

/** Setup de papéis múltiplos (nome + quantidade) — docs/spec-privacidade-sorteio.md § Extensão. */
export function PapeisEditor({ papeis, onChange, totalParticipantes }: PapeisEditorProps) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const soma = somaQuantidades(papeis);
  const restante = totalParticipantes - soma;
  const quantidadeNumero = Number(quantidade);
  const quantidadeValida = quantidade.trim() !== '' && Number.isFinite(quantidadeNumero) && quantidadeNumero > 0;

  function adicionar() {
    if (!nome.trim() || !quantidadeValida) return;
    onChange([...papeis, { nome: nome.trim(), quantidade: quantidadeNumero }]);
    setNome('');
    setQuantidade('');
  }

  function preencherRestante() {
    if (!nome.trim() || restante <= 0) return;
    onChange([...papeis, { nome: nome.trim(), quantidade: restante }]);
    setNome('');
    setQuantidade('');
  }

  function remover(indice: number) {
    onChange(papeis.filter((_, i) => i !== indice));
  }

  return (
    <div className={styles.wrapper}>
      {papeis.map((p, i) => (
        <button key={`${p.nome}-${i}`} type="button" className={styles.chip} onClick={() => remover(i)}>
          {p.nome} × {p.quantidade} <span aria-hidden="true">✕</span>
        </button>
      ))}

      <div className={styles.form}>
        <input
          className={styles.inputNome}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do papel"
        />
        <input
          className={styles.inputQtd}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Qtd"
          inputMode="numeric"
        />
        <button type="button" className={styles.addBotao} onClick={adicionar} disabled={!nome.trim() || !quantidadeValida}>
          + papel
        </button>
      </div>

      {totalParticipantes > 0 && restante > 0 && nome.trim() && (
        <button type="button" className={styles.preencherBotao} onClick={preencherRestante}>
          Preencher restante ({restante}) com "{nome.trim()}"
        </button>
      )}

      {totalParticipantes > 0 && (
        <div
          className={
            soma === totalParticipantes ? styles.validacaoOk : styles.validacaoAlerta
          }
        >
          {soma === totalParticipantes
            ? `${soma} de ${totalParticipantes} — pronto para sortear`
            : soma < totalParticipantes
              ? `Faltam ${totalParticipantes - soma} participante(s) sem papel definido`
              : `Papéis em excesso: ${soma - totalParticipantes} a mais que o total de participantes`}
        </div>
      )}
    </div>
  );
}
