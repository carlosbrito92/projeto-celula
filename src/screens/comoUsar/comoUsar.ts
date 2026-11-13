import type { IconName } from '../../icons/Icon';

// Conteúdo da tela "Como usar". Adicionar um card = adicionar um item aqui.
// Ícone novo: vendorizar o SVG (src/icons/README.md) e incluir em IconName.
// Texto curto, sem jargão e sem emoji. Os nomes entre aspas são os rótulos
// reais da interface; mudou um botão, mudar aqui também.

export interface CardComoUsar {
  id: string;
  icone: IconName;
  titulo: string;
  passos: readonly string[];
}

export const CARDS_COMO_USAR: readonly CardComoUsar[] = [
  {
    id: 'ler-pregacoes',
    icone: 'book-open',
    titulo: 'Ler uma pregação',
    passos: [
      'Toque numa mensagem da página inicial para abrir.',
      'O "Índice" no começo leva direto a cada ponto.',
      'A fileira de pontos no alto da tela acompanha a leitura. Toque num deles para pular até lá.',
      'As setas no rodapé passam para o ponto anterior ou o próximo.',
      'Sem tempo? Quando a mensagem tem, o botão "Ler versão resumida" mostra só os pontos principais.',
    ],
  },
  {
    id: 'tamanho-letra',
    icone: 'a-large-small',
    titulo: 'Tamanho da letra',
    passos: [
      'Toque em "Aa" no alto da leitura para aumentar a letra.',
      'Depois do maior tamanho, ela volta ao normal.',
    ],
  },
  {
    id: 'anotacoes',
    icone: 'pen-line',
    titulo: 'Grifar e anotar',
    passos: [
      'Toque na caneta no alto da leitura para ligar o modo de anotação.',
      'Selecione um trecho com o dedo e toque em "Grifar". A nota é opcional.',
      'Toque no caderno para ver, editar ou apagar seus grifos e notas.',
      'Para guardar a mensagem com seus grifos, toque na seta para baixo e salve em PDF.',
    ],
  },
  {
    id: 'quebra-gelos',
    icone: 'users-round',
    titulo: 'Quebra-gelos',
    passos: [
      'Na aba "Quebra-gelos" ficam as brincadeiras para abrir a reunião, com as regras de cada uma.',
      'Cada uma mostra quantas pessoas pede e quanto tempo leva.',
      'Use "Só leitura" ou "Com sorteio" para filtrar.',
    ],
  },
  {
    id: 'utilitarios',
    icone: 'shuffle',
    titulo: 'Utilitários',
    passos: [
      'Na aba "Utilitários": Sorteador de Nome/Palavra, Sorteador de Papel Especial e Contador / Cronômetro.',
      'Nos sorteadores, o celular passa de mão em mão e cada pessoa vê só o que tirou.',
    ],
  },
  {
    id: 'jogos-celular',
    icone: 'smartphone',
    titulo: 'Jogos pelo celular',
    passos: [
      'Alguns quebra-gelos têm o botão "Jogar pelo Celular".',
      'Quem organiza abre a sala e mostra o código QR. Cada pessoa aponta a câmera do próprio celular e entra.',
    ],
  },
  {
    id: 'privacidade',
    icone: 'shield-check',
    titulo: 'Privacidade',
    passos: [
      'Não tem login nem cadastro.',
      'Seus grifos e notas ficam só neste aparelho. Ninguém mais vê.',
      'Limpar os dados do site no navegador apaga seus grifos e notas. Se quiser guardar, salve em PDF antes.',
    ],
  },
];
