# Ato 5 da história: a corrida final, a decolagem e o botão Continue

> Spec de 15/11/2026. Issue [#411](https://github.com/nayetdet/marscraft/issues/411). Base: `origin/main` em `b38873f`.
> Depende dos atos 1 a 4 (specs nesta pasta). Fecha a refatoração da história em 5 atos.

## Objetivo

O ato 5 é o único com prazo: encher o foguete e decolar antes de a janela de lançamento fechar, usando tudo o que os atos 1 a 4 ensinaram. Depois da tela final, a criança pode continuar.

## Decisões tomadas com o Derick

- O ato 5 é a **corrida final**: a janela de lançamento só abre no começo dele.
- A criança busca os blocos de gelo que faltam, a pé ou de rover, carrega o foguete e aperta IGNITE.
- "Play again" vira **"Continue"** nas duas telas finais.
- Um meteoro cai com certeza na partida: é o do ato 1. Os meteoros sorteados continuam depois, e o gelo deles também serve para o foguete.

## Como a criança joga

| # | Passo | O que ela faz | O que aprende |
|---|---|---|---|
| 1 | (evento) WINDOW OPEN | Recebe o aviso: a janela de lançamento abriu | Terra e Marte só se alinham de tempos em tempos |
| 2 | FILL THE ROCKET | Busca gelo e carrega o foguete até encher | Toda viagem custa ar ou bateria, e o relógio corre |
| 3 | IGNITE | Vai ao foguete e aperta IGNITE | Missão cumprida |
| 4 | (tela final) | Vê a mensagem da Terra e o boletim; aperta Continue | O que a missão dela valeu |

## Peças

### 1. Janela de lançamento só no ato 5

Hoje a janela abre no fim do tutorial (`StoryDirector._finishTutorial`) e dura `STORY_CONFIG.WINDOW_HOURS` (24 h de jogo = 20 min reais).

Novo:
- `windowHoursLeft` só existe no ato 5; `_windowClosesAt` é marcado quando o ato 5 começa.
- Nos atos 1 a 4 o painel não mostra relógio de janela.
- `WINDOW_HOURS` continua 24 h: sobram 5 blocos de gelo para buscar, menos do que a rotina de hoje pede no mesmo prazo. `balance.test.ts` confere que dá tempo.

### 2. Rotina de encher o foguete

- A rotina de hoje do ato 2 (buscar gelo, carregar, voltar à base; `_updateRoutine`, `needsBase`, card `CARDS.act2`) passa a ser a do ato 5, sem mudar a lógica.
- O card do ato muda de texto: a ciência já foi enviada no ato 4, então ele fala só de gelo, foguete e prazo.
- O tanque continua pedindo `MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK` (6) blocos; 1 já entrou no ato 1.
- A criança escolhe o caminho: a pé (gasta ar do traje) ou de rover (gasta a bateria dele; o rover já entrega gelo direto no foguete).
- As exigências do foguete não mudam: tanque cheio, tempestade solar sobrevivida (ato 3) e ciência enviada (ato 4). Se alguma ainda faltar ao chegar no ato 5 (tutorial pulado, por exemplo), o objetivo aponta para ela, como hoje.

### 3. Eventos durante a corrida

- Tempestades de poeira, eventos sorteados (meteoro incluído) e tempestades solares reais do DONKI continuam acontecendo no ato 5: são os obstáculos da corrida.
- Gelo de cratera de meteoro conta como gelo para o foguete.

### 4. Janela fechada

- Se a janela fechar antes do IGNITE, aparece a tela de hoje (`WINDOW_CLOSED`, com o fato real dos ~26 meses).
- **Continue** nessa tela: a história diz que a tripulação esperou a próxima janela. O jogo volta a rodar no mesmo mundo, com uma janela nova de `WINDOW_HOURS`, e a criança pode terminar e decolar. O boletim final registra que ela decolou na segunda janela.

### 5. Vitória e Continue

- `public/game.html`: `play-again-btn` e `window-play-again-btn` passam a dizer "Continue".
- Hoje os dois recarregam a página (`src/ui/MissionHud.ts:100`, `src/ui/StoryHud.ts:140`).
- **Continue** na vitória: fecha a tela final e o jogo volta a rodar no mesmo mundo, em modo livre: sem objetivo guiado, sem janela e sem prazo. A base, os recursos e os eventos continuam funcionando. O foguete fica fora da plataforma.
- O `StoryDirector` ganha o estado de modo livre (`act = 6`), salvo junto com a partida: reabrir o jogo depois da vitória cai no modo livre, não na tela final.
- "Reset World", no menu inicial, continua sendo o jeito de começar outra partida.

### 6. Pular o tutorial

- "Skip the tutorial" (Demo Tools) passa a levar direto ao ato 5, com a janela aberta. A luneta é entregue na hora, porque o ato 2 foi pulado.

### 7. Documentação

- `AGENTS.md` (mapa do código e descrição da história), `docs/game/estado-atual-e-gaps.md` e os comentários de `StoryDirector.ts` passam a descrever 5 atos.

## Ordem de implementação dos 5 atos

1. PR de água vezes 10 (spec do ato 1).
2. Ato 1 (#407).
3. Ato 2 (#408).
4. Ato 3 (#409).
5. Ato 4 (#410).
6. Ato 5 (#411).

Cada PR deixa o jogo jogável do começo ao fim: enquanto um ato não existe, o `StoryDirector` passa do último ato pronto direto para a corrida final, com a janela aberta.

## Testes e validação

- Vitest: `StoryDirector.test.ts` (janela só no ato 5, segunda janela, modo livre, pular tutorial), `objectiveView.test.ts`, `MenuScreens.test.ts`, `missionReport.test.ts` (segunda janela), `balance.test.ts`.
- `npm run typecheck` e `npm run build`.
- Visual, em desktop e touch 844×390: abertura da janela, corrida, IGNITE, tela final, Continue na vitória e na janela fechada, e reabrir o jogo em modo livre.

## Fora deste spec

- Como deixar a base para a próxima tripulação (#423).
