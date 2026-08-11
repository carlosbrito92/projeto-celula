import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { FlippableCard } from './FlippableCard';
import { calcularPosicaoFan } from './fanLayout';
import { IconeForma } from './IconeForma';
import { CORES, type Carta, type Cor, type Declaracao, type Traco } from './types';
import type { Acao } from './acao';
import styles from './Jogo.module.css';

const VALORES = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * Carta de conteúdo irrelevante — só usada com `revelada={false}` (verso não
 * depende do id/tipo real, §6.1.1). Nunca a mesma referência de uma carta
 * real, então nunca cria continuidade de `layoutId` acidental com a mão de
 * ninguém. `FlippableCard` monta as duas faces sempre (o flip 3D depende
 * disso), então mesmo a face nunca exibida precisa de `cor`/`valor` válidos
 * — sem isso, `cartaParaVisual` quebra tentando montar a forma numerada.
 */
const CARTA_VERSO_PILHA: Carta = { id: 'pilha-topo', tipo: 'numerada', cor: 'vermelho', valor: 1 };

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
  /** Ordem de turno da partida — driva o placar de jogadores (só quantidade de cartas, nunca conteúdo). */
  jogadores: string[];
  /** id → quantidade de cartas na mão. Só contagem, nunca as cartas em si (nada de novo em termos de sigilo, §2). */
  contagemMaos: Record<string, number>;
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

const CORES_ATIVAS: Record<Cor, string> = {
  vermelho: styles.corPillAtivaVermelho,
  azul: styles.corPillAtivaAzul,
  verde: styles.corPillAtivaVerde,
};

/**
 * UI da tela de jogo (docs/Tela de Jogo Spicy.dc.html) — mesa escura + fio
 * dourado, mesmo par visual do verso da carta aprovado. Componente burro:
 * só lê a projeção pública + mão própria e emite `Acao` pro chamador
 * (Organizador/host aplica via `acao.ts`) — nenhuma chamada Playroom aqui
 * dentro.
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
        <div className={styles.fimDeJogo}>
          <h1 className={styles.fimTitulo}>Fim de jogo</h1>
          {projecao.worldsEndRevelada && (
            <p className={styles.fimTexto}>O Fim do Mundo foi revelado — a partida encerra imediatamente.</p>
          )}
          <div className={styles.placarFinal}>
            {Object.entries(projecao.trofeusColetados)
              .sort(([, a], [, b]) => b - a)
              .map(([id, qtd]) => (
                <div key={id} className={styles.placarFinalLinha}>
                  <span>{nome(id)}</span>
                  <span className={styles.placarFinalValor}>{qtd}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tela}>
      <div className={styles.header}>
        <div className={styles.headerVez}>
          Vez de: <strong>{nome(projecao.jogadorDaVezId)}</strong>
        </div>
        <div className={styles.trofeuPill}>
          <div className={styles.trofeuIcone} />
          <span>{projecao.trofeusNoPote} no pote</span>
        </div>
      </div>

      <div className={styles.placar}>
        {projecao.jogadores.map((id) => (
          <div
            key={id}
            className={id === projecao.jogadorDaVezId ? styles.placarItemAtivo : styles.placarItem}
          >
            <div className={styles.placarNome}>{id === meuId ? 'Você' : nome(id)}</div>
            <div className={styles.placarContagem}>{projecao.contagemMaos[id] ?? 0} cartas</div>
          </div>
        ))}
      </div>

      <div className={styles.colunaCentro}>
      <div className={styles.mesaCentro}>
        <div className={styles.pilhaLabel}>
          {projecao.declaracaoAtual ? `PILHA · ${projecao.pilhaSpicyQtd} CARTAS` : 'PILHA VAZIA'}
        </div>
        {projecao.declaracaoAtual && (
          <>
            <div className={styles.pilhaStack}>
              <div className={styles.pilhaSombra2} />
              <div className={styles.pilhaSombra1} />
              <FlippableCard carta={CARTA_VERSO_PILHA} revelada={false} className={styles.pilhaCartaTopo} />
            </div>
            <div className={styles.declaradoPill}>
              <span className={styles.declaradoLabel}>DECLARADO</span>
              <IconeForma cor={projecao.declaracaoAtual.cor} tamanho={12} />
              <span className={styles.declaradoValor}>
                {capitalizar(projecao.declaracaoAtual.cor)} {projecao.declaracaoAtual.valor}
              </span>
            </div>
          </>
        )}
      </div>

      {projecao.avisoSequenciaAtivo && projecao.ultimaDeclaracaoForaDeSequencia && (
        <div className={styles.avisoVermelho}>
          <div className={styles.avisoVermelhoIcone} />
          <span>Declaração fora de sequência</span>
        </div>
      )}

      {projecao.ultimoResultado && (
        <div className={styles.bloco}>
          <div className={styles.blocoLabel}>REVELADO</div>
          <div className={styles.reveladoLinha}>
            <FlippableCard carta={projecao.ultimoResultado.cartaRevelada} revelada className={styles.cartaMedia} />
            <div className={styles.reveladoTextos}>
              <div className={styles.reveladoTitulo}>
                Era {capitalizar(projecao.ultimoResultado.cartaRevelada.cor ?? '')}{' '}
                {projecao.ultimoResultado.cartaRevelada.valor}
              </div>
              <div className={styles.reveladoSubtitulo}>
                {nome(
                  projecao.ultimoResultado.declaranteVenceu
                    ? projecao.ultimoResultado.declaranteId
                    : projecao.ultimoResultado.desafianteId,
                )}{' '}
                venceu o desafio e leva a pilha.
              </div>
            </div>
          </div>
        </div>
      )}

      {projecao.pawHolderId && (
        <div className={styles.avisoDourado}>
          <div className={styles.trofeuIcone} />
          <span>{nome(projecao.pawHolderId)} reivindicou a pilha · Spice Raider</span>
        </div>
      )}

      {podeDesafiar && projecao.ultimaJogadaEhCopia && (
        <div className={styles.bloco}>
          <div className={styles.blocoLabel}>DESAFIAR CÓPIA · COPY CAT</div>
          <button type="button" className={styles.botaoVermelho} onClick={() => onAcao({ tipo: 'desafiar', traco: 'ambos' })}>
            Errado!
          </button>
        </div>
      )}

      {podeDesafiar && !projecao.ultimaJogadaEhCopia && (
        <div className={styles.bloco}>
          <div className={styles.blocoLabel}>DESAFIAR DECLARAÇÃO</div>
          <div className={styles.pillsLinha}>
            <button
              type="button"
              className={tracoDesafio === 'cor' ? styles.pillVermelhoAtiva : styles.pillNeutra}
              onClick={() => setTracoDesafio('cor')}
            >
              Duvidar da cor
            </button>
            <button
              type="button"
              className={tracoDesafio === 'valor' ? styles.pillVermelhoAtiva : styles.pillNeutra}
              onClick={() => setTracoDesafio('valor')}
            >
              Duvidar do número
            </button>
          </div>
          <button type="button" className={styles.botaoVermelho} onClick={() => onAcao({ tipo: 'desafiar', traco: tracoDesafio })}>
            Desafiar!
          </button>
        </div>
      )}

      {podeCopiar && (
        <div className={styles.bloco}>
          <div className={styles.blocoLabel}>COPIAR DECLARAÇÃO · COPY CAT</div>
          <div className={styles.textoMuted}>
            Escolha uma carta sua e copie a declaração de {nome(projecao.ultimoDeclaranteId ?? '')} (
            {projecao.declaracaoAtual && `${capitalizar(projecao.declaracaoAtual.cor)} ${projecao.declaracaoAtual.valor}`}
            ).
          </div>
          <div className={styles.mao}>
            {minhaMao.map((carta) => (
              <FlippableCard
                key={carta.id}
                carta={carta}
                revelada
                className={styles.cartaPequena}
                selecionada={carta.id === cartaParaCopiar?.id}
                onClick={() => setCartaParaCopiar(carta)}
              />
            ))}
          </div>
          {cartaParaCopiar && (
            <button type="button" className={styles.botaoAzul} onClick={confirmarCopia}>
              Copiar!
            </button>
          )}
        </div>
      )}

      <div className={styles.espacador} />

      {minhaVez && <div className={styles.suaVezBadge}>SUA VEZ</div>}

      <div className={styles.maoFan}>
        <AnimatePresence>
          {minhaMao.map((carta, i) => {
            const selecionada = carta.id === cartaSelecionada?.id;
            const { rotacaoDeg, deslocamentoY } = calcularPosicaoFan(i, minhaMao.length);
            return (
              <FlippableCard
                key={carta.id}
                carta={carta}
                revelada
                className={selecionada ? styles.cartaFanSelecionada : styles.cartaFan}
                selecionada={selecionada}
                onClick={minhaVez ? () => setCartaSelecionada(carta) : undefined}
                rotacaoDeg={rotacaoDeg}
                deslocamentoY={deslocamentoY}
                zIndex={selecionada ? minhaMao.length + 1 : i}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {minhaVez && (
        <div className={styles.painelDeclararControles}>
          <div className={styles.painelHeader}>
            <div className={styles.blocoLabel}>DECLARAR COMO</div>
            {minhaMao.length === 1 && (
              <label className={styles.ultimaCartaCheck}>
                <input
                  type="checkbox"
                  checked={anunciouUltima}
                  onChange={(e) => setAnunciouUltima(e.target.checked)}
                />
                Última carta!
              </label>
            )}
          </div>

          <div className={styles.pillsLinha}>
            {CORES.map((cor) => (
              <button
                key={cor}
                type="button"
                className={corDeclarada === cor ? CORES_ATIVAS[cor] : styles.pillNeutra}
                onClick={() => setCorDeclarada(cor)}
                data-testid={`cor-${cor}`}
              >
                <IconeForma cor={cor} tamanho={11} contorno={corDeclarada !== cor} />
                {capitalizar(cor)}
              </button>
            ))}
          </div>

          <div className={styles.valorGrid}>
            {VALORES.map((v) => (
              <button
                key={v}
                type="button"
                className={valorDeclarado === v ? styles.valorCelulaAtiva : styles.valorCelula}
                onClick={() => setValorDeclarado(v)}
                data-testid={`valor-${v}`}
              >
                {v}
              </button>
            ))}
          </div>

          {changeYourLuckAtivo && cartaSelecionada && (
            <div className={styles.bloco}>
              <div className={styles.blocoLabel}>CHANGE YOUR LUCK · VALOR 5</div>
              <div className={styles.textoMuted}>Enfiar até 2 cartas extras embaixo da pilha.</div>
              <div className={styles.mao}>
                {minhaMao
                  .filter((c) => c.id !== cartaSelecionada.id)
                  .map((carta) => (
                    <FlippableCard
                      key={carta.id}
                      carta={carta}
                      revelada
                      className={
                        extrasSelecionadas.includes(carta.id) ? styles.cartaPequenaDourada : styles.cartaPequena
                      }
                      selecionada={extrasSelecionadas.includes(carta.id)}
                      onClick={() => alternarExtra(carta.id)}
                    />
                  ))}
                <div className={styles.slotTracejado}>{extrasSelecionadas.length} de 2 escolhidas</div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {minhaVez && (
        <div className={styles.colunaAcoes}>
          <div className={styles.acoesRodape}>
            <button type="button" className={styles.botaoContorno} onClick={() => onAcao({ tipo: 'passar' })}>
              Passar
            </button>
            <button
              type="button"
              className={styles.botaoVerde}
              onClick={confirmarDeclaracao}
              disabled={!cartaSelecionada}
            >
              Jogar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
