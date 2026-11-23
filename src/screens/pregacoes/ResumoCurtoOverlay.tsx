import { useState, type CSSProperties } from 'react';
import { Icon } from '../../icons/Icon';
import styles from './ResumoCurtoOverlay.module.css';

interface PontoResumo {
  numero: number;
  titulo: string;
  resumo: string;
  frase_chave?: string;
}

interface ResumoOverlayProps {
  resumo: {
    frase_tema?: string;
    pontos?: (string | PontoResumo)[];
    versiculo_chave?: { referencia: string; texto: string };
  };
  aoFechar: () => void;
  /** Escala de fonte do botão "Aa" da Leitura, para o resumo acompanhar. */
  escala?: number;
}

export function ResumoCurtoOverlay({ resumo, aoFechar, escala = 1 }: ResumoOverlayProps) {
  const [progresso, setProgresso] = useState(0);

  // Progresso de rolagem do próprio corpo (o overlay rola por dentro, não a janela).
  const aoRolar = (el: HTMLDivElement) => {
    const max = el.scrollHeight - el.clientHeight;
    setProgresso(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
  };

  return (
    <div className={styles.overlay} style={{ '--leitura-escala': escala } as CSSProperties}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.voltar}
          onClick={aoFechar}
          aria-label="Fechar resumo"
        >
          ← Voltar
        </button>
        <span className={styles.headerLabel}>Versão Resumida</span>
      </header>
      <div className={styles.progressoBarra}>
        <div className={styles.progressoPreenchimento} style={{ width: `${progresso}%` }} />
      </div>

      <div className={styles.corpo} onScroll={(e) => aoRolar(e.currentTarget)}>
        {resumo.frase_tema && (
          <div className={styles.fraseTema}>
            {resumo.frase_tema}
          </div>
        )}

        {resumo.pontos && resumo.pontos.length > 0 && (
          <ul className={styles.pontos}>
            {resumo.pontos.map((ponto, index) => {
              const ehObjeto = typeof ponto === 'object' && ponto !== null;
              const ehNovoFormato = ehObjeto && 'numero' in ponto && 'titulo' in ponto;

              const numero = ehNovoFormato ? (ponto as PontoResumo).numero : index + 1;
              const titulo = ehNovoFormato ? (ponto as PontoResumo).titulo : `Ponto ${numero}`;
              const textoResumo = ehNovoFormato
                ? (ponto as PontoResumo).resumo
                : (typeof ponto === 'string' ? ponto : '');
              const fraseChave = ehNovoFormato ? (ponto as PontoResumo).frase_chave : undefined;

              return (
                <li key={index} className={styles.pontoItem}>
                  <div className={styles.cabecalhoPonto}>
                    <span className={styles.pontoNumero}>{String(numero).padStart(2, '0')}</span>
                    <h3 className={styles.tituloPonto}>{titulo}</h3>
                  </div>
                  <p className={styles.pontoTexto}>{textoResumo}</p>
                  {fraseChave && (
                    <blockquote className={styles.fraseChave}>
                      <Icon name="quote" className={styles.iconeAspas} />
                      <span>{fraseChave}</span>
                    </blockquote>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {resumo.versiculo_chave && (
          <div className={styles.versiculoChave}>
            <p className={styles.versiculoChaveTexto}>"{resumo.versiculo_chave.texto}"</p>
            <span className={styles.versiculoChaveReferencia}>{resumo.versiculo_chave.referencia}</span>
          </div>
        )}
      </div>

      <button type="button" className={styles.ctaCompleta} onClick={aoFechar}>
        Ler a mensagem completa
      </button>
    </div>
  );
}
