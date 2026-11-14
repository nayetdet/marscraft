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
- Um pico de tempestade ou de cinturão chega a ser **centenas a mil vezes** a dose normal. É por isso que existe o "abrigo de tempestade" nas bases.

Sugestão de mecânica: uma barra de "dose acumulada" que sobe com `taxa_base × multiplicador`. A taxa base vem da tabela, conforme o local escolhido. O multiplicador sobe durante um evento do DONKI (SEP/CME) e cai quando o jogador está dentro do habitat blindado.

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

Essas constantes geram trade-offs prontos:
- **Lua:** a noite de 14 dias obriga a guardar energia (baterias) ou cortar sistemas. É um dilema forte de energia contra suporte de vida.
- **Marte:** o painel solar rende menos e a poeira derruba ainda mais. O atraso de até 22 min impede o "controle da missão" de salvar o jogador em tempo real, então ele precisa decidir sozinho.

## Calibração atual do jogo vs. realidade

| Parâmetro no código | Valor atual | Real | Comentário |
|---|---|---|---|
| `PHYSICS_CONFIG.MARS_GRAVITY` (`src/config/constants.js`) | `12.0` | 3,71 m/s² | Ajustado para "sensação" de jogo. Se mantiver, explique isso no jogo ou nos créditos; o critério *Validity* olha isso. |
| Duração de 1 sol (`MarsSkySystem.autoAdvanceSpeed = 0.02` h/s) | ~20 min reais por dia de 24 h | 24 h 39 min | O relógio usa 24 h. Pode virar 24,65 h para ficar fiel. |
| Taxas de O2/água/comida (`SURVIVAL_CONFIG`) | arbitrárias | — | Ok ser escala de jogo, mas a **razão** entre elas pode seguir o consumo real de um astronauta (O2 ~0,84 kg/dia, água ~2,5–3,5 kg/dia, comida ~1,8 kg/dia; fonte: NASA ECLSS / BVAD). |
