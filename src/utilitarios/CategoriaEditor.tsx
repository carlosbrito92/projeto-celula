import styles from './CategoriaEditor.module.css';

export interface CategoriaConfig {
  nome: string;
  palavras: string[];
}

interface CategoriaEditorProps {
  categorias: CategoriaConfig[];
  categoriaEscolhida: string | null;
  onEscolher: (nome: string) => void;
  /**
   * Quantas palavras a categoria escolhida precisa ter — varia por widget:
   * sorteio de atribuição escondida precisa de uma palavra por participante
   * (cada um recebe um valor diferente); sorteio de papel especial no modo
   * Artista Impostor precisa de só 1 (a palavra é compartilhada por todo
   * mundo, menos o impostor) — ver docs/spec-privacidade-sorteio.md
   * § Correção: modelo "Artista Impostor" é diferente do modelo "Detetive".
   */
  minimoPalavras: number;
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
  minimoPalavras,
}: CategoriaEditorProps) {
  const categoria = categorias.find((c) => c.nome === categoriaEscolhida) ?? null;
  const palavrasSuficientes = categoria ? categoria.palavras.length >= minimoPalavras : false;

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

      {categoria && minimoPalavras > 0 && (
        <div className={palavrasSuficientes ? styles.validacaoOk : styles.validacaoAlerta}>
          {palavrasSuficientes
            ? `Categoria "${categoria.nome}" selecionada — pronto para sortear`
            : `Categoria "${categoria.nome}" tem só ${categoria.palavras.length} palavra(s) — precisa de pelo menos ${minimoPalavras}`}
        </div>
      )}
    </div>
  );
}
