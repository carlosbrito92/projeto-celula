import { useState } from 'react';
import { idCampo } from '../../../editorial/caminho';
import { adicionarBloco, moverSecao, removerSecao, ROTULO_TIPO_BLOCO, type TipoNovoBloco } from '../../../editorial/modelo';
import { BlocoEditor } from './BlocoEditor';
import { CampoTexto } from './Campos';
import { errosDoCampo, useEditor } from './contexto';
import styles from '../Editor.module.css';

const TIPOS = Object.entries(ROTULO_TIPO_BLOCO) as [TipoNovoBloco, string][];

export function SecaoEditor({ s, total }: { s: number; total: number }) {
  const { conteudo, aplicar, erros } = useEditor();
  const secao = conteudo.secoes[s];
  const iMapa = conteudo.mapa_pontos.findIndex((p) => p.id === secao.id);
  const tituloIndice = iMapa >= 0 ? conteudo.mapa_pontos[iMapa].titulo : '';
  const extra = !secao.numero;
  const [novoTipo, setNovoTipo] = useState<TipoNovoBloco>('paragrafo');
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const qtdErros = errosDoCampo(erros, `secoes[${s}]`).length + erros.filter((e) => e.caminho.startsWith(`secoes[${s}].`)).length;

  return (
    <details className={styles.grupo} id={idCampo(['secoes', s])} open>
      <summary className={styles.grupoTitulo}>
        <span className={styles.numero}>{extra ? '—' : secao.numero}</span>
        <span>{tituloIndice || secao.titulo || 'Ponto sem título'}</span>
        {qtdErros > 0 && <span className={styles.contadorErros}>{qtdErros}</span>}
      </summary>
      <div className={styles.grupoCorpo}>
        {iMapa >= 0 && (
          <CampoTexto
            caminho={['mapa_pontos', iMapa, 'titulo']}
            rotulo="Título no índice"
            dica="Curto — aparece na trilha de pontos."
            obrigatorio
          />
        )}
        <CampoTexto
          caminho={['secoes', s, 'titulo']}
          rotulo="Título da seção"
          dica={iMapa >= 0 ? 'Se ficar vazio, usa o título do índice.' : undefined}
          obrigatorio={iMapa < 0}
        />
        <CampoTexto caminho={['secoes', s, 'sec_eyebrow']} rotulo="Rótulo (opcional)" dica='Ex: "Fundação", "Conclusão".' />
        <CampoTexto caminho={['secoes', s, 'referencias']} rotulo="Referências (opcional)" dica="Ex: Gênesis 3.15 · Romanos 3.20" />

        <div className={styles.blocos}>
          {secao.corpo.map((_, b) => (
            <BlocoEditor key={b} s={s} b={b} total={secao.corpo.length} />
          ))}
          {errosDoCampo(erros, `secoes[${s}].corpo`)
            .filter((e) => e.caminho === `secoes[${s}].corpo`)
            .map((e) => (
              <div key={e.mensagem} className={styles.erroCampo}>
                Conteúdo: {e.mensagem}
              </div>
            ))}
        </div>

        <div className={styles.adicionar}>
          <label className={styles.rotulo} htmlFor={`novo-bloco-${s}`}>
            Adicionar bloco
          </label>
          <div className={styles.linha}>
            <select id={`novo-bloco-${s}`} className={styles.input} value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoNovoBloco)}>
              {TIPOS.map(([t, nome]) => (
                <option key={t} value={t}>
                  {nome}
                </option>
              ))}
            </select>
            <button type="button" className={styles.botaoSecundario} onClick={() => aplicar((c) => adicionarBloco(c, s, novoTipo))}>
              Adicionar
            </button>
          </div>
        </div>

        <div className={styles.acoesSecao}>
          <button type="button" className={styles.botaoSecundario} disabled={s === 0} onClick={() => aplicar((c) => moverSecao(c, s, -1))}>
            ↑ Subir ponto
          </button>
          <button type="button" className={styles.botaoSecundario} disabled={s === total - 1} onClick={() => aplicar((c) => moverSecao(c, s, 1))}>
            ↓ Descer ponto
          </button>
          {confirmarRemocao ? (
            <>
              <button
                type="button"
                className={styles.botaoPerigo}
                onClick={() => {
                  setConfirmarRemocao(false);
                  aplicar((c) => removerSecao(c, s));
                }}
              >
                Confirmar remoção
              </button>
              <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmarRemocao(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmarRemocao(true)}>
              Remover ponto
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
