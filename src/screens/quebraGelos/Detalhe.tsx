import { useState } from 'react';
import { Link } from '../../router/Router';
import { useQuebraGeloJogo } from '../../content/useQuebraGelos';
import { Icon } from '../../icons/Icon';
import type { QuebraGeloJogoConteudo, UtilitarioInlineRef } from '../../content/types';
import { SorteioAtribuicao } from '../../utilitarios/sorteioAtribuicao/SorteioAtribuicao';
import { SorteioPapel } from '../../utilitarios/sorteioPapel/SorteioPapel';
import { Cronometro } from '../../utilitarios/cronometro/Cronometro';
import { formatarDuracao, formatarIdade, formatarJogadores } from './metaFormat';
import styles from './Detalhe.module.css';

function renderUtilitario(ref: UtilitarioInlineRef, aoFechar: () => void) {
  switch (ref.utilitario_tipo) {
    case 'sorteio_atribuicao':
      return <SorteioAtribuicao categorias={ref.categorias} aoFechar={aoFechar} />;
    case 'sorteio_papel':
      return <SorteioPapel papeis={ref.papeis} aoFechar={aoFechar} />;
    case 'cronometro':
      return <Cronometro aoFechar={aoFechar} />;
    default:
      return null;
  }
}

export function Detalhe({ id }: { id: string }) {
  const { jogo, erro, carregando } = useQuebraGeloJogo(id);
  const [utilitarioAberto, setUtilitarioAberto] = useState<UtilitarioInlineRef | null>(null);

  if (erro) return <div className={styles.semRegras}>Não foi possível carregar este quebra-gelo.</div>;
  if (carregando || !jogo) return <div className={styles.semRegras}>Carregando…</div>;

  if (utilitarioAberto) {
    return (
      <div className={styles.overlay}>{renderUtilitario(utilitarioAberto, () => setUtilitarioAberto(null))}</div>
    );
  }

  const conteudo = jogo.conteudo as QuebraGeloJogoConteudo;
  const badges = [
    formatarJogadores(conteudo.jogadores),
    formatarIdade(conteudo.idade_minima),
    formatarDuracao(conteudo.duracao_minutos),
  ].filter((b): b is string => Boolean(b));

  const [ctaPrincipal, ...ctasSecundarios] = conteudo.utilitarios_inline ?? [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Link to="/quebra-gelos" className={styles.voltar}>
          ←
        </Link>
        <div className={styles.tipoLabel}>
          {jogo.tipo === 'instrucional' ? 'Só leitura' : 'Com sorteio'}
        </div>
      </div>

      <div className={styles.hero}>
        {conteudo.icone && (
          <div className={styles.heroIcone}>
            <Icon name={conteudo.icone} />
          </div>
        )}
        <div className={styles.heroTitulo}>{jogo.nome}</div>
        {badges.length > 0 && (
          <div className={styles.badges}>
            {badges.map((b) => (
              <span key={b} className={styles.badge}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {conteudo.regras && conteudo.regras.length > 0 ? (
        <div className={styles.regras}>
          {conteudo.regras.map((texto, i) => (
            <div key={i} className={styles.regraItem}>
              <span className={styles.regraNumero}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.regraTexto}>{texto}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.semRegras}>Detalhes em breve.</div>
      )}

      {ctaPrincipal && (
        <>
          <button
            type="button"
            className={styles.ctaBloco}
            onClick={() => setUtilitarioAberto(ctaPrincipal)}
          >
            <div className={styles.ctaTextos}>
              <div className={styles.ctaEyebrow}>{ctaPrincipal.eyebrow ?? 'Antes de começar'}</div>
              <div className={styles.ctaTitulo}>{ctaPrincipal.rotulo_acao}</div>
            </div>
            <div className={styles.ctaIcone}>
              <Icon name="dices" />
            </div>
          </button>
          {ctasSecundarios.length > 0 && (
            <div className={styles.depois}>
              Depois: {ctasSecundarios.map((c) => c.rotulo_acao).join(' · ')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
