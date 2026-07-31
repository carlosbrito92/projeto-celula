# Spec: Fluxo de Privacidade Sequencial — Utilitários de Sorteio

> Feature nova, definida fora do plano original de Fase 3 do Claude Code. Aplica-se aos dois widgets de sorteio com revelação individual: **sorteio de atribuição escondida** e **sorteio de papel especial**. O widget de contador/cronômetro não é afetado — não tem noção de "revelação por pessoa".
>
> Contexto: o plano original de Fase 3 modelou os dois widgets com comportamentos de privacidade diferentes (atribuição com fluxo elaborado, papel especial com revelação imediata em 2 estados). Esta spec substitui isso — **ambos ganham o mesmo fluxo de passar-o-celular**, descrito abaixo.
>
> **Natureza temporária:** este fluxo existe porque a V1 é single-device (um celular físico circulando). Na V2 (multiplayer via lobby/QR code), o organizador do lobby tem essa informação diretamente pela rede — passar o celular fisicamente deixa de ser necessário. Não desenhar isso como arquitetura permanente; é a solução certa para a restrição atual (um aparelho, uma sala), não para o problema em geral.

---

## Problema que a spec resolve

Numa célula real, o círculo de pessoas não segue uma ordem previsível pelo app — não há como o sistema saber de antemão "quem senta ao lado de quem" para definir uma sequência automática de passagem. Ao mesmo tempo, o líder que conduz o sorteio muitas vezes participa dele — e se participa, não pode saber o resultado dos outros sem quebrar a mecânica do jogo (ex: o líder não pode saber quem é o impostor se ele também está jogando).

A spec resolve isso deixando o **líder informar a ordem manualmente** (ele sabe como o círculo está fisicamente formado) e criando um momento de **revelação tardia e opcional** para o líder gerenciar a dinâmica sem interrompê-la.

---

## Fluxo completo

### 1. Setup (líder, antes de começar)

- Líder informa **quantos participantes** vão jogar.
- Líder pode digitar os **nomes em ordem de passagem** (a ordem escrita = a ordem física real do círculo, decidida pelo próprio líder) — ou deixar em branco/sem nomear, dependendo da dinâmica.
- Líder marca uma opção: **"Eu também vou participar do sorteio?"**
  - Se marcar sim: o líder entra no sorteio como mais um participante normal — e, por consequência, **não saberá o resultado dos outros** até revelar manualmente depois (ver passo 5).
  - Se marcar não: o líder atua só como operador/condutor, nunca é sorteado.

### 2. Início

- Líder toca **"Vamos começar?"** → app entra em modo "passando o celular".
- Celular é entregue à primeira pessoa da lista (ou à primeira pessoa disponível, se sem nomes).

### 3. Ciclo de revelação (por pessoa, em loop)

Para cada participante, nesta ordem:

1. **Prompt de posse**: tela mostra "Passe para [Nome]" (ou "Passe para o próximo", se sem nomes).
2. Pessoa que está seguer com o celular toca **"Revelar"** → vê **seu próprio** papel/frase secreta (nunca o de outra pessoa).
3. Depois de um pequeno intervalo (ou toque explícito), a pessoa é perguntada mais uma vez: **"Quer rever antes de passar?"** — última chance de conferir antes de entregar o celular adiante.
4. Pessoa toca **"Próximo"** → volta ao passo 1 para o próximo participante da lista.

O ciclo se repete até que o número de toques em "próximo"/"avançar" atinja a contagem total de participantes informada no setup.

### 4. Fim do ciclo

- Depois do N-ésimo toque em avançar (última pessoa da lista), o app **presume que o celular voltou para o líder** — não há confirmação explícita de identidade, é uma decisão consciente de manter o fluxo simples e confiar na dinâmica física do grupo (celular realmente circula e volta).
- App retorna automaticamente para a **tela de gestão do líder**.

### 5. Tela de gestão do líder

- Lista de todos os participantes, com os valores/papéis **ocultos por padrão** — medida de segurança para o caso de alguém afobado tocar em algo antes de devolver o celular ao líder.
- Líder pode **revelar individualmente, para si mesmo**, o papel/valor de cada participante — só para saber "quem é quem" e conduzir a dinâmica (ex: saber quem confrontar, quem chamar) sem precisar perguntar em voz alta e sem interromper o jogo.
- Essa revelação é sempre **sob demanda e silenciosa** (só o líder vê, na própria tela) — nunca automática, nunca exibida para o grupo.

---

## Decisões explícitas (não são lacunas — foram escolhidas conscientemente)

- **Sem verificação de identidade** ao fim do ciclo — o app confia que o celular fisicamente voltou à mão do líder. Não há PIN, não há confirmação "você é o líder?".
- **Sem ordem imposta pelo app** — a ordem é 100% definida pelo líder no setup, refletindo a disposição física real do círculo, que o app não tem como prever.
- **Contagem por toques, não por identidade confirmada** — o app não verifica se a pessoa X realmente viu (não há autenticação por pessoa); confia no número total de toques em "avançar" bater com o número de participantes informado.
- **Aplica-se aos dois widgets igualmente** — sorteio de atribuição escondida (valores diferentes por pessoa) e sorteio de papel especial (um papel entre N) usam o mesmo mecanismo de passagem; a diferença entre os dois está em *o que* é sorteado/revelado, não em *como* a privacidade é gerenciada.
- **Temporário por natureza** — ver nota no topo do documento. Não generalizar este mecanismo para além do contexto single-device da V1.

---

## Extensão: papéis múltiplos no sorteio de papel especial

> Identificado ao revisar o primeiro protótipo funcional (screenshots do app real): o widget de sorteio de papel especial só suportava **um único papel nomeado** (ex: "Assassino"), sorteado para 1 pessoa entre N — todo o resto do grupo ficava implicitamente "sem papel". Dinâmicas reais como o jogo do Detetive precisam de **múltiplos papéis nomeados simultaneamente**, alguns únicos (1 Detetive, 1 Assassino) e outros repetíveis (N Cidadãos/Vítimas). Esta extensão substitui o campo único de "nome do papel" por uma lista de papéis configurável no setup.

### Setup (revisado)

Em vez de um campo de texto único para o nome do papel, o líder configura uma **lista de papéis**, cada um com:

- **Nome do papel** (texto livre, ex: "Detetive", "Assassino", "Cidadão")
- **Quantidade** (número inteiro, digitado pelo líder — ex: Detetive: 1, Assassino: 1, Cidadão: 3)

O app pode **sugerir preenchimento** para agilizar a configuração (ex: ao adicionar um segundo papel depois de já ter um, oferecer "preencher o restante dos participantes com este papel" como atalho) — mas a quantidade numérica explícita é a base de dados real; sugestões são só uma conveniência de UI sobre ela, nunca a única forma de definir a quantidade.

### Validação

- Se a soma das quantidades dos papéis for **menor** que o total de participantes, o app deve avisar antes de sortear (ex: "faltam 2 pessoas sem papel definido") e oferecer uma correção rápida — não travar silenciosamente nem sortear com participantes sem papel definido sem avisar.
- Se a soma for **maior** que o total de participantes, também avisar antes de sortear (papéis em excesso não têm como ser atribuídos).
- Sortear só fica disponível quando a soma bate exatamente com o total de participantes.

### Distribuição no sorteio

Cada papel gera exatamente a quantidade de "fichas" configurada (ex: Assassino gera 1 ficha, Cidadão gera 3 fichas) — o conjunto total de fichas é embaralhado e distribuído 1:1 entre os participantes, do mesmo jeito que o sorteio de atribuição escondida já distribui valores. Papéis repetidos (ex: "Cidadão" 3 vezes) não têm identidade própria entre si — são o mesmo papel atribuído a pessoas diferentes.

### Efeito sobre o fluxo de passagem e a tela de gestão

Nenhuma mudança estrutural no fluxo de passagem sequencial nem na tela de gestão (seções "Fluxo completo" e "Decisões explícitas" acima continuam valendo como estão) — a única mudança é **o que é revelado** por pessoa: em vez de "você tem/não tem o papel X", cada pessoa vê o nome do papel que lhe coube (podendo ser um papel repetido, como "Cidadão").

---

## Pendência de implementação

Ainda não implementado — o plano original de Fase 3 do Claude Code modelava os dois widgets com fluxos de privacidade diferentes (sem esse mecanismo de passagem sequencial), e o setup do sorteio de papel especial só suportava um único papel nomeado. Esta spec (fluxo de passagem + extensão de papéis múltiplos) substitui ambos os desenhos. Carlos vai levar esta spec ao Claude Code como instrução específica; registrar como pendência em `progresso.md` (Fase 3) até a implementação acontecer.
