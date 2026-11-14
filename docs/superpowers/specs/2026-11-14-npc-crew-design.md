# NPCs tripulantes: design

> Status: aprovado no brainstorming de 2026-11-14 · Base de código: `main` em `c55a0a6`
> Depende de: #35 (MOXIE / suporte de vida) e #40 (estações da base) · Relacionadas: #43 (DONKI), #45 (multiplayer), #48 (papéis da tripulação)

## Revisão na implementação (2026-11-14)

A implementação foi feita em cima do PR #44 (energia, O2 pago pela bateria, tempestades solares), porque #35/#40 ainda não existiam. O que mudou em relação ao texto abaixo:

- **Estações mínimas criadas aqui** (`src/crew/stations.js`), seguindo o contrato `Station`. #35/#40 podem enriquecê-las depois.
- **Modelo de manutenção:** cada estação tem `health`, que cai sem operador e sobe com operador. O trabalho gasta `WORK_ENERGY_PER_HOUR` da bateria. O contrato virou `update(hours, effort, base)`, `problems(base)` e `canOperate(base)`.
  - Estufa: produz comida para a tripulação (precisa de irrigação).
  - Reciclador de água: devolve 98% da água usada pela tripulação ([Ref] ISS).
  - Gerador de O2: `health` baixa encarece o O2 do habitat até 2× (filtros de CO2 saturados), para o jogador e para a tripulação.
  - **Enfermaria** (nova, papel da #48): cura o comandante dentro da base e é a **única** fonte de aviso de radiação alta e de vida baixa.
- **O2 do tripulante custa energia** (`OXYGEN_ENERGY_PER_HOUR`), como o O2 do jogador no PR #44, e não um estoque de O2 separado.
- **Papéis da #48:** 1, 2 ou 3 tripulantes = Ana (Flight Engineer: O2 e água), Leo (Botanist: estufa) e Maya (Medical Officer: enfermaria). Cada um começa na sua estação e rende 1,5× nela (`SPECIALIST_EFFORT`). Qualquer um pode receber qualquer ordem.
- **Ordens:** Oxygen · Water · Greenhouse · Medical bay · Rest. Falar exige **olhar** para o tripulante (para não roubar o [F] do bebedouro).
- **Evacuação** após `EVACUATE_AFTER_HOURS = 12` horas de jogo (~10 min reais) em vez de 2 sols, para caber numa partida.
- Ficaram para outras issues: limpeza de poeira dos painéis (#35), treino no ARED (#40) e bônus de imunidade das rações frescas (#48).

## Objetivo

O jogador é o **líder da tripulação**. De 1 a 3 NPCs operam estações da base (estufa, tratamento de água, gerador de O2), avisam pelo rádio quando a estação deles tem problema e recebem ordens do líder. Assim o jogador não precisa fazer pessoalmente as tarefas repetitivas.

## Trade-off educativo (regra central)

**Cada tripulante custa recursos.** Todo NPC respira, bebe e come do **estoque compartilhado da base**. Mais tripulantes significam mais estações operando e também mais consumo. Isso ensina por que a NASA dimensiona a tripulação a partir da capacidade do suporte de vida.

Proporção de consumo por tripulante (NASA *Baseline Values and Assumptions Document*, BVAD), escalada para o tempo de jogo:

| Recurso | Real (por pessoa/dia) | Uso no jogo |
|---|---|---|
| O2 | ~0,84 kg | proporção 1 |
| Água | ~2,5 a 3,5 kg | proporção ~3,5 |
| Comida | ~1,8 kg | proporção ~2,1 |

Os valores absolutos ficam em `src/config/constants.js` (`CREW_CONFIG`), e a **razão** entre eles segue a tabela acima. Valores iniciais: `MAX_CREW: 3`, `EVACUATE_AFTER_SOLS: 2`, `ALERT_COOLDOWN_S: 30`. A fonte (NASA BVAD) entra na tela de fontes/créditos do jogo.

Nenhuma ordem é de graça:
- **Operar estação:** produz o recurso da estação, mas o NPC continua consumindo.
- **Descansar:** não produz nada e o NPC consome igual, mas a estação para de gastar o que ela consome (ex.: a estufa gasta água e energia). É a forma de economizar insumos quando o estoque está baixo, ao custo de parar a produção.
- **Ter mais tripulação:** cobre mais estações, mas consome mais.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Trade-off | Tripulação custa recursos (consumo do estoque da base) |
| Ordens | Pelos dois caminhos: de perto (tecla **F**, a interação existente) e pelo painel da tripulação (tecla **C**) |
| Avisos | **Quem cuida, avisa.** Só estações com operador emitem alerta. Estação vazia fica silenciosa e o jogador só descobre indo até lá. |
| Estações | **Não são criadas aqui.** Esta feature define o contrato `Station`, e #35/#40 o implementam. |
| Tamanho da tripulação | Escolhido **antes da missão** (1 a 3), com o custo visível |
| Falha | Falta de recurso deixa o NPC **fraco** (para de trabalhar). Depois de `EVACUATE_AFTER_SOLS` (2) sols seguidos, ele é **evacuado** para a Terra (permanente, sem morte). |
| Implementação | Abordagem A: simulação pura e testável + avatar andando em **trilhos fixos** (sem pathfinding) |

## Arquitetura

Lógica e visual separados. A lógica não importa Three.js e é testada com Vitest. Isso também prepara #45, em que o host simula os NPCs.

```
src/crew/
  Station.js          contrato (JSDoc) e helpers; implementações reais vêm de #35/#40
  CrewMember.js       estado e necessidades de um tripulante (puro)
  CrewManager.js      lista de tripulantes, ordens, tick de consumo/produção, avisos (puro)
  crewRails.js        grafo fixo de waypoints da base (porta, estufa, água, O2, alojamento)
  CrewAvatar.js       boneco voxel (Three.js) que segue os trilhos até a estação da tarefa
  *.test.js
src/ui/CrewPanel.js   painel (tecla C) + menu de ordem (F perto do NPC)
```

### Contrato `Station` (implementado por #35/#40)

```js
/**
 * @typedef {Object} Station
 * @property {string} id                  ex.: 'greenhouse-1'
 * @property {'greenhouse'|'water'|'oxygen'} kind
 * @property {number} health              0..1; degrada sozinho com o tempo
 * @property {{x:number,y:number,z:number}} workPoint   ponto de trabalho (waypoint do trilho)
 * @property {(dt:number, workers:number, base:BaseStock) => void} produce
 *           produz só se workers > 0 e a estação tiver o que precisa (ex.: energia)
 * @property {() => string[]} problems    alertas atuais, ex.: ['no-water', 'filter-saturated']
 * @property {() => boolean} canOperate   false se destruída ou sem energia
 */
```

`BaseStock` é o estoque compartilhado. A água já existe em `SurvivalSystem.baseWater` / `WATER_SYSTEM_CONFIG` (PR #41). O2 e comida da base são adicionados por #35/#40 no mesmo padrão.

### `CrewMember`

- Campos: `name`, `task` (`stationId` | `'rest'` | `null`), `state`, `starvedSols` (sols seguidos sem recurso).
- Estados: `idle` → `walking` → `working` | `resting`; qualquer estado → `weak` (faltou recurso); `weak` → `evacuated` quando `starvedSols >= CREW_CONFIG.EVACUATE_AFTER_SOLS`.
- `weak` volta para a tarefa anterior quando o recurso volta.
- `evacuated` é terminal: o NPC sai do mundo.

### `CrewManager`

- `assign(memberId, task)`: valida com `station.canOperate()`. Se não puder, devolve um motivo ("The station has no power") e mantém a tarefa.
- `tick(dt, base)`:
  1. **Consumo:** o jogador tem prioridade no estoque, e os NPCs consomem do que sobra. Faltou → `weak`.
  2. **Produção:** chama `station.produce(dt, workersNaEstação, base)` para cada estação.
  3. **Avisos:** para cada estação **com operador** e com `problems()` não vazio, emite um aviso de rádio, respeitando `CREW_CONFIG.ALERT_COOLDOWN_S` por estação.
- Contagem de sols: usa `MarsSkySystem.solCount` (mudança de sol) para `starvedSols`.

### Fluxo

```
ordem (F perto do NPC | painel C)
  → CrewManager.assign()
  → CrewAvatar anda pelos trilhos até station.workPoint
  → estado 'working' → station.produce() aumenta o estoque
  → consumo de todos os tripulantes reduz o estoque
  → problema na estação operada → aviso de rádio
```

## Interface (textos em inglês, como o resto da UI)

- **Ordem de perto:** mirando no NPC, aparece o prompt `[F] Talk to Ana`. Ele entra no `handlePlayerInteract` existente, com prioridade quando a mira está num NPC. Abre um menu com 4 botões grandes: **Greenhouse · Water · Oxygen · Rest**. Cada botão traz uma linha simples de efeito ("Makes food. Uses water and power.").
- **Painel da tripulação (C):** uma linha por tripulante (nome, tarefa, ícones de O2/água/comida, estado) e uma linha por estação (barra de `health`, operador, alerta). Estação sem operador mostra `?`. Dá para trocar a tarefa clicando. Usa o mesmo padrão de overlay e pointer lock do inventário.
- **Aviso de rádio:** um toast com o nome de quem fala ("Ana: Commander, the greenhouse is out of water!") e um ícone de alerta flutuando sobre a estação enquanto o problema persistir.
- **Escolha de tripulação:** no menu inicial, botões de 1 a 3 com o custo somado por sol ("3 crew = 3× oxygen, water and food every sol") e a linha "NASA plans crew size around life support."
- **Evacuação:** toast "Ana was sent back to Earth to recover."

## Casos de borda

| Situação | Comportamento |
|---|---|
| Estoque zerado | Os NPCs ficam `weak` e param. O jogador continua com prioridade, então a falha da tripulação vira aviso antes de afetar o jogador. |
| Ordem para estação destruída ou sem energia | O NPC responde o motivo, e a tarefa não muda |
| Jogador bloqueia o caminho com blocos | Sem efeito: o avatar segue os trilhos e não colide com voxels |
| Todos evacuados | O jogo continua solo, sem game over |
| Estação removida enquanto operada | O NPC passa para `idle` e avisa "My station is gone" |
| Multiplayer (#45) | O host roda o `CrewManager`, e os clientes só renderizam o `CrewAvatar` |

## Testes (Vitest, só lógica pura)

- `CrewMember`: transições `working → weak → evacuated` exatamente em `EVACUATE_AFTER_SOLS`; recuperação de `weak` quando o recurso volta; `evacuated` é terminal.
- `CrewManager`:
  - o consumo escala linearmente com o número de tripulantes;
  - o jogador tem prioridade no estoque;
  - `produce` só é chamado com `workers > 0`;
  - `assign` recusa estação com `canOperate() === false`.
- Avisos: só estações com operador alertam; o cooldown é respeitado; estação vazia nunca alerta.
- `Station` mockada que implementa o contrato. Não depende de #35/#40 estarem prontas.
- Fora dos testes: `CrewAvatar` e `CrewPanel` (visuais).

## Fora de escopo

Diálogos ramificados, personalidade/moral/cansaço, pathfinding livre no voxel, contratar tripulantes no meio do jogo, NPCs em EVA (fora da base) e NPCs dirigindo o rover.

## Critério de pronto

- [ ] Escolha de 1 a 3 tripulantes no menu inicial, com o custo visível
- [ ] NPCs aparecem na base e andam pelos trilhos até a estação da tarefa
- [ ] Dá para ordenar de perto (F) e pelo painel (C)
- [ ] Estação operada produz, e todo tripulante consome do estoque da base
- [ ] Avisos de rádio só de estações operadas, com cooldown
- [ ] Falta de recurso → `weak` → evacuação após `EVACUATE_AFTER_SOLS` sols, sem morte
- [ ] Fonte NASA BVAD na tela de créditos/fontes
- [ ] Testes Vitest da lógica passando (`npm test`)
