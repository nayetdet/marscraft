# Ato 4 da história: traje, 3 amostras de cada tipo, ciência no monitor e contador de pontos

> Spec de 15/11/2026. Issue [#410](https://github.com/nayetdet/marscraft/issues/410). Base: `origin/main` em `b38873f`.
> Depende dos atos 1 a 3 (specs nesta pasta).

## Objetivo

O ato 4 é a ciência da missão: sair de traje, coletar amostras de cada tipo, analisar na base e mandar para a Terra, com os pontos sempre à vista.

## Decisões tomadas com o Derick

- A criança coleta **3 amostras de cada um dos 5 tipos** (15 no total).
- As 3 pistas (#344) continuam: cada pista (gelo, lamito, enxofre) só conta quando as **3 amostras do tipo dela** foram analisadas. Areia e meteorito dão pontos, mas não são pista. A resposta da Terra na tela final continua.

## Como a criança joga

| # | Passo | O que ela faz | O que aprende |
|---|---|---|---|
| 1 | SUIT UP | Veste o traje no Suitport | Reforça o ato 1 |
| 2 | COLLECT SAMPLES | Busca as pedrinhas pelo mapa, 3 de cada tipo | Cada rocha conta uma parte da história de Marte |
| 3 | ANALYZE | Leva para a base e analisa no monitor de ciência | Analisar gasta bateria e vira pontos |
| 4 | SEND TO EARTH | Envia a ciência pelo rádio | Enviar custa energia; cada passagem leva pouco dado |

## Peças

### 1. Campos de amostra

Hoje: `SAMPLE_SITE_CONFIG.COUNT: 10` dá 2 locais por tipo, espalhados de 40 a 78 blocos da base (`src/world/sampleSites.ts`).

Novo:
- Cada tipo tem **um campo** com 3 pedrinhas a poucos blocos uma da outra: 5 saídas em vez de 15.
- `SAMPLE_SITE_CONFIG`: `COUNT` passa a 15; entram `PER_TYPE: 3` e `FIELD_RADIUS` (valor 4 blocos). O centro de cada campo usa as regras de hoje (anel em volta da base; gelo perto da cratera de gelo; `CLUE_RINGS` para lamito e enxofre).
- `placeSampleSites` continua função pura com semente. Os ids continuam `site-N`.
- Partida salva com amostras já coletadas: os ids antigos que não existirem mais são ignorados.

### 2. Passos

- `suit-up`: o mesmo passo do ato 1, sem a animação de primeira vez (ela só toca uma vez por partida).
- `collect-samples` (novo): termina com 3 amostras de cada tipo coletadas. O painel do objetivo mostra a contagem por tipo (`SAND 1/3`, `MUDSTONE 0/3`...). A seta aponta para o campo mais perto que ainda tem pedrinha.
- `analyze-samples` (novo): termina quando as 15 foram analisadas (`StationSystem.analyzeSample`, 2 % de bateria cada). A criança pode voltar à base e analisar aos poucos; o passo de coleta e o de análise não travam um ao outro.
- `send-science` (novo): termina quando a meta de pontos e as 3 pistas chegaram à Terra.

A coleta não exige ordem. Se o ar do traje acabar, a criança volta, recarrega e sai de novo.

### 3. Pistas com 3 amostras

- `clueStates` (`src/mission/clues.ts`) passa a contar: a pista é `found` quando há `PER_TYPE` amostras analisadas daquele tipo esperando envio, e `sent` quando as `PER_TYPE` foram enviadas. Com menos que isso, `bag` (alguma coletada) ou `todo`.
- O painel mostra o progresso de cada pista (`OLD LAKE 2/3`).
- A regra "amostra de pista nunca é gasta em melhoria" (`pickForSpend`) continua.
- `clueDue` (pista a cada 2 blocos de gelo) deixa de guiar a seta neste ato: quem guia é o passo de coleta.

### 4. Meta de pontos

- As 15 amostras somam 42 pontos (3 × (2 + 3 + 4 + 3 + 2)), mais os scans.
- `SCIENCE_CONFIG.POINTS_TO_LAUNCH` sobe de 10 para **30**: dá para decolar sem escanear tudo, mas não sem a coleta.
- `MAX_ITEMS_PER_UPLOAD: 8` continua: 15 amostras pedem pelo menos 2 envios, e cada envio paga o custo base. É o custo da ciência.
- `balance.test.ts` confere que a meta é alcançável só com as amostras e que a bateria cheia paga os envios necessários ao longo de um sol.

### 5. Contador de ciência

- Linha nova no painel do canto superior direito (o painel do objetivo, `src/story/objectiveView.ts` e `src/ui/StoryHud.ts`), visível desde o ato 2, quando a criança recebe a luneta: `SCIENCE 12 | SENT 8/30`.
- `SCIENCE` = pontos achados nesta partida (esperando envio + enviados). `SENT` = pontos na Terra sobre a meta.
- Quando os pontos sobem, o número pisca por um instante.
- Em touch (844×390) a linha cabe no painel sem cobrir controles.

## Testes e validação

- Vitest: `sampleSites.test.ts` (3 por tipo, campo compacto, semente fixa), `clues.test.ts` (pista com 3), `sciencePackage.test.ts` (meta 30), `objectiveView.test.ts` (contagem por tipo e contador), `tutorialSteps.test.ts`, `StoryDirector.test.ts`, `balance.test.ts`.
- `npm run typecheck` e `npm run build`.
- Visual, em desktop e touch 844×390: os 5 campos no mapa, a contagem por tipo, a análise e o contador.

## Fora deste spec

- Analisar aqui ou levar o tubo para a Terra (#422). Os tubos de amostra continuam como estão.
