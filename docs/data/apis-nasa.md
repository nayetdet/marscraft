# APIs e datasets da NASA: guia prático

> Tudo aqui foi **testado em 2026-11-14** a partir de uma máquina local (curl). Amostras reais e reduzidas ficam em [`samples/`](samples/).
> Os números prontos para usar na mecânica do jogo estão em [`numeros-reais.md`](numeros-reais.md).

## Resumo: o que dá para chamar direto do navegador

O jogo é um site estático (Vite → GitHub Pages), sem backend. Uma API só pode ser chamada **do navegador** se responder com o cabeçalho CORS `Access-Control-Allow-Origin`.

| API | Chave | CORS (navegador) | Situação | Estratégia recomendada |
|---|---|---|---|---|
| `api.nasa.gov/DONKI/*` | sim (`api_key`) | ✅ `*` | CME e notifications OK. **FLR retorna 404.** | Fetch ao vivo **com fallback** para um JSON embutido |
| `api.nasa.gov/insight_weather` | sim | ✅ `*` | OK (feed arquivado, sols 675–681 de out/2020) | Embutir (é estático, não muda) |
| `api.nasa.gov/planetary/apod` | sim | ✅ `*` | deu 500 e depois 429 | Opcional (imagem do dia na tela inicial) |
| `api.nasa.gov/mars-photos` | sim | — | ❌ **fora do ar** ("No such app", 404) | Não usar. Use a NASA Image Library. |
| RadLab `visualization.osdr.nasa.gov/radlab/api/` | não | ❌ sem cabeçalho | OK | **Baixar na build e embutir** |
| OSDR search `osdr.nasa.gov/osdr/data/search` | não | ❌ só `osdr.nasa.gov` | OK | **Baixar na build e embutir** |
| Mars/Moon Trek tiles (WMTS) | não | ✅ `*` | OK | Pode carregar direto como textura |
| Mars Trek search (`TrekServices`) | não | ❌ | OK | Embutir |
| NASA Image Library `images-api.nasa.gov` | não | ✅ `*` | OK | Fetch direto (fotos reais de Marte/Artemis) |

**Limite da `DEMO_KEY`:** o cabeçalho devolveu `X-Ratelimit-Limit: 10` por hora por IP, e estourou em poucos minutos de teste. **Peça uma chave grátis em <https://api.nasa.gov/>** (1.000 req/h). Em site estático a chave fica visível no bundle; para uma chave gratuita da api.nasa.gov isso é aceitável. Mesmo assim, nunca dependa só do fetch ao vivo, e mantenha sempre um fallback embutido.

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

Ideia de mecânica: usar `speed` para o tempo de aviso. A distância Sol–Terra (~150 milhões de km) dividida pela velocidade dá o tempo de chegada (de ~2 a ~7 dias). Escalar isso para "horas de jogo". `type` vira a intensidade do evento.

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

## 3. OSDR: estudos de biologia espacial e saúde

- Repositório: <https://osdr.nasa.gov/bio/repo/>
- **Busca:** `GET https://osdr.nasa.gov/osdr/data/search?term=<palavra>&type=cgene&size=N`
  - `type=cgene` filtra para os **estudos OSDR/GeneLab** (IDs `OSD-###`). Sem esse filtro, aparecem resultados ruidosos de outras fontes (`mg_rast`).
- Resposta no estilo Elasticsearch: `hits.total`, `hits.hits[]._source` com `Accession`, `Study Title`, `Study Description`, `Flight Program`, `Mission`, `organism`, `Study Publication Title`.
- Amostra: [`samples/osdr-search-bone-loss.json`](samples/osdr-search-bone-loss.json). `term=bone loss` dá 36 estudos, ex.: **OSD-342** "Targeting myostatin/activin A protects against skeletal muscle and bone loss during spaceflight" (ISS, camundongos).
- Página de um estudo: `https://osdr.nasa.gov/bio/repo/data/studies/OSD-342`
- Termos úteis: `bone loss`, `muscle atrophy`, `radiation`, `sleep`, `immune`, `plant growth` (para a estufa), `microgravity`.
- **Uso no jogo:** "Fato real da NASA" curto e atribuído, ligado a uma mecânica. Ex.: ficar muitos sols sem exercício/gravidade → "Cientistas da NASA viram ossos enfraquecendo em camundongos na Estação Espacial (estudo OSD-342)".

## 4. InSight Mars Weather: clima real na superfície de Marte

- `GET https://api.nasa.gov/insight_weather/?api_key=KEY&feedtype=json&ver=1.0`
- **Feed arquivado:** a missão InSight terminou em 2022 e o endpoint devolve sempre os sols 675–681 (19 a 25/10/2020, Elysium Planitia).
- Campos por sol: `AT` (temperatura do ar, °C), `PRE` (pressão, Pa), `HWS` (vento, m/s). Cada um traz `av`/`mn`/`mx`/`ct`, além de `Season` e `WD` (rosa dos ventos).
- Amostra limpa: [`samples/insight-weather-sols-675-681.json`](samples/insight-weather-sols-675-681.json)

## 5. Mars Trek / Moon Trek: mapas e terreno reais

- Portal: <https://trek.nasa.gov/mars/> (Moon: <https://trek.nasa.gov/moon/>)
- **Tiles WMTS (CORS liberado):**
  `https://trek.nasa.gov/tiles/{Mars|Moon}/EQ/{LAYER}/1.0.0/default/default028mm/{z}/{row}/{col}.jpg`
  - Mars, relevo colorido MOLA: `Mars_MGS_MOLA_ClrShade_merge_global_463m`
  - Moon, mosaico LRO WAC: `LRO_WAC_Mosaic_Global_303ppd_v02`
  - `z=0` devolve a imagem global (testado: 200 OK, JPEG).
- **Busca de locais/bookmarks:** `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?bbox=-180,-90,180,90&q=jezero&proj=urn:ogc:def:crs:EPSG::104905&start=0&rows=5` (Solr: `response.docs[]` com `title`, `bbox`, `description`, `mediaURL`, `layers`). Amostra: [`samples/mars-trek-search-jezero.json`](samples/mars-trek-search-jezero.json).
- **Uso no jogo:** tela de "escolha onde pousar" (Gale, Jezero, polo sul da Lua) com a imagem real; o local escolhido muda os parâmetros (ex.: gelo perto do polo = mais água e mais frio).

## 6. NASA Image and Video Library (extra, não listado no desafio)

- `GET https://images-api.nasa.gov/search?q=artemis%20habitat&media_type=image&page_size=3`, sem chave, CORS `*`.
- Resposta: `collection.items[].data[0]` (`title`, `description`, `nasa_id`, `center`, `date_created`) e `links[].href` (miniaturas).
- Substitui o Mars Rover Photos, que está fora do ar. Útil para fotos reais em telas de carregamento ou de fim de partida. **Atenção:** imagens da NASA são de domínio público, mas **o logo da NASA não pode ser usado** como marca do projeto.

## 7. Space Apps GraphQL (para atualizar este contexto)

- `POST https://api.spaceappschallenge.org/graphql` (Apollo; bloqueia GET por CSRF, então mande `Content-Type: application/json`).
- O texto do desafio também vem embutido no HTML da página, no payload RSC do Next (`self.__next_f.push`). O objeto `ChallengePage` tem `detailsContent` e `resourcesTabContent` (HTML). Foi assim que [`../challenge/`](../challenge/) foi gerado.
