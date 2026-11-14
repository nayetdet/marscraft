# Passe visual (chão, céu, sombra de canto, casco, pedras): design

> Status: aprovado no brainstorming de 2026-11-14 · Base: `feat/terreno-real-gale` em `80a563f` · Branch: `feat/visual-pass`

## Problema

Capturas de 14/11/2026 mostram cinco defeitos, em ordem de impacto:

1. Chão e céu têm o mesmo laranja; o horizonte e o relevo real somem.
2. A textura do chão é um chuvisco de alto contraste, igual em todos os blocos.
3. Não há sombra: luz ambiente forte e nenhuma oclusão. A base parece uma caixa chapada.
4. O casco da base é uma grade branca repetida, sem acabamento.
5. O terreno é vazio.

O interior da base está bom e não é alvo.

## Decisão

Cinco etapas independentes, na ordem abaixo. Cada uma tem commit próprio e pode ser a última.

| # | Etapa | Onde |
|---|---|---|
| 1 | Paleta e textura do chão, com variação de cor por bloco e por altura | `src/graphics/blockMaterials.js`, `src/world/voxelShading.js` (novo), `src/world/VoxelWorld.js` |
| 2 | Céu, névoa e luz: horizonte claro e empoeirado, chão mais escuro, menos luz ambiente | `src/sky/atmosphereShader.js`, `src/sky/MarsSkySystem.js`, `src/world/VoxelWorld.js` (disco do horizonte) |
| 3 | Oclusão de ambiente por vértice, calculada ao montar a malha | `src/world/voxelShading.js`, `src/world/VoxelWorld.js`, `src/graphics/blockMaterials.js` |
| 4 | Textura do casco e do vidro | `src/graphics/blockMaterials.js` |
| 5 | Pedras pequenas espalhadas, sem colisão | `src/world/surfaceRocks.js` (novo), `src/world/terrainGenerator.js`, `src/world/VoxelWorld.js` |

Fora de escopo: sombras em tempo real (pesam em máquina fraca), mudar a forma da base (outra sessão está mexendo nela) e o interior.

## Mecanismo comum: cor por vértice

O atlas dos blocos opacos passa a usar `vertexColors`. Cada vértice de face recebe `tinta do bloco × oclusão`. Custo por frame: zero; tudo é calculado quando o chunk é montado.

`src/world/voxelShading.js` reúne as funções puras, testáveis sem Three.js:

- `vertexOcclusion(side1, side2, corner)`: nível 0 a 3 do algoritmo clássico de voxels (dois lados cheios = 0; senão 3 menos os vizinhos cheios).
- `OCCLUSION_BRIGHTNESS`: brilho de cada nível.
- `naturalTint(id, x, y, z)`: fator de brilho para regolito, arenito e basalto (variação por bloco, por mancha larga e por altura); 1 para os outros blocos.

Só blocos opacos fazem sombra: ar e vidro não. Quando `a0 + a2 < a1 + a3`, a diagonal do quadrado é invertida para a sombra não ficar torta.

## Etapa 1: chão

- Regolito: de laranja neon `(242,152,72)` para ferrugem empoeirado, com grão de baixo contraste.
- Arenito (encostas e borda): tom um pouco mais claro e amarelado, faixas suaves.
- `naturalTint`: ±4 % por bloco (quebra a repetição), ±6 % em manchas de ~20 m, e de −8 % no fundo a +6 % na borda conforme a altura.

As cores são escolha de arte, não dado. O formato do terreno continua sendo o dado real.

## Etapa 2: céu, névoa e luz

- Céu de dia: horizonte bege-claro empoeirado e zênite caramelo mais escuro, no lugar do laranja saturado. A auréola azulada em volta do Sol fica.
- Névoa de dia na cor do horizonte.
- Menos luz ambiente e mais Sol, para as faces de cima e de lado dos blocos se diferenciarem.
- Disco do horizonte (`horizonGround`) na cor nova do chão.
- Conferir que o interior continua claro.

## Etapa 3: oclusão de ambiente

Para cada face visível, cada vértice consulta 3 vizinhos na camada à frente da face. Blocos na borda do chunk consultam o mundo inteiro, então não há emenda. Ao quebrar ou colocar um bloco, os chunks diagonais também são remontados.

## Etapa 4: casco e vidro

- Casco: branco levemente quente, com emenda só em duas bordas (a grade fica mais leve) e sem rebites nos quatro cantos.
- Vidro: tom mais azul e moldura cinza-azulada.

## Etapa 5: pedras

- `InstancedMesh` com ~900 pedras de 0,15 a 0,45 m, posição e forma por semente fixa, sobre o topo do terreno.
- Nada de pedra nas áreas niveladas nem na cratera de gelo: `isBuildZone(x, z)` exportada de `terrainGenerator.js`.
- Sem colisão. Limitação aceita: se o bloco de baixo for minerado, a pedra fica no ar.
- É decoração inventada: não entra na tela "NASA Data".

## Testes

- `src/world/voxelShading.test.js`: tabela da oclusão; `naturalTint` igual a 1 para casco e vidro, determinístico, dentro de [0,8; 1,2] e crescente com a altura em média.
- `src/world/VoxelWorld.test.js`: a geometria opaca tem atributo `color` com um valor por vértice; um bloco num canto recebe vértices mais escuros que um bloco isolado.
- `src/world/terrainGenerator.test.js`: `isBuildZone` verdadeiro no centro da base, no MAV e na cratera de gelo; falso longe.
- Validação visual: capturas antes e depois de cada etapa (exterior de dia, pôr do sol, noite, interior, vista aérea) e um viewport 844 × 390.

## Riscos

| Risco | Mitigação |
|---|---|
| Interior escurecer com menos luz ambiente | Captura do interior em cada etapa; ajustar as luzes |
| Montagem do mundo ficar lenta | Medir o tempo de `rebuildMeshes` antes e depois |
| Conflito com a outra sessão | Nenhum arquivo deste passe está na lista de arquivos alterados por ela em 14/11 |
