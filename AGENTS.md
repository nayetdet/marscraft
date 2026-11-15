# AGENTS.md

Guia para agentes de IA (Claude Code, Codex, Cursor…) e pessoas novas no repo.

## O que é este projeto

**MarsCraft**: jogo voxel de sobrevivência em primeira pessoa num posto avançado em Marte, feito para o desafio **[Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)** do **NASA Space Apps Challenge 2026**.

O desafio, em uma frase: um jogo em que **crianças de 7 a 12 anos** administram uma base na Lua ou em Marte e aprendem **trade-offs reais de engenharia** (suporte de vida, blindagem contra radiação, energia, comida e atraso de comunicação), **usando dados abertos reais da NASA**.

> ⏰ **Prazo de submissão: domingo, 15/11/2026, às 23:59 no horário local.** A página de submissão e a demo precisam estar em inglês (vídeo de ≤30 s com legenda em inglês, ou até 7 slides). Detalhes em [`docs/challenge/julgamento-e-submissao.md`](docs/challenge/julgamento-e-submissao.md).

## Leia antes de mexer

| Preciso de… | Arquivo |
|---|---|
| Entender o desafio (texto oficial) | [`docs/challenge/desafio.md`](docs/challenge/desafio.md) |
| Saber o que falta no jogo | [`docs/game/estado-atual-e-gaps.md`](docs/game/estado-atual-e-gaps.md) |
| Usar uma API da NASA | [`docs/data/apis-nasa.md`](docs/data/apis-nasa.md) |
| Um número real (dose de radiação, temperatura, gravidade…) | [`docs/data/numeros-reais.md`](docs/data/numeros-reais.md) |
| Índice completo | [`docs/README.md`](docs/README.md) |

## Princípios de design (vêm do desafio, não negociáveis)

1. **Nenhuma escolha é de graça.** Toda ação útil custa outro recurso. Se uma mecânica nova cria uma escolha "segura" sem custo, ela está errada.
2. **Mecânica > visual.** Um sistema simples que ensina uma restrição real vale mais que polimento gráfico.
3. **Dados reais, não inventados.** Calibre com [`docs/data/numeros-reais.md`](docs/data/numeros-reais.md). Se precisar de um número que não está lá, busque na fonte da NASA e registre no doc com a fonte.
4. **Honestidade com o dado:** dado embutido aparece como "dados reais de DD/MM/AAAA"; **só chame de "ao vivo"** o que veio de fetch bem-sucedido.
5. **Atribuir as fontes dentro do jogo** (tela de Fontes/Créditos com DONKI, RadLab, InSight, OSDR, HiRISE, Mars Trek).
6. **Poucos recursos centrais (2 ou 3)** para não sobrecarregar a criança. Proposta atual: **Energia, O2 e Radiação**.
7. **Linguagem para 7 a 12 anos:** termos técnicos (sol, dose, CME) sempre com explicação curta no contexto.
8. **Sem logo da NASA** em texturas ou UI geradas. Asset gerado por IA precisa de marca d'água; código assistido por IA precisa ser declarado nos créditos.

## Stack e comandos

- **TypeScript + [Three.js](https://threejs.org/) `^0.181` + Next.js.** O React é somente a camada obrigatória de montagem do Next (`src/app/page.tsx`); HUD e jogo continuam em HTML/CSS/TS puro, no shell `public/game.html` e em `src/ui/`.
- `npm install` · `npm run dev` (Next com `--hostname`) · `npm run build` · `npm run start` · `npm run typecheck`
- **Migração de tipos:** os módulos legados estão em `.ts`, com `@ts-nocheck` até cada módulo receber campos e assinaturas explícitas. Não adicione novos módulos sem tipos; ao alterar um módulo migrado, remova o marcador quando a tipagem puder ser validada.
- **Painel de admin (testes manuais):** `F8` no `npm run dev`, ou `?admin` na URL (também no Pages, com botão ADMIN para touch). Força tempestade, mexe em bateria, água e tempo, e teleporta para as salas (`src/ui/AdminPanel.ts`).
- **Testes:** `npm test` (Vitest, `vitest run`). Os testes ficam ao lado do arquivo (`src/**/<nome>.test.ts`) e cobrem lógica pura: física, sobrevivência, terreno. Não há linter. Há `shell.nix` (Node 22) para quem usa Nix.
- **Deploy:** push na `main` dispara `.github/workflows/deploy.yml`, que publica na Vercel. Configure os secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` e `NASA_API_KEY` no GitHub. O workflow entrega a chave à build e ao ambiente de produção da Vercel, nunca ao navegador.
- **API:** dados com chave passam por rotas de servidor do Next. O DONKI usa `/api/space-weather`, portanto a chave nunca entra no bundle. RadLab e OSDR continuam baixados por script e embutidos como JSON.

## Mapa do código

```
public/game.html           HUD, menus e tela de morte (markup + ids usados pelo HudManager)
src/app/                   casca Next e rota de servidor /api/space-weather; nao converte o jogo em React
src/main.ts                bootstrap → new GameEngine(container).start()
src/core/GameEngine.ts     loop principal; instancia e conecta todos os sistemas
src/mission/               missao: bateria e paineis (energy), tempestades solares do DONKI (solarStorms), radiacao,
                           radio Terra-Marte (commsLink, earthMars), MAV e textos (MissionSystem, missionText),
                           gerador de O2 eletrolise x MOXIE (oxygenPlant, oxygenText)
                           tempestade de poeira e poeira nos paineis (dustWeather, weatherText)
src/data/marsWeather.ts    clima real do InSight por sol (insightWeather.tson): temperatura la fora e relatorio do tempo
src/config/
  constants.ts             WORLD/PHYSICS/CAMERA/SURVIVAL_CONFIG (todo número de balanceamento mora aqui)
  blockTypes.ts            BLOCK_IDS e HOTBAR_BLOCKS (inventário inicial, consumíveis)
src/world/
  VoxelWorld.ts            armazenamento de voxels, chunks, meshing, raycast
  terrainGenerator.ts      cratera real de Gale (elevação HiRISE em src/data/marsTerrain.tson) + áreas niveladas da base
  nasaSpaceshipBuilder.ts  base/nave construída em voxels
  nasaModelsBuilder.ts     modelos 3D extras (painéis solares, antena, rover, estufa)
  voxelRaycaster.ts        DDA para mirar blocos
  voxelShading.ts          cor por vértice dos blocos: tinta do chão natural e sombra de canto (oclusão)
  surfaceRocks.ts          pedras decorativas espalhadas fora das áreas construídas (sem colisão)
src/player/
  PlayerPhysics.ts         movimento, gravidade, colisão AABB × voxels
  InputController.ts       teclado/mouse/pointer lock e controles touch em paisagem (joystick, câmera por arrasto, ações, hotbar e atalhos de missão/tripulação)
  SurvivalSystem.ts        barras O2/vida/água/comida, áreas pressurizadas, inventário (9 slots de hotbar + 27 de mochila)
  PlayerHand.ts            mão/bloco em 1ª pessoa
src/base/                  organizacao visual da base: posteres e placas (basePosters),
                           telas vivas (baseDisplayText, baseCanvas), mobilia de cenario (baseFurniture) e a decoracao 3D que junta tudo (baseDecor)
src/sky/                   céu marciano: shader de atmosfera, Sol, Terra+Lua, Fobos/Deimos, ciclo de sols
src/graphics/              texturas procedurais em canvas e materiais dos blocos
  shaderMode/              modo "Shaders" do menu: sombra do Sol em tempo real, lampadas da base com sombra, bloom,
                           raios de luz e tone mapping (ShaderMode, GodRaysPass), luzes secundarias coloridas (accentLights),
                           a conta da sombra (shadowRig) e a regra de ligar/desligar (shaderSettings)
src/crew/                  tripulação NPC (#47/#48): CrewManager (necessidades, ordens, avisos), estações
                           (estufa, reciclador de água, gerador de O2, enfermaria), trilhos, avatar voxel e
                           crewInstances (desenha as caixas de todos os trajes juntas, com instancing)
src/story/                 história em 3 atos: StoryDirector (objetivos, janela de lançamento), textos em storyChapters,
                           tutorialSteps (os passos do tutorial guiado do ato 1, um por vez, em dados),
                           objectiveView (o que o painel do objetivo desenha), waypoints (para onde a seta aponta) e WaypointBeacon (seta 3D),
                           firstTimeMoments (a animacao e o fato real da primeira vez de cada acao principal, em dados; quem desenha e o FirstTimeHud)
  cutscene/                animações de chegada e de decolagem: timeline (keyframes), CutscenePlayer, efeitos, cápsula
src/ui/                    HudManager (barras, hotbar, inventário, toasts, rótulos do céu), StoryHud
                           (card de rádio), WaypointHud (seta na tela), CutsceneHud (legendas, pular), FirstTimeHud (abertura e card das animações de primeira vez) + CSS
docs/                      contexto do desafio, APIs e dados reais
```

## Requisitos para mobile

- **A experiência mobile é em paisagem (landscape).** Em retrato, mostre a orientação para girar o aparelho e pause a jogabilidade; não tente forçar a rotação via API do navegador.
- **Preserve paridade de ações:** toda ação relevante disponível no teclado/mouse deve ter um controle touch equivalente, salvo quando for explicitamente exclusiva do desktop.
- **Controles atuais:** joystick virtual à esquerda; RUN acima do joystick; arrasto na metade direita da tela para olhar; ações à direita (pular, minerar/perfurar, usar/colocar, interagir, luneta e inventário); hotbar selecionável por toque.
- **Rover:** mantenha os controles contextuais touch (joystick para dirigir, arrasto à direita para olhar, DRILL para ação e interação para sair). O sprint não se aplica ao rover; esconda esse botão nesse modo e não reintroduza a antiga troca de câmera `CAM`.
- **Alvos touch:** mantenha botões confortáveis para toque (mínimo aproximado de 44 px), respeite `safe-area-inset-*` e evite sobrepor joystick, hotbar, HUD ou controles de ação.
- **Implementação:** reutilize `InputController.ts`, os elementos em `public/game.html` e os estilos existentes em `src/ui/styles/`. Mantenha teclado/mouse funcionando e pause corretamente durante inventário e orientação retrato.
- **Validação visual:** confira ao menos um viewport mobile horizontal (por exemplo, 844×390) e um vertical (390×844, que deve exibir a orientação). Verifique interação real dos botões/gestos; não considere apenas o build como validação de layout.

### Onde encaixar as mecânicas novas

- **Recursos e regras de sobrevivência:** `SurvivalSystem.update(dt, playerPos)`. Hoje o O2 recarrega de graça em `isPlayerInsideShip`; é aí que entra o custo de energia.
- **Balanceamento:** só em `src/config/constants.ts`. Não espalhe números mágicos.
- **Ciclo dia/noite (energia solar):** `MarsSkySystem.timeOfDay` / `solCount` (1 sol = 24 h de jogo ≈ 40 min reais; 1 hora de jogo = 100 s reais, com `MISSION_CONFIG.GAME_HOURS_PER_SECOND = 0.01`).
- **Dados da NASA embutidos:** crie `src/data/*.tson` (gerados por script, com data de coleta) e um módulo de acesso. Não faça fetch espalhado pelo código.
- **HUD novo:** adicione o markup em `public/game.html` e a lógica em `HudManager.update(...)`.

## Convenções

- **Idioma:** código, identificadores e **textos da UI em inglês** (a submissão é em inglês). Docs e parte dos comentários estão em pt-BR. Textos da UI sem emoji (estilo pixel atual).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **Fluxo de PR:** skills do projeto em `.claude/skills/`: `/setup-issue` (sessão só para criar issues, com checagem de duplicata e do código), `/start-issue` (pegar uma issue) e `/send-pr` (rebase, checagens e PR vinculado a uma issue). Repo `nayetdet/nasa-space-apps`, branch base `main`. Nunca faça push direto na `main`.
- **Modo Shaders:** o botão `Shaders: On/Off` do menu liga sombra do Sol, bloom, raios de luz e tone mapping (`src/graphics/shaderMode/`, números em `GRAPHICS_CONFIG`). As `PointLight` da cena são tratadas como lâmpadas de cômodo (luz primária dos interiores) e ganham sombra própria nesse modo; luz colorida de apoio (telas, estufa, porta, plataforma) entra em `accentLights.ts`, que só existe na cena com o modo ligado. Por padrão liga só em GPU de verdade e fora de telas de toque, e se desliga sozinho se o FPS cair. Desligado, o jogo desenha direto na tela, como antes. Fragment shader escrito à mão precisa terminar com `#include <colorspace_fragment>` (ou com `SRGB_AUTHORED_OUTPUT`, de `src/graphics/srgbOutput.ts`, se as cores foram escolhidas "como aparecem na tela"), senão fica claro demais com os shaders ligados. Mudança visual deve ser conferida nos dois modos.
- **Draw calls:** o custo de um quadro é quase todo CPU dentro de `renderer.render`, proporcional ao número de `Mesh` desenhados (medido em 15/11/2026: ~8 µs por desenho). Modelo feito de muitas caixinhas não deve virar um `Mesh` por caixa: junte por material (`mergeByMaterial`, em `nasaModelsBuilder.ts`) ou, se as peças se mexem, use instancing como `src/crew/crewInstances.ts` (a tripulação inteira em 2 desenhos; `sync()` roda uma vez por quadro no loop do `GameEngine`). O painel F3 mostra os draw calls. No modo Shaders, peça com raio menor que `GRAPHICS_CONFIG.SHADOW_CASTER_MIN_RADIUS` não faz sombra; grupo com muitas peças pequenas pode ter uma caixa de sombra (`userData.shadowProxy`, ver `CrewAvatar`).
- **Performance:** o loop roda a cada frame. Reaproveite `THREE.Vector3`/`Color` (veja os `_sunDir` e as cores constantes em `MarsSkySystem.ts`) e evite alocar dentro do `update`.
- **Créditos e referências:** todo asset, código ou dado externo usado precisa entrar na lista de *References* da submissão. Mantenha-a atualizada nos docs ou no README.
