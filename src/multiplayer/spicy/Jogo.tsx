import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { FlippableCard } from './FlippableCard';
import { calcularPosicaoFan } from './fanLayout';
import { calcularPontuacaoFinal, determinarVencedor, type JogadorPontuacao } from './fimDePartida';
import { IconeForma } from './IconeForma';
import { textoDeclaracao, textoDesafio } from './textos';
import { CORES, type Carta, type Cor, type Declaracao, type Traco } from './types';
import { useJanelaDesafio } from './useJanelaDesafio';
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
  /** 1+ ids — desafios simultâneos (janela de detecção ~300ms, `Organizador.tsx`) dividem a pilha entre todos. */
  desafiantesIds: string[];
  declaranteVenceu: boolean;
  cartaRevelada: Carta;
  /** O que foi alegado (não a carta real) — usado no texto de sabor do desafio. */
  declaracaoContestada: Declaracao;
  /** Presente só quando os desafiantes venceram — id → pontos que cada um ganhou. */
  pontosPorDesafiante: Record<string, number>;
}

/**
 * Guarda de forma — bug real achado em 2026-08-15 (crash em produção, `TypeError:
 * Cannot read properties of undefined (reading 'map')`): `ultimoResultado` sincronizado
 * via Playroom (`useMultiplayerState`) apareceu truthy mas sem `desafiantesIds`/`cartaRevelada`
 * num reconnect/troca de sala — provável valor transitório do SDK antes do primeiro sync
 * real chegar. Sem essa guarda, `.map`/`.length`/`.id` em cima de campos ausentes quebravam
 * o render, e como o app não tem Error Boundary, a tela inteira ficava em branco. Mesmo
 * espírito de "dado desconhecido não derruba a UI" de `ComponenteTemaRenderer`.
 */
export function resultadoValido(r: ResultadoDesafioPublico | null): r is ResultadoDesafioPublico {
  return (
    r !== null &&
    Array.isArray(r.desafiantesIds) &&
    r.cartaRevelada != null &&
    r.pontosPorDesafiante != null
  );
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
  /** Cartas restantes no monte de compra — "relógio da partida" (§9). */
  pilhaCompraQtd: number;
  trofeusNoPote: number;
  trofeusColetados: Record<string, number>;
  /** Pontos acumulados vencendo desafios (tamanho da pilha no momento da vitória) — id → pontos. */
  pontuacoes: Record<string, number>;
  jogoEncerrado: boolean;
  worldsEndRevelada: boolean;
  ultimoResultado: ResultadoDesafioPublico | null;
  /** `Date.now()` da declaração/cópia atual, ou `null` — alimenta `useJanelaDesafio` (regra de turno §P2). */
  declaradoEm: number | null;
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

interface BlocoReveladoProps {
  resultado: ResultadoDesafioPublico;
  nome: (id: string) => string;
  fraseDesafio: string;
}

/**
 * Extraído do corpo de `Jogo` só pra isolar `reveladaVisivel` — precisa
 * nascer com `revelada={false}` (verso) e virar `true` um tick depois pra
 * `FlippableCard` de fato ver a prop MUDAR de valor e disparar o flip do
 * Framer Motion. Sem isso (`revelada` fixo em `true` desde o primeiro
 * render), a troca de carta entre desafios era instantânea — a mesma
 * instância nunca via `revelada` passar de `false` pra `true` de verdade.
 * `key={cartaRevelada.id}` no pai força essa instância a remontar (e
 * reiniciar `reveladaVisivel`) a cada novo resultado — sem isso, um 2º
 * desafio reusaria a mesma instância já com `reveladaVisivel: true`.
 */
function BlocoRevelado({ resultado, nome, fraseDesafio }: BlocoReveladoProps) {
  const [reveladaVisivel, setReveladaVisivel] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReveladaVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={styles.bloco}>
      <div className={styles.blocoLabel}>REVELADO</div>
      <div className={styles.reveladoLinha}>
        <FlippableCard carta={resultado.cartaRevelada} revelada={reveladaVisivel} className={styles.cartaMedia} />
        <div className={styles.reveladoTextos}>
          <div className={styles.reveladoTitulo}>
            Era {capitalizar(resultado.cartaRevelada.cor ?? '')} {resultado.cartaRevelada.valor}
          </div>
          <div className={styles.reveladoSubtitulo}>
            {resultado.declaranteVenceu ? (
              <>{nome(resultado.declaranteId)} venceu o desafio e leva a pilha.</>
            ) : resultado.desafiantesIds.length === 1 ? (
              <>{nome(resultado.desafiantesIds[0])} venceu o desafio e leva a pilha.</>
            ) : (
              <>
                {resultado.desafiantesIds.map(nome).join(' e ')} desafiaram juntos e venceram — pilha dividida
                entre eles.
              </>
            )}
          </div>
          {!resultado.declaranteVenceu && resultado.desafiantesIds.length > 1 && (
            <div className={styles.textoMuted}>
              {resultado.desafiantesIds
                .map((id) => `${nome(id)}: ${resultado.pontosPorDesafiante[id]} pts`)
                .join(' · ')}
            </div>
          )}
          {fraseDesafio && <div className={styles.textoMuted}>{fraseDesafio}</div>}
        </div>
      </div>
    </div>
  );
}

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
  const [cartaEmVoo, setCartaEmVoo] = useState<Carta | null>(null);

  // Fallback de segurança — se `onAnimationComplete` do Framer não disparar por algum motivo (unmount concorrente etc.), a carta não fica presa em voo pra sempre.
  useEffect(() => {
    if (!cartaEmVoo) return;
    const t = setTimeout(() => setCartaEmVoo(null), 700);
    return () => clearTimeout(t);
  }, [cartaEmVoo]);

  const nome = (id: string) => projecao.nomes[id] ?? id;

  // Sorteado uma vez por evento (chave muda a cada nova declaração/desafio), não a cada render —
  // `nome`/`projecao.nomes` ficam fora do dep array de propósito: `publicarEstado` recria o objeto
  // `nomes` a cada ação (mesmo as que não mudam o texto), o que ressortearia a frase sem necessidade.
  const fraseDeclaracao = useMemo(() => {
    if (!projecao.declaracaoAtual || !projecao.ultimoDeclaranteId) return '';
    return textoDeclaracao(nome(projecao.ultimoDeclaranteId), projecao.declaracaoAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projecao.ultimoDeclaranteId, projecao.pilhaSpicyQtd, projecao.declaracaoAtual?.cor, projecao.declaracaoAtual?.valor]);

  const fraseDesafio = useMemo(() => {
    if (!resultadoValido(projecao.ultimoResultado)) return '';
    const { declaranteId, desafiantesIds, declaracaoContestada } = projecao.ultimoResultado;
    const nomeDesafiantes = desafiantesIds.map(nome).join(' e ');
    return textoDesafio(nome(declaranteId), nomeDesafiantes, declaracaoContestada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projecao.ultimoResultado]);

  const minhaVez = projecao.jogadorDaVezId === meuId;
  const janelaDesafio = useJanelaDesafio(projecao.declaradoEm);
  // Regra de turno (§P2): não pode desafiar na própria vez, exceto janela de 5s em partidas de 2 —
  // enforcement de verdade fica no host (`turno.ts#podeDesafiarAgora`), isso só evita mostrar um botão que seria rejeitado.
  // Também nunca pro próprio declarante desafiar a própria declaração (bug achado 2026-08-14) — mesmo
  // guard que `podeCopiar` já tinha logo abaixo, espelhando `podeDesafiarAgora` no host.
  const podeDesafiar =
    projecao.pilhaSpicyQtd > 0 &&
    projecao.declaracaoAtual !== null &&
    projecao.ultimoDeclaranteId !== meuId &&
    (!minhaVez || (projecao.jogadores.length === 2 && janelaDesafio.ativa));
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

  /**
   * Clique duplo — "jogar limpo" (§P4): declara automaticamente o valor/cor
   * real da carta, sem passar pelo painel "Declarar como" (reservado só
   * pra blefe intencional). Só faz sentido pra cartas numeradas — wilds não
   * têm cor/valor fixo pra declarar "de verdade" (`FlippableCard` só recebe
   * o handler quando `carta.tipo === 'numerada'`, ver mão em leque abaixo).
   */
  const jogarCartaLimpa = (carta: Carta) => {
    if (carta.cor === undefined || carta.valor === undefined) return;
    setCartaEmVoo(carta);
    onAcao({
      tipo: 'declarar',
      cartaId: carta.id,
      declaracao: { cor: carta.cor, valor: carta.valor },
      anunciouUltima: minhaMao.length === 1,
    });
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
    const pontuacoesFinais: JogadorPontuacao[] = projecao.jogadores.map((id) => ({
      jogador: id,
      pontosPilha: projecao.pontuacoes[id] ?? 0,
      trofeus: projecao.trofeusColetados[id] ?? 0,
      cartasNaMao: projecao.contagemMaos[id] ?? 0,
    }));
    const vencedor = determinarVencedor(pontuacoesFinais);
    const resultadosOrdenados = pontuacoesFinais
      .map(calcularPontuacaoFinal)
      .sort((a, b) => b.pontuacaoFinal - a.pontuacaoFinal);

    return (
      <div className={styles.tela}>
        <div className={styles.fimDeJogo}>
          <h1 className={styles.fimTitulo}>Fim de jogo</h1>
          {projecao.worldsEndRevelada && (
            <p className={styles.fimTexto}>O Fim do Mundo foi revelado — a partida encerra imediatamente.</p>
          )}
          <p className={styles.fimTexto}>
            <strong>{nome(vencedor.jogador)}</strong> venceu
            {vencedor.vitoriaAutomatica ? ' — vitória automática (2 troféus)' : ''}!
          </p>
          <div className={styles.placarFinal}>
            {resultadosOrdenados.map((r) => (
              <div
                key={r.jogador}
                className={r.jogador === vencedor.jogador ? styles.placarFinalLinhaVencedor : styles.placarFinalLinha}
              >
                <span>{nome(r.jogador)}</span>
                <span className={styles.placarFinalValor}>{r.vitoriaAutomatica ? 'AUTO' : r.pontuacaoFinal}</span>
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
        <div className={styles.montePill}>
          <span>{projecao.pilhaCompraQtd} no monte</span>
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
        {/* Fora do `if (declaracaoAtual)` de propósito: a carta "voando" (clique duplo, §P4) precisa
            de um lugar pra aparecer mesmo jogando a 1ª carta de uma rodada nova (declaracaoAtual local
            ainda null até a ação ir e voltar do host). */}
        <div className={styles.pilhaStack}>
          {projecao.declaracaoAtual && (
            <>
              <div className={styles.pilhaSombra2} />
              <div className={styles.pilhaSombra1} />
              <FlippableCard carta={CARTA_VERSO_PILHA} revelada={false} className={styles.pilhaCartaTopo} />
            </>
          )}
          <AnimatePresence>
            {cartaEmVoo && (
              <FlippableCard
                key={cartaEmVoo.id}
                carta={cartaEmVoo}
                revelada
                className={styles.cartaVoando}
                onAnimationComplete={() => setCartaEmVoo(null)}
              />
            )}
          </AnimatePresence>
        </div>
        {projecao.declaracaoAtual && (
          <>
            <div className={styles.declaradoPill}>
              <span className={styles.declaradoLabel}>DECLARADO</span>
              <IconeForma cor={projecao.declaracaoAtual.cor} tamanho={12} />
              <span className={styles.declaradoValor}>
                {capitalizar(projecao.declaracaoAtual.cor)} {projecao.declaracaoAtual.valor}
              </span>
            </div>
            {fraseDeclaracao && <div className={styles.textoMuted}>{fraseDeclaracao}</div>}
          </>
        )}
      </div>

      {projecao.avisoSequenciaAtivo && projecao.ultimaDeclaracaoForaDeSequencia && (
        <div className={styles.avisoVermelho}>
          <div className={styles.avisoVermelhoIcone} />
          <span>Declaração fora de sequência</span>
        </div>
      )}

      {resultadoValido(projecao.ultimoResultado) && (
        <BlocoRevelado
          key={projecao.ultimoResultado.cartaRevelada.id}
          resultado={projecao.ultimoResultado}
          nome={nome}
          fraseDesafio={fraseDesafio}
        />
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
          {/* Carta em voo (clique duplo) some da mão aqui — reaparece no overlay do `.pilhaStack` acima, mesmo `layoutId` (`carta.id`), nunca os dois montados ao mesmo tempo. */}
          {minhaMao
            .filter((c) => c.id !== cartaEmVoo?.id)
            .map((carta, i, maoVisivel) => {
              const selecionada = carta.id === cartaSelecionada?.id;
              const { rotacaoDeg, deslocamentoY } = calcularPosicaoFan(i, maoVisivel.length);
              return (
                <FlippableCard
                  key={carta.id}
                  carta={carta}
                  revelada
                  className={selecionada ? styles.cartaFanSelecionada : styles.cartaFan}
                  selecionada={selecionada}
                  onClick={minhaVez ? () => setCartaSelecionada(carta) : undefined}
                  onDoubleClick={minhaVez && carta.tipo === 'numerada' ? () => jogarCartaLimpa(carta) : undefined}
                  rotacaoDeg={rotacaoDeg}
                  deslocamentoY={deslocamentoY}
                  zIndex={selecionada ? maoVisivel.length + 1 : i}
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
