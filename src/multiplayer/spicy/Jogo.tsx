import { useState } from 'react';
import { CORES, type Carta, type Cor, type Declaracao, type Traco } from './types';
import type { Acao } from './acao';
import styles from './Jogo.module.css';

const VALORES = Array.from({ length: 10 }, (_, i) => i + 1);

function rotuloCarta(carta: Carta): string {
  switch (carta.tipo) {
    case 'numerada':
      return `${capitalizar(carta.cor!)} ${carta.valor}`;
    case 'wild_cor':
      return 'Wild de cor';
    case 'wild_numero':
      return 'Wild de número';
    case 'trofeu':
      return 'Troféu';
    case 'fim_do_mundo':
      return "Fim do Mundo";
  }
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ResultadoDesafioPublico {
  declaranteId: string;
  desafianteId: string;
  declaranteVenceu: boolean;
  cartaRevelada: Carta;
}

export interface ProjecaoPublica {
  jogadorDaVezId: string;
  declaracaoAtual: Declaracao | null;
  ultimoDeclaranteId: string | null;
  pilhaSpicyQtd: number;
  trofeusNoPote: number;
  trofeusColetados: Record<string, number>;
  jogoEncerrado: boolean;
  worldsEndRevelada: boolean;
  ultimoResultado: ResultadoDesafioPublico | null;
  /** id → nome (só o que cada jogador digitou no início, sem PII além disso). */
  nomes: Record<string, string>;
  /** Toggle de setup (§4) — só controla se o aviso abaixo aparece; motor sempre calcula. */
  avisoSequenciaAtivo: boolean;
  /** true logo após uma declaração fora de sequência; próxima ação de qualquer tipo reseta. */
  ultimaDeclaracaoForaDeSequencia: boolean;
  /** Variante "Spice It Up!" ativa nesta partida (§5), ou `null`. */
  varianteAtiva: string | null;
  /** Spice Raider (§5): jogador que reivindicou a pilha atual, ou `null`. */
  pawHolderId: string | null;
  /** Copy Cat (§5): true quando o topo da pilha é uma cópia — desafio não pede traço. */
  ultimaJogadaEhCopia: boolean;
}

interface JogoProps {
  meuId: string;
  minhaMao: Carta[];
  projecao: ProjecaoPublica;
  onAcao: (acao: Acao) => void;
}

/**
 * UI mínima do Sprint B (docs/spicy-spec.md §7) — texto e botões, sem SVG,
 * sem visual de carta (isso é Sprint C). Componente burro: só lê a projeção
 * pública + mão própria e emite `Acao` pro chamador (Organizador/host
 * aplica via `acao.ts`) — nenhuma chamada Playroom aqui dentro.
 */
export function Jogo({ meuId, minhaMao, projecao, onAcao }: JogoProps) {
  const [cartaSelecionada, setCartaSelecionada] = useState<Carta | null>(null);
  const [corDeclarada, setCorDeclarada] = useState<Cor>('vermelho');
  const [valorDeclarado, setValorDeclarado] = useState(1);
  const [anunciouUltima, setAnunciouUltima] = useState(false);
  const [tracoDesafio, setTracoDesafio] = useState<Traco>('cor');
  const [extrasSelecionadas, setExtrasSelecionadas] = useState<string[]>([]);
  const [cartaParaCopiar, setCartaParaCopiar] = useState<Carta | null>(null);

  const nome = (id: string) => projecao.nomes[id] ?? id;
  const minhaVez = projecao.jogadorDaVezId === meuId;
  const podeDesafiar = projecao.pilhaSpicyQtd > 0 && projecao.declaracaoAtual !== null;
  const podeCopiar =
    projecao.varianteAtiva === 'copy_cat' && podeDesafiar && projecao.ultimoDeclaranteId !== meuId;
  const changeYourLuckAtivo = projecao.varianteAtiva === 'change_your_luck' && valorDeclarado === 5;

  const confirmarDeclaracao = () => {
    if (!cartaSelecionada) return;
    onAcao({
      tipo: 'declarar',
      cartaId: cartaSelecionada.id,
      declaracao: { cor: corDeclarada, valor: valorDeclarado },
      anunciouUltima,
      cartasExtrasParaEnfiar: changeYourLuckAtivo ? extrasSelecionadas : undefined,
    });
    setCartaSelecionada(null);
    setAnunciouUltima(false);
    setExtrasSelecionadas([]);
  };

  const alternarExtra = (cartaId: string) => {
    setExtrasSelecionadas((atual) =>
      atual.includes(cartaId)
        ? atual.filter((id) => id !== cartaId)
        : atual.length < 2
          ? [...atual, cartaId]
          : atual,
    );
  };

  const confirmarCopia = () => {
    if (!cartaParaCopiar) return;
    onAcao({ tipo: 'copiar', cartaId: cartaParaCopiar.id });
    setCartaParaCopiar(null);
  };

  if (projecao.jogoEncerrado) {
    return (
      <div className={styles.tela}>
        <h1 className={styles.titulo}>Fim de jogo</h1>
        {projecao.worldsEndRevelada && (
          <p className={styles.texto}>O Fim do Mundo foi revelado — a partida encerra imediatamente.</p>
        )}
        <div className={styles.placar}>
          {Object.entries(projecao.trofeusColetados).map(([id, qtd]) => (
            <div key={id}>
              {nome(id)}: {qtd} troféu(s)
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tela}>
      <div className={styles.cabecalho}>
        <div>
          Vez de: <strong>{nome(projecao.jogadorDaVezId)}</strong>
        </div>
        <div>Troféus no pote: {projecao.trofeusNoPote}</div>
      </div>

      <div className={styles.pilha}>
        {projecao.declaracaoAtual
          ? `Pilha: ${projecao.pilhaSpicyQtd} carta(s) — declarado ${capitalizar(projecao.declaracaoAtual.cor)} ${projecao.declaracaoAtual.valor}`
          : 'Pilha vazia'}
      </div>

      {projecao.avisoSequenciaAtivo && projecao.ultimaDeclaracaoForaDeSequencia && (
        <div className={styles.aviso}>⚠ Essa declaração quebrou a sequência esperada.</div>
      )}

      {projecao.ultimoResultado && (
        <div className={styles.resultado}>
          Revelado: {rotuloCarta(projecao.ultimoResultado.cartaRevelada)} —{' '}
          {nome(projecao.ultimoResultado.declaranteVenceu ? projecao.ultimoResultado.declaranteId : projecao.ultimoResultado.desafianteId)}{' '}
          venceu o desafio
        </div>
      )}

      {projecao.pawHolderId && (
        <div className={styles.aviso}>
          🐾 {nome(projecao.pawHolderId)} reivindicou a pilha (Spice Raider) — resolve na próxima jogada.
        </div>
      )}

      {podeDesafiar && projecao.ultimaJogadaEhCopia && (
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Desafiar cópia (Copy Cat)</div>
          <button type="button" onClick={() => onAcao({ tipo: 'desafiar', traco: 'ambos' })}>
            Errado!
          </button>
        </div>
      )}

      {podeDesafiar && !projecao.ultimaJogadaEhCopia && (
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Desafiar declaração</div>
          <select value={tracoDesafio} onChange={(e) => setTracoDesafio(e.target.value as Traco)}>
            <option value="cor">Duvidar da cor</option>
            <option value="valor">Duvidar do número</option>
          </select>
          <button type="button" onClick={() => onAcao({ tipo: 'desafiar', traco: tracoDesafio })}>
            Desafiar!
          </button>
        </div>
      )}

      {podeCopiar && (
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Copiar declaração (Copy Cat)</div>
          <div className={styles.mao}>
            {minhaMao.map((carta) => (
              <button
                key={carta.id}
                type="button"
                className={carta.id === cartaParaCopiar?.id ? styles.cartaSelecionada : styles.carta}
                onClick={() => setCartaParaCopiar(carta)}
              >
                {rotuloCarta(carta)}
              </button>
            ))}
          </div>
          {cartaParaCopiar && (
            <button type="button" onClick={confirmarCopia}>
              Copiar!
            </button>
          )}
        </div>
      )}

      {minhaVez && (
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Sua mão ({minhaMao.length})</div>
          <div className={styles.mao}>
            {minhaMao.map((carta) => (
              <button
                key={carta.id}
                type="button"
                className={carta.id === cartaSelecionada?.id ? styles.cartaSelecionada : styles.carta}
                onClick={() => setCartaSelecionada(carta)}
              >
                {rotuloCarta(carta)}
              </button>
            ))}
          </div>

          {cartaSelecionada && (
            <div className={styles.declarar}>
              <div className={styles.blocoTitulo}>Declarar como:</div>
              <select
                data-testid="select-cor"
                value={corDeclarada}
                onChange={(e) => setCorDeclarada(e.target.value as Cor)}
              >
                {CORES.map((cor) => (
                  <option key={cor} value={cor}>
                    {capitalizar(cor)}
                  </option>
                ))}
              </select>
              <select
                data-testid="select-valor"
                value={valorDeclarado}
                onChange={(e) => setValorDeclarado(Number(e.target.value))}
              >
                {VALORES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {minhaMao.length === 1 && (
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={anunciouUltima}
                    onChange={(e) => setAnunciouUltima(e.target.checked)}
                  />
                  Última carta!
                </label>
              )}

              {changeYourLuckAtivo && (
                <div className={styles.declarar}>
                  <div className={styles.blocoTitulo}>Enfiar até 2 cartas extras embaixo (Change Your Luck)</div>
                  <div className={styles.mao}>
                    {minhaMao
                      .filter((c) => c.id !== cartaSelecionada.id)
                      .map((carta) => (
                        <button
                          key={carta.id}
                          type="button"
                          className={
                            extrasSelecionadas.includes(carta.id) ? styles.cartaSelecionada : styles.carta
                          }
                          onClick={() => alternarExtra(carta.id)}
                        >
                          {rotuloCarta(carta)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <button type="button" onClick={confirmarDeclaracao}>
                Jogar
              </button>
            </div>
          )}

          <button type="button" onClick={() => onAcao({ tipo: 'passar' })}>
            Passar
          </button>
        </div>
      )}

      {!minhaVez && (
        <div className={styles.mao}>
          {minhaMao.map((carta) => (
            <div key={carta.id} className={styles.carta}>
              {rotuloCarta(carta)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
