# Números reais para calibrar o jogo

Este arquivo existe para **não inventar números**, o que o próprio desafio pede. Cada valor tem a fonte ao lado.
- **[API]** = medido pelas APIs listadas no desafio em 2026-11-14 (amostras em [`samples/`](samples/)).
- **[Ref]** = constante pública de referência (fact sheets da NASA). Não veio destas APIs, mas é dado oficial.

## Radiação: taxa de dose absorvida [API, RadLab]

Arquivo: [`samples/radlab-dose-rate-summary.json`](samples/radlab-dose-rate-summary.json). Unidade provável: **µGy/h** (ver a nota em `apis-nasa.md`).

No jogo, as mesmas consultas são refeitas por `node scripts/fetch-radlab-summary.mjs` e gravadas em `src/data/radlabSummary.tson` (coleta de 15/11/2026 UTC, medianas idênticas às da tabela). A dose normal do jogo (`RADIATION_CONFIG.MARS_SURFACE_DOSE_UGY_PER_HOUR`) lê a mediana do Curiosity desse JSON, e o gráfico de 4 barras do diário e da enfermaria usa as proporções abaixo (issue #106).

| Local | Instrumento | Janela | Mediana | Média | Máx. | Leitura para o jogo |
|---|---|---|---|---|---|---|
| **Superfície de Marte** (Cratera Gale) | Curiosity MSL-RAD | 16/11–10/12/2022 | **6,93** | 6,96 | 9,86 | Estável. A atmosfera fina protege um pouco. |
| **Órbita da Lua** | LRO CRaTER | 16–17/11/2022 | **9,21** | 9,24 | 12,68 | Na Lua não há atmosfera nem campo magnético, então a dose é um pouco maior que em Marte. |
| **Viagem Terra–Lua** (Artemis I) | Orion HERA-HSU1 | 16/11–10/12/2022 | **16,69** | 19,58 | **8.012** | O pico gigante aconteceu ao atravessar os **cinturões de Van Allen**. |
| **Estação Espacial** (órbita baixa) | ISS DosTel1 | 01/01/2023 | **4,74** | 28,30 | 510 | Mediana baixa, porque o campo magnético da Terra protege. Há picos ao cruzar a Anomalia do Atlântico Sul. |

Proporções úteis para crianças (pela mediana):
- Marte ≈ **1,5×** a Estação Espacial; Lua ≈ **1,9×**; viagem no espaço profundo ≈ **3,5×**.
- Os picos da tabela (Orion: 8.012; Estação: 510) são de **cinturões de radiação da Terra** (Van Allen e Anomalia do Atlântico Sul). Não servem para calibrar uma tempestade solar na superfície de Marte: para isso use a seção abaixo.

### Tempestade solar na superfície de Marte: o que foi medido (issue #99)

| Fato | Valor | Fonte |
|---|---|---|
| Maior tempestade já medida pelo Curiosity (RAD), 20/05/2024, flare X12 | **8.100 µGy** no total, "equivalente a 30 raios-X de tórax", "não letal"; as partículas chegaram a Marte "em dezenas de minutos" | [NASA, 2024](https://www.nasa.gov/missions/maven/nasa-watches-mars-light-up-during-epic-solar-storm/) |
| Tempestade de 11/09/2017 | níveis de radiação na superfície **mais que o dobro** de qualquer medida anterior do RAD; as leituras altas duraram **mais de dois dias** | [NASA JPL, 2017](https://www.jpl.nasa.gov/news/large-solar-storm-sparks-global-aurora-and-doubles-radiation-levels-on-the-martian-surface/) |
| Quando a nuvem da CME passa por Marte | a dose de raios cósmicos **cai** (queda de Forbush); o RAD registrou 424 dessas de 2012 a 2016 | [Guo et al.](https://arxiv.org/abs/1712.06885); [Papaioannou et al., 2019](https://doi.org/10.1007/s11207-019-1454-2) |
| O que traz o perigo | partículas energéticas solares (SEP), que viajam quase à velocidade da luz e chegam em minutos; a nuvem da CME leva de 1 a 4 dias até a Terra | [NASA SVS, "Travel Time"](https://svs.gsfc.nasa.gov/vis/a010000/a010900/a010941/10941_Travel_Time_HTML_Transcript.html) |

Simplificação do jogo, a explicar: o jogo usa a **chegada da nuvem da CME** prevista pela NASA como relógio da tempestade (aviso → chegada → radiação alta). Na vida real as partículas perigosas chegam antes da nuvem, em minutos. Eventos SEP separados ficam para a issue #100. Nenhum texto do jogo diz quantas vezes a dose sobe.

Mecânica: a dose acumulada sobe com a taxa do momento (dose normal ou dose da tempestade), reduzida pelo habitat, pela blindagem e pela parede de água do abrigo.

[Ref] Para dar escala: o limite de carreira de astronautas da NASA é **600 mSv** (NASA-STD-3001, 2022).

### Dose da missão: a viagem já gasta a maior parte do limite (issue #104)

| Fato | Valor | Fonte |
|---|---|---|
| Dose na viagem até Marte, medida pelo RAD **dentro da nave** do Curiosity (2011–2012) | **1,8 mSv por dia** (1,84 ± 0,33) | [Ref] Zeitlin et al., *Science* 340 (2013); [SwRI/NASA, "SwRI-led team calculates the radiation exposure associated with a trip to Mars"](https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-the-radiation-exposure-associated-trip-mars) |
| Só o trânsito, ida e volta, com a propulsão atual (~180 dias cada perna) | **0,66 ± 0,12 Sv** (660 mSv, acima do limite de carreira) | mesma fonte |
| Duração da viagem de ida no jogo | **203 dias** (Mars 2020: 30/07/2020 a 18/02/2021) | tabela de constantes abaixo |
| Conta que o jogo mostra | 203 × 1,8 = **~365 mSv só para chegar**, ou seja, **~61 %** dos 600 mSv antes de pisar em Marte | `DOSE_CONFIG.TRANSIT_*`; a barra BODY DOSE do HUD abre aí |
| Superfície de Marte | ~0,64 mSv/dia (metade do espaço profundo, graças ao planeta embaixo e à atmosfera fina) | [Ref] Hassler et al., *Science* 343 (2014); o jogo usa a mediana do RadLab (6,93 µGy/h × 3,05 = ~0,51 mSv/dia) |

**Escala de jogo (declarada, não é medida), `DOSE_CONFIG.GAME_FACTOR = 8`:** a dose normal da superfície entra na barra no relógio das tempestades (1 hora de jogo = 1 dia real, o mesmo de `STORM_CONFIG.REAL_HOURS_PER_GAME_HOUR`), e **toda** dose que entra na barra (calmaria, tempestade, dentro e fora) é multiplicada por 8. Resultado: **1 hora de jogo vale ~8 dias em Marte**, e ~60 horas de jogo (2,5 sols) somam a dose de uma estadia real de ~500 dias. As proporções entre lá fora, habitat (×0,25), escudo (×0,2), parede de água (até ×0,17) e traje melhorado (×0,65, `STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR`) são as mesmas de `radiation.js`. Na barra (mSv de jogo):

| Situação | Soma na barra |
|---|---|
| 1 hora de jogo lá fora em dia calmo (100 s reais) | ~4,1 mSv (uma saída de 10 min reais: ~24 mSv, 4 % do limite) |
| 1 hora de jogo dentro da base em dia calmo | ~1,0 mSv |
| A maior tempestade (8.100 µGy), lá fora sem proteção | ~198 mSv |
| A maior tempestade, dentro da base sem abrigo | ~49 mSv |
| A maior tempestade, no abrigo com a parede cheia | ~8 mSv |

**Ao passar de 600 mSv** a médica de voo proíbe novas saídas do comandante: a porta externa do airlock não abre por dentro (quem está lá fora sempre entra). Não é game over: o rover, parado na plataforma do MAV, descarrega o gelo direto no tanque (10 kg = 1 bloco, escala de jogo), e quando o foguete está pronto a caminhada final até ele é liberada.

## Clima espacial [API, DONKI]

- **34 CMEs** entre 01/11 e 13/11/2026, com velocidades de **245 a 974 km/s** (mediana em torno de 370 km/s).
- Classe por velocidade: `S` (<500) · `C` (500–999) · `O` (1000–1999) · `R` (2000–2999) · `ER` (≥3000 km/s).
- Tempo de viagem Sol → Terra ≈ 150 milhões de km ÷ velocidade, ou seja, **~2 dias** (900 km/s) a **~7 dias** (250 km/s). Isso vira o "tempo de aviso" do evento no jogo.
- Notificações de 07 a 13/11/2026: 4× RBE (cinturão de radiação), 3× CME, 1× Report.

## Clima na superfície de Marte [API, InSight, Elysium Planitia, sols 675–681, out/2020]

Arquivo: [`samples/insight-weather-sols-675-681.json`](samples/insight-weather-sols-675-681.json)

| Grandeza | Valor real |
|---|---|
| Temperatura do ar | mínima **−97,7 °C**, máxima **−4,4 °C** (média diária ≈ −62 °C) |
| Pressão | média **~746 Pa**, ou seja, ≈ **0,7 %** da pressão ao nível do mar na Terra (101.325 Pa) |
| Vento horizontal | média ~7 m/s, rajadas de ~22 m/s |

A pressão baixíssima explica por que **não dá para respirar nem ficar sem traje** fora do habitat, o que justifica a mecânica de O2 do jogo.

**No jogo (issue #108):** `scripts/fetch-insight-weather.mjs` grava [`src/data/insightWeather.tson`](../../src/data/insightWeather.tson) (fonte, URL sem chave e data de coleta), lido só por `src/data/marsWeather.ts`. Cada sol do jogo usa um sol real em sequência (sol 1 = sol 675, repetindo depois do 681). Rajadas reais por sol: **18,4 a 26,9 m/s**.

| Uso no jogo | Real ou jogo |
|---|---|
| Mínima e máxima de cada sol, citadas no relatório do tempo ("WEATHER TODAY") | **Real** (InSight) |
| Curva da temperatura no sol: mínima às 5 h (antes do nascer do Sol), máxima às 14 h, meia onda de cosseno entre elas (`WEATHER_CONFIG`) | **Forma de jogo**; os extremos são reais |
| Aquecedor: gasto cresce em linha reta com o frio, de `HEATER_DAY_PER_HOUR` no ar mais quente do arquivo (−4,4 °C) até `HEATER_NIGHT_PER_HOUR` no mais frio (−97,7 °C) | Temperaturas **reais**; potência de **jogo** |
| Vento limpa poeira dos painéis: rajada acima de 20 m/s tira 2 % de poeira por m/s, uma vez por sol (`DUST_WEATHER_CONFIG.WIND_CLEAN_*`) | Rajadas **reais**; regra de **jogo**, inspirada nos "cleaning events" reais do Spirit e do Opportunity |

Limite honesto: os 7 sols são quase iguais (mesma estação), então o que varia de verdade é o ciclo dentro do sol e o vento. O rótulo é sempre "real data from InSight, October 2020", nunca "today" nem "live".

## Poeira e tempestades de poeira (issue #103)

| Grandeza | Valor real | Fonte |
|---|---|---|
| Opacidade do ar ("tau") média no local do Opportunity | **~0,5** | [Ref] NASA JPL, release de 08/2018 sobre a recuperação do Opportunity ("an average tau for its location on Mars is usually 0.5"), reproduzido em [phys.org](https://phys.org/news/2018-08-opportunity-recovery-efforts.html) |
| Tau da tempestade global de 2018 (Opportunity, 10/06/2018) | **10,8**, o maior já medido na superfície; último contato em 10/06/2018 | [Ref] [NASA JPL: Opportunity Hunkers Down During Dust Storm](https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/) |
| Tau abaixo do qual o Opportunity voltaria a carregar | **< 2,0** | [Ref] mesmo release de 08/2018 |
| Vento e redemoinhos limparam os painéis do Spirit e do Opportunity ("cleaning events") | fato qualitativo | [Ref] NASA JPL; [Planetary Society, 08/2018](https://www.planetary.org/articles/08-mer-update-opportunity-sleeps) |
| O vento de Marte não derruba ninguém: o perigo é a poeira, que tapa a luz e cobre os painéis | fato qualitativo | [Ref] [NASA: The Fact and Fiction of Martian Dust Storms](https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/) |

**Escala de jogo** (`DUST_WEATHER_CONFIG` em `src/config/constants.ts`): geração solar cai em linha reta de 100 % (tau 0,5) até **20 %** no tau recorde (nunca zero de dia); o pico de cada tempestade é sorteado entre tau 7 e 10,8; aviso de 2 h de jogo, tempestade de 6 a 9 h, poeira baixando em 3 h; primeira tempestade 8 a 16 h depois do tutorial, depois uma a cada 24 a 36 h. Poeira nos painéis: +0,6 %/h normal e +5 %/h na tempestade; painel todo coberto ainda gera 30 %. Limpar a mão tira 25 % de poeira e custa **1 ponto de O2 do traje** (de 20) por vez. A borda do mapa não machuca mais: virou parede invisível no raio `DUST_STORM_FATAL_RADIUS` (100 blocos do centro da base).

### Ato 2 da história: poeira no traje e vazamento de ar (issue #408)

| Fato | Valor real | Fonte |
|---|---|---|
| Poeira gasta o traje espacial | Nas 6 missões Apollo que pousaram na Lua, a poeira lunar causou **abrasão** nos trajes (luvas, botas e tecido externo), além de entupir mecanismos e estragar vedações. É dado da **Lua**: não há traje usado em Marte para medir | [Ref] [NASA/TM-2005-213610, Gaier, "The Effects of Lunar Dust on EVA Systems During the Apollo Missions"](https://ntrs.nasa.gov/citations/20050160460) |
| Detector de vazamento por ultrassom na Estação Espacial | Em **setembro de 2020** a tripulação da Expedição 63 usou um **detector de vazamento por ultrassom** para procurar um pequeno vazamento de ar, que foi isolado no módulo Zvezda. O vazamento não era perigo imediato para a tripulação | [Ref] [NASA Space Station blog, 29/09/2020, "Crew Continues Troubleshooting as Tests Isolate Small Leak"](https://blogs.nasa.gov/spacestation/2020/09/29/crew-continues-troubleshooting-as-tests-isolate-small-leak/) |
| Tempo de tripulação é escasso na Estação Espacial | Com 3 tripulantes no lado americano, uma semana típica dá a cada um cerca de **12 h de pesquisa, 6 h de operações de veículos e 4 h de manutenção**; com 1 só tripulante, a manutenção passaria a **12 h por semana** e a pesquisa ficaria para trás. Card WHO BRINGS THE GLASS? do ato 2 (issue #415): "astronaut time is scarce on the Space Station". A parada de 1 h de jogo (`ACT2_CONFIG.CREW_HELP_HOURS`) e quem cuida de cada máquina são regra de jogo | [NASA Office of Inspector General, relatório IG-20-005 (2019), p. 18 e 19](https://oig.nasa.gov/wp-content/uploads/2024/02/IG-20-005.pdf), consultado em 15/11/2026 |

**Regra de jogo** (`ACT2_CONFIG` em `src/config/constants.ts`), nada disto é dado real:

- Tempestade de poeira roteirizada do ato 2: aviso de 0,5 h de jogo, tempestade de 1,5 h (as sorteadas duram 6 a 9 h), tau de pico 9, poeira nos painéis a +40 %/h (cerca de 60 % no total).
- Poeira **por painel**: cada um dos 5 painéis tem a sua; a geração solar usa a média. A criança limpa um painel por vez (25 % por escovada, 1 ponto de O2 do traje). O passo termina com a tempestade acabada e todos os painéis abaixo de 10 %.
- Traje ou Terra (issue #417): a melhoria do traje custa **4 pontos de ciência** que nunca chegam à Terra e corta **35 %** da radiação lá fora (`SCIENCE_CONFIG.SUIT_UPGRADE_POINTS`, `STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR`). Tudo **regra de jogo**, sem fonte da NASA; o card e o boletim dizem isso.
- O traje desgasta **2 vezes** mais rápido lá fora durante uma tempestade de poeira (`STORM_SUIT_WEAR_MULTIPLIER`). O fator 2 é do jogo; o card cita o fato da Apollo e diz que a regra da tempestade é do jogo.
- Fichas raras que só existem na tempestade (issue #419, `src/story/acts/act2StormScans.ts`): a **parede de poeira** (`dust-storm-wall`) e o **redemoinho** (`dust-devil`) valem 2 pontos cada e a luneta só as registra **lá fora e com o evento acontecendo** (tempestade de poeira na fase `storm`; evento `dustDevil` ativo). Quando e onde escanear é regra de jogo, e as fichas dizem isso ("Scan: only outside..."). Os fatos das fichas são reais e já estão neste doc: tau ~0,5 em dia limpo e 10,8 na tempestade de 2018 (seção "Poeira e tempestades de poeira"), o vento de Marte não derruba ninguém (mesma seção) e a limpeza dos painéis do Spirit em 09/03/2005, com energia cerca de 50 % maior e redemoinhos filmados no dia seguinte (seção "Eventos aleatórios de Marte"). O boletim final lista as fichas que a criança pôde pegar e deixou passar.
- Janela rachada: o ar da base cai 0,15 %/s e para em 30 % (ninguém morre do vazamento roteirizado). O buraco aberto pelo jogador continua em 5 %/s.
- A luneta acha a rachadura em 1,2 s por janela e, numa janela inteira, diz a quantos blocos o vazamento "soa". É a versão de jogo do detector por ultrassom, que na Estação é um aparelho próprio, não uma luneta.
- O engenheiro leva 10 s reais para buscar o vidro novo.

## Constantes físicas e de missão [Ref]

| Grandeza | Marte | Lua | Fonte |
|---|---|---|---|
| Gravidade | **3,71 m/s²** (0,38 g) | **1,62 m/s²** (0,17 g) | [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) / [Moon](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) fact sheets |
| Duração do dia | **1 sol = 24 h 39 min** | **~29,5 dias terrestres** (≈ 14 dias de luz + 14 de escuridão) | fact sheets |
| Luz solar disponível (irradiância) | ~**43 %** da Terra (~590 W/m²) e cai muito em tempestades de poeira | ~igual à da Terra (~1.361 W/m²), mas some na noite lunar de 14 dias | fact sheets |
| Atraso de comunicação (só ida) | **~3 a ~22 min**, conforme a posição dos planetas | **~1,3 s** | distância ÷ velocidade da luz |

### Números da história (atos e animações)

Usados nos textos de `src/story/storyChapters.ts` e nas legendas de `src/story/cutscene/`. Coletados em 2026-11-14.

A distância e o atraso de rádio que aparecem no jogo **não são constantes**: vêm do `CommsLink` (`src/mission/earthMars.ts`, issue #56), que calcula a posição dos planetas para a data real da partida. As duas primeiras linhas abaixo são a conferência desse cálculo contra o JPL Horizons.

| Grandeza | Valor | Uso no jogo | Fonte |
|---|---|---|---|
| Distância Terra–Marte em 14/11/2026 | **1,32436 UA = 198,1 milhões de km** | Conferência: `earthMarsGeometry` dá 198,12 milhões de km para a mesma data. Aparece no card do rádio e na legenda do pouso | [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/): alvo `499` (Marte), observador `500@399` (geocentro), quantidade 20, 2026-11-14 00:00 UT |
| Atraso de rádio nesse dia | **661 s ≈ 11 min** só de ida, **22 min** ida e volta | Conferência: `earthMarsGeometry` dá 11,01 min. A espera pela resposta usa a escala do rádio da base (`COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE = 3`): 22 min de ida e volta ≈ 66 s reais | distância ÷ velocidade da luz (299.792,458 km/s) |
| Duração da viagem Terra–Marte | **~7 meses** (Mars 2020: 30/07/2020 a 18/02/2021, 203 dias) | Legenda da chegada | [NASA Mars 2020](https://science.nasa.gov/mission/mars-2020-perseverance/) |
| Pressão na superfície | Marte **6,36 mbar** × Terra **1.014 mbar** (~0,6 %) | Legenda "Mars air is 100 times thinner" (a NASA usa "about 100 times thinner") | [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) |
| Período sinódico de Marte | **779,94 dias ≈ 26 meses** | Fim alternativo: a janela de lançamento só reabre em ~26 meses | [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) |
| Base usada por uma tripulação depois da outra | A Estação Espacial Internacional está **ocupada sem interrupção desde novembro de 2000**; na troca de tripulação ("crew handover") as duas ficam a bordo ao mesmo tempo | Card LEAVING THE BASE do ato 5 (issue #423): "crews hand the Space Station to the next crew" | [NASA: International Space Station Facts and Figures](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/) ("The space station has been continuously occupied since November 2000"; "Sometimes more are aboard the station during a crew handover"), consultado em 15/11/2026 |

Como deixar a base (issue #423, `ACT5_CONFIG`): arrumar a base antes do IGNITE gasta **2 h de jogo** da janela de lançamento (`HANDOVER_WINDOW_HOURS`), e a base conta como pronta com o tanque de água pela metade, até 15 % de poeira nos painéis e metade dos campos plantada. Tudo isso é **regra de jogo**; o que é real é a prática de uma tripulação entregar a estação para a seguinte.

A janela de lançamento do jogo (`STORY_CONFIG.WINDOW_HOURS = 8` horas de jogo) é **escala de jogo**, não um número real: o que é real é a existência da janela e o intervalo de ~26 meses.

Essas constantes geram trade-offs prontos:
- **Lua:** a noite de 14 dias obriga a guardar energia (baterias) ou cortar sistemas. É um dilema forte de energia contra suporte de vida.
- **Marte:** o painel solar rende menos e a poeira derruba ainda mais. O atraso de até 22 min impede o "controle da missão" de salvar o jogador em tempo real, então ele precisa decidir sozinho.

## Missão do MAV: energia, tempestades e radiação (issue #30)

Números usados em `src/config/constants.ts` (`ENERGY_CONFIG`, `RADIATION_CONFIG`, `STORM_CONFIG`, `MAV_CONFIG`):

| Uso no jogo | Valor | Fonte |
|---|---|---|
| Rendimento dos painéis solares em Marte | **43 %** do que renderiam na Terra | [Ref] Mars Fact Sheet (irradiância ~590 W/m²) |
| Dose normal na superfície | **6,93 µGy/h** | [API, RadLab] Curiosity MSL-RAD, mediana |
| Conversão µGy → µSv (fator de qualidade) | **3,05** (0,21 mGy/dia → 0,64 mSv/dia) | [Ref] Hassler et al., *Science* 343 (2014), MSL-RAD |
| Dose normal resultante | **0,021 mSv/h** | conta acima |
| Dose total de uma tempestade, lá fora e sem proteção (`RADIATION_CONFIG.STORM_DOSE_MIN_UGY` / `_MAX_UGY`) | de **665 µGy** (o dobro da dose normal por 2 dias: 2 × 6,93 µGy/h × 48 h) até **8.100 µGy** (o recorde). Nenhuma tempestade do jogo passa do recorde (teste em `solarStorms.test.js`) | [Ref] os dois eventos reais da tabela "Tempestade solar na superfície de Marte" acima |
| Força de cada tempestade (`stormTotalDoseUGy`) | **regra do jogo**: cresce com a velocidade da CME, do mínimo em 300 km/s ao recorde em 1.200 km/s; golpe de raspão em Marte vale 75 % | A velocidade e o "golpe de raspão" vêm do DONKI; o mapeamento para dose não é medida da NASA, e a tela "NASA Data" diz isso |
| Tempo de aviso da tempestade | chegada prevista em Marte − saída do Sol, da própria CME (`marsArrivalTime − startTime`); 1 dia real de viagem = 1 hora de jogo | [API, DONKI] modelo WSA-ENLIL, `cmeAnalyses[].enlilList[].impactList[]` com `location: "Mars"`. Exemplo: CME de 01/11/2026 19:00Z, chegada em 07/11 06:00Z = 5 dias e 11 h = 5,46 h de jogo |
| Tempestades usadas | só CMEs reais com **impacto previsto em Marte**; se não houver nenhuma, a fila fica vazia ("No storms headed to Mars in this data") | [API, DONKI] `src/data/donkiCme.tson`, gerado por `npm run fetch:donki`. Coleta de 15/11/2026: **153 CMEs para Marte** de 1.651 entre 14/11/2025 e 13/11/2026; velocidades de 255 a 1.960 km/s (mediana 535), avisos de 1,6 a 7,2 horas de jogo (mediana 4,7), 92 de raspão |
| Pico de SEP (só com dado ao vivo, issue #100; `SPACE_WEATHER_CONFIG`) | a cada 3 tempestades, a 3ª é um pico de SEP: aviso de **0,25 h de jogo** (~25 s reais) e dose total de **665 µGy** (a menor tempestade real do Curiosity). As duas coisas são **regra do jogo** | [API, DONKI] `/DONKI/SEP`: data (`eventTime`) e nave que mediu (`instruments`) são reais. O DONKI não dá a força da SEP em Marte. As partículas viajam perto da velocidade da luz e chegam em minutos a horas, por isso o aviso é curto. Sem SEP na janela ao vivo (caso de 14/11/2026: 0 em 60 dias), o jogo não cria uma |
| Relevo do mundo (`src/data/marsTerrain.ts`) | recorte de **224 × 224 pixels a 1,0118 m por pixel** de uma cratera de ~180 m em Aeolis Palus, cratera Gale (**4,4743°S, 137,4032°E**, ~7 km ao norte do pouso do Curiosity); **12,7 m** de relevo, de −4.448,1 m a −4.435,5 m; 1 bloco ≈ 1 m | [API, HiRISE DTM `DTEEC_010573_1755_010639_1755_U01`](https://www.uahirise.org/dtm/PSP_010573_1755), NASA/JPL-Caltech/University of Arizona; `src/data/marsTerrain.tson`, gerado por `node scripts/fetch-mars-terrain.mjs`. Nivelados para as construções: base, alas norte e leste, estufa e plataforma do MAV. Com a cratera de gelo, que é do jogo, só **~5 % das colunas** diferem do dado real depois do arredondamento para blocos. |
| Limite de carreira exibido na vitória | **600 mSv** | [Ref] NASA-STD-3001 (2022) |
| O2 em kg no resumo da vitória | 1 sol respirando lá fora = **0,84 kg** | [Ref] NASA BVAD |
| Consumo da tripulação NPC (`CREW_CONFIG`) | **30 L de água e 1,8 kg de comida por pessoa por sol** (1,25 L e 0,125 ração por hora de jogo; a água é uso total, beber, cozinhar, higiene e lavagem, desde 15/11/2026, quando a água da base subiu 10 vezes; eram 3 L, só beber e cozinhar; 1 ração = 1 refeição de 0,6 kg), no relógio do jogo (issue #229); O2 pago em energia, 0,75 %/h por tripulante. Eram 0,3 L e 0,18 ração por hora depois da issue #81 (7,2 L por sol, 2,4 vezes o real) | [Ref] NASA BVAD: ~3 kg de água (beber e preparar comida) e ~1,8 kg de comida por pessoa/dia. A parte de higiene e lavagem dos 30 L é **escala de jogo**: o total real por tripulante ainda não foi conferido no BVAD (uma busca em 15/11/2026 achou um estudo de base lunar com ~29 kg por pessoa por dia, não lido na fonte). O custo de energia do O2 é escala de jogo |
| Reciclador de água (`STATION_CONFIG.WATER_RECOVERY`) | **98 %** da água usada volta ao tanque | [Ref] NASA, sistema de recuperação de água da ISS (2023) |
| Água das plantas (`WATER_SYSTEM_CONFIG.CROP_WATER_RETURN`, issue #101) | a planta bebe do tanque só enquanto cresce e **90 %** volta como água cinza (escala de jogo); os 10 % restantes ficam na comida | Fato real: no Advanced Plant Habitat da ISS a água transpirada é condensada e guardada no reservatório de recuperação, e "a maior parte da água para sustentar o crescimento vem da umidade condensada" ([Monje et al., 2020, *Frontiers in Plant Science*](https://pmc.ncbi.nlm.nih.gov/articles/PMC7314936); [ficha do APH, NASA](https://www.nasa.gov/sites/default/files/atoms/files/advanced-plant-habitat.pdf)). O artigo não dá a porcentagem recuperada: os 90 % são regra do jogo, e o jogo não mostra esse número como dado real. Litros por cultura (`CROP_CONFIG.*.water`) e por ração da tripulação (`STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD`) também são de jogo: não achamos um número oficial de litros por planta para Marte |
| Parede de água do abrigo de tempestade (`RADIATION_CONFIG.SHELTER_WATER_CURVE`, issue #56) | redução média da dose das tempestades solares de 2012: **1 g/cm² → 42 %**, **5 g/cm² → 79 %**, **10 g/cm² → 83 %** (10 g/cm² de água é a referência de "abrigo de tempestade") | [Ref] Quinn et al., *Modeling shielding in the Earth-Moon-Mars radiation environment using PREDICCS* (pôster, UNH, com dados do MSL/RAD): [PDF](https://posters.unh.edu/private_media/4209/). Paredes de água no alojamento como abrigo: [Clowdsley, NASA LaRC, 2021](https://ntrs.nasa.gov/citations/20210009760) |
| Bateria do rover (`ROVER_CONFIG`, issue #111) | dirigir gasta **0,5 %/s**, cada perfuração **4 %**; abaixo de **15 %** o rover anda a 35 % da velocidade e não perfura; parado no depósito recarrega **8 %/s**, e a carga cheia custa **10 %** da bateria da base. Uma viagem de gelo completa gasta ~26 % (3 viagens por carga) | Tudo escala de jogo. Os números reais do Curiosity ficam na ficha do scanner (`src/data/scanCatalog.ts`) |
| Repouso do tripulante (`CREW_CONFIG.BEDRIDDEN_AFTER_HOURS`, `BED_REST_HOURS`, issue #111) | **12 h** de jogo sem ar, água ou comida deixam o tripulante de cama na enfermaria; **6 h** com tudo em dia para voltar (metade com a médica de plantão) | Escala de jogo. Ninguém volta para a Terra fora do foguete: a janela de lançamento só abre a cada ~26 meses (período sinódico) |
| Aquecedor do módulo norte (`UTILITY_CONFIG.HEATER_*`, issue #56 B2) | de **0,5 %/h** (ar mais quente do InSight) a **2 %/h** (ar mais frio), proporcional à temperatura real lá fora (issue #108; escala de jogo; eram 1 e 4 antes da issue #81); desligado à noite, o reciclador de água e a estufa param | Temperatura real: média ~−62 °C, mínima **−97,7 °C** (InSight, tabela de clima acima). A potência é de jogo: não achamos um número oficial de aquecimento para uma base em Marte |
| Primeira impressão 3D no espaço (oficina, issue #56 B5) | **novembro de 2014**, na ISS (impressora da Made In Space, peça de plástico ABS) | [NASA: 3-D Printer Creates First Object in Space](https://www.nasa.gov/missions/station/open-for-business-3-d-printer-creates-first-object-in-space-on-international-space-station/) |
| Cozinha e despensa (issue #56 B3) | ~**1,8 kg** de comida por pessoa por dia; na ISS a comida vem embalada e é aquecida na cozinha | [Ref] NASA BVAD (linha da tripulação acima). A ração do jogo sai da mesma despensa da tripulação |
| Primeira ração (animação de primeira vez `ration`, ato 3, issue #409) | o laboratório de comida espacial da NASA produz **comida liofilizada** (freeze-dried) e embalada para os astronautas; em missões longas a comida precisa continuar segura, nutritiva e gostosa por **até 5 anos** | [NASA: Space Food Systems](https://www.nasa.gov/directorates/esdmd/hhp/space-food-systems/) (página atualizada em 10/03/2026, lida em 15/11/2026): "The Space Food Systems Laboratory produces freeze-dried food" e "Foods on these missions will need to be safe, nutritious, and palatable for up to five years". **Regra de jogo:** o cozinheiro transformar 1 planta colhida em 1 ração em 10 s por 0,5 % de bateria (`UTILITY_CONFIG.RATION_PREP_*`); a refeição fresca (bônus de velocidade) saiu do jogo em 15/11/2026 |
| Atraso do rádio Terra–Marte (`src/mission/earthMars.ts`, issue #56 A2) | calculado para a data do jogo: em 14/11/2026, **~198 milhões de km = ~11 min só de ida**; oposição de 16/01/2025: 96 milhões de km (5,4 min); conjunção de 09/01/2026: ~360 milhões de km (20 min) | [Ref] NASA/JPL, [Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html) (tabela 1, válida de 1800 a 2050); velocidade da luz 299.792,458 km/s. No jogo, cada minuto real de luz vira 0,35 s de espera (~8 s de ida e volta; eram 3 s por minuto até 15/11/2026) |
| Conjunção solar (`COMMS_CONFIG.CONJUNCTION_SUN_ANGLE_DEG`) | os comandos para Marte param quando o Sol fica a **menos de ~2°** de Marte no céu da Terra, por **~2 semanas**, a cada **~26 meses** | [Ref] NASA/JPL: [What's Mars Solar Conjunction, and Why Does It Matter?](https://www.nasa.gov/solar-system/whats-mars-solar-conjunction-and-why-does-it-matter/). A próxima real é só em 2028, então o jogo encena uma por partida (6 h de jogo) e a chama de "simulated" |
| Água na parede cheia | **600 L = 10 g/cm²** (escala de jogo: ~0,0167 g/cm² por litro; eram 40 L até a issue #228 e 60 L até 15/11/2026) | Uma parede real de 10 cm em volta de uma cabine pede centenas de litros; com o tanque de 1000 L (15/11/2026) a parede do jogo passou a ter esse tamanho |
| Ciência para a Terra em pontos (`SCIENCE_CONFIG`, issues #105 e #269) | uma moeda só, **pontos de ciência**: descoberta do scanner **1 ponto** (céu e paisagem, raras, **2**); amostra analisada **1 a 4** conforme o tipo (tabela "Amostras do mapa" abaixo). O foguete só decola com **30 pontos enviados** (ato 4, issue #410: as 15 amostras do mapa, 3 de cada tipo, somam 42) e com as 3 pistas, cada uma com as **3 amostras do tipo dela** analisadas e enviadas. Envio: **8 % + 3 % por item**, no máximo **8 itens por envio**. Melhorias do traje e da ferramenta gastam **4 pontos ainda não enviados** cada (o que é gasto não vai para a Terra). Cada tubo de amostra no MAV pede **+1 bloco de gelo** (até 4 tubos). Analisar aqui ou levar o tubo (issue #422): a amostra do tubo vai **crua**, não é analisada, vale **o dobro dos pontos** (`TUBE_POINTS_FACTOR`), contados só no boletim final; não entra na meta de decolagem nem paga melhoria. Amostra de pista não vai no tubo | Tudo escala de jogo. Fatos reais usados só em texto: os rovers mandam quase todo o dado por orbitadores, que repassam para a Terra, em sessões limitadas por passagem ([NASA, Mars Relay Network](https://science.nasa.gov/mars/mars-relay-network/); [NASA/JPL](https://www.jpl.nasa.gov/news/the-mars-relay-network-connects-us-to-nasas-martian-explorers)); o Perseverance guarda amostras em tubos para uma futura missão de retorno ([NASA, Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/)). Um tubo real pesa muito menos que um bloco de gelo: o painel do MAV diz que é regra do jogo |

| Pôster "How we make air" | as duas máquinas do gerador de O2 (seção abaixo); MOXIE (rover Perseverance) produziu **122 g** de O2 em 16 rodadas, pico de **12 g/h** | [Ref] [NASA, 06/09/2023](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) |
| Painel da enfermaria (`src/ui/stationText.ts`, issue #111) | "na Estação Espacial, sem exercício, os ossos ficam ~1 % menos densos por mês"; **quanto se perde em Marte (0,38 g) ninguém mediu** | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/): "for every month in space, astronauts' weight-bearing bones become roughly 1% less dense if they don't take precautions". O artigo é sobre microgravidade e não dá número para gravidade parcial: nenhum astronauta viveu meses em 0,38 g. A perda no jogo é taxa de jogo (`STATION_CONFIG.FITNESS_DECAY`) |
| Pôster "Why we exercise" | ossos perdem **~1 %** de densidade por mês no espaço sem exercício; tripulações da ISS treinam **~2 h por dia** | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/) |
| Academia agora ou depois (ato 3, issue #421, `src/story/acts/act3Gym.ts`) | Card TRAIN NOW x LATER: "Space Station crews train 2 hours a day" e ossos ~1 % menos densos por mês sem exercício. **Quanto se perde em Marte (0,38 g) ninguém mediu**: o card, a legenda da cena e este doc dizem que é regra de jogo | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/), conferido em 15/11/2026: "Crews exercise for an average of two hours a day" e "for every month in space, astronauts' weight-bearing bones become roughly 1% less dense if they don't take precautions". **Regra de jogo** (`ACT3_CONFIG`): cada treino gasta 10 % da barra de comida, 15 % da de água, 2 h de relógio e 3 % de bateria; com ossos ou preparo abaixo de 40 o trabalho fica 40 % mais lento, a vida só se recupera até 70 % da barra (o teto nunca tira vida) e, na decolagem, a tripulação carrega a criança até o foguete (em boa forma ela vai andando). A regra é uma simplificação: nenhum astronauta viveu meses em gravidade parcial |
| Pôsteres "Mars vs Earth" e "Going outside" | gravidade 38 %, sol de 24 h 39 min, luz 43 %, pressão 0,7 %, −62 °C (média) e −97,7 °C (mínima) | tabelas acima (Mars Fact Sheet e InSight) |

A tela "NASA Data" do menu (`public/game.html`) lista as fontes.

### Ritmo do consumo (issue #81, escala de jogo)

No playtest tudo zerava junto. A conta mostrava por quê: com a tripulação padrão (2) e tudo ligado, a base gastava parada **10,5 %/h de dia e 13,5 %/h à noite**, ou seja, **288 % de bateria por sol**, e os painéis geram **~164 % por sol** (pico de 21,5 %/h, zero à noite). A noite de 12 h pedia 162 % de uma bateria de 100 %.

| Consumo passivo (por hora de jogo = 50 s reais) | Antes | Agora | Onde |
|---|---|---|---|
| O2 da tripulação, por tripulante | 1,5 % | **0,75 %** | `CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR` |
| Trabalho em cada estação operada | 2 % | **1 %** | `STATION_CONFIG.WORK_ENERGY_PER_HOUR` |
| Luz da estufa | 2,5 % | **1,25 %** | `UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR` |
| Aquecedor, dia / noite | 1 % / 4 % | **0,5 % / 2 %** | `UTILITY_CONFIG.HEATER_*` |
| **Base padrão, dia / noite** | 10,5 % / 13,5 % | **5,25 % / 6,75 %** | soma das linhas |
| Água que a tripulação bebe, por tripulante | 0,5 L | 0,3 L na issue #81; 0,125 L (3 L por sol, o valor real do BVAD para beber e cozinhar) na issue #229; **1,25 L** (30 L por sol, uso total) desde 15/11/2026 | `CREW_CONFIG.WATER_L_PER_HOUR` |
| Comida da tripulação, por tripulante | 0,3 ração | 0,18 ração na issue #81; **0,125 ração** (3 refeições de 0,6 kg por sol = 1,8 kg, o valor real do BVAD) desde a issue #229 | `CREW_CONFIG.FOOD_PER_HOUR` |
| Água da estufa da tripulação, por ração | 1 L | 0,5 L na issue #81; **5 L** desde 15/11/2026 (água vezes 10) | `STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD` |

O que isso dá (testes em `src/config/balance.test.ts`):

- **Noite:** uma bateria cheia ao pôr do sol chega ao amanhecer com ~19 % (gasta 81 %). A margem é pequena de propósito: ligar a blindagem (12,5 %/h) ou a fábrica (25 %/h) à noite ainda derruba a base.
- **Sol inteiro:** a base gasta 144 % e o Sol dá ~164 %. Sobram ~20 % por sol: paga um bloco de gelo virando combustível (3,75 %) e a blindagem de uma tempestade (11 %), mas não o tanque inteiro do foguete (fábrica a 25 %/h e blindagem a 55 %/h desde 15/11/2026, metade do que eram). Para pagar o foguete é preciso desligar algo (luz da estufa: 30 % por sol; tripulação descansando: 48 % por sol), e cada um desses para de fazer o seu trabalho.
- **Água:** sem ninguém no reciclador e sem gelo, o tanque inicial de 250 L (de 1000 L; eram 25 de 100 L até 15/11/2026, quando tanque e gastos subiram 10 vezes juntos) dura mais de meio sol (12 h de jogo = 20 min reais, o ato 1 e a primeira viagem do rover) e menos de um sol. A base padrão gasta ~15 L/h (na escala antiga: 1,5 L/h, 2,8 L/h depois da issue #101 e 5 L/h antes dela) e ~94 % disso fica esperando como água cinza; o reciclador (30 L/h) dá conta.
- **Traje:** o tanque de O2 já durava 6 min fora da base (`SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE`), acima dos 3 a 4 min pedidos, e não mudou. Ir a pé até a cratera de gelo (43 blocos da porta do airlock), minerar 10 blocos e voltar, andando o dobro do caminho reto, gasta ~30 % do tanque.
- **Primeiro sol mais brando** (`PACING_CONFIG`, `src/mission/pacing.ts`): os consumos passivos da tabela (menos a água da estufa) valem **60 %** durante o sol 1 e sobem em linha reta até 100 % ao longo do sol 2. A produção não muda, e as escolhas do jogador (blindagem, fábrica, rádio, plantio) custam o mesmo desde o início. O painel da sala de energia mostra o gasto real do momento e avisa do "easy start".

Os custos de energia desta tabela são escala de jogo. A água e a comida da tripulação passaram a ser o valor real do BVAD por pessoa e por sol (issue #229, seção "Regra única do tempo" abaixo).

Escala de jogo (não é dado real): capacidade da bateria, custos de energia em %, duração da tempestade (3 h de jogo), dano por mSv e o limite de 0,5 mSv por hora de jogo a partir do qual a radiação machuca. O limite foi calibrado para que toda tempestade machuque lá fora, as fortes machuquem dentro do habitat sem abrigo, e o abrigo com a parede cheia ou a blindagem dentro do habitat protejam em qualquer tempestade (testes em `radiation.test.js`). A conversão µGy → mSv usa o mesmo fator de qualidade 3,05 da dose normal; para partículas de tempestade o fator real é outro, e o jogo não mostra essa conta como dado.

Simplificação a explicar: a "blindagem ligada" (tecla R) é um escudo ativo que gasta energia e só protege dentro da bolha em volta da base. Escudos magnéticos ativos ainda são pesquisa; nas bases reais, o abrigo de tempestade usa massa (água, regolito). Detalhes e fontes em [`protecao-radiacao.md`](protecao-radiacao.md).

## Gerador de O2: eletrólise ou MOXIE (issue #102)

O ar do habitat (o do jogador e o da tripulação) sai de um gerador com **dois modos**, escolhidos no painel "LIFE SUPPORT / ECLSS". Um gasta água, o outro gasta mais energia: nenhum é melhor em tudo. Código em `src/mission/oxygenPlant.ts` (conta) e `src/mission/oxygenText.ts` (textos), números em `OXYGEN_PLANT_CONFIG`.

| Máquina | Como faz O2 | O que vale no jogo | Fonte |
|---|---|---|---|
| **OGA** (Oxygen Generation Assembly, Estação Espacial): modo **"Air from water"** | eletrólise: 2 H2O → 2 H2 + O2. **36 g de água dão 32 g de O2** (razão 1,125) | Com os **0,84 kg de O2 por pessoa por dia** do BVAD: **0,945 L de água por pessoa por sol** (`ELECTROLYSIS_WATER_L_PER_PERSON_SOL`; 1 kg de água = 1 L). O ar do jogador segue a mesma razão: a água tirada do tanque é 1,125 × os kg de O2 do `oxygenPointsToKg` (1 sol respirando lá fora = 0,84 kg). Com o tanque vazio o O2 para de recarregar e o HUD diz "WATER TANK EMPTY" | [Ref] [NASA, status do OGA da ISS (2015)](https://ntrs.nasa.gov/api/citations/20150016494/downloads/20150016494.pdf); [NASA, ICES 2024](https://ntrs.nasa.gov/api/citations/20240002161/downloads/ICES24%20Paper%20168.pdf) (reação de eletrólise); NASA BVAD |
| **Sabatier** (Estação Espacial): melhoria opcional | junta o H2 da eletrólise com o CO2 que a tripulação expira: CO2 + 4 H2 → CH4 + 2 H2O. O hidrogênio que sai no metano limita a recuperação de O2 a **~50 %** | Montado uma vez na impressora 3D pelo painel (3 regolitos, 8 % de bateria, escala de jogo), devolve **metade** da água da eletrólise (`SABATIER_WATER_RETURN = 0.5`) | [Ref] [NASA, ICES 2024](https://ntrs.nasa.gov/api/citations/20240002161/downloads/ICES24%20Paper%20168.pdf) |
| **MOXIE** (rover Perseverance): modo **"Air from Mars air"** | tira o oxigênio do CO2 do ar de Marte | Não gasta água. **122 g** no total em 16 rodadas, pico de **12 g/h**: no pico, uma pessoa (840 g/dia) pediria 70 horas de MOXIE por dia | [Ref] [NASA, 06/09/2023](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) |

**Escala de jogo (não é dado da NASA):** o custo de energia de cada modo. Não existe potência oficial de um gerador de O2 para uma base em Marte. A eletrólise usa os custos que já existiam (`ENERGY_CONFIG.OXYGEN_COST_PER_POINT = 1,5 %` por ponto de O2 do jogador, `CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR = 0,75 %/h` por tripulante) e o MOXIE gasta **o dobro** (`MOXIE_ENERGY_FACTOR = 2`). O painel diz que esses custos são regra do jogo e que a conta da água é química real.

Nenhum modo domina (testes em `src/mission/MissionSystem.test.ts` e `src/crew/CrewManager.test.ts`):

- **Noite sem Sol, bateria em 30 %:** 15 pontos de O2 custam 22,5 % na eletrólise e 45 % no MOXIE. Só a eletrólise chega ao amanhecer. Com a tripulação (2 pessoas, 12 h, bateria em 40 %) é igual: no MOXIE eles ficam sem ar.
- **Tanque quase vazio (0,05 L):** a eletrólise só faz ~7 pontos de O2 e para; o MOXIE faz os 20 sem tocar no tanque.

O tripulante no gerador de O2 avisa quando o modo está gastando o recurso que está acabando: tanque abaixo de **10 L** com eletrólise, bateria abaixo de **25 %** com MOXIE (`LOW_WATER_WARN_L`, `LOW_BATTERY_WARN_PCT`, escala de jogo). A sala de energia mostra o modo na lista "WHERE THE POWER GOES" (linha "Crew air: water" ou "Crew air: Mars air") e a tela "POWER MAP" da base mostra "O2 MAKER: FROM WATER / FROM MARS AIR / NO WATER / NO POWER".

Com a razão real a água do ar é pouca perto da que se bebe: ~0,14 L por recarga completa do traje do jogador e ~1,9 L por sol para 2 tripulantes. O peso da escolha aparece quando o tanque está baixo (a água também vai para beber, para as plantas e para a parede do abrigo) ou à noite, quando cada ponto de bateria conta.

### Sono no beliche (issue #109)

| Número | Valor | Fonte |
|---|---|---|
| Sono real de astronautas | **~6 h por noite**, com **8,5 h** reservadas na agenda (64 astronautas do ônibus espacial e 21 da Estação Espacial) | Barger et al., *The Lancet Neurology* 13(9), 2014; resumo em https://www.space.com/26829-astronauts-space-station-sleep-deprivation.html |
| Gasto de energia dormindo | taxa de atividade do sono = **1,0× o metabolismo basal**; um dia moderadamente ativo fica em **~1,7–2,0×** | FAO/WHO/UNU, *Human energy requirements* (2004) |
| Ritmo do corpo e erros | dormir fora do ritmo do relógio do corpo piora o sono; cansaço leva a erros | NASA, ritmo circadiano e iluminação para astronautas (2016): https://phys.org/news/2016-12-nasa-effects-circadian-solution-astronauts.pdf |

Escala de jogo (`SLEEP_CONFIG` em `src/config/constants.ts`, regras em `src/player/sleep.ts`):

- Dormindo, o relógio corre 3 h de jogo por segundo real, em passos de 0,1 h. A missão, o aquecedor, a luz da estufa, o filtro de CO2 e as plantas andam como acordado.
- Fome e sede caem **1,2 e 0,8 pontos (de 20) por hora dormida**. Acordado a barra de comida dura ~1,8 h de jogo, então a mesma taxa matava quem dormisse; o corpo gasta menos dormindo (FAO acima), e o jogo arredonda isso para "uma noite de 9 h gasta metade da comida e um terço da água".
- Aviso de tempestade, bateria vazia, vazamento de ar, alarme da base (frio, CO2 ≥ 40 %, poeira) ou fome/sede ≤ 4 acordam o jogador; o relógio para naquele passo.
- Mais de 1 sol (24 h de jogo) acordado deixa o trabalho mais lento (o mesmo 0,6× de `getWorkSpeed`). Cada hora dormida paga 3 h acordado.

## Eventos aleatórios de Marte (issue #107)

Cada evento mostra um card com o fato abaixo, a data e a fonte (`src/mission/eventText.ts`). Os fatos foram conferidos nas fontes em 14/11/2026. Quando cada evento acontece e o tamanho do efeito são **escala de jogo**, sorteados pela semente da partida (`src/mission/eventDirector.ts`, números em `EVENTS_CONFIG`).

| Evento | Fato real usado no card | Fonte |
|---|---|---|
| Meteoro | Em **24/12/2021** um meteoroide atingiu Marte; o InSight sentiu um tremor de **magnitude 4** e o MRO achou a cratera nova (**~150 m** de diâmetro), com **pedaços de gelo do tamanho de pedregulhos** jogados para fora | [NASA JPL, 27/10/2022](https://www.jpl.nasa.gov/news/nasas-insight-lander-detects-stunning-meteoroid-impact-on-mars/) |
| Tremor de Marte | O InSight detectou **mais de 1.313 tremores**; o maior, de **magnitude 5**, em **04/05/2022** | [NASA JPL, 09/05/2022](https://www.jpl.nasa.gov/news/nasas-insight-records-monster-quake-on-mars/) |
| Eclipse de Fobos | O Perseverance filmou Fobos cruzando o Sol em **02/04/2022** (sol 397); o eclipse durou **um pouco mais de 40 segundos** | [NASA JPL, 20/04/2022](https://www.jpl.nasa.gov/news/nasas-perseverance-rover-captures-video-of-solar-eclipse-on-mars) |
| Redemoinho de poeira | No sol 420 do Spirit (**09/03/2005**) a poeira saiu dos painéis e a energia subiu **cerca de 50 %**; no dia seguinte o Spirit filmou redemoinhos. **Não confirmado** que foi um redemoinho: a própria NASA pergunta se foi coincidência, e o card diz isso | [NASA/JPL MER, 14/03/2005 (via Spaceflight Now)](https://spaceflightnow.com/mars/mera/050314dustdevil.html); [NASA Photojournal PIA03608](https://science.nasa.gov/photojournal/solar-panel-dust-accumulation-and-cleanings/) ("wind events" que limpam os painéis, sol 420) |
| Traje espacial (animação de primeira vez `suit`, ato 1, issue #407) | Um traje completo é como uma **nave para uma pessoa**; a **mochila** leva o oxigênio que o astronauta respira | [NASA: What Is a Spacesuit? (Grades 5-8)](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-a-spacesuit-grades-5-8/) |
| Geada ao amanhecer | O Viking Lander 2 fez a primeira foto clara de geada no chão de Marte em **13/09/1977** (Utopia Planitia). **Não se sabe** se era gelo de água, gelo seco (CO2) ou os dois; o card diz isso | [NASA Photojournal PIA00530](https://science.nasa.gov/photojournal/frost-on-utopia-planitia) |
| Aurora | Depois de uma erupção solar em **15/03/2024**, o Perseverance detectou uma aurora **verde** (557,7 nm), a primeira em luz visível vista da superfície de outro planeta | [NASA JPL, 14/05/2025](https://www.jpl.nasa.gov/news/nasa-observes-first-visible-light-auroras-at-mars/) |

Correções em relação ao texto da issue: a foto da geada (PIA00530) é de **1977**, não de 1979, e a fonte **não** diz que era gelo de água. O texto do redemoinho ficou como hipótese, não como fato.

Escala de jogo (não é dado real): a cratera do meteoro tem raio de 4 blocos (a real tem ~150 m); o tremor tira 35 % da saúde de uma estação da tripulação; o eclipse corta até 40 % da luz e da carga solar (Fobos é menor que o Sol visto de Marte, então o eclipse real também é parcial, mas o jogo não usa a fração real); o redemoinho limpa por inteiro 2 dos 5 painéis do campo solar, os mais perto do caminho dele (`EVENTS_CONFIG.DUST_DEVIL_PANELS_CLEANED`, ato 2, issue #408). As durações em segundos reais (`EVENTS_CONFIG.DURATION_SECONDS`) são o tempo da animação; só a do eclipse (40 s) segue o evento real.

## Amostras do mapa (issue #270)

Dez locais de amostra espalhados pelo mapa (`SAMPLE_SITE_CONFIG`, `src/world/sampleSites.ts`), dois de cada tipo, sempre nos mesmos lugares para a mesma semente. A criança coleta lá fora (custa ar do traje, dose de radiação e um lugar na mochila), analisa no terminal de ciência (2 % de bateria) e a ficha do tipo abre no diário [J] com o fato real. **As posições no mapa e os pontos são regra de jogo; os fatos são reais** (`src/data/sampleTypes.ts`). Fontes conferidas em 15/11/2026.

| Amostra no jogo | Pontos (jogo) | Fato real mostrado | Fonte |
|---|---|---|---|
| Dark Dune Sand | 2 | O Curiosity fez o primeiro estudo de perto de dunas ativas em outro planeta (Bagnold Dunes, cratera Gale, dez/2015 a abr/2017). Imagens de órbita mostram as dunas andando até **~1 metro por ano terrestre** | [NASA: 'High Dune' is First Martian Dune Studied up Close](https://www.nasa.gov/image-article/high-dune-first-martian-dune-studied-up-close/); [NASA/JPL, 16/11/2015](https://www.jpl.nasa.gov/news/nasas-curiosity-mars-rover-heads-toward-active-dunes/) |
| Layered Mudstone | 3 | Em 2013 o Curiosity perfurou o lamito "John Klein" em Yellowknife Bay: era lama do fundo de um lago antigo, com água de pH neutro e pouco sal, boa para micróbios, e com carbono, hidrogênio, oxigênio, enxofre, nitrogênio e fósforo | [NASA/JPL, 12/03/2013](https://www.jpl.nasa.gov/news/nasa-rover-finds-conditions-once-suited-for-ancient-life-on-mars/) |
| Yellow Sulfur Crystals | 4 | Em **30/05/2024** o Curiosity passou por cima de uma pedra no canal Gediz Vallis e a quebrou: dentro havia cristais amarelos de **enxofre puro (elementar)**, nunca visto antes em Marte | [NASA/JPL, 18/07/2024](https://www.jpl.nasa.gov/news/nasas-curiosity-rover-discovers-a-surprise-in-a-martian-rock/) |
| Iron Meteorite | 3 | O Curiosity achou vários meteoritos de ferro e níquel em Gale; o "Cacao" (28/01/2023, sol 3.725) tem **~30 cm** | [NASA Science: Curiosity Finds a Meteorite, Cacao](https://science.nasa.gov/resource/curiosity-finds-a-meteorite-cacao/) |
| Buried Ice Core | 2 | Em 2008 a sonda Phoenix cavou perto do polo norte e achou pedaços brancos que **sumiram em 4 dias**: era gelo de água sublimando. **Não é de Gale**: a ficha do jogo diz que o achado real é da Phoenix, e a cratera de gelo do mapa é do jogo | [NASA/JPL, 19/06/2008](https://www.jpl.nasa.gov/news/bright-chunks-at-phoenix-landers-mars-site-must-have-been-ice/) |
| Plain Regolith | 1 (só a primeira análise conta) | Sem fato próprio: o regolito comum vale pouco para a exploração do mapa ter motivo | regra do jogo |

## Pistas da missão (issue #344)

A missão do jogo usa a pergunta real do Curiosity em Gale: a cratera já foi um lago, e dava para viver ali? Três tipos de amostra da tabela acima são as **pistas** que respondem a ela (`src/mission/clues.ts`). O foguete só decola com as 3 enviadas para a Terra, além dos pontos de ciência.

| Pista no jogo | Amostra | O que responde | Base real |
|---|---|---|---|
| WATER NOW | Buried Ice Core | Marte ainda tem água, congelada | Phoenix, 2008 (linha "Buried Ice Core" acima). Não é de Gale: a ficha avisa |
| OLD LAKE | Layered Mudstone | Esta rocha era lama no fundo de um lago | Curiosity em Yellowknife Bay, 2013 (linha "Layered Mudstone" acima) |
| LIFE INGREDIENT | Yellow Sulfur Crystals | O enxofre é um dos ingredientes de que a vida precisa | O mesmo comunicado de 2013 lista o enxofre entre os elementos-chave para a vida achados no lamito; os cristais são o achado de 2024 (linha "Yellow Sulfur Crystals" acima) |

A resposta da tela de vitória ("Gale was a lake, good for life") resume a conclusão de 2013: um lago antigo com água boa para micróbios. O jogo não diz que houve vida.

**Regra de jogo:** qual amostra é pista, a ordem, a distância de cada local (`SAMPLE_SITE_CONFIG.CLUE_RINGS`: lamito a 40 a 48 blocos da base, enxofre a 64 a 76) e o ritmo de uma pista a cada 2 blocos de gelo (`SCIENCE_CONFIG.ICE_PER_CLUE_TRIP`).

## Regra única do tempo e referência real (issue #229)

**A regra:** o relógio do jogo anda `GAME_HOURS_PER_SECOND = 0,02` hora de jogo por segundo real: **1 hora de jogo = 50 s reais, 1 sol de 24 h = 20 min reais**. Tudo o que gasta ou produz "por hora" segue esse relógio. O que precisa de outra compressão para caber numa partida é uma **exceção com nome** (`TIME_SCALE_CONFIG` e as constantes citadas abaixo) e aparece para a criança na aba **REAL VS GAME** do diário [J] (`src/data/realVsGame.ts`). Testes em `src/config/timeScale.test.ts` e `src/config/balance.test.ts`.

### Referência real, por pessoa e por sol

| Recurso | Real | No jogo | Fonte |
|---|---|---|---|
| Oxigênio | **0,84 kg** por pessoa por dia | o resumo da vitória converte os pontos de O2 em kg com esse número (`MAV_CONFIG.OXYGEN_KG_PER_DAY`); o custo de energia do O2 é escala de jogo | [Ref] NASA BVAD |
| Água (beber e preparar comida) | **~3 kg** por pessoa por dia | **30 L por tripulante por sol** (`CREW_CONFIG.WATER_L_PER_HOUR = 30/24`): os ~3 L reais de beber e cozinhar mais higiene e lavagem em escala de jogo (15/11/2026) | [Ref] NASA BVAD |
| Comida | **~1,8 kg** por pessoa por dia | **1,8 kg por tripulante por sol**: 3 rações de 0,6 kg (`CREW_CONFIG.FOOD_PER_HOUR = 3/24`, `KG_PER_RATION = 0,6`). Igual ao real, no relógio do jogo | [Ref] NASA BVAD |
| Fome e sede do jogador | astronautas fazem ~3 refeições por dia | a barra cheia dura **12 horas de jogo** (10 min reais), para comida e para água (`TIME_SCALE_CONFIG.PLAYER_FOOD_HOURS` / `PLAYER_WATER_HOURS`). É a mesma ordem da tripulação, que cai de cama depois de 12 h sem comer ou beber. A fome era 0,11 ponto/s (a barra zerava em ~3 min = 3,6 h de jogo, mais rápido do que uma planta crescia) | escala de jogo declarada: uma pessoa de verdade aguenta mais tempo sem comer |
| Ar do traje | um passeio no espaço dura **5 a 8 horas** | **4 min reais = ~4,8 horas de jogo** (`SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND`). Perto do real no relógio do jogo; não mudou | [NASA: What Is a Spacewalk?](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-a-spacewalk-grades-k-4/) (link não conferido por fetch em 15/11/2026) |

### Exceções declaradas ao relógio

| Sistema | No jogo | Real | Constante com nome | Por quê |
|---|---|---|---|---|
| Plantas | 5 a 19 s | 28 a 105 dias | `TIME_SCALE_CONFIG.CROP_REAL_DAYS_PER_GAME_SECOND = 5,6` | Para a criança ver a colheita. A proporção entre as culturas é real (tabela abaixo) |
| Combustível do foguete | 10 blocos de gelo enchem o tanque; 0,15 h de fábrica por bloco | tirar 4 astronautas de Marte pede **~7 t de combustível e ~25 t de oxigênio** | `TIME_SCALE_CONFIG.REAL_ASCENT_PROPELLANT_TONNES = 32`, `MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK`, `MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK` | Milhares de vezes menor, para encher numa partida. Fonte: [NASA, 21/04/2021 (MOXIE)](https://www.nasa.gov/news-release/nasas-perseverance-mars-rover-extracts-first-oxygen-from-red-planet/) |
| Energia | bateria em %, de 0 a 100 | sem tamanho medido para uma base em Marte | `TIME_SCALE_CONFIG.REACTOR_KW = 10` (`src/mission/powerUnits.ts`) | Régua declarada: o reator do jogo (+16 %/h; era +8 até 15/11/2026) vale **uma unidade Kilopower de 10 kW**. Daí: 1 %/h = 0,625 kW, bateria cheia = **62,5 kWh**, campo solar no pico = **~13 kW**. O gerador nuclear do jogo (2 %/h) dá 1,25 kW nessa régua, ou **~11 MMRTGs** de verdade (110 W cada): a aba REAL VS GAME diz isso. As proporções entre os consumos continuam sendo escala de jogo, e a conta interna continua em % (a troca para kWh por dentro ficou fora desta issue) |
| Tempestade solar | 0,2 h de jogo (10 s reais) | radiação alta por mais de 2 dias (set/2017) | `STORM_CONFIG.DURATION_HOURS`, `REAL_HOURS_PER_GAME_HOUR`, `WARNING_REAL_HOURS_PER_GAME_HOUR` | Teste com jogadores de 15/11/2026: esperar parado cansava. A dose total é a real |
| Dose acumulada | 1 hora de jogo vale ~8 dias reais | ~0,64 mSv por dia na superfície | `DOSE_CONFIG.GAME_FACTOR` | Para a barra de dose andar numa partida de ~2,5 sols |
| Parede do abrigo | 600 L = 10 g/cm² | centenas de litros | `RADIATION_CONFIG.SHELTER_WALL_MAX_L`, `SHELTER_G_CM2_PER_L` | O tamanho exato é regra de jogo, escolhido para caber no tanque de 1000 L da base. A curva de redução de dose é a real (PREDICCS) |
| Rádio | 0,35 s por minuto-luz | 3 a 22 min só de ida | `COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE` | A distância é a real do dia; só a espera é menor |
| Conjunção solar | 6 h de jogo, uma vez por partida | ~2 semanas a cada 26 meses | `COMMS_CONFIG.GAME_CONJUNCTION_HOURS` | Encenada para a criança praticar decidir sem a Terra |
| Sono | o relógio corre 3 h de jogo por segundo | uma noite de sono | `SLEEP_CONFIG.CLOCK_HOURS_PER_SECOND` | Dormir é a forma de passar o tempo, com custo |
| Espera no abrigo (issue #228) | o relógio corre 10 vezes mais rápido | a tempestade inteira | `STORM_SKIP_CONFIG.CLOCK_HOURS_PER_SECOND` | Só com a parede de água cheia; a simulação continua rodando |
| Airlock | ~1,6 s | ~1 hora depois de um passeio no espaço | `MISSION_CONFIG.AIRLOCK_CYCLE`, `SUIT_CLEAN_TIME` | Esperar na porta não ensina nada; as duas portas e o custo de energia ficam |

### O que ainda é escala de jogo, sem fator real

Custos de energia de cada equipamento (`ENERGY_CONFIG`, `UTILITY_CONFIG`, `STATION_CONFIG`), água e comida por cultura (`CROP_CONFIG.*.water/energy/nutrition`), blindagem ativa (não existe: só estudo NIAC, ver `protecao-radiacao.md`) e bateria do rover. Não achamos número oficial para uma base em Marte; a aba REAL VS GAME e a tela "NASA Data" dizem que são regras do jogo.

## Calibração atual do jogo vs. realidade

A aba **REAL VS GAME** do diário [J] (`src/data/realVsGame.ts`, issues #106 e #229) mostra para a criança onde o jogo muda a realidade: gravidade, duração do sol, airlock, bateria e gerador nuclear (em kW), comida e água da tripulação, fome e sede, ar do traje, combustível do foguete, tempestade, parede do abrigo, plantas, rádio e conjunção. Os valores do jogo vêm de `constants.ts`; os reais, das tabelas deste arquivo.

| Parâmetro no código | Valor atual | Real | Comentário |
|---|---|---|---|
| `PHYSICS_CONFIG.MARS_GRAVITY` (`src/config/constants.ts`) | `12.0` | 3,71 m/s² | Ajustado para "sensação" de jogo; a aba REAL VS GAME explica. |
| Duração de 1 sol (`MISSION_CONFIG.GAME_HOURS_PER_SECOND = 0.02` h/s) | 20 min reais por dia de 24 h | 24 h 39 min | O relógio usa 24 h. |
| Fome, sede, água e comida da tripulação | no relógio do jogo (issue #229) | tabela "Referência real" acima | A razão entre elas segue o consumo real de um astronauta (BVAD). O O2 do jogador (`OXYGEN_DRAIN_RATE`) continua sendo escala de jogo. |

### Crescimento de plantas na estufa

Dias reais de cultivo (`CROP_CONFIG.*.realDays`): **alface 28 dias, soja 90, batata 105**. Fonte: testes do Biomass Production Chamber do Kennedy Space Center da NASA, com ciclos de 28 a 30 dias para alface, 90 a 97 para soja e 90 a 105 para batata ([Wheeler et al., NTRS 20040089951](https://ntrs.nasa.gov/citations/20040089951)). Na Estação Espacial, o experimento VEG-04 colheu plantas para salada depois de 28 dias ([NASA, 10/07/2019](https://www.nasa.gov/image-article/growing-veggies-space/)).

No jogo a estufa é uma **exceção declarada ao relógio** (`TIME_SCALE_CONFIG.CROP_REAL_DAYS_PER_GAME_SECOND = 5,6`): 5,6 dias reais passam em 1 segundo de jogo, então alface, soja e batata levam **5, 16 e 19 segundos**. A compressão é a mesma para as três, por isso a proporção entre elas é a real (a batata demora quase 4 vezes a alface). Eram 5, 7 e 9 s, sem relação com o real. Água, energia e comida por cultura continuam sendo escolhas de jogo: a alface é a mais rápida, a soja dá mais comida por colheita e a batata rende mais por litro e por % de bateria, mas é a mais lenta (teste em `src/config/timeScale.test.ts`).

## Energia noturna e RTG (issue #85)

| Uso no jogo | Número | Fonte |
|---|---|---|
| Gerador nuclear da base (`ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR`) | **2 % de bateria por hora de jogo**, de dia e de noite, só para o suporte de vida (O2 do jogador e da tripulação, filtro de CO2). O que sobra é perdido: fábrica, blindagem, luz da estufa e aquecedor continuam na bateria, para manter as escolhas de energia | Inspirado no **MMRTG** do Curiosity e do Perseverance: ~**110 W** elétricos no lançamento, gerados pelo calor do plutônio-238, sem depender do Sol ([NASA: MMRTG](https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/#mmrtg)). A potência no jogo é escala de jogo |
| Reator de fissão (`ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR`, `DOSE_CONFIG.REACTOR_MSV_PER_HOUR`) | **+16 % de bateria por hora de jogo** (era +8 até 15/11/2026), de dia e de noite, para a base toda, ligado e desligado no painel Power & Heat (funciona com a bateria vazia). Custo: **+2 mSv por hora de jogo** na barra de dose enquanto está ligado. A potência e a dose são **regra do jogo**: o reator do jogo fica perto da base; um de verdade fica longe ou atrás de um escudo pesado, e esse é o trade-off real (distância e massa do escudo x dose da tripulação) | Inspirado no **Kilopower / KRUSTY**: reator de fissão pequeno testado pela NASA e pelo DOE em Nevada (nov/2017 a mar/2018), de **1 a 10 kW** elétricos por pelo menos 10 anos, sem depender do Sol; 4 unidades dariam conta de um posto avançado ([NASA, 02/05/2018](https://www.nasa.gov/news-release/demonstration-proves-nuclear-fission-system-can-provide-space-exploration-power/)). Link ainda não conferido por fetch em 15/11/2026 |
| Tempestade solar (`STORM_CONFIG.DURATION_HOURS`) | **0,2 hora de jogo** (10 s reais; eram 3 h e depois 1 h até 15/11/2026, cansava no teste com jogadores). A dose total da tempestade não mudou, então `HARM_THRESHOLD` e `WARN` subiram na mesma proporção e a blindagem passou a 110 %/h (22 % por tempestade) e depois, no mesmo dia, a 55 %/h (11 % por tempestade). O aviso é a viagem real da CME encolhida: 250 h reais = 1 h de jogo, com mínimo de 20 s reais (tempo de voltar andando da cratera de gelo até o abrigo): 20 a 35 s | Escala de jogo. A tempestade de 09/2017 ficou alta por ~2 dias (NASA JPL) |
| Bateria vazia (`STANDBY_BELOW`, 1 %) | máquinas em espera; o astronauta não morre dentro da base por falta de energia | regra do jogo |
| Aviso de pôr do sol (`SUNSET_WARNING_HOUR`) | 16h30 no relógio do jogo (o Sol se põe às 18h) | regra do jogo |
