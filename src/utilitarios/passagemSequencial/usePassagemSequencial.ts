import { useState } from 'react';
import { resolverParticipantes } from './resolverParticipantes';
import { lerNomesPersistidos, salvarNomesPersistidos } from '../nomesPersistentes';

type SubFasePassagem = 'aguardando' | 'revelado' | 'confirmando';

type Estado =
  | { fase: 'setup' }
  | { fase: 'passagem'; indice: number; sub: SubFasePassagem }
  | { fase: 'gestao' };

/**
 * Fluxo de privacidade sequencial ("passar o celular") — docs/spec-privacidade-sorteio.md.
 * Compartilhado entre sorteio de atribuição escondida e sorteio de papel especial:
 * a diferença entre os dois está só em `gerarValores` (o que é sorteado), nunca
 * em como a privacidade é gerida. Natureza temporária — solução para a restrição
 * de V1 single-device (um celular circulando), não arquitetura permanente.
 */
export function usePassagemSequencial() {
  const [quantidade, setQuantidade] = useState(0);
  // Inicializa com nomes de uma sessão anterior na mesma visita (docs/spec-privacidade-sorteio.md
  // § Extensão: nomes persistentes) — cada setNomes() também persiste, ver abaixo.
  const [nomes, setNomesState] = useState<string[]>(lerNomesPersistidos);
  const [liderParticipa, setLiderParticipa] = useState(false);

  function setNomes(novosNomes: string[]) {
    setNomesState(novosNomes);
    salvarNomesPersistidos(novosNomes);
  }

  const [participantes, setParticipantes] = useState<string[]>([]);
  const [valores, setValores] = useState<string[]>([]);
  const [revelados, setRevelados] = useState<boolean[]>([]);
  const [estado, setEstado] = useState<Estado>({ fase: 'setup' });

  /**
   * `quantidadeFinal` é recebida explicitamente (não lida do estado `quantidade`)
   * porque widgets tipicamente chamam `setQuantidade(nomes.length)` e `iniciar()`
   * no mesmo handler de evento — `setQuantidade` não atualiza `quantidade` a
   * tempo do `iniciar` desta mesma chamada (closure obsoleta), então `iniciar`
   * não pode confiar no `quantidade` já commitado. Achado testando no device
   * (participante ficava em branco na tela de passagem).
   */
  function iniciar(
    quantidadeFinal: number,
    gerarValores: (participantes: string[]) => Record<string, string>,
  ) {
    const novosParticipantes = resolverParticipantes(quantidadeFinal, nomes);
    const valoresPorParticipante = gerarValores(novosParticipantes);
    setQuantidade(quantidadeFinal);
    setParticipantes(novosParticipantes);
    setValores(novosParticipantes.map((p) => valoresPorParticipante[p] ?? ''));
    setRevelados(novosParticipantes.map(() => false));
    setEstado({ fase: 'passagem', indice: 0, sub: 'aguardando' });
  }

  function revelarAtual() {
    if (estado.fase !== 'passagem' || estado.sub !== 'aguardando') return;
    setEstado({ ...estado, sub: 'revelado' });
  }

  function pedirConfirmacao() {
    if (estado.fase !== 'passagem' || estado.sub !== 'revelado') return;
    setEstado({ ...estado, sub: 'confirmando' });
  }

  function reverNovamente() {
    if (estado.fase !== 'passagem' || estado.sub !== 'confirmando') return;
    setEstado({ ...estado, sub: 'revelado' });
  }

  function avancar() {
    if (estado.fase !== 'passagem' || estado.sub !== 'confirmando') return;
    const proximoIndice = estado.indice + 1;
    // Sem verificação de identidade: a contagem de toques em "avançar" batendo
    // com `quantidade` é o próprio critério de término (decisão consciente do
    // spec, não uma lacuna) — o app presume que o celular voltou ao líder.
    if (proximoIndice >= quantidade) {
      setEstado({ fase: 'gestao' });
    } else {
      setEstado({ fase: 'passagem', indice: proximoIndice, sub: 'aguardando' });
    }
  }

  function revelarParaLider(indice: number) {
    setRevelados((atual) => atual.map((v, i) => (i === indice ? !v : v)));
  }

  function valorDe(indice: number): string {
    return valores[indice] ?? '';
  }

  function reiniciar() {
    setQuantidade(0);
    // setNomesState, não setNomes: reiniciar zera o estado local deste widget,
    // mas não deve apagar a lista persistida (docs/spec-privacidade-sorteio.md
    // § Extensão: nomes persistentes) — é conveniência da sessão, não algo
    // que resetar um único sorteio deva descartar pro próximo utilitário.
    setNomesState([]);
    setLiderParticipa(false);
    setParticipantes([]);
    setValores([]);
    setRevelados([]);
    setEstado({ fase: 'setup' });
  }

  const participanteAtual = estado.fase === 'passagem' ? participantes[estado.indice] : null;
  const valorAtual =
    estado.fase === 'passagem' && estado.sub !== 'aguardando' ? valores[estado.indice] : null;

  return {
    quantidade,
    setQuantidade,
    nomes,
    setNomes,
    liderParticipa,
    setLiderParticipa,
    iniciar,
    estado,
    participantes,
    participanteAtual,
    valorAtual,
    revelarAtual,
    pedirConfirmacao,
    reverNovamente,
    avancar,
    revelarParaLider,
    revelados,
    valorDe,
    reiniciar,
  };
}
