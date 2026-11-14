# História em 3 atos (início, meio e fim): design

> Status: aprovado no brainstorming de 2026-11-14 · Base de código: `main` em `ded5730` · Branch: `feat/story-arc`
> Relacionadas: #30 (MAV e vitória), #47/#48 (tripulação), #54 (estações e expedição)

## Problema

O jogo já tem um objetivo final (abastecer o MAV, sobreviver a 3 tempestades, enviar dados e lançar), mas não tem história: nada explica por que o jogador está ali, e nada o leva de um sistema para o outro. Além disso, duas máquinas de objetivo convivem sem se falar:

- `src/core/MissionSystem.js` (`ExpeditionSystem` no `GameEngine`), com `stage` (`prepare → outside → sample → return → report → complete`), `objective` e `console()`;
- `src/mission/MissionSystem.js`, com o checklist do MAV (`progress`, `dataSent`, `ignite()`).

O tema **atraso de comunicação** do desafio também não aparece como mecânica.

## Objetivo central

**"Get home: launch the MAV before the launch window closes."**

O jogador é o comandante júnior do posto. A janela de lançamento abre quando ele sobrevive à 3ª tempestade e fecha `STORY_CONFIG.WINDOW_HOURS` horas de jogo depois. Se ela fechar, a partida termina com a tela *"The launch window closed"* e o fato real de que **janelas Terra–Marte se repetem a cada ~26 meses**.

## Os 3 atos

Um objetivo aparece por vez em `#mission-objective`. Os textos abaixo são a UI (inglês, sem emoji).

### Ato 1: Arrival (tutorial, sem tempestades)

| id | Objetivo na UI | Concluído quando |
|---|---|---|
| `enter-base` | Go inside the base through the airlock | `snapshot.insideHabitat === true` (o jogador nasce fora, na rampa) |
| `report` | Tell Mission Control you landed: go to the command console | `snapshot.atConsole === true` (chegar ao console envia o relatório sozinho, sem tecla nova) |
| `await-reply` | Waiting for Earth... reply in `mm:ss` | o tempo de ida e volta acabou |
| `collect-ice` | Go outside and collect 1 block of Martian ice (white crater behind the base, X 22 / Z -22) | contagem de `MARS_ICE` na mochila > contagem no início do objetivo |
| `return-base` | Bring the ice back inside the base | `snapshot.insideHabitat === true` |

Card de abertura (logo depois da animação de chegada): *"Welcome, Commander! You just landed on Mars. Your base runs on solar power: the battery charges in daylight and drains at night. Watch the POWER bar."*

**Atraso de comunicação.** Ao chegar no console, o card diz: *"Earth is 198 million km away today. Radio waves take 11 minutes to get there, and 11 more to come back. Nobody on Earth can help you right now: you decide!"*

**Revisão no merge com a `main` (2026-11-14).** O PR #67 (issue #56) trouxe o `CommsLink`, que calcula a distância Terra–Marte e o atraso de rádio para a data real da partida a partir das órbitas do JPL. Para o jogo ter um rádio só, a história passou a usar o `CommsLink`, e a constante própria (`src/data/commsDelay.js`) saiu:

- O card e a legenda do pouso mostram a distância e os minutos de luz **do dia** (em 14/11/2026: ~198 milhões de km e 11 min só de ida, o mesmo valor do JPL Horizons).
- A espera pela resposta usa a escala do rádio da base (`COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE = 3`): 22 min de ida e volta viram ~66 s reais, e o objetivo mostra a contagem em segundos (`Waiting for Earth to answer: 40 s`).
- O card cita a fonte como "Distance calculated for DD/MM/AAAA from NASA/JPL planet orbits", nunca "live".

A resposta de `await-reply` pede o gelo: *"Mission Control: Welcome to Mars, Commander! First job: bring 1 block of ice into the base. On Mars, ice is water, air and rocket fuel."*

Voltar com o gelo abre o ato 2: *"Mission Control: Great work! Your job now: fill the MAV rocket with fuel made from ice, survive 3 solar storms, and send your science home. Then launch!"*

### Ato 2: Build the way home

- Ao começar o ato, o diretor chama `mission.startStorms(hours)`: **as tempestades só começam aqui**, então nenhuma CME cai no meio do tutorial.
- O objetivo mostra o checklist resumido, por exemplo `MAV fuel 40% · Storms 1/3`. O painel do MAV continua como está.
- **A 1ª tempestade é guiada.** No primeiro `storm-warning`, aparece o card *"A solar storm is coming! Two ways to stay safe: hide inside the base (safe, but you stop working outside) or turn on the shield [R] (you keep working, but it eats your battery)."* Durante o aviso, o objetivo vira *"Get safe: go inside or turn on the shield [R]"*. As tempestades seguintes só usam os avisos que já existem.
- Termina quando `mission.stormsSurvived >= 3`.

### Ato 3: Launch window

- Ao começar: `windowClosesAt = hours + WINDOW_HOURS`. Card: *"The launch window is open! Earth and Mars are lined up for the trip home. Launch before it closes."*
- Objetivos, na ordem, pulando os que já estão feitos: encher o combustível, `Send your science data to Earth [G] at the command console`, `Go to the MAV and press IGNITE`.
- O HUD mostra `Window closes in hh:mm` junto do objetivo.
- **Vitória:** o `ignite()` que já existe. A tela de vitória ganha a linha de epílogo *"You launched with hh:mm left in the window."*
- **Janela fechada:** se `hours >= windowClosesAt` antes do lançamento, o diretor emite `window-closed` e aparece o overlay novo com o fato dos 26 meses e o botão *Play again*, que recarrega a página.

Morrer não reinicia a história: a tela de morte e o respawn continuam iguais, e a tempestade em que o jogador morreu não conta (regra que já existe).

## Arquitetura

```
src/story/storyChapters.js     dados: atos, objetivos, textos dos cards (sem lógica)
src/story/StoryDirector.js     lógica pura (sem DOM/Three.js): update(snapshot) -> eventos
src/story/StoryDirector.test.js
src/ui/StoryHud.js             card de rádio + linha de objetivo + overlay de janela fechada
```

### `StoryDirector`

```js
const director = new StoryDirector();
director.update(snapshot); // a cada frame
director.objectiveText;    // string para #mission-objective
director.windowHoursLeft;  // null fora do ato 3
director.drainEvents();    // [{ type: 'card', card } | { type: 'start-storms' } | { type: 'window-closed' }]
```

`snapshot` é montado pelo `GameEngine` a partir do estado que já existe:

| campo | origem |
|---|---|
| `hours` | `_skyHours()` |
| `insideHabitat` | `survival.insidePressurizedShip` |
| `iceCount` | `survival.countItem(BLOCK_IDS.MARS_ICE)` |
| `atConsole` | `currentInteraction === 'rover_terminal'` |
| `stormPhase`, `stormsSurvived`, `propellantPct`, `dataSent`, `launched` | `mission.storm.phase`, `mission.stormsSurvived`, `mission.propellant`, `mission.dataSent`, `mission.launched` |

O diretor não toca em outros sistemas. Ele só emite eventos, e quem aplica os efeitos é o `GameEngine`: `start-storms` vira `mission.startStorms(hours)`, `card` vira `storyHud.showCard(card)` e `window-closed` vira `storyHud.showWindowClosed()`.

### Mudanças em código existente

- `src/mission/MissionSystem.js`: o construtor aceita `stormsStarted = false`. Enquanto as tempestades não começam, `this.schedule = []` e `stormStateAt` devolve `calm`. O método novo `startStorms(hours)` chama `buildStormSchedule(cmes, hours)`.
- `src/core/MissionSystem.js` (`ExpeditionSystem`): saem `stage`, `objective`, `console()` e `collectSample()`, e ficam energia, radiação e estufa. Os usos também saem: as linhas 220-221, 237 e 898 do `GameEngine` (na `main` em `ded5730`) e a ação `mission` do `StationPanel`, que passa a devolver `director.objectiveText`. Os testes são atualizados.
- `src/config/constants.js`: novo `STORY_CONFIG` com `WINDOW_HOURS: 8` (≈ 6,7 min reais) e `CARD_SECONDS: 12`.
- `index.html`: markup do card de rádio e do overlay de janela fechada. Os estilos ficam em `src/ui/styles/`.

### Card de rádio (UI)

Painel **não modal** no topo e centro (estilo *Mission Control radio*), visível por `CARD_SECONDS` ou até ser fechado com Enter, clique ou toque no botão `OK`. Ele não pausa o jogo e não mexe no pointer lock, para não brigar com o menu. Os cards entram numa fila, um por vez. No mobile, o botão `OK` tem ≥ 44 px, respeita `safe-area-inset-top` e não cobre os controles touch.

## Animações (adicionadas em 2026-11-14, a pedido)

Duas *cutscenes* dentro do motor, puláveis: a **chegada** (pouso da cápsula, 14,8 s, no primeiro Play) e a **decolagem** do MAV (15,5 s, ao apertar IGNITE). O roteiro plano a plano, com tempos, câmeras e legendas, está em [`../plans/2026-11-14-story-arc.md`](../plans/2026-11-14-story-arc.md). O motor de cutscene fica em `src/story/cutscene/` (`timeline.js` puro + `CutscenePlayer`), e a camada de UI em `src/ui/CutsceneHud.js`.

## Tutorial curto e HUD visual (revisão de 2026-11-14, a pedido)

O ato 1 era longo e repetitivo (5 objetivos, ~66 s parado esperando a Terra e quatro passagens pelo airlock) e o HUD era só texto. O que mudou, e que vale por cima das seções acima:

- **Ato 1 em 3 passos:** `enter-base → report → collect-ice`. Saíram `await-reply` e `return-base`.
- **Atraso de rádio sem espera parada:** ao chegar no console, o passo seguinte (`collect-ice`) já vale. A resposta da Terra chega sozinha depois do tempo de ida e volta (`StoryDirector.replySecondsLeft`, card `EARTH ANSWERED`), com o jogador já trabalhando. O atraso continua sendo ensinado, agora como "ninguém espera a Terra: você decide".
- **Ato 2 começa ao pegar o gelo**, ainda lá fora: o gelo vai direto para o foguete, sem voltar pelo airlock antes.
- **Painel do objetivo em ícones** (`src/story/objectiveView.js`, puro e testado, pintado pelo `StoryHud.updateObjective`): 3 bolinhas dos atos, um ícone grande com 2 ou 3 palavras (`ENTER THE BASE`, `GET ICE`, `LOAD THE ROCKET`...), os 3 passos do tutorial no ato 1, e nos atos 2 e 3 os três medidores do foguete (barra de combustível, bolinhas das tempestades, marca dos dados enviados). Um relógio em barra mostra a janela de lançamento fechando.
- **Card do rádio recolhido** (`#story-signal`): fechado o card `MESSAGE SENT` (Enter, OK ou tempo), fica no mesmo lugar uma faixa fina com o sinal andando de Marte até a Terra e voltando com a resposta, e os segundos que faltam, até o card `EARTH ANSWERED` chegar.
- **Próximo trabalho dinâmico nos atos 2 e 3** (`nextRocketJob`): buscar gelo → carregar o foguete → enviar os dados → esperar a fábrica / as tempestades. A seta segue o mesmo trabalho (`objectiveTarget`), inclusive até o console quando falta enviar os dados.
- **Cards desenhados** (`storyChapters.js`): no lugar do parágrafo, até 4 linhas curtas com ícone (≤ 8 palavras, checado em teste); o card do rádio desenha o sinal indo de Marte à Terra com os minutos reais; o card da 1ª tempestade mostra as duas saídas lado a lado com ganho (verde) e custo (vermelho), o trade-off do desafio.

## Painel do objetivo e setas (adicionados em 2026-11-14, a pedido)

O HUD novo da `main` (#59) escondeu o canto superior esquerdo, então o objetivo ganhou um painel próprio ali (`#story-objective`): o título do ato (`PART 1 OF 3: ARRIVAL`) e o texto do objetivo.

Cada objetivo aponta para um lugar, e duas setas mostram o caminho:

- **Seta 3D** (`src/story/WaypointBeacon.js`): flutua em cima do lugar, sobe e desce, e cresce com a distância.
- **Seta na tela** (`src/ui/WaypointHud.js`): com o lugar à vista, fica em cima dele com nome e distância (`ICE CRATER 41 m`); com o lugar fora da tela ou atrás do jogador, encosta na borda e gira para o lado certo. Ela aparece mesmo através das paredes.

| Objetivo | Lugar |
|---|---|
| `enter-base`, `storm-guide` | Airlock |
| `report`, `send-data` | Console de comando |
| `collect-ice` | Cratera de gelo |
| `act2`, `fuel` | Cratera de gelo se a mochila está sem gelo; foguete se há gelo para entregar; console se o tanque não precisa de mais gelo e os dados não foram enviados; nenhum depois disso |
| `ignite` | Foguete (MAV) |
| `done`, `failed` | Nenhum |

**Rota pelo airlock.** A base só tem uma entrada. Se o lugar fica lá fora e o jogador está dentro (ou o contrário), a seta aponta primeiro para o airlock. Dirigindo o rover, a câmera está lá fora, então a rota não passa pelo airlock. A regra é pura e testada em `src/story/waypoints.js` (`objectiveTarget` e `routeWaypoint`).

## Fora do escopo (bônus, se sobrar tempo)

- Evento surpresa no meio do ato 2 (tripulante doente, filtro saturado).
- *Debrief* de morte com a lição ligada à causa.
- Salvar o progresso da história no `localStorage` (cada partida é uma missão nova).
- Unificar o `[G]` (`mission.sendData`) com o `sendMav` da estação (`StationSystem`). A história usa só `mission.dataSent`. Abrir issue.

## Testes

- **Vitest (`StoryDirector.test.js`):** avança pelos 5 objetivos do ato 1 com snapshots sintéticos; `collect-ice` usa a contagem do início do objetivo (gelo que o jogador já tinha não conta); `await-reply` termina depois de 22 min de jogo; `start-storms` é emitido uma vez; o card guiado aparece só no 1º `storm-warning`; o ato 3 começa com 3 tempestades; `window-closed` sai uma vez quando o tempo acaba sem lançar e não sai se `launched`.
- **Vitest (`MissionSystem`):** sem `startStorms` não há tempestade nem dose de tempestade; depois de `startStorms(h)`, o 1º aviso cai em `h + FIRST_WARNING_AFTER_HOURS`.
- **Manual:** desktop + 844×390 em paisagem (card legível, `OK` tocável e sem sobrepor joystick ou hotbar) + 390×844 (overlay de rotação). Jogar o ato 1 inteiro e usar a tecla T para chegar ao ato 3 e ver a janela fechar.
