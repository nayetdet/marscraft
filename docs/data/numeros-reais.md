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
| Tempestades usadas | só CMEs reais com **impacto previsto em Marte**; se não houver nenhuma, a fila fica vazia ("No storms headed to Mars in this data") | [API, DONKI] `src/data/donkiCme.json`, gerado por `node scripts/fetch-donki-cme.mjs`. **Pendente:** o arquivo embutido tem 1 CME (a de 01/11/2026), montado da amostra salva; a janela de 01 a 13/11 tinha 2 para Marte, e a outra (09/11, 726 km/s) ficou de fora porque a amostra não guarda a chegada. Regravar com `NASA_API_KEY` e uma janela de 12 meses |
| Relevo do mundo (`src/data/marsTerrain.js`) | recorte de **224 × 224 pixels a 1,0118 m por pixel** de uma cratera de ~180 m em Aeolis Palus, cratera Gale (**4,4743°S, 137,4032°E**, ~7 km ao norte do pouso do Curiosity); **12,7 m** de relevo, de −4.448,1 m a −4.435,5 m; 1 bloco ≈ 1 m | [API, HiRISE DTM `DTEEC_010573_1755_010639_1755_U01`](https://www.uahirise.org/dtm/PSP_010573_1755), NASA/JPL-Caltech/University of Arizona; `src/data/marsTerrain.json`, gerado por `node scripts/fetch-mars-terrain.mjs`. Nivelados para as construções: base, alas norte e leste, estufa e plataforma do MAV. Com a cratera de gelo, que é do jogo, só **~5 % das colunas** diferem do dado real depois do arredondamento para blocos. |
| Limite de carreira exibido na vitória | **600 mSv** | [Ref] NASA-STD-3001 (2022) |
| O2 em kg no resumo da vitória | 1 sol respirando lá fora = **0,84 kg** | [Ref] NASA BVAD |
| Consumo da tripulação NPC (`CREW_CONFIG`) | água : comida = 0,5 L : 0,3 ração por hora de jogo (proporção BVAD ~3 kg : ~1,8 kg por pessoa/dia); O2 pago em energia | [Ref] NASA BVAD |
| Reciclador de água (`STATION_CONFIG.WATER_RECOVERY`) | **98 %** da água usada volta ao tanque | [Ref] NASA, sistema de recuperação de água da ISS (2023) |
| Água das plantas (`WATER_SYSTEM_CONFIG.CROP_WATER_RETURN`, issue #101) | a planta bebe do tanque só enquanto cresce e **90 %** volta como água cinza (escala de jogo); os 10 % restantes ficam na comida | Fato real: no Advanced Plant Habitat da ISS a água transpirada é condensada e guardada no reservatório de recuperação, e "a maior parte da água para sustentar o crescimento vem da umidade condensada" ([Monje et al., 2020, *Frontiers in Plant Science*](https://pmc.ncbi.nlm.nih.gov/articles/PMC7314936); [ficha do APH, NASA](https://www.nasa.gov/sites/default/files/atoms/files/advanced-plant-habitat.pdf)). O artigo não dá a porcentagem recuperada: os 90 % são regra do jogo, e o jogo não mostra esse número como dado real. Litros por cultura (`CROP_CONFIG.*.water`) e por ração da tripulação (`STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD`) também são de jogo: não achamos um número oficial de litros por planta para Marte |
| Parede de água do abrigo de tempestade (`RADIATION_CONFIG.SHELTER_WATER_CURVE`, issue #56) | redução média da dose das tempestades solares de 2012: **1 g/cm² → 42 %**, **5 g/cm² → 79 %**, **10 g/cm² → 83 %** (10 g/cm² de água é a referência de "abrigo de tempestade") | [Ref] Quinn et al., *Modeling shielding in the Earth-Moon-Mars radiation environment using PREDICCS* (pôster, UNH, com dados do MSL/RAD): [PDF](https://posters.unh.edu/private_media/4209/). Paredes de água no alojamento como abrigo: [Clowdsley, NASA LaRC, 2021](https://ntrs.nasa.gov/citations/20210009760) |
| Aquecedor do módulo norte (`UTILITY_CONFIG.HEATER_*`, issue #56 B2) | **1 %/h** de dia e **4 %/h** à noite (escala de jogo); desligado à noite, o reciclador de água e a estufa param | Temperatura real: média ~−62 °C, mínima **−97,7 °C** (InSight, tabela de clima acima). A potência é de jogo: não achamos um número oficial de aquecimento para uma base em Marte |
| Primeira impressão 3D no espaço (oficina, issue #56 B5) | **novembro de 2014**, na ISS (impressora da Made In Space, peça de plástico ABS) | [NASA: 3-D Printer Creates First Object in Space](https://www.nasa.gov/missions/station/open-for-business-3-d-printer-creates-first-object-in-space-on-international-space-station/) |
| Cozinha e despensa (issue #56 B3) | ~**1,8 kg** de comida por pessoa por dia; na ISS a comida vem embalada e é aquecida na cozinha | [Ref] NASA BVAD (linha da tripulação acima). A ração do jogo sai da mesma despensa da tripulação |
| Atraso do rádio Terra–Marte (`src/mission/earthMars.js`, issue #56 A2) | calculado para a data do jogo: em 14/11/2026, **~198 milhões de km = ~11 min só de ida**; oposição de 16/01/2025: 96 milhões de km (5,4 min); conjunção de 09/01/2026: ~360 milhões de km (20 min) | [Ref] NASA/JPL, [Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html) (tabela 1, válida de 1800 a 2050); velocidade da luz 299.792,458 km/s. No jogo, cada minuto real de luz vira 3 s de espera |
| Conjunção solar (`COMMS_CONFIG.CONJUNCTION_SUN_ANGLE_DEG`) | os comandos para Marte param quando o Sol fica a **menos de ~2°** de Marte no céu da Terra, por **~2 semanas**, a cada **~26 meses** | [Ref] NASA/JPL: [What's Mars Solar Conjunction, and Why Does It Matter?](https://www.nasa.gov/solar-system/whats-mars-solar-conjunction-and-why-does-it-matter/). A próxima real é só em 2028, então o jogo encena uma por partida (6 h de jogo) e a chama de "simulated" |
| Água na parede cheia | **40 L = 10 g/cm²** (escala de jogo: 0,25 g/cm² por litro) | Uma parede real de 10 cm em volta de uma cabine pede centenas de litros; o jogo encolhe para caber no tanque de 100 L da base |

| Pôster "How we make air" | MOXIE (rover Perseverance) produziu **122 g** de O2 em 16 rodadas, pico de **12 g/h** | [Ref] [NASA, 06/09/2023](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) |
| Painel da enfermaria (`src/ui/stationText.js`, issue #111) | "na Estação Espacial, sem exercício, os ossos ficam ~1 % menos densos por mês"; **quanto se perde em Marte (0,38 g) ninguém mediu** | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/): "for every month in space, astronauts' weight-bearing bones become roughly 1% less dense if they don't take precautions". O artigo é sobre microgravidade e não dá número para gravidade parcial: nenhum astronauta viveu meses em 0,38 g. A perda no jogo é taxa de jogo (`STATION_CONFIG.FITNESS_DECAY`) |
| Pôster "Why we exercise" | ossos perdem **~1 %** de densidade por mês no espaço sem exercício; tripulações da ISS treinam **~2 h por dia** | [Ref] [NASA, 01/12/2023](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/) |
| Pôsteres "Mars vs Earth" e "Going outside" | gravidade 38 %, sol de 24 h 39 min, luz 43 %, pressão 0,7 %, −62 °C (média) e −97,7 °C (mínima) | tabelas acima (Mars Fact Sheet e InSight) |

Os textos dos pôsteres ficam em `src/base/basePosters.js`; a tela "NASA Data" do menu (`index.html`) lista as mesmas fontes.

Escala de jogo (não é dado real): capacidade da bateria, custos de energia em %, duração da tempestade (3 h de jogo), dano por mSv e o limite de 0,5 mSv por hora de jogo a partir do qual a radiação machuca. O limite foi calibrado para que toda tempestade machuque lá fora, as fortes machuquem dentro do habitat sem abrigo, e o abrigo com a parede cheia ou a blindagem dentro do habitat protejam em qualquer tempestade (testes em `radiation.test.js`). A conversão µGy → mSv usa o mesmo fator de qualidade 3,05 da dose normal; para partículas de tempestade o fator real é outro, e o jogo não mostra essa conta como dado.

Simplificação a explicar: a "blindagem ligada" (tecla R) é um escudo ativo que gasta energia e só protege dentro da bolha em volta da base. Escudos magnéticos ativos ainda são pesquisa; nas bases reais, o abrigo de tempestade usa massa (água, regolito). Detalhes e fontes em [`protecao-radiacao.md`](protecao-radiacao.md).

## Calibração atual do jogo vs. realidade

| Parâmetro no código | Valor atual | Real | Comentário |
|---|---|---|---|
| `PHYSICS_CONFIG.MARS_GRAVITY` (`src/config/constants.js`) | `12.0` | 3,71 m/s² | Ajustado para "sensação" de jogo. Se mantiver, explique isso no jogo ou nos créditos; o critério *Validity* olha isso. |
| Duração de 1 sol (`MISSION_CONFIG.GAME_HOURS_PER_SECOND = 0.01` h/s) | ~40 min reais por dia de 24 h | 24 h 39 min | O relógio usa 24 h. Pode virar 24,65 h para ficar fiel. |
| Taxas de O2/água/comida (`SURVIVAL_CONFIG`) | arbitrárias | — | Ok ser escala de jogo, mas a **razão** entre elas pode seguir o consumo real de um astronauta (O2 ~0,84 kg/dia, água ~2,5–3,5 kg/dia, comida ~1,8 kg/dia; fonte: NASA ECLSS / BVAD). |

### Crescimento de plantas na estufa

No experimento VEG-04, plantas para salada foram colhidas depois de 28 dias na Estação Espacial Internacional ([NASA, 10/07/2019](https://www.nasa.gov/image-article/growing-veggies-space/)). No jogo, alface, batata e soja levam 5, 7 e 9 segundos, respectivamente: são tempos acelerados para jogar, não medições de cultivo em Marte. A referência de 28 dias se aplica às plantas para salada do experimento, não à batata ou à soja.
