/**
 * Catálogo de variantes "Spice It Up!" pro seletor de setup (§5). Só rótulo
 * — NENHUM efeito de variante está implementado no motor (`turno.ts`) ainda.
 * Escolher uma aqui marca a sessão (sincronizado, todo mundo vê o combinado)
 * mas o motor roda regra base de qualquer forma até essa lógica ser
 * construída numa sprint própria. Não remover este aviso até isso mudar.
 */
export interface Variante {
  id: string;
  nome: string;
}

export const VARIANTES: Variante[] = [
  { id: 'we_love_chili', nome: 'We Love Chili!' },
  { id: 'start_it_up', nome: 'Start It Up!' },
  { id: 'spice_raider', nome: 'Spice Raider' },
  { id: 'change_your_luck', nome: 'Change Your Luck' },
  { id: 'turn_it_up', nome: 'Turn It Up!' },
  { id: 'copy_cat', nome: 'Copy Cat' },
];
