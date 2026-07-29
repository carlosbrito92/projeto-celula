# Progresso — Projeto Célula

> Checklist de acompanhamento. Não é um sprint com cerimônia — é um documento vivo, atualizado conforme o trabalho avança, seguindo o mesmo princípio dos demais markdowns do projeto: registra o que já foi decidido/feito, não o que "deveria" acontecer em teoria. Marcar `[x]` quando concluído; adicionar uma linha nova sempre que uma decisão nova entrar em qualquer um dos outros documentos.

---

## Fase 0 — Definição (concluída)

Tudo que precisava ser decidido antes de qualquer código existir.

- [x] Visão e problema central definidos (`projeto-celula.md` §1)
- [x] Escopo por fase (V1 vs V2) fechado (`projeto-celula.md` §3)
- [x] Modelo de acesso e permissão decidido — sem hierarquia (`projeto-celula.md` §2)
- [x] Módulo de pregações especificado — biblioteca, temas por série, navegação (`projeto-celula.md` §4)
- [x] Módulo de quebra-gelos especificado — tipos, fluxo, catálogo inicial (`projeto-celula.md` §5)
- [x] Kit de utilitários compartilhados especificado (`projeto-celula.md` §6)
- [x] Stack técnica decidida — React + Capacitor + Supabase + Vercel (`projeto-celula.md` §7)
- [x] Requisitos de segurança definidos — RLS, rate limiting, sem PII persistida (`projeto-celula.md` §7)
- [x] Estratégia de modularidade para não travar a V2 (`projeto-celula.md` §7)
- [x] Sistema de temas por série documentado, com workflow de criação de tema novo (`estilos-pregacao.md`)
- [x] Schema JSON de conteúdo de pregação definido e calibrado com 4 pregações reais (`geracao-pregacao.md`)
- [x] Regras de precedência de fonte (transcrição vs. anotação; ruído severo) formalizadas (`geracao-pregacao.md`)
- [x] Mock visual do projeto gerado e aprovado (`mock-prompt.md`, `mock-aprovado-v2.html`)
- [x] Sistema de ícones decidido — Lucide via fork próprio (`mock-prompt.md`)
- [x] Mecanismo de acompanhamento de progresso definido (este documento)

---

## Fase 1 — Fundação técnica (não iniciada)

Infraestrutura mínima antes de qualquer feature visível.

- [ ] Criar fork do repositório Lucide no GitHub
- [x] Criar repositório do Projeto Célula (código) — https://github.com/carlosbrito92/projeto-celula
- [x] Criar projeto Supabase (auth anônima, banco Postgres) — projeto `projeto-celula`, região `sa-east-1`, ref `tvhywnpctttrmzcyueii`
- [x] Definir e aplicar Row Level Security nas tabelas iniciais (pregações, quebra-gelos) — tabelas `pregacoes`/`quebra_gelos` criadas com RLS habilitado, policy de `select` pública para `anon`/`authenticated`, sem policy de escrita (conteúdo editorial só via service role); migração em `supabase/migrations/`
- [ ] Configurar projeto React + Capacitor (scaffold inicial, build Android/iOS/PWA funcionando)
- [ ] Configurar deploy no Vercel
- [ ] Criar documento vivo de projeto para a fase de código (equivalente a um `CLAUDE.md`, conforme prática referenciada do artigo do Akita) — hurdles técnicos documentados aqui, não nos markdowns de conteúdo

## Fase 2 — Módulo de Pregações (não iniciada)

- [ ] Modelar tabela(s) Supabase para pregações (jsonb do schema + metadados como colunas indexáveis)
- [ ] Implementar renderização dos tipos de bloco universais (`paragrafo`, `versiculo`, `callout`, `frase_chave`, `lista`)
- [ ] Implementar renderização dos `componente_tema` (stage, diagnostico, antidoto, versus, analogia, banho_list, humor, merch_section, etc.)
- [ ] Implementar sistema de tema por série (resolver `Série → tema`, aplicar CSS vars dinamicamente)
- [ ] Implementar tela de biblioteca (destaque + lista + busca)
- [ ] Implementar tela de leitura com índice clicável + FAB (usando a correção de `scrollIntoView` já documentada)
- [ ] Popular com as pregações já calibradas (os 4 JSONs de exemplo existentes) como primeiro conteúdo real

## Fase 3 — Módulo de Quebra-gelos + Utilitários (não iniciada)

- [ ] Modelar tabela(s) Supabase para quebra-gelos
- [ ] Implementar os três utilitários como módulos isolados (sorteador nome/palavra, sorteador de papel, contador/cronômetro)
- [ ] Implementar tela de catálogo de quebra-gelos
- [ ] Implementar tela de quebra-gelo individual com utilitário embutido inline
- [ ] Popular com o catálogo já mapeado (9 quebra-gelos do primeiro lote)
- [ ] Trocar ícones placeholder (emoji) pelos ícones Lucide definitivos, usando a tabela de mapeamento já documentada

## Fase 4 — Polimento V1 (não iniciada)

- [ ] Testes (seguindo a prática de TDD desde o início, não retroativo) para utilitários e renderização de conteúdo
- [ ] Revisão de segurança (RLS, rate limiting) antes de qualquer exposição pública
- [ ] Testar build Capacitor real em dispositivo Android e iOS
- [ ] Convidar um pequeno grupo de líderes de célula para uso real / feedback

## Fase 5 — V2: Multiplayer (não iniciada, sem detalhamento ainda)

Arquitetura detalhada fica para quando esta fase entrar em pauta — ver `projeto-celula.md` §8.

- [ ] Detalhar arquitetura de lobby via QR code
- [ ] Detalhar sincronização de estado via Supabase Realtime
- [ ] Especificar o primeiro mini-jogo (candidato natural: Artista Impostor, já semi-especificado no material original)

---

## Como manter este documento

- Marcar `[x]` assim que algo for concluído — não esperar o fim da fase inteira.
- Se uma tarefa nova surgir que não estava prevista aqui, adicionar na fase correspondente (não deixar implícita).
- Se uma decisão em qualquer outro markdown do projeto mudar o escopo de uma fase, refletir aqui também — este documento deve sempre bater com o estado real dos outros cinco.
- Fases não têm data fixa nem duração estimada — o ritmo é ditado pelo tempo disponível de Carlos, não por sprint.
