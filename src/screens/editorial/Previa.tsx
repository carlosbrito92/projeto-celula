import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { limparParaPublicar, type Conteudo } from '../../editorial/modelo';
import { ThemeScope } from '../../themes/ThemeScope';
import { resolveTema } from '../../themes/registry';
import { ConteudoLeitura } from '../pregacoes/ConteudoLeitura';
import { ResumoCurtoOverlay } from '../pregacoes/ResumoCurtoOverlay';
import leitura from '../pregacoes/Reading.module.css';
import styles from './Editor.module.css';

// Prévia ao vivo (docs/painel-editorial.md §7.4): o mesmo ConteudoLeitura da
// tela de Leitura, com o tema resolvido pela série, sobre o JSON que seria
// enviado (limparParaPublicar). No celular cobre a tela; em tela larga fica ao
// lado do editor e acompanha a digitação.

export function Previa({ conteudo, aoFechar }: { conteudo: Conteudo; aoFechar: () => void }) {
  const adiado = useDeferredValue(conteudo); // digitação não espera a prévia redesenhar
  const limpo = useMemo(() => limparParaPublicar(adiado), [adiado]);
  const [resumoAberto, setResumoAberto] = useState(false);
  const m = limpo.metadados;
  const tema = resolveTema(m.serie, m.tema_override);
  const resumo = limpo.resumo_lider ?? limpo.resumo_curto;

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aoFechar]);

  return (
    <div className={styles.previaLeitura} role="dialog" aria-label="Prévia da leitura">
      <div className={styles.previaLeituraBarra}>
        <span>Prévia · como fica para quem lê</span>
        <button type="button" className={styles.botaoSecundario} onClick={aoFechar}>
          Voltar a editar
        </button>
      </div>
      <ThemeScope tema={tema}>
        {resumoAberto && resumo ? (
          <ResumoCurtoOverlay resumo={resumo} aoFechar={() => setResumoAberto(false)} />
        ) : (
          <div className={leitura.wrapper}>
            {/* Mesmo cabeçalho da Leitura, sem ficar grudado no topo (a barra da prévia já fica). */}
            <div className={leitura.headerSticky} style={{ position: 'static' }}>
              <div className={leitura.header}>
                <div className={leitura.headerInfo}>
                  <div className={leitura.headerTitulo}>{m.tema || 'Sem tema'}</div>
                  <div className={leitura.headerMeta}>
                    {m.pregador && <span>{m.pregador}</span>}
                    {m.pregador && m.data && <span>·</span>}
                    {m.data && <span>{m.data}</span>}
                    {m.texto_base && <span>· {m.texto_base}</span>}
                  </div>
                </div>
              </div>
            </div>
            <ConteudoLeitura
              serie={m.serie}
              conteudo={limpo}
              pregador={m.pregador}
              dataExibicao={m.data}
              aoAbrirResumo={resumo ? () => setResumoAberto(true) : undefined}
            />
          </div>
        )}
      </ThemeScope>
    </div>
  );
}
