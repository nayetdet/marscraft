# Terreno real de Marte (cratera em Gale, HiRISE): design

> Status: aprovado no brainstorming de 2026-11-14 · Base de código: `feat/estufa-maior` em `5839e17` · Branch: `feat/terreno-real-gale`

## Problema

O terreno é o ponto mais fraco do jogo e aparece em todo frame. `src/world/terrainGenerator.js` soma duas senoides e uma borda sintética: fora da base o mundo é liso, vazio e **inventado**, o que contraria o princípio "dados reais, não inventados".

A comparação que motivou a mudança: o mapa "Life on Mars" (minecraft.net, 2019) ganha no visual do terreno, e o projeto GeoBoxers reconstruiu Gale no Minecraft a partir de modelos de elevação HiRISE em escala 1:1.

## Decisão

Trocar a altura procedural pela **elevação real de uma cratera pequena dentro de Gale**, em escala 1 bloco ≈ 1 metro.

- **Por que Gale:** a radiação do jogo vem do instrumento RAD do Curiosity, que está em Gale. Terreno e dose passam a ser do mesmo lugar.
- **Por que essa cratera:** o jogo já é "uma base dentro de uma cratera". Esta tem uns 180 m de largura, cabe inteira no mundo de 224 × 224 blocos, e a borda real cerca a base no lugar da borda sintética.

Alternativas descartadas: oferecer a escolha entre Gale e Jezero (dobra o teste na véspera do prazo) e usar só as imagens do Mars Trek num mapa da base (impacto pequeno).

## O dado

| Campo | Valor |
|---|---|
| Fonte | Modelo digital de terreno HiRISE, sonda Mars Reconnaissance Orbiter (NASA/JPL-Caltech/University of Arizona) |
| Produto | `DTEEC_010573_1755_010639_1755_U01` (PDS3, float de 32 bits, elevação em metros) |
| Página | <https://www.uahirise.org/dtm/PSP_010573_1755> |
| Resolução | 1,0118 m por pixel |
| Recorte | 224 × 224 pixels, centro em 4,4743°S, 137,4032°E (Aeolis Palus, uns 7 km ao norte do pouso do Curiosity) |
| Relevo do recorte | 12,7 m no total: de -1,1 m a +11,6 m em relação ao nível da base |

O arquivo tem 471 MB, mas o servidor aceita `Range`: o script baixa só as 224 linhas do recorte (6,4 MB).

O centro do recorte foi escolhido por busca em passos de 4 m: é a posição em que o chão real sob a base varia menos (desvio de 0,76 m) e em que a borda fica pelo menos 5,1 m acima da base em todas as 16 direções testadas.

### O que o Mars Trek não entrega

O `docs/data/apis-nasa.md` aponta o Mars Trek como fonte de terreno. Testado em 2026-11-14:

- Os tiles de elevação de Gale (`Gale_DEM_SMG_1m`) são PNG de 8 bits: degraus de uns 20 m, inúteis na escala de 1 m.
- Os modelos de Jezero não têm tiles (404) e o serviço de elevação bruta (ArcGIS ImageServer) não respondeu.
- Os tiles de **imagem** e o catálogo funcionam, mas ficam fora deste escopo.

O HiRISE é o instrumento por trás dos modelos que o Trek cataloga, então o crédito vai para o HiRISE.

## Arquitetura

Segue o padrão do DONKI (`scripts/fetch-donki-cme.mjs` → `src/data/donkiCme.json`).

1. **`scripts/fetch-mars-terrain.mjs`**: lê o rótulo PDS3, converte latitude/longitude em linha/coluna (projeção equirretangular do rótulo), baixa o recorte por `Range` e grava `src/data/marsTerrain.json`. Falha se houver pixel sem dado ou se o relevo passar de 25,5 m.
2. **`src/data/marsTerrain.json`**: metadados (fonte, produto, URL, coordenadas, resolução, data da coleta, elevação mínima e máxima) e as alturas em `Uint8` com passo de 0,1 m, em base64 (67 KB).
3. **`src/data/marsTerrain.js`**: decodifica uma vez e expõe:
   - `terrainOffset(x, z)`: metros acima do nível da base na coluna do mundo (`x`, `z`). Leste é `+x` e norte é `-z`, como no resto do jogo.
   - `MARS_TERRAIN`: metadados para a UI.
   - O nível de referência é a média das alturas reais no disco de 28 m em volta do centro da base (`-4, 0`), o mesmo disco que o gerador aplaina.
4. **`src/world/terrainGenerator.js`**: `groundY + noise2D(x, z)` vira `groundY + terrainOffset(x, z)`. Saem `noise2D` e o bloco da borda sintética. Os aplainamentos da base, do MAV, da ala norte e da estufa ficam como estão.

## Honestidade com o dado

- **Real:** 90 % das colunas do mundo, sem alteração além do arredondamento para blocos inteiros.
- **Alterado:** os 10 % sob a base, a ala norte, a estufa e a plataforma do MAV, nivelados para as construções (corte de até 3,0 m e aterro de até 1,5 m). Nivelar o terreno antes de construir é o que uma missão real faria.
- **Inventado:** a cratera de gelo (`ICE_CRATER_CENTER`), que é mecânica de jogo.
- **Não verificado:** a foto orbital do Mars Trek para o mesmo ponto não mostra a cratera com clareza. A classificação "cratera" vem da forma no modelo de elevação. Não sobrepor foto e terreno sem conferir o alinhamento.
- A resolução é de 1,0118 m, então o texto da UI diz "about 1 meter".

## Atribuição no jogo

- Nova linha **Ground** na tela "NASA Data" (`index.html`), com produto, local e data da coleta vinda do JSON.
- `docs/data/apis-nasa.md` ganha a seção do HiRISE e a correção sobre o Mars Trek; `docs/data/numeros-reais.md` ganha os números do recorte; `docs/game/estado-atual-e-gaps.md` e o mapa do código no `AGENTS.md` são atualizados.

## Testes

- `src/data/marsTerrain.test.js`: tamanho e metadados do JSON; referência próxima de zero no disco da base; borda de pelo menos 4 m em 8 direções; relevo do mundo dentro de [-3 m, +14 m].
- `src/world/terrainGenerator.test.js`: os testes atuais continuam passando; novo teste confere que colunas fora dos aplainamentos têm a altura do dado real, e que a plataforma do MAV e o local de pouso da animação estão no nível do chão.
- Validação visual no navegador: andar da base até a borda, conferir rover, cratera de gelo e animação de pouso.

## Fora de escopo

- Escolha do local de pouso, terreno de Jezero.
- Mapa ou foto real numa tela da base.
- Pedras decorativas e novos pontos de interesse.

## Riscos

| Risco | Mitigação |
|---|---|
| Objeto externo em posição fixa ficar enterrado ou flutuando | Os aplainamentos existentes continuam; teste cobre MAV e local de pouso; conferência visual do restante |
| Conflito com `feat/estufa-maior`, que mexe no mesmo arquivo | A branch parte dela; a mudança no gerador é de poucas linhas |
| Servidor do HiRISE fora do ar | O JSON é embutido; o script só é necessário para regenerar |
