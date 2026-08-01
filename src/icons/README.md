# Ícones

SVGs vendorizados de `src/icons/lucide/`, copiados do fork
[`carlosbrito92/lucide`](https://github.com/carlosbrito92/lucide) (não do pacote
`lucide-react` do npm — decisão em `docs/mock-prompt.md` §"Sistema de ícones",
para manter controle de versão e espaço para ícones customizados no próprio
fork no futuro).

Revisão pinada: commit `4aec3f892fd6c23063bc2fead83c899b5d412b1c` do fork.

Cada SVG tem `width`/`height` trocados de `"24"` para `"1em"` na cópia (o
original do Lucide usa `24`) — assim o ícone escala com `font-size` do
elemento que o envolve, igual ao emoji que ele substitui. `stroke="currentColor"`
já vem do Lucide, então a cor também segue o `color` do CSS normalmente.

Para adicionar um ícone novo: pegar o SVG de `icons/<nome>.svg` no fork (na
revisão pinada acima, ou atualizar a revisão se for sincronizar com upstream),
aplicar a mesma troca de `width`/`height`, salvar em `src/icons/lucide/<nome>.svg`
e adicionar `<nome>` em `IconName` (`src/icons/Icon.tsx`).
