# Ato 1 da história: água acabando, rover, meteoro e primeiro gelo no foguete

> Spec de 15/11/2026. Issue [#407](https://github.com/nayetdet/marscraft/issues/407). Base: `origin/main` em `b38873f`.
> Faz parte da refatoração da história em 5 atos (#407 a #411). Um spec por ato, nesta pasta.

## Objetivo

O ato 1 ensina, nesta ordem: a Terra demora a responder, a água da base acaba, o rover busca gelo, Marte muda (meteoro), sair a pé gasta o ar do traje e gelo vira combustível.

## Decisões tomadas com o Derick

- A criança **começa dentro da base**, sem traje. O passo `ENTER THE BASE` sai do ato.
- O passo `scan` **sai do ato 1** e passa a pertencer ao ato 2 (#408). Até lá nenhum passo ensina o scanner.
- O gelo do meteoro é buscado **a pé, de traje**. Vestir o traje pela primeira vez é um passo próprio.
- A água da base fica **10 vezes maior, com o mesmo ritmo** (tanque e gastos sobem juntos).

## Como a criança joga

| # | Passo | O que ela faz | O que aprende |
|---|---|---|---|
| 1 | CALL EARTH | Chama a Terra no terminal de rádio | A resposta demora: ela decide sozinha |
| 2 | DRIVE THE ROVER | Liga o rover no console | A água está acabando; o rover trabalha lá fora |
| 3 | DRILL ICE FOR WATER | Perfura gelo e descarrega na base | Gelo vira água do tanque |
| 4 | (evento) METEOR | Assiste ao meteoro cair | Marte muda: apareceu gelo novo |
| 5 | SUIT UP | Veste o traje no Suitport | Sem traje ninguém sai |
| 6 | GET METEOR ICE | Vai a pé até a cratera nova e pega 1 gelo | Sair gasta o ar do traje |
| 7 | LOAD THE ROCKET | Carrega o gelo no foguete | Gelo vira combustível e gasta bateria |

A resposta da Terra chega sozinha no meio dos passos seguintes, como hoje. O meteoro não é um passo: é um evento entre o passo 3 e o 5.

## Entrega em 2 PRs

### PR 1: água vezes 10

Regra: volumes da base sobem 10 vezes; o que uma pessoa usa de uma vez fica no valor real.

| Constante | Hoje | Novo |
|---|---|---|
| `WATER_SYSTEM_CONFIG.MAX_BASE_WATER` | 100 L | 1000 L |
| `WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER` | 25 L | 250 L |
| `WATER_SYSTEM_CONFIG.ICE_CARGO_MAX` | 50 kg | 500 kg |
| `WATER_SYSTEM_CONFIG.ICE_PER_DRILL` | 10 kg | 100 kg |
| `RADIATION_CONFIG.SHELTER_WALL_MAX_L` | 60 L | 600 L |
| `RADIATION_CONFIG.SHELTER_FILL_STEP_L` | 10 L | 100 L |
| `RADIATION_CONFIG.SHELTER_FILL_MIN_L` | 1 L | 10 L |
| `RADIATION_CONFIG.SHELTER_G_CM2_PER_L` | 10 / 60 | 10 / 600 |
| `CREW_CONFIG.WATER_L_PER_HOUR` | 3 / 24 | 30 / 24 |
| `CROP_CONFIG.*.water` (alface, batata, soja) | 1, 2, 3 L | 10, 20, 30 L |
| `STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD` | 0,5 L | 5 L |
| `STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR` | 3 L/h | 30 L/h |
| `STATION_CONFIG.LOW_WATER_L` | 5 L | 50 L |
| `STATION_CONFIG.LOW_WATER_WARN_L` | 10 L | 100 L |
| `DETOUR_RESUME_EXTRA.water` (desvio do tutorial) | 2 L | 20 L |

Fica como está:
- `DRINK_AMOUNT_FROM_DISPENSER` (2 L por gole) e `UTILITY_CONFIG.MEAL_WATER_L` (1 L por refeição).
- A água da eletrólise, que já usa a razão real (36 g de água para 32 g de O2).
- `ROVER_ICE_KG_PER_MAV_BLOCK`, que acompanha `ICE_PER_DRILL` sozinha.

Qualquer outra constante em litros achada durante a implementação segue a mesma regra. `balance.test.ts` e os testes de cada módulo são atualizados; o ritmo conferido é o de hoje: os 250 L iniciais duram mais de meio sol e menos de um sol sem gelo novo.

Dado real: 30 L por pessoa por sol é uso total (beber, comida, higiene e lavagem). Antes de mudar o texto do jogo, confirmar o número no NASA BVAD e registrar a fonte em `docs/data/numeros-reais.md`. Se o BVAD der outro total, o texto do jogo diz o valor real e marca os 30 L como escala de jogo. A aba REAL VS GAME (`src/data/realVsGame.ts`) e a linha da parede do abrigo no doc são atualizadas: a parede de 600 L passa a bater com as "centenas de litros" reais.

Este PR também entrega o "tanque maior" pedido no ato 3 (#409).

### PR 2: história do ato 1

**Começo dentro da base.** A animação de chegada termina com a criança ao lado do terminal de rádio, com o traje guardado no Suitport (`survival.suitEquipped = false`). Partida salva continua abrindo onde parou.

**Passos centrais** (`CORE_STEPS` em `src/story/tutorialSteps.ts`): `report` → `rover-drive` → `rover-ice` → `suit-up` → `collect-ice` → `load-rocket`. `enter-base` e `scan` perdem o `core: true` e ficam só no passeio completo.

**Passo novo `suit-up`:**
- `done`: o retrato do jogo passa a ter `suitEquipped`; o passo termina quando ele fica `true` depois do pedido.
- Lugar novo da seta: `suitport` (`src/story/waypoints.ts`).
- Animação de primeira vez nova, `suit`, em `src/story/firstTimeMoments.ts`, com um fato real sobre trajes e a fonte registrada em `numeros-reais.md`.

**Meteoro roteirizado.** O `GameEngine` já recebe o evento `step-done` do `StoryDirector`. Quando o id for `rover-ice`, ele chama `eventDirector.trigger('meteor', horas)`. O `StoryDirector` não muda. O `_meteorImpact` guarda o lugar da queda, e a seta de `collect-ice` aponta para lá. Se o meteoro não achar chão livre, a seta continua na cratera de gelo antiga. O meteoro sorteado continua existindo depois do ato 1.

**`collect-ice`.** Enquanto a skin do gelo de meteoro (#414) não existir, o bloco é o mesmo `MARS_ICE`: qualquer gelo novo conclui o passo. O que muda é a seta e o balão.

**Balões.** `rover-drive` passa a dizer que a água está acabando; `collect-ice`, que o meteoro deixou gelo novo. Frases curtas, em inglês, sem emoji.

## Testes e validação

- Vitest: `tutorialSteps.test.ts` (ordem dos passos centrais), `StoryDirector.test.ts`, `waypoints.test.ts`, `firstTimeMoments.test.ts`, `balance.test.ts` e os testes de água.
- `npm run typecheck` e `npm run build`.
- Visual, com Shaders ligado e desligado: partida nova em desktop e em touch 844×390, do começo até carregar o foguete.

## Fora deste spec

- Escolha "tanque ou foguete" para o primeiro gelo (#413).
- Skin do gelo de meteoro (#414).
- Ensinar o scanner (ato 2, #408).
