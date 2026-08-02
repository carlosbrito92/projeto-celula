import styles from './CategoriaEditor.module.css';

export interface CategoriaConfig {
  nome: string;
  palavras: string[];
}

interface CategoriaEditorProps {
  categorias: CategoriaConfig[];
  categoriaEscolhida: string | null;
  onEscolher: (nome: string) => void;
  totalParticipantes: number;
}

/**
 * Seletor de categoria — nunca renderiza `palavras`, só `nome`. É a garantia
 * central da spec (docs/spec-privacidade-sorteio.md § Extensão: banco de
 * categorias): quem configura escolhe uma categoria, nunca vê a palavra
 * específica, que só é sorteada e revelada na tela individual de cada
 * participante.
 */
export function CategoriaEditor({
  categorias,
  categoriaEscolhida,
  onEscolher,
  totalParticipantes,
}: CategoriaEditorProps) {
  const categoria = categorias.find((c) => c.nome === categoriaEscolhida) ?? null;
  const palavrasSuficientes = categoria ? categoria.palavras.length >= totalParticipantes : false;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pills}>
        {categorias.map((c) => (
          <button
            key={c.nome}
            type="button"
            className={`${styles.pill} ${c.nome === categoriaEscolhida ? styles.pillAtiva : ''}`}
            onClick={() => onEscolher(c.nome)}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {categoria && totalParticipantes > 0 && (
        <div className={palavrasSuficientes ? styles.validacaoOk : styles.validacaoAlerta}>
          {palavrasSuficientes
            ? `Categoria "${categoria.nome}" selecionada — pronto para sortear`
            : `Categoria "${categoria.nome}" tem só ${categoria.palavras.length} palavra(s) para ${totalParticipantes} participantes`}
        </div>
      )}
    </div>
  );
}
