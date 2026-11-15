# Ato 3 da história: abrigo na tempestade solar, primeira planta, primeira ração e academia

> Spec de 15/11/2026. Issue [#409](https://github.com/nayetdet/marscraft/issues/409). Base: `origin/main` em `b38873f`.
> Depende dos atos 1 e 2 (specs nesta pasta). O "tanque maior" desta issue é entregue pelo PR de água do ato 1.

## Objetivo

O ato 3 ensina a viver dentro da base: radiação pede abrigo e a água da parede não se bebe, comida precisa ser plantada e preparada, e o corpo precisa de treino na gravidade baixa.

## Decisões tomadas com o Derick

- A cozinha fica **só com [F], sem painel**. O modal COOK FRESH MEAL sai, e a refeição fresca deixa de existir.
- O limite de água da base sobe para 1000 L (PR de água do ato 1). A parede cheia leva 600 L.

## Como a criança joga

| # | Passo | O que ela faz | O que aprende |
|---|---|---|---|
| 1 | (evento) SOLAR STORM | Recebe o aviso de tempestade solar | Radiação é um perigo que não se vê |
| 2 | FILL THE WATER WALL | Enche a parede do abrigo | Água de proteção é água que não se bebe |
| 3 | HIDE IN THE SHELTER | Fica na cápsula até a tempestade passar | Água bloqueia radiação |
| 4 | PLANT A SEED | Planta no monitor da estufa | Planta gasta água e bateria |
| 5 | HARVEST 1 PLANT | Colhe e recolhe a planta | Comida demora a crescer |
| 6 | MAKE A RATION | Leva a planta ao cozinheiro e recebe a ração | De onde vem a comida da tripulação |
| 7 | DO 1 WORKOUT | Treina na academia | Gravidade baixa enfraquece os ossos |

## Peças

### 1. Tempestade solar roteirizada

- O jogo já tem a tempestade do tutorial (`tutorialStorm` em `src/mission/MissionSystem.ts`, com dado de uma CME real do DONKI), disparada pelo evento `start-storms` no fim do tutorial. Ela passa a ser disparada no começo do ato 3.
- As tempestades reais (ao vivo, pelo DONKI) continuam valendo só depois dela.
- O card de escolha HIDE x SHIELD (`CARDS.stormGuide`) continua existindo; o ato guia a criança pelo caminho do abrigo.

### 2. Passos do abrigo

- `cert-shelter` (FILL THE WATER WALL) já existe: termina quando a parede ganha água. Mantém o certificado e a animação de primeira vez `shelter`.
- Passo novo `hide-shelter`: termina quando a tempestade passa com a criança dentro do abrigo (`isInsideShelter` já existe). Mantém a animação de primeira vez `storm`.
- A espera rápida da tempestade com a parede cheia (`stormSkip`) continua como está.
- Se a criança sobreviver de outro jeito (blindagem ligada), o passo também termina: o ato não trava.

### 3. Plantar e colher

- `plant` e `cert-greenhouse` já existem e passam a fazer parte do ato 3, com os desvios de água e energia de hoje (`PLANT_NEEDS`).
- O passo de colher passa a pedir também que a criança recolha a planta do chão, porque o passo seguinte precisa dela na mochila.

### 4. Primeira ração, sem modal

Hoje: o ponto de interação da cozinha abre o painel `galley` (comer ração, COOK FRESH MEAL); o cozinheiro transforma colheita em ração sozinho (10 s, 0,5 % de bateria) e entrega ração com [F].

Novo:
- Os pontos de interação da cozinha deixam de abrir painel. Sai a visão `galley` de `src/ui/machineViews.ts` e de `src/ui/StationPanel.ts`, com `cookMeal`.
- [F] no cozinheiro **com planta colhida na mochila**: ele recebe a planta, prepara por `RATION_PREP_SECONDS` (10 s) com animação, gasta `RATION_PREP_POWER` e entrega 1 ração.
- [F] no cozinheiro **sem planta**: entrega 1 ração da despensa, como hoje (`takeRation`).
- A ração é comida pela hotbar, como os outros alimentos.
- Passo novo `make-ration`: termina quando a criança recebe a ração feita com a planta dela. Animação de primeira vez nova, `ration`, com um fato real sobre comida no espaço e a fonte.
- O preparo automático da despensa pela tripulação continua.

Refeição fresca removida:
- Saem `UtilityModule.cookMeal`, `STATION_CONFIG.FRESH_FOOD_DURATION`, `UTILITY_CONFIG.MEAL_WATER_L`, `MEAL_POWER`, `MEAL_HEAL` e o estado `stations.freshFood`.
- **Atenção:** hoje, sem refeição fresca, o trabalho fica 40 % mais lento (`getWorkSpeed` em `src/core/GameEngine.ts:429`). Esse termo sai da conta, senão o jogo inteiro fica lento para sempre.
- Textos que citam refeição fresca (painéis, `docs/game/estado-atual-e-gaps.md`, `numeros-reais.md`) são atualizados.

### 5. Academia

- `cert-gym` já existe e fecha o ato 3, com o certificado e a animação de primeira vez `workout`.
- O trade-off "academia agora ou depois" (#421) fica fora.

## Testes e validação

- Vitest: `tutorialSteps.test.ts`, `StoryDirector.test.ts`, `machineViews.test.ts` e `StationPanel.test.ts` (sem `galley`), `firstTimeMoments.test.ts`, testes da cozinha em `UtilityModule`.
- `npm run typecheck` e `npm run build`.
- Visual, em desktop e touch 844×390: tempestade e abrigo, plantar, colher, entregar a planta ao cozinheiro e treinar.

## Fora deste spec

- Luz da estufa à noite (#420) e academia agora ou depois (#421).
