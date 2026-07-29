# CLAUDE.md — Projeto Célula

Documento vivo da fase de código, conforme prática referenciada em `docs/projeto-celula.md` §7 (artigo "Do Zero à Pós-Produção em 1 Semana", Akita). Registra decisões técnicas, requisitos não-negociáveis e hurdles conforme aparecem — atualizar sempre que algo relevante mudar, não deixar como documento estático.

Para visão de produto, escopo e módulos: ver `docs/projeto-celula.md`. Este arquivo é sobre **como construir**, não **o que construir**.

---

## O projeto em uma frase

Web app (React + Capacitor) para redes de célula: biblioteca de pregações, catálogo de quebra-gelos, kit de utilitários. Sem login tradicional, sem hierarquia de permissão, escopo V1 enxuto.

## Recursos e IDs

- **GitHub**: https://github.com/carlosbrito92/projeto-celula
- **Supabase**: projeto `projeto-celula`, ref `tvhywnpctttrmzcyueii`, região `sa-east-1`
- **Vercel**: https://projeto-celula.vercel.app (deploy automático a cada push em `main`)
- **Fork Lucide** (ícones, ver `docs/mock-prompt.md`): https://github.com/carlosbrito92/lucide
- **App id Capacitor**: `com.minc.celula`

## Documentos relacionados

- `docs/projeto-celula.md` — visão, escopo por fase, stack, segurança (fonte de verdade do produto)
- `docs/estilos-pregacao.md` — sistema de temas por série
- `docs/geracao-pregacao.md` — schema de conteúdo (JSON) de pregações
- `docs/mock-prompt.md` / `docs/mock-aprovado-v2.html` — referência visual aprovada
- `docs/progresso.md` — checklist de acompanhamento por fase
- `supabase/migrations/` — migrações do banco (schema + RLS)

---

## Requisitos de segurança — não-negociáveis

Direto de `docs/projeto-celula.md` §7. Um agente de IA "implementa o que você pede, mas raramente sugere proteções que você não pediu" — por isso ficam explícitos aqui, não implícitos:

1. **RLS obrigatório em toda tabela nova**, sem exceção — mesmo sem "conta de usuário".
2. **Conteúdo editorial é somente leitura para o app.** `pregacoes` e `quebra_gelos` (e qualquer tabela de conteúdo futura) nunca têm policy de insert/update/delete para `anon`/`authenticated`. Escrita só via service role (script/dashboard, fora do client).
3. **Dado efêmero de sessão** (resultado de sorteio, nome digitado numa dinâmica) pode ter escrita livre — não tem valor de permanência, não precisa das mesmas garantias do conteúdo editorial.
4. **Rate limiting nos utilitários** (ex: Supabase Edge Functions com throttle) antes de qualquer utilitário ficar acessível publicamente sem autenticação.
5. **Sem PII persistida** além da sessão, a não ser que histórico seja explicitamente decidido depois.

Ao adicionar uma tabela nova: habilitar RLS na mesma migração que cria a tabela, nunca depois.

## Práticas de desenvolvimento

- **TDD nasce junto com o código.** Utilitários (sorteador, contador) e lógica de renderização de conteúdo nascem com teste, não como algo adicionado depois.
- **Refactoring contínuo é disciplina.** A separação em camadas (conteúdo / utilitários locais / roteamento por feature — ver `docs/projeto-celula.md` §7) exige poda regular, não desenho único.
- **O humano decide o quê, a IA decide o como.** Questionar decisões de arquitetura propostas (ex: recusar over-engineering, state machine complexa quando um caso simples resolve).
- **Modularidade para a V2.** Utilitários da V1 (sorteio single-device) são módulos isolados desde já, pensados para serem *estendidos* com Supabase Realtime na V2 — não reescritos.

## Ambiente de build

- **JDK 21 é obrigatório para o build Android** (Capacitor 8 / AGP atual). Pinado localmente via `.sdkmanrc` neste diretório — não altera o JDK padrão da máquina. Se o build falhar com `invalid source release: 21`, rodar `sdk env` (sem pipe — pipe roda em subshell e não propaga `JAVA_HOME`) antes do `./gradlew`.
- **iOS só builda em macOS/Xcode.** A plataforma está escafoldada (`ios/`), mas nunca foi buildada de verdade neste ambiente (Linux). Testar em macOS antes de considerar a V1 pronta para a App Store.
- Build Android já validado de ponta a ponta em hardware físico (tablet Samsung via `adb`) — ver commit do scaffold inicial.

## Hurdles técnicos

> Registrar aqui conforme aparecem, com data e contexto suficiente para não repetir o mesmo erro. Não duplicar em `docs/progresso.md` (que é só checklist) nem nos markdowns de conteúdo.

- **2026-07-29** — Build Android falhava com `invalid source release: 21` mesmo após instalar JDK 21 e exportar `JAVA_HOME` corretamente. Causa: `sdk env | tail -1` — o pipe roda `sdk env` em subshell, então a variável exportada não chegava ao shell pai. Corrigido rodando `sdk env` sem pipe antes do comando de build.
