# Números reais para calibrar o jogo

Este arquivo existe para **não inventar números**, o que o próprio desafio pede. Cada valor tem a fonte ao lado.
- **[API]** = medido pelas APIs listadas no desafio em 2026-11-14 (amostras em [`samples/`](samples/)).
- **[Ref]** = constante pública de referência (fact sheets da NASA). Não veio destas APIs, mas é dado oficial.

## Radiação: taxa de dose absorvida [API, RadLab]

Arquivo: [`samples/radlab-dose-rate-summary.json`](samples/radlab-dose-rate-summary.json). Unidade provável: **µGy/h** (ver a nota em `apis-nasa.md`).

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

**No jogo (issue #108):** `scripts/fetch-insight-weather.mjs` grava [`src/data/insightWeather.json`](../../src/data/insightWeather.json) (fonte, URL sem chave e data de coleta), lido só por `src/data/marsWeather.js`. Cada sol do jogo usa um sol real em sequência (sol 1 = sol 675, repetindo depois do 681). Rajadas reais por sol: **18,4 a 26,9 m/s**.

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

**Escala de jogo** (`DUST_WEATHER_CONFIG` em `src/config/constants.js`): geração solar cai em linha reta de 100 % (tau 0,5) até **20 %** no tau recorde (nunca zero de dia); o pico de cada tempestade é sorteado entre tau 7 e 10,8; aviso de 2 h de jogo, tempestade de 6 a 9 h, poeira baixando em 3 h; primeira tempestade 8 a 16 h depois do tutorial, depois uma a cada 24 a 36 h. Poeira nos painéis: +0,6 %/h normal e +5 %/h na tempestade; painel todo coberto ainda gera 30 %. Limpar a mão tira 25 % de poeira e custa **1 ponto de O2 do traje** (de 20) por vez. A borda do mapa não machuca mais: virou parede invisível no raio `DUST_STORM_FATAL_RADIUS` (100 blocos do centro da base).

## Constantes físicas e de missão [Ref]

| Grandeza | Marte | Lua | Fonte |
|---|---|---|---|
| Gravidade | **3,71 m/s²** (0,38 g) | **1,62 m/s²** (0,17 g) | [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) / [Moon](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) fact sheets |
| Duração do dia | **1 sol = 24 h 39 min** | **~29,5 dias terrestres** (≈ 14 dias de luz + 14 de escuridão) | fact sheets |
| Luz solar disponível (irradiância) | ~**43 %** da Terra (~590 W/m²) e cai muito em tempestades de poeira | ~igual à da Terra (~1.361 W/m²), mas some na noite lunar de 14 dias | fact sheets |
| Atraso de comunicação (só ida) | **~3 a ~22 min**, conforme a posição dos planetas | **~1,3 s** | distância ÷ velocidade da luz |

### Números da história (atos e animações)

Usados nos textos de `src/story/storyChapters.js` e nas legendas de `src/story/cutscene/`. Coletados em 2026-11-14.

A distância e o atraso de rádio que aparecem no jogo **não são constantes**: vêm do `CommsLink` (`src/mission/earthMars.js`, issue #56), que calcula a posição dos planetas para a data real da partida. As duas primeiras linhas abaixo são a conferência desse cálculo contra o JPL Horizons.

| Grandeza | Valor | Uso no jogo | Fonte |
|---|---|---|---|
| Distância Terra–Marte em 14/11/2026 | **1,32436 UA = 198,1 milhões de km** | Conferência: `earthMarsGeometry` dá 198,12 milhões de km para a mesma data. Aparece no card do rádio e na legenda do pouso | [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/): alvo `499` (Marte), observador `500@399` (geocentro), quantidade 20, 2026-11-14 00:00 UT |
| Atraso de rádio nesse dia | **661 s ≈ 11 min** só de ida, **22 min** ida e volta | Conferência: `earthMarsGeometry` dá 11,01 min. A espera pela resposta usa a escala do rádio da base (`COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE = 3`): 22 min de ida e volta ≈ 66 s reais | distância ÷ velocidade da luz (299.792,458 km/s) |
| Duração da viagem Terra–Marte | **~7 meses** (Mars 2020: 30/07/2020 a 18/02/2021, 203 dias) | Legenda da chegada | [NASA Mars 2020](https://science.nasa.gov/mission/mars-2020-perseverance/) |
| Pressão na superfície | Marte **6,36 mbar** × Terra **1.014 mbar** (~0,6 %) | Legenda "Mars air is 100 times thinner" (a NASA usa "about 100 times thinner") | [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) |
| Período sinódico de Marte | **779,94 dias ≈ 26 meses** | Fim alternativo: a janela de lançamento só reabre em ~26 meses | [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) |

A janela de lançamento do jogo (`STORY_CONFIG.WINDOW_HOURS = 8` horas de jogo) é **escala de jogo**, não um número real: o que é real é a existência da janela e o intervalo de ~26 meses.

Essas constantes geram trade-offs prontos:
- **Lua:** a noite de 14 dias obriga a guardar energia (baterias) ou cortar sistemas. É um dilema forte de energia contra suporte de vida.
- **Marte:** o painel solar rende menos e a poeira derruba ainda mais. O atraso de até 22 min impede o "controle da missão" de salvar o jogador em tempo real, então ele precisa decidir sozinho.

## Missão do MAV: energia, tempestades e radiação (issue #30)

Números usados em `src/config/constants.js` (`ENERGY_CONFIG`, `RADIATION_CONFIG`, `STORM_CONFIG`, `MAV_CONFIG`):

| Uso no jogo | Valor | Fonte |
|---|---|---|
| Rendimento dos painéis solares em Marte | **43 %** do que renderiam na Terra | [Ref] Mars Fact Sheet (irradiância ~590 W/m²) |
| Dose normal na superfície | **6,93 µGy/h** | [API, RadLab] Curiosity MSL-RAD, mediana |
| Conversão µGy → µSv (fator de qualidade) | **3,05** (0,21 mGy/dia → 0,64 mSv/dia) | [Ref] Hassler et al., *Science* 343 (2014), MSL-RAD |
| Dose normal resultante | **0,021 mSv/h** | conta acima |
| Dose total de uma tempestade, lá fora e sem proteção (`RADIATION_CONFIG.STORM_DOSE_MIN_UGY` / `_MAX_UGY`) | de **665 µGy** (o dobro da dose normal por 2 dias: 2 × 6,93 µGy/h × 48 h) até **8.100 µGy** (o recorde). Nenhuma tempestade do jogo passa do recorde (teste em `solarStorms.test.js`) | [Ref] os dois eventos reais da tabela "Tempestade solar na superfície de Marte" acima |
| Força de cada tempestade (`stormTotalDoseUGy`) | **regra do jogo**: cresce com a velocidade da CME, do mínimo em 300 km/s ao recorde em 1.200 km/s; golpe de raspão em Marte vale 75 % | A velocidade e o "golpe de raspão" vêm do DONKI; o mapeamento para dose não é medida da NASA, e a tela "NASA Data" diz isso |
| Tempo de aviso da tempestade | chegada prevista em Marte − saída do Sol, da própria CME (`marsArrivalTime − startTime`); 1 dia real de viagem = 1 hora de jogo | [API, DONKI] modelo WSA-ENLIL, `cmeAnalyses[].enlilList[].impactList[]` com `location: "Mars"`. Exemplo: CME de 01/11/2026 19:00Z, chegada em 07/11 06:00Z = 5 dias e 11 h = 5,46 h de jogo |
| Tempestades usadas | só CMEs reais com **impacto previsto em Marte**; se não houver nenhuma, a fila fica vazia ("No storms headed to Mars in this data") | [API, DONKI] `src/data/donkiCme.json`, gerado por `node scripts/fetch-donki-cme.mjs`. Coleta de 15/11/2026: **153 CMEs para Marte** de 1.651 entre 14/11/2025 e 13/11/2026; velocidades de 255 a 1.960 km/s (mediana 535), avisos de 1,6 a 7,2 horas de jogo (mediana 4,7), 92 de raspão |
| Pico de SEP (só com dado ao vivo, issue #100; `SPACE_WEATHER_CONFIG`) | a cada 3 tempestades, a 3ª é um pico de SEP: aviso de **0,25 h de jogo** (~25 s reais) e dose total de **665 µGy** (a menor tempestade real do Curiosity). As duas coisas são **regra do jogo** | [API, DONKI] `/DONKI/SEP`: data (`eventTime`) e nave que mediu (`instruments`) são reais. O DONKI não dá a força da SEP em Marte. As partículas viajam perto da velocidade da luz e chegam em minutos a horas, por isso o aviso é curto. Sem SEP na janela ao vivo (caso de 14/11/2026: 0 em 60 dias), o jogo não cria uma |
| Relevo do mundo (`src/data/marsTerrain.js`) | recorte de **224 × 224 pixels a 1,0118 m por pixel** de uma cratera de ~180 m em Aeolis Palus, cratera Gale (**4,4743°S, 137,4032°E**, ~7 km ao norte do pouso do Curiosity); **12,7 m** de relevo, de −4.448,1 m a −4.435,5 m; 1 bloco ≈ 1 m | [API, HiRISE DTM `DTEEC_010573_1755_010639_1755_U01`](https://www.uahirise.org/dtm/PSP_010573_1755), NASA/JPL-Caltech/University of Arizona; `src/data/marsTerrain.json`, gerado por `node scripts/fetch-mars-terrain.mjs`. Nivelados para as construções: base, alas norte e leste, estufa e plataforma do MAV. Com a cratera de gelo, que é do jogo, só **~5 % das colunas** diferem do dado real depois do arredondamento para blocos. |
| Limite de carreira exibido na vitória | **600 mSv** | [Ref] NASA-STD-3001 (2022) |
| O2 em kg no resumo da vitória | 1 sol respirando lá fora = **0,84 kg** | [Ref] NASA BVAD |
| Consumo da tripulação NPC (`CREW_CONFIG`) | água : comida = 0,3 L : 0,18 ração por hora de jogo (proporção BVAD ~3 kg : ~1,8 kg por pessoa/dia); O2 pago em energia, 0,75 %/h por tripulante. Eram 0,5 L, 0,3 ração e 1,5 %/h antes da issue #81 | [Ref] NASA BVAD para a proporção; os valores são escala de jogo |
| Reciclador de água (`STATION_CONFIG.WATER_RECOVERY`) | **98 %** da água usada volta ao tanque | [Ref] NASA, sistema de recuperação de água da ISS (2023) |
| Água das plantas (`WATER_SYSTEM_CONFIG.CROP_WATER_RETURN`, issue #101) | a planta bebe do tanque só enquanto cresce e **90 %** volta como água cinza (escala de jogo); os 10 % restantes ficam na comida | Fato real: no Advanced Plant Habitat da ISS a água transpirada é condensada e guardada no reservatório de recuperação, e "a maior parte da água para sustentar o crescimento vem da umidade condensada" ([Monje et al., 2020, *Frontiers in Plant Science*](https://pmc.ncbi.nlm.nih.gov/articles/PMC7314936); [ficha do APH, NASA](https://www.nasa.gov/sites/default/files/atoms/files/advanced-plant-habitat.pdf)). O artigo não dá a porcentagem recuperada: os 90 % são regra do jogo, e o jogo não mostra esse número como dado real. Litros por cultura (`CROP_CONFIG.*.water`) e por ração da tripulação (`STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD`) também são de jogo: não achamos um número oficial de litros por planta para Marte |
| Parede de água do abrigo de tempestade (`RADIATION_CONFIG.SHELTER_WATER_CURVE`, issue #56) | redução média da dose das tempestades solares de 2012: **1 g/cm² → 42 %**, **5 g/cm² → 79 %**, **10 g/cm² → 83 %** (10 g/cm² de água é a referência de "abrigo de tempestade") | [Ref] Quinn et al., *Modeling shielding in the Earth-Moon-Mars radiation environment using PREDICCS* (pôster, UNH, com dados do MSL/RAD): [PDF](https://posters.unh.edu/private_media/4209/). Paredes de água no alojamento como abrigo: [Clowdsley, NASA LaRC, 2021](https://ntrs.nasa.gov/citations/20210009760) |
| Bateria do rover (`ROVER_CONFIG`, issue #111) | dirigir gasta **0,5 %/s**, cada perfuração **4 %**; abaixo de **15 %** o rover anda a 35 % da velocidade e não perfura; parado no depósito recarrega **8 %/s**, e a carga cheia custa **10 %** da bateria da base. Uma viagem de gelo completa gasta ~26 % (3 viagens por carga) | Tudo escala de jogo. Os números reais do Curiosity ficam na ficha do scanner (`src/data/scanCatalog.js`) |
| Repouso do tripulante (`CREW_CONFIG.BEDRIDDEN_AFTER_HOURS`, `BED_REST_HOURS`, issue #111) | **12 h** de jogo sem ar, água ou comida deixam o tripulante de cama na enfermaria; **6 h** com tudo em dia para voltar (metade com a médica de plantão) | Escala de jogo. Ninguém volta para a Terra fora do foguete: a janela de lançamento só abre a cada ~26 meses (período sinódico) |
| Aquecedor do módulo norte (`UTILITY_CONFIG.HEATER_*`, issue #56 B2) | de **0,5 %/h** (ar mais quente do InSight) a **2 %/h** (ar mais frio), proporcional à temperatura real lá fora (issue #108; escala de jogo; eram 1 e 4 antes da issue #81); desligado à noite, o reciclador de água e a estufa param | Temperatura real: média ~−62 °C, mínima **−97,7 °C** (InSight, tabela de clima acima). A potência é de jogo: não achamos um número oficial de aquecimento para uma base em Marte |
| Primeira impressão 3D no espaço (oficina, issue #56 B5) | **novembro de 2014**, na ISS (impressora da Made In Space, peça de plástico ABS) | [NASA: 3-D Printer Creates First Object in Space](https://www.nasa.gov/missions/station/open-for-business-3-d-printer-creates-first-object-in-space-on-international-space-station/) |
| Cozinha e despensa (issue #56 B3) | ~**1,8 kg** de comida por pessoa por dia; na ISS a comida vem embalada e é aquecida na cozinha | [Ref] NASA BVAD (linha da tripulação acima). A ração do jogo sai da mesma despensa da tripulação |
| Atraso do rádio Terra–Marte (`src/mission/earthMars.js`, issue #56 A2) | calculado para a data do jogo: em 14/11/2026, **~198 milhões de km = ~11 min só de ida**; oposição de 16/01/2025: 96 milhões de km (5,4 min); conjunção de 09/01/2026: ~360 milhões de km (20 min) | [Ref] NASA/JPL, [Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html) (tabela 1, válida de 1800 a 2050); velocidade da luz 299.792,458 km/s. No jogo, cada minuto real de luz vira 3 s de espera |
| Conjunção solar (`COMMS_CONFIG.CONJUNCTION_SUN_ANGLE_DEG`) | os comandos para Marte param quando o Sol fica a **menos de ~2°** de Marte no céu da Terra, por **~2 semanas**, a cada **~26 meses** | [Ref] NASA/JPL: [What's Mars Solar Conjunction, and Why Does It Matter?](https://www.nasa.gov/solar-system/whats-mars-solar-conjunction-and-why-does-it-matter/). A próxima real é só em 2028, então o jogo encena uma por partida (6 h de jogo) e a chama de "simulated" |
| Água na parede cheia | **40 L = 10 g/cm²** (escala de jogo: 0,25 g/cm² por litro) | Uma parede real de 10 cm em volta de uma cabine pede centenas de litros; o jogo encolhe para caber no tanque de 100 L da base |

| Pôster "How we make air" | as duas máquinas do gerador de O2 (seção abaixo); MOXIE (rover Perseverance) produziu **122 g** de O2 em 16 rodadas, pico de **12 g/h** | [Ref] [NASA, 06/09/2023](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) |
| Painel da enfermaria (`src/ui/stationText.js`, issue #111) | "na Estação Espacial, sem exercício, os ossos ficam ~1 % menos densos por mês"; **quanto se perde em Marte (0,38 g) ninguém mediu** | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/): "for every month in space, astronauts' weight-bearing bones become roughly 1% less dense if they don't take precautions". O artigo é sobre microgravidade e não dá número para gravidade parcial: nenhum astronauta viveu meses em 0,38 g. A perda no jogo é taxa de jogo (`STATION_CONFIG.FITNESS_DECAY`) |
| Pôster "Why we exercise" | ossos perdem **~1 %** de densidade por mês no espaço sem exercício; tripulações da ISS treinam **~2 h por dia** | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/) |
| Pôsteres "Mars vs Earth" e "Going outside" | gravidade 38 %, sol de 24 h 39 min, luz 43 %, pressão 0,7 %, −62 °C (média) e −97,7 °C (mínima) | tabelas acima (Mars Fact Sheet e InSight) |

A tela "NASA Data" do menu (`index.html`) lista as fontes.

### Ritmo do consumo (issue #81, escala de jogo)

No playtest tudo zerava junto. A conta mostrava por quê: com a tripulação padrão (2) e tudo ligado, a base gastava parada **10,5 %/h de dia e 13,5 %/h à noite**, ou seja, **288 % de bateria por sol**, e os painéis geram **~164 % por sol** (pico de 21,5 %/h, zero à noite). A noite de 12 h pedia 162 % de uma bateria de 100 %.

| Consumo passivo (por hora de jogo = 50 s reais) | Antes | Agora | Onde |
|---|---|---|---|
| O2 da tripulação, por tripulante | 1,5 % | **0,75 %** | `CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR` |
| Trabalho em cada estação operada | 2 % | **1 %** | `STATION_CONFIG.WORK_ENERGY_PER_HOUR` |
| Luz da estufa | 2,5 % | **1,25 %** | `UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR` |
| Aquecedor, dia / noite | 1 % / 4 % | **0,5 % / 2 %** | `UTILITY_CONFIG.HEATER_*` |
| **Base padrão, dia / noite** | 10,5 % / 13,5 % | **5,25 % / 6,75 %** | soma das linhas |
| Água que a tripulação bebe, por tripulante | 0,5 L | **0,3 L** | `CREW_CONFIG.WATER_L_PER_HOUR` |
| Comida da tripulação, por tripulante | 0,3 ração | **0,18 ração** | `CREW_CONFIG.FOOD_PER_HOUR` |
| Água da estufa da tripulação, por ração | 1 L | **0,5 L** | `STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD` |

O que isso dá (testes em `src/config/balance.test.js`):

- **Noite:** uma bateria cheia ao pôr do sol chega ao amanhecer com ~19 % (gasta 81 %). A margem é pequena de propósito: ligar a blindagem (12,5 %/h) ou a fábrica (25 %/h) à noite ainda derruba a base.
- **Sol inteiro:** a base gasta 144 % e o Sol dá ~164 %. Sobram ~20 % por sol: paga um bloco de gelo virando combustível (15 %), não paga a blindagem de uma tempestade (37,5 %) nem o tanque do foguete (150 %). Para pagar essas escolhas é preciso desligar algo (luz da estufa: 30 % por sol; tripulação descansando: 48 % por sol), e cada um desses para de fazer o seu trabalho.
- **Água:** sem ninguém no reciclador e sem gelo, o tanque inicial de 25 L dura mais de meio sol (12 h de jogo = 20 min reais, o ato 1 e a primeira viagem do rover) e menos de um sol. A base padrão gasta ~1,5 L/h (era 2,8 L/h depois da issue #101 e 5 L/h antes dela) e ~94 % disso fica esperando como água cinza; o reciclador (3 L/h) dá conta.
- **Traje:** o tanque de O2 já durava 6 min fora da base (`SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE`), acima dos 3 a 4 min pedidos, e não mudou. Ir a pé até a cratera de gelo (43 blocos da porta do airlock), minerar 10 blocos e voltar, andando o dobro do caminho reto, gasta ~30 % do tanque.
- **Primeiro sol mais brando** (`PACING_CONFIG`, `src/mission/pacing.js`): os consumos passivos da tabela (menos a água da estufa) valem **60 %** durante o sol 1 e sobem em linha reta até 100 % ao longo do sol 2. A produção não muda, e as escolhas do jogador (blindagem, fábrica, rádio, plantio) custam o mesmo desde o início. O painel da sala de energia mostra o gasto real do momento e avisa do "easy start".

Nada disso é dado da NASA: a única referência real é a proporção água : comida do BVAD, que foi mantida.

Escala de jogo (não é dado real): capacidade da bateria, custos de energia em %, duração da tempestade (3 h de jogo), dano por mSv e o limite de 0,5 mSv por hora de jogo a partir do qual a radiação machuca. O limite foi calibrado para que toda tempestade machuque lá fora, as fortes machuquem dentro do habitat sem abrigo, e o abrigo com a parede cheia ou a blindagem dentro do habitat protejam em qualquer tempestade (testes em `radiation.test.js`). A conversão µGy → mSv usa o mesmo fator de qualidade 3,05 da dose normal; para partículas de tempestade o fator real é outro, e o jogo não mostra essa conta como dado.

Simplificação a explicar: a "blindagem ligada" (tecla R) é um escudo ativo que gasta energia e só protege dentro da bolha em volta da base. Escudos magnéticos ativos ainda são pesquisa; nas bases reais, o abrigo de tempestade usa massa (água, regolito). Detalhes e fontes em [`protecao-radiacao.md`](protecao-radiacao.md).

## Gerador de O2: eletrólise ou MOXIE (issue #102)

O ar do habitat (o do jogador e o da tripulação) sai de um gerador com **dois modos**, escolhidos no painel "LIFE SUPPORT / ECLSS". Um gasta água, o outro gasta mais energia: nenhum é melhor em tudo. Código em `src/mission/oxygenPlant.js` (conta) e `src/mission/oxygenText.js` (textos), números em `OXYGEN_PLANT_CONFIG`.

| Máquina | Como faz O2 | O que vale no jogo | Fonte |
|---|---|---|---|
| **OGA** (Oxygen Generation Assembly, Estação Espacial): modo **"Air from water"** | eletrólise: 2 H2O → 2 H2 + O2. **36 g de água dão 32 g de O2** (razão 1,125) | Com os **0,84 kg de O2 por pessoa por dia** do BVAD: **0,945 L de água por pessoa por sol** (`ELECTROLYSIS_WATER_L_PER_PERSON_SOL`; 1 kg de água = 1 L). O ar do jogador segue a mesma razão: a água tirada do tanque é 1,125 × os kg de O2 do `oxygenPointsToKg` (1 sol respirando lá fora = 0,84 kg). Com o tanque vazio o O2 para de recarregar e o HUD diz "WATER TANK EMPTY" | [Ref] [NASA, status do OGA da ISS (2015)](https://ntrs.nasa.gov/api/citations/20150016494/downloads/20150016494.pdf); [NASA, ICES 2024](https://ntrs.nasa.gov/api/citations/20240002161/downloads/ICES24%20Paper%20168.pdf) (reação de eletrólise); NASA BVAD |
| **Sabatier** (Estação Espacial): melhoria opcional | junta o H2 da eletrólise com o CO2 que a tripulação expira: CO2 + 4 H2 → CH4 + 2 H2O. O hidrogênio que sai no metano limita a recuperação de O2 a **~50 %** | Montado uma vez na impressora 3D pelo painel (3 regolitos, 8 % de bateria, escala de jogo), devolve **metade** da água da eletrólise (`SABATIER_WATER_RETURN = 0.5`) | [Ref] [NASA, ICES 2024](https://ntrs.nasa.gov/api/citations/20240002161/downloads/ICES24%20Paper%20168.pdf) |
| **MOXIE** (rover Perseverance): modo **"Air from Mars air"** | tira o oxigênio do CO2 do ar de Marte | Não gasta água. **122 g** no total em 16 rodadas, pico de **12 g/h**: no pico, uma pessoa (840 g/dia) pediria 70 horas de MOXIE por dia | [Ref] [NASA, 06/09/2023](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) |

**Escala de jogo (não é dado da NASA):** o custo de energia de cada modo. Não existe potência oficial de um gerador de O2 para uma base em Marte. A eletrólise usa os custos que já existiam (`ENERGY_CONFIG.OXYGEN_COST_PER_POINT = 1,5 %` por ponto de O2 do jogador, `CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR = 0,75 %/h` por tripulante) e o MOXIE gasta **o dobro** (`MOXIE_ENERGY_FACTOR = 2`). O painel diz que esses custos são regra do jogo e que a conta da água é química real.

Nenhum modo domina (testes em `src/mission/MissionSystem.test.js` e `src/crew/CrewManager.test.js`):

- **Noite sem Sol, bateria em 30 %:** 15 pontos de O2 custam 22,5 % na eletrólise e 45 % no MOXIE. Só a eletrólise chega ao amanhecer. Com a tripulação (2 pessoas, 12 h, bateria em 40 %) é igual: no MOXIE eles ficam sem ar.
- **Tanque quase vazio (0,05 L):** a eletrólise só faz ~7 pontos de O2 e para; o MOXIE faz os 20 sem tocar no tanque.

O tripulante no gerador de O2 avisa quando o modo está gastando o recurso que está acabando: tanque abaixo de **10 L** com eletrólise, bateria abaixo de **25 %** com MOXIE (`LOW_WATER_WARN_L`, `LOW_BATTERY_WARN_PCT`, escala de jogo). A sala de energia mostra o modo na lista "WHERE THE POWER GOES" (linha "Crew air: water" ou "Crew air: Mars air") e a tela "POWER MAP" da base mostra "O2 MAKER: FROM WATER / FROM MARS AIR / NO WATER / NO POWER".

Com a razão real a água do ar é pouca perto da que se bebe: ~0,14 L por recarga completa do traje do jogador e ~1,9 L por sol para 2 tripulantes. O peso da escolha aparece quando o tanque está baixo (a água também vai para beber, para as plantas e para a parede do abrigo) ou à noite, quando cada ponto de bateria conta.

## Calibração atual do jogo vs. realidade

| Parâmetro no código | Valor atual | Real | Comentário |
|---|---|---|---|
| `PHYSICS_CONFIG.MARS_GRAVITY` (`src/config/constants.js`) | `12.0` | 3,71 m/s² | Ajustado para "sensação" de jogo. Se mantiver, explique isso no jogo ou nos créditos; o critério *Validity* olha isso. |
| Duração de 1 sol (`MISSION_CONFIG.GAME_HOURS_PER_SECOND = 0.02` h/s) | ~20 min reais por dia de 24 h | 24 h 39 min | O relógio usa 24 h. Pode virar 24,65 h para ficar fiel. |
| Taxas de O2/água/comida (`SURVIVAL_CONFIG`) | arbitrárias | — | Ok ser escala de jogo, mas a **razão** entre elas pode seguir o consumo real de um astronauta (O2 ~0,84 kg/dia, água ~2,5–3,5 kg/dia, comida ~1,8 kg/dia; fonte: NASA ECLSS / BVAD). |

### Crescimento de plantas na estufa

No experimento VEG-04, plantas para salada foram colhidas depois de 28 dias na Estação Espacial Internacional ([NASA, 10/07/2019](https://www.nasa.gov/image-article/growing-veggies-space/)). No jogo, alface, batata e soja levam 5, 7 e 9 segundos, respectivamente: são tempos acelerados para jogar, não medições de cultivo em Marte. A referência de 28 dias se aplica às plantas para salada do experimento, não à batata ou à soja.

## Energia noturna e RTG (issue #85)

| Uso no jogo | Número | Fonte |
|---|---|---|
| Gerador nuclear da base (`ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR`) | **2 % de bateria por hora de jogo**, de dia e de noite, só para o suporte de vida (O2 do jogador e da tripulação, filtro de CO2). O que sobra é perdido: fábrica, blindagem, luz da estufa e aquecedor continuam na bateria, para manter as escolhas de energia | Inspirado no **MMRTG** do Curiosity e do Perseverance: ~**110 W** elétricos no lançamento, gerados pelo calor do plutônio-238, sem depender do Sol ([NASA: MMRTG](https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/#mmrtg)). A potência no jogo é escala de jogo |
| Bateria vazia (`STANDBY_BELOW`, 1 %) | máquinas em espera; o astronauta não morre dentro da base por falta de energia | regra do jogo |
| Aviso de pôr do sol (`SUNSET_WARNING_HOUR`) | 16h30 no relógio do jogo (o Sol se põe às 18h) | regra do jogo |
