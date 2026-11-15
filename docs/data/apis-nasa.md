# APIs e datasets da NASA: guia prático

> Tudo aqui foi **testado em 2026-11-14** a partir de uma máquina local (curl). Amostras reais e reduzidas ficam em [`samples/`](samples/).
> Os números prontos para usar na mecânica do jogo estão em [`numeros-reais.md`](numeros-reais.md).

## Resumo: acesso às APIs no jogo

O jogo usa Next.js e é publicado na Vercel. Dados que precisam de chave passam pelas rotas de servidor; a chave fica na variável `NASA_API_KEY` da Vercel e nunca é enviada ao navegador. APIs sem chave e assets públicos ainda podem ser carregados diretamente quando tiverem CORS.

| API | Chave | CORS (navegador) | Situação | Estratégia recomendada |
|---|---|---|---|---|
| `api.nasa.gov/DONKI/*` | sim (`api_key`) | ✅ `*` | CME, SEP e notifications OK. **FLR retorna 404.** Janela máxima de 60 dias. | Rota de servidor `/api/space-weather`, com fallback para JSON embutido (`src/data/spaceWeather.ts`) |
| `api.nasa.gov/insight_weather` | sim | ✅ `*` | OK (feed arquivado, sols 675–681 de out/2020) | Embutir (é estático, não muda) |
| `api.nasa.gov/planetary/apod` | sim | ✅ `*` | deu 500 e depois 429 | Opcional (imagem do dia na tela inicial) |
| `api.nasa.gov/mars-photos` | sim | — | ❌ **fora do ar** ("No such app", 404) | Não usar. Use a NASA Image Library. |
| RadLab `visualization.osdr.nasa.gov/radlab/api/` | não | ❌ sem cabeçalho | OK | **Baixar na build e embutir** |
| OSDR search `osdr.nasa.gov/osdr/data/search` | não | ❌ só `osdr.nasa.gov` | OK | **Baixar na build e embutir** |
| Mars/Moon Trek tiles (WMTS) | não | ✅ `*` | OK | Pode carregar direto como textura |
| Mars Trek search (`TrekServices`) | não | ❌ | OK | Embutir |
| Mars Trek, tiles de **elevação** | não | ✅ `*` | PNG de 8 bits (degraus de ~20 m); só Gale tem tiles | Não serve para terreno a 1 m. Use o HiRISE DTM. |
| HiRISE DTM `uahirise.org/PDS/DTM` | não | não testado | OK, aceita `Range` | **Baixar o recorte por script e embutir** (`scripts/fetch-mars-terrain.mjs`) |
| NASA Image Library `images-api.nasa.gov` | não | ✅ `*` | OK | Fetch direto (fotos reais de Marte/Artemis) |

**Limite da `DEMO_KEY`:** o cabeçalho devolveu `X-Ratelimit-Limit: 10` por hora por IP, e estourou em poucos minutos de teste. **Peça uma chave grátis em <https://api.nasa.gov/>** (1.000 req/h) e cadastre-a como `NASA_API_KEY` na Vercel. Mesmo assim, nunca dependa só do fetch ao vivo, e mantenha sempre um fallback embutido.

**Regra do desafio:** dado embutido é aceito, mas **não pode aparecer como "ao vivo"**. Mostre "dados de DD/MM/AAAA" para dado embutido e "ao vivo" só quando o fetch funcionou.

**Rede local:** a máquina de desenvolvimento rejeita o certificado TLS de `spaceappschallenge.org` (`SEC_E_UNTRUSTED_ROOT`). Para scraping, usamos `curl -k`, só leitura. As APIs da NASA funcionaram normalmente.

---

## 1. DONKI: clima espacial (radiação, tempestades solares)

- Portal: <https://ccmc.gsfc.nasa.gov/tools/DONKI/>
- Base usada: `https://api.nasa.gov/DONKI/{TIPO}?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY`. O host direto `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/{TIPO}` não exige chave, mas **deu timeout** nesta rede.
- Datas são opcionais. Sem elas, a API usa os últimos 30 dias.

| Tipo | O que é | Uso no jogo |
|---|---|---|
| `CME` | Ejeção de massa coronal (nuvem de plasma do Sol) | "Tempestade solar a caminho, chega em X horas" |
| `FLR` | Erupção solar (flare) | ⚠️ retornando 404 em 2026-11-14 |
| `SEP` | Partículas solares energéticas (**o perigo de radiação de verdade para astronautas**) | Evento crítico: abrigo ou blindagem |
| `GST` | Tempestade geomagnética (índice Kp) | Interferência na comunicação |
| `RBE` | Aumento no cinturão de radiação | Evento de radiação |
| `IPS`, `HSS`, `MPC`, `WSAEnlilSimulations` | Choque interplanetário, vento solar rápido, cruzamento da magnetopausa, simulações | Opcional |
| `notifications?type=all` | Boletins em texto, prontos para mensagem | "Mensagem do Controle da Missão" |

**CME: campos úteis** (amostra em [`samples/donki-cme-2026-11-sample.json`](samples/donki-cme-2026-11-sample.json); 34 CMEs entre 01/11 e 13/11/2026):

```jsonc
{
  "activityID": "2026-11-01T00:00:00-CME-001",
  "startTime": "2026-11-01T00:00Z",
  "sourceLocation": "S15E65",
  "note": "Diffuse CME first seen to the SE by SOHO LASCO C2...",
  "cmeAnalyses": [{
    "isMostAccurate": true,
    "speed": 894.0,           // km/s; na janela foram de 245 a 974
    "halfAngle": 14.0,
    "type": "C",              // S < C < O < R < ER (do mais lento ao mais rápido)
    "enlilList": [{
      "estimatedShockArrivalTime": null,   // quando preenchido: chegada prevista na Terra
      "isEarthGB": false,
      "impactList": [{ "location": "Europa Clipper", "arrivalTime": "2026-11-03T12:00Z", "isGlancingBlow": true }]
    }]
  }]
}
```

**`impactList` é o que o jogo usa (issue #99).** Cada rodada do modelo WSA-ENLIL lista os lugares que a CME deve atingir (`location`: `Mars`, `STEREO A`, sondas…), com a chegada prevista (`arrivalTime`) e se é golpe de raspão (`isGlancingBlow`). A maioria das CMEs **não** tem `Mars` na lista: na janela de 01 a 13/11/2026 foram 2 de 33. O script `scripts/fetch-donki-cme.ts` grava só essas, com `marsArrivalTime` e `isGlancingBlow`, e o tempo de aviso no jogo é `marsArrivalTime − startTime` (1 dia real = 1 hora de jogo). Exemplo real da amostra: CME de 01/11 19:00Z (357 km/s), chegada prevista em Marte em 07/11 06:00Z, de raspão.

```bash
# Uma vez: copie o modelo e cole a chave gratuita de https://api.nasa.gov/ no .env (o git ignora)
cp .env.example .env

# 12 meses por padrão, em blocos de 30 dias. Sem chave cai na DEMO_KEY, que estoura em ~8 blocos
# e bloqueia o IP por ~1 dia
npm run fetch:donki                    # ou: npm run fetch:donki -- 2025-11-14 2026-11-13
```

**Nunca commite a chave.** A `NASA_API_KEY` do `.env` é lida pelos scripts de coleta locais; em produção, cadastre o mesmo nome apenas nas variáveis de ambiente da Vercel. Ela não vai para o bundle.

`speed` e `isGlancingBlow` viram a força da tempestade por uma regra do jogo (ver `numeros-reais.md`).

### Fetch ao vivo no jogo (issue #100)

Único ponto de rede do jogo: `src/data/spaceWeather.ts`. O jogo não consulta o DONKI durante o tutorial: a primeira busca e o polling começam quando a história emite `start-storms`, ao concluir ou pular o tutorial. Nunca dentro do loop.

- **Pedidos** (em paralelo, ~5 s de tempo limite cada, via `AbortController`):
  - `CME` dos últimos 30 dias → normalizado pelo mesmo `summarizeCmes` do script (`src/data/donkiNormalize.ts`), então o formato é igual ao de `donkiCme.json` (`headedToMars`, `marsArrivalTime`, `isGlancingBlow`).
  - `SEP` dos últimos 60 dias (limite da API) → `{ id, eventTime, seenBy, link }`.
  - `notifications?type=all` dos últimos 7 dias → só o boletim mais novo: `{ type, issueTime, url }`. O `messageBody` não é usado.
- **Chave:** a rota Next `/api/space-weather` lê `process.env.NASA_API_KEY` no servidor. O navegador chama somente essa rota, sem receber a chave. Sem a variável, a rota usa `DEMO_KEY` como fallback (10 pedidos por hora por IP).
- **Cache:** a primeira busca do jogo força uma nova consulta à rota. A CDN compartilha a resposta por 10 min (`SPACE_WEATHER_CONFIG.LIVE_POLL_MINUTES`) para reduzir pedidos à NASA; o polling consulta a cada 10 min. A partida não reaproveita o cache local de 45 min.
- **Fallback para `donkiCme.json`** em falhas do pedido de CME: sem rede, HTTP diferente de 200 (inclusive 429 e o 400 de janela grande, que vem em texto puro), corpo vazio, JSON inválido, resposta que não é lista ou tempo esgotado. Uma resposta válida sem CME prevista para Marte significa Sol calmo e não adiciona tempestade ao vivo. A primeira tempestade programada continua usando o snapshot do repositório. Falha só no SEP ou no boletim não derruba o modo ao vivo: o jogo segue sem SEP e sem boletim. Com 0 SEP, o jogo não inventa uma.
- **Quando vale:** até terminar o tutorial, os rótulos usam **"real data from DD/MM/AAAA"** e a tempestade programada usa o snapshot. Depois da primeira consulta bem-sucedida, a fonte geral mostra **"LIVE from NASA DONKI, fetched HH:MM"** (hora local); cada tempestade mantém a fonte que a gerou. Sem fetch bem-sucedido, os rótulos continuam com a data dos dados embutidos.
- **Onde o rótulo aparece:** aviso de tempestade (toast), card de alerta do HUD, tela do comando (`baseDisplayText.js`), pôster `SOLAR STORMS`, tela "NASA Data", computador da missão e tela de vitória.
- **SEP no jogo:** com SEP ao vivo, a cada 3 tempestades a 3ª é um pico de SEP (`SPACE_WEATHER_CONFIG`): aviso curto (0,25 h de jogo, ~25 s), porque as partículas chegam quase na velocidade da luz, e dose igual à menor tempestade medida pelo Curiosity (o DONKI não dá a força da SEP em Marte). As duas coisas são **regra do jogo**; a data e a nave que mediu são reais.
- **Boletim:** vira uma linha no rádio da estação de ciência ("NASA space weather bulletin, 13/11: CME (a giant cloud of particles from the Sun)") com link para o texto completo.
- **Testado em 14/11/2026:** `CME` de 30 dias trouxe 90 CMEs, 10 com impacto previsto em Marte (~165 KB); `SEP` de 60 dias veio **vazio** (200 com corpo vazio) e janelas acima de 60 dias dão 400; `notifications` de 7 dias trouxe 9 boletins (CME, RBE, Report). O host `kauai.ccmc.gsfc.nasa.gov` deu timeout de novo.

**notifications:** campos `messageType` (`RBE`, `CME`, `Report`, `SEP`…), `messageIssueTime`, `messageURL` e `messageBody` (texto markdown em inglês, longo). Amostra em [`samples/donki-notifications-2026-11-07_13.json`](samples/donki-notifications-2026-11-07_13.json).

## 2. RadLab (OSDR): dosimetria de radiação real

- Portal: <https://visualization.osdr.nasa.gov/radlab/>. A página da GUI de docs retorna 500, mas a API funciona.
- Tutorial: <https://osdr-tutorials.readthedocs.io/en/latest/pages/guides/radlab_portal.html>
- **Endpoint:** `GET https://visualization.osdr.nasa.gov/radlab/api/?<filtros>&<colunas>&format=json|tsv|csv|html`
- **Sintaxe descoberta na prática:**
  - Filtro de igualdade: `spacecraft=Curiosity`, `instrument=DOSTEL1`
  - Filtro de intervalo: `timestamp>=2022-11-16&timestamp<2022-12-11` (aceita `T00:10`)
  - **Coluna = chave sem valor:** `&absorbed_dose_rate&latitude&longitude&altitude`
  - Sem coluna nenhuma, a API devolve o erro `No columns specified`. Chave inválida (ex.: `timestamp.start`) devolve `Invalid key`.
- **Resposta JSON** (formato "split" do pandas): `{"columns":[...], "index":[...], "data":[[...], ...]}`

```bash
curl "https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=Curiosity&timestamp>=2022-11-16&timestamp<2022-12-11&absorbed_dose_rate&format=json"
# columns: ["timestamp","instrument_id","absorbed_dose_rate","spacecraft"]
# data[0]: ["2022-11-16T00:03:22","MSL-RAD-Surface",7.6037726,"Curiosity"]
```

**Naves e instrumentos disponíveis** (vistos na janela da Artemis I, 16/11 a 10/12/2022):

| spacecraft | instrument | Onde |
|---|---|---|
| `Curiosity` | `MSL-RAD` (`MSL-RAD-Surface`) | **Superfície de Marte** (Cratera Gale) |
| `Orion` | `HERA-HSU1`, `HERA-HSU2`, `EAD-MU01`, `M42-SN127` | **Artemis I**: viagem Terra → Lua → Terra |
| `LRO` | `CRaTER` | Órbita da Lua |
| `ISS` | `DosTel1`, `Lidal`, `REM-Lid` | Órbita baixa da Terra (picos ao cruzar a Anomalia do Atlântico Sul) |
| `TGO` | `Liulin-MO-AB`, `Liulin-MO-CD` | Órbita de Marte (ExoMars Trace Gas Orbiter) |
| `BioSentinel` | `BPD` | Espaço profundo (órbita heliocêntrica) |

**Unidade:** a resposta não traz a unidade. Pela ordem de grandeza (Curiosity ~7 ≈ 0,17 mGy/dia, coerente com os ~0,2 mGy/dia publicados), **é provavelmente µGy/h**. Confirme na Knowledgebase da RadLab antes de mostrar a unidade ao jogador. Para crianças, prefira comparações ("3× mais que na Estação Espacial") a unidades.

> ⚠️ Pedidos grandes demoram e pesam: a série da Orion HERA-HSU1 em 25 dias tem cerca de 35 mil linhas (3 MB). Agregue (média por hora/dia) num script e embuta só o resumo.

**No jogo (issue #106):** `node scripts/fetch-radlab-summary.mjs` refaz as 4 consultas da amostra (mesmas janelas) e grava `src/data/radlabSummary.tson` com n, janela, mediana, média, p10, p90, máximo e data de coleta. Falha de rede ou série vazia interrompe o script. `RADIATION_CONFIG.MARS_SURFACE_DOSE_UGY_PER_HOUR` lê a mediana do Curiosity desse JSON (`src/data/radlabSummary.ts`). O diário [J] (aba NASA STUDIES) e a enfermaria mostram um gráfico de 4 barras **sem unidade**, só a comparação com a Estação Espacial ("Mars: about 1.5 times the Space Station"), porque a unidade ainda não foi confirmada na documentação do RadLab (o portal de docs responde 500 em 14/11/2026).

## 3. OSDR: estudos de biologia espacial e saúde

- Repositório: <https://osdr.nasa.gov/bio/repo/>
- **Busca:** `GET https://osdr.nasa.gov/osdr/data/search?term=<palavra>&type=cgene&size=N`
  - `type=cgene` filtra para os **estudos OSDR/GeneLab** (IDs `OSD-###`). Sem esse filtro, aparecem resultados ruidosos de outras fontes (`mg_rast`).
- Resposta no estilo Elasticsearch: `hits.total`, `hits.hits[]._source` com `Accession`, `Study Title`, `Study Description`, `Flight Program`, `Mission`, `organism`, `Study Publication Title`.
- Amostra: [`samples/osdr-search-bone-loss.json`](samples/osdr-search-bone-loss.json). `term=bone loss` dá 36 estudos, ex.: **OSD-342** "Targeting myostatin/activin A protects against skeletal muscle and bone loss during spaceflight" (ISS, camundongos).
- Página de um estudo: `https://osdr.nasa.gov/bio/repo/data/studies/OSD-342`
- Termos úteis: `bone loss`, `muscle atrophy`, `radiation`, `sleep`, `immune`, `plant growth` (para a estufa), `microgravity`.
- **Uso no jogo:** "Fato real da NASA" curto e atribuído, ligado a uma mecânica. Ex.: ficar muitos sols sem exercício/gravidade → "Cientistas da NASA viram ossos enfraquecendo em camundongos na Estação Espacial (estudo OSD-342)".
- **No jogo (issue #106):** `node scripts/fetch-osdr-topics.mjs` busca os 3 primeiros estudos de `bone loss`, `muscle atrophy`, `radiation`, `sleep` e `immune` e grava `src/data/osdrTopics.tson` (URL da busca, data de coleta, accession, título, organismo, programa de voo e missão). Sem estudos inventados: falha de rede interrompe o script. A frase para criança de cada estudo fica em `src/data/osdrStudies.ts`. Revelação (`src/story/studyReveals.ts`): treino na esteira → osso, na bicicleta → músculo, tratamento na enfermaria → radiação (depois imunidade), tempestade sobrevivida → radiação; `reveal('sleep')` fica para o beliche (#109). A aba NASA STUDIES do diário mostra o link e o aviso de honestidade ("Done on the Space Station / in a lab on Earth with mice. It did not measure Mars."). Os resultados de `sleep` não são sobre sono em si (repouso na cama, cérebro de camundongo, missão RR-7 que observou ritmo de sono e vigília); a frase de cada um diz o que o estudo fez.

## 4. InSight Mars Weather: clima real na superfície de Marte

- `GET https://api.nasa.gov/insight_weather/?api_key=KEY&feedtype=json&ver=1.0`
- **Feed arquivado:** a missão InSight terminou em 2022 e o endpoint devolve sempre os sols 675–681 (19 a 25/10/2020, Elysium Planitia).
- Campos por sol: `AT` (temperatura do ar, °C), `PRE` (pressão, Pa), `HWS` (vento, m/s). Cada um traz `av`/`mn`/`mx`/`ct`, além de `Season` e `WD` (rosa dos ventos).
- Amostra limpa: [`samples/insight-weather-sols-675-681.json`](samples/insight-weather-sols-675-681.json)
- **No jogo (issue #108):** `node scripts/fetch-insight-weather.mjs` lê a chave do `.env` e grava [`src/data/insightWeather.tson`](../../src/data/insightWeather.tson) (só temperatura, pressão e vento por sol, com data de coleta e a URL sem a chave). Acesso só por `src/data/marsWeather.ts`.
- **Fonte com mais variação (REMS do Curiosity, MEDA do Perseverance no PDS):** ainda não investigada. Fica como próximo passo; se der certo, baixar por script e embutir como JSON, porque o PDS não serve para chamada do navegador.

## 5. Mars Trek / Moon Trek: mapas e terreno reais

- Portal: <https://trek.nasa.gov/mars/> (Moon: <https://trek.nasa.gov/moon/>)
- **Tiles WMTS (CORS liberado):**
  `https://trek.nasa.gov/tiles/{Mars|Moon}/EQ/{LAYER}/1.0.0/default/default028mm/{z}/{row}/{col}.jpg`
  - Mars, relevo colorido MOLA: `Mars_MGS_MOLA_ClrShade_merge_global_463m`
  - Moon, mosaico LRO WAC: `LRO_WAC_Mosaic_Global_303ppd_v02`
  - `z=0` devolve a imagem global (testado: 200 OK, JPEG).
- **Busca de locais/bookmarks:** `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?bbox=-180,-90,180,90&q=jezero&proj=urn:ogc:def:crs:EPSG::104905&start=0&rows=5` (Solr: `response.docs[]` com `title`, `bbox`, `description`, `mediaURL`, `layers`). Amostra: [`samples/mars-trek-search-jezero.json`](samples/mars-trek-search-jezero.json).
- **Elevação (testado em 14/11/2026):** os tiles de elevação existem só para Gale (`Gale_DEM_SMG_1m`, PNG até o zoom 14) e são de **8 bits**: a faixa inteira do modelo vira 256 tons, uns 20 m por degrau. Perto do pouso do Curiosity um tile inteiro tem 3 tons, então não serve para terreno na escala de 1 m. Os modelos de Jezero do catálogo não têm tiles (404) e o serviço de elevação bruta (`trek.nasa.gov/mars/arcgis/rest/services/.../ImageServer`) não respondeu. Para elevação real, use o HiRISE DTM (seção 6).
- **Catálogo:** `searchItems` com `rows=2100` devolve os 2.035 itens (222 produtos, 1.783 nomes oficiais, 12 locais de pouso); o parâmetro `q` não filtrou nos testes, então filtre localmente por `bbox`.
- **Uso no jogo:** tela de "escolha onde pousar" (Gale, Jezero, polo sul da Lua) com a imagem real; o local escolhido muda os parâmetros (ex.: gelo perto do polo = mais água e mais frio). As texturas `public/textures/moon.jpg` (`LRO_WAC_Mosaic_Global_303ppd_v02`, Moon Trek) e `public/textures/earth.jpg` (`BlueMarble_ShadedRelief_Bathymetry`, NASA Earthdata GIBS) são usadas no sistema Terra–Lua do céu marciano (`src/sky/celestialBodies.ts`).

## 6. HiRISE DTM: elevação real de Marte a 1 m

O HiRISE é a câmera da sonda Mars Reconnaissance Orbiter (NASA/JPL-Caltech/University of Arizona). Os modelos digitais de terreno (DTM) dela são a origem dos modelos de elevação que o Mars Trek cataloga.

- Página do produto usado no jogo: <https://www.uahirise.org/dtm/PSP_010573_1755> (Gale, candidato a pouso do MSL).
- Arquivo: `https://www.uahirise.org/PDS/DTM/PSP/ORB_010500_010599/PSP_010573_1755_PSP_010639_1755/DTEEC_010573_1755_010639_1755_U01.IMG` (471 MB, 7.186 × 16.392 pixels, **1,0118 m por pixel**, elevação em metros como float de 32 bits little-endian).
- **Download parcial:** o servidor aceita `Range`. O rótulo PDS3 fica nos primeiros bytes; cada linha da imagem ocupa `RECORD_BYTES` bytes e a imagem começa no registro `^IMAGE`. Um recorte de 224 linhas custa 6,4 MB.
- **Latitude/longitude → pixel** (projeção equirretangular do rótulo): `linha = LINE_PROJECTION_OFFSET − lat × MAP_RESOLUTION` e `coluna = SAMPLE_PROJECTION_OFFSET + (lon − CENTER_LONGITUDE) × MAP_RESOLUTION × cos(CENTER_LATITUDE)`.
- Pixel sem dado: `MISSING_CONSTANT` (um float muito negativo).
- **No jogo:** `node scripts/fetch-mars-terrain.mjs` grava `src/data/marsTerrain.tson` (recorte de 224 × 224 em 4,4743°S, 137,4032°E); `src/data/marsTerrain.ts` dá a altura de cada coluna do mundo.
- Alternativa não usada: Jezero, `.../PDS/DTM/ESP/ORB_045900_045999/ESP_045994_1985_ESP_046060_1985/DTEEC_045994_1985_046060_1985_U01.IMG` (381 MB, 1,0097 m por pixel), que cobre o pouso do Perseverance (18,4447°N, 77,4509°E).
- **Não verificado:** o alinhamento entre este DTM e os mosaicos de foto do Mars Trek (`curiosity_hirise_mosaic`). Não sobreponha foto e terreno sem conferir.
- Crédito: **NASA/JPL-Caltech/University of Arizona**.

## 7. NASA Image and Video Library (extra, não listado no desafio)

- `GET https://images-api.nasa.gov/search?q=artemis%20habitat&media_type=image&page_size=3`, sem chave, CORS `*`.
- Resposta: `collection.items[].data[0]` (`title`, `description`, `nasa_id`, `center`, `date_created`) e `links[].href` (miniaturas).
- Substitui o Mars Rover Photos, que está fora do ar. Útil para fotos reais em telas de carregamento ou de fim de partida. **Atenção:** imagens da NASA são de domínio público, mas **o logo da NASA não pode ser usado** como marca do projeto.

## 8. Space Apps GraphQL (para atualizar este contexto)

- `POST https://api.spaceappschallenge.org/graphql` (Apollo; bloqueia GET por CSRF, então mande `Content-Type: application/json`).
- O texto do desafio também vem embutido no HTML da página, no payload RSC do Next (`self.__next_f.push`). O objeto `ChallengePage` tem `detailsContent` e `resourcesTabContent` (HTML). Foi assim que [`../challenge/`](../challenge/) foi gerado.

## Integração da estufa: estudos OSDR reais

`node scripts/fetch-osdr-plants.mjs` consulta a busca oficial (`plant growth`, `type=cgene`, três resultados) e grava `src/data/osdrPlants.tson`, com URL, data de coleta, accession, título, organismo e missão. Falha de rede ou resposta inválida interrompe o script; não gera estudos fictícios. Também aceita um arquivo bruto baixado desse endpoint como argumento, para redes que exigem download separado.

O jogo usa o snapshot real embutido porque OSDR não libera CORS para o site. O caderno da estufa revela um registro por colheita e oferece links para OSD-772, OSD-177 e OSD-773 (snapshot de 14/11/2026). Não é consulta ao vivo. Os estudos contextualizam cultivo no espaço, sem extrapolar seus resultados para produção em Marte.

A proposta educativa de autossuficiência vem do [toolkit da CSA](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) e da página [Growing healthy food](https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp). Custos, rendimento e duração de alface/batata/soja são escolhas explícitas de balanceamento em `CROP_CONFIG`, não medições dessas agências. A UI informa essa distinção.
