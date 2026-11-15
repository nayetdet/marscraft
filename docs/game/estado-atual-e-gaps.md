# MarsCraft: estado atual × requisitos do desafio

> Snapshot de 2026-11-14 (base: `main` em `67604af`). Atualize quando mecânicas mudarem.

## O que o jogo já é

Jogo voxel em primeira pessoa **no navegador** (Three.js + Next.js, deploy na Vercel). O jogo usa TypeScript; a rota de servidor `/api/space-weather` protege a chave da NASA. O jogador sobrevive numa cratera de Marte ao redor de uma base/nave.

| Sistema | Onde | O que faz hoje |
|---|---|---|
| Mundo voxel | `src/world/VoxelWorld.ts`, `terrainGenerator.js`, `src/data/marsTerrain.ts` | Mundo 224×48×224 com chunks e meshing. O relevo é a **elevação real** de uma cratera de ~180 m dentro de Gale (HiRISE, 1 bloco ≈ 1 m); só a área das construções foi nivelada e a cratera de gelo é do jogo. Dá para quebrar e colocar blocos. |
| Base e nave | `src/world/nasaSpaceshipBuilder.ts`, `nasaModelsBuilder.js` | Habitat principal, túnel pressurizado, estufa (domo), painéis solares, antena, rover e console, com colisão nos objetos |
| Sobrevivência | `src/player/SurvivalSystem.ts`, `SURVIVAL_CONFIG` | 4 barras de 0–20: **O2, Vida, Água, Comida**. O O2 cai fora e recarrega dentro da área pressurizada, pago pela bateria. Água e comida caem sempre. Zerar qualquer uma tira vida, e vida zerada mata. |
| Missão | `src/mission/*`, `MISSION_CONFIG`, `ENERGY_CONFIG`, `RADIATION_CONFIG`, `STORM_CONFIG` | Bateria carregada pelos painéis, tempestades solares das CMEs do DONKI, dose de radiação em mSv, rádio com atraso e o MAV. O relógio é um só: 1 hora de jogo = 50 s reais, 1 sol = 20 min reais. |
| Tripulação e estações | `src/crew/*`, `src/core/StationSystem.ts`, `UtilityModule.js` | Tripulantes NPC que consomem ar, água e comida e operam estufa, reciclador, gerador de O2 e enfermaria; módulo norte com energia, cozinha, banheiro e oficina |
| Consumíveis | `src/config/blockTypes.ts` | Martian Ice (+água) e as colheitas da estufa (alface, batata, soja e cenoura: +comida, +vida), usados com o botão direito |
| Céu astronômico | `src/sky/*` | Sol, Terra e Lua vistos de Marte, Fobos e Deimos, ciclo dia/noite em "sols", luneta (tecla Z); o tempo passa mais rápido dormindo no beliche do dormitório (issue #109; a tecla T ficou só no painel de admin) |
| HUD | `src/ui/HudManager.ts`, `public/game.html` | Barras estilo Minecraft, hotbar de 9 slots, inventário (tecla E, 36 slots), toasts, tela de morte e rótulos no céu. **UI em inglês.** |

## Organização da base (`src/base/`)

A base é dividida em zonas com placa, cor no piso e função: `CMD-1` comando, `LSS-1` suporte de vida, `HAB-1` beliches, `SHL-1` abrigo de tempestade, `MED-1` enfermaria, `GRN-1` estufa, `GYM-1` academia e `AL-1` airlock.

- **Telas vivas** (`baseDisplayText.js` + `baseCanvas.js`): status da base no comando, mapa de energia no suporte de vida, medidor de radiação dentro do abrigo (mostra os litros na parede de água) e painel da estufa. Redesenham só quando o conteúdo muda.
- **Pôsteres educativos** (`basePosters.js`): 8 pôsteres com um quadro "REAL DATA" e a fonte; três deles formam uma galeria no túnel da estufa. Mirar e apertar [F] mostra o dado.
- **Menu**: "NASA Data" (fontes, aviso de que o dado é embutido e rótulo "LIVE" só para o clima espacial buscado na hora) e "Demo Controls" (adiantar a próxima tempestade real, noite, meio-dia e bateria a 10 %), pensado para jurados e para gravar o vídeo.

A ala norte (`NORTH_WING` em `habitatLayout.js`) é um corredor central envidraçado que liga quatro módulos separados, cada um com a sua função: energia e aquecimento, cozinha, banheiro e oficina. O campo solar fica a oeste do módulo de energia.

O dormitório é um módulo próprio a leste do habitat (`EAST_WING` em `habitatLayout.js`), com três beliches, armários e mesa. A mobília de cenário de cada seção fica em `src/base/baseFurniture.ts`.

A estufa é a maior estrutura da base: redoma de raio 14 (`DOME_X`, `DOME_RADIUS` em `habitatLayout.js`) com praça central e anel de caminhada. Toda a plantação é plantável: o canteiro do jardim e oito campos, quatro de dentro (A1 a A4) e quatro de fora (B1 a B4), em `GREENHOUSE_PLOTS` (`greenhouseLayout.js`). O monitor de comida mostra a estufa vista de cima (`src/ui/greenhouseMap.ts`): o jogador toca num campo e escolhe a cultura. Campo maior custa mais água e energia de uma vez e rende mais refeições (`GREENHOUSE_PLOT_YIELD`). As plantas 3D de cada campo ficam em `src/base/greenhouseFields.ts`.

O abrigo de tempestade, o terminal de rádio e o módulo norte são da issue #56 (`nasaModelsBuilder.js`); `baseDecor.js` só acrescenta placa, pôster e medidor a eles.

## Comparação com o que o desafio pede

| Requisito do desafio | Situação | Gap |
|---|---|---|
| Posto avançado na Lua/Marte | ✅ Marte | — |
| **Suporte de vida** | ✅ | O O2 do habitat só recarrega com energia da bateria (issue #30). |
| **Blindagem contra radiação** | ✅ | Tempestades solares a partir de CMEs reais do DONKI, dose em mSv (RadLab), blindagem ligada pelo item Shield Remote (hotbar) que gasta energia (issue #30) e abrigo de tempestade com parede de água que troca água por proteção (issue #56). |
| **Orçamento de energia** | ✅ | Bateria carregada pelo Sol (43 % da Terra, zero à noite); gastam O2, blindagem, fábrica de combustível e rádio (issue #30). |
| **Lote de 15/11/2026 (issues #135, #228, #229, #237)** | ✅ | Cards de rádio com o tripulante que fala, texto letra por letra e escolha rápida [1] HIDE / [2] SHIELD no alerta de tempestade, sem travar o jogador (#135). Parede do abrigo com 60 L e espera rápida da tempestade só com a parede cheia (#228). Regra única do tempo: água e comida da tripulação no valor real do BVAD, fome e sede no relógio do jogo, plantas com dias reais e exceções com nome na aba REAL VS GAME (#229; a conta interna de energia continua em %, com a régua em kW só para comparar). Tutorial desvia a criança para buscar o recurso que falta e volta ao passo (#237). |
| **Condição de vitória** | ✅ | Abastecer o MAV (gelo + energia), sobreviver a 3 tempestades e enviar ciência de verdade para a Terra (issue #30): tudo o que a criança acha vale **pontos de ciência** (descobertas do scanner e amostras do mapa analisadas; issues #269 e #270), o painel SCIENCE FOR EARTH lista cada item com nome e pontos e o foguete pede 10 pontos enviados, com custo de energia por item e envio em partes; melhorias do traje gastam pontos não enviados; tubos de amostra no foguete pedem mais gelo (issue #105). O boletim final tem a nota SCIENCE EXPLORER e mostra o que foi descoberto (issue #271). Agora dentro de uma história em 3 atos, com janela de lançamento: se ela fechar, a partida termina sem decolagem. |
| **História (início, meio e fim)** | ✅ | Animação de pouso → ato 1 (tutorial guiado em 3 passos, HUD em ícones) → ato 2 (preparar a volta, tempestades) → ato 3 (janela de lançamento) → animação de decolagem. Ver [`../superpowers/specs/2026-11-14-story-arc-design.md`](../superpowers/specs/2026-11-14-story-arc-design.md). |
| **Produção de comida** | ✅ | Nove campos plantáveis na estufa (alface, batata e soja), que custam água e energia e só crescem com luz, calor e base limpa; a tripulação também produz rações na estufa. A água é uma só: a planta bebe do tanque da base enquanto cresce, a maior parte volta como água cinza e o reciclador (operado pela tripulação) devolve 98 %; tanque vazio para os campos (issue #101). |
| **Módulo norte (issue #56, parte B)** | ✅ | Sala de energia e aquecimento (consumo de cada sistema e corte de carga; o aquecedor gasta mais à noite e desligado congela canos e estufa), cozinha e despensa (ração da despensa × refeição fresca com cenoura, água e energia), banheiro (lavar vira água cinza; filtro gasto recupera menos que 98 %) e oficina com impressora 3D (regolito + energia consertam a estação mais gasta). O depósito de carga (B6) foi descartado: ensina pouco pelo esforço. |
| **Atraso de comunicação** | ✅ | Terminal de rádio no habitat (issue #56): o atraso vem da distância Terra–Marte calculada para a data (órbitas do JPL); pedir conselho ao Controle da Missão custa energia e a resposta chega atrasada, montada com a situação do momento do envio. Uma conjunção solar encenada deixa o rádio mudo e a criança decide sozinha. No ato 1 da história, o primeiro relatório ao Controle da Missão já ensina esse atraso (resposta só depois da ida e volta do sinal). |
| **Toda escolha tem custo (trade-off)** | 🟡 | O núcleo existe: a bateria é disputada por O2, blindagem, fábrica de combustível, aquecedor, luz da estufa e rádio; a água é disputada por beber, plantar e a parede do abrigo; sair para buscar gelo custa O2 e dose. Buscar gelo com o rover gasta a bateria dele, recarregada no depósito com energia da base (issue #111). Passar o tempo também custa: dormir no beliche gasta comida e água do jogador enquanto a base segue gastando energia (issue #109). |
| **Dados reais da NASA** | 🟡 | Tempestades (CMEs do DONKI), dose de radiação (RadLab, Curiosity), estudos de plantas (OSDR) e o relevo do mundo (HiRISE, cratera em Gale: terreno e radiação vêm do mesmo lugar). Tudo embutido, nada ao vivo (issue #100). A fila de tempestades só usa CMEs com impacto previsto em Marte, com o aviso igual à viagem prevista pela NASA, e a dose de cada tempestade fica entre dois eventos reais medidos pelo Curiosity (issue #99). Coleta embutida de 12 meses (até 13/11/2026): 153 CMEs para Marte. O céu é "inspirado", não alimentado por dados. |
| **Atribuição de fontes no jogo** | ✅ | Tela "NASA Data" no menu e fonte em cada pôster e tela da base. |
| Público de 7 a 12 anos, linguagem simples | 🟡 | Pôsteres, telas da base e cards de rádio explicam cada restrição com frases curtas. Treino de cadete com 4 certificados (issue #88), causa da morte com protocolo (issue #83, PR #141), alertas com ação e lugar (issue #82, PR #144) e boletim final com notas (issue #90). |
| Navegador, sem conta | ✅ | — |
| Rejogabilidade | 🟡 | Mundo fixo e sem eventos aleatórios (issue #107). O tamanho da tripulação muda a partida. |
| 2 ou 3 recursos centrais | ⚠️ | O painel de missão mostra energia, água, ar e radiação da base, e o jogador ainda tem 4 barras próprias (O2, vida, água, comida). É mais do que os 2 ou 3 que o desafio sugere. |
| UI em inglês para submissão | ✅ | A UI já está em inglês (PR #8). Falta escrever em inglês a página de submissão e a demo. |

## Proposta de núcleo de trade-off (histórico)

> Esta era a proposta inicial. Energia, O2 pago pela bateria, radiação com tempestades do DONKI, rádio com atraso e estufa já estão no jogo; o texto fica como registro da intenção.

Três recursos ligados entre si, todos alimentados por dados reais:

1. **⚡ Energia** (painéis solares → bateria)
   - Gera de dia e zera à noite (o ciclo de sol já existe). Em Marte gera menos que na Terra: [Ref] ~43 %.
   - Consome com: reciclagem de O2 dentro do habitat, luz e água da estufa, blindagem e rádio.
2. **🫁 Suporte de vida (O2)**
   - Dentro do habitat, o O2 **só recarrega se houver energia**. Isso cria o trade-off central.
3. **☢️ Radiação (dose acumulada)**
   - Taxa base = **RadLab Curiosity MSL-RAD real** (~6,9 por hora de jogo, normalizada).
   - **Evento de tempestade solar vindo do DONKI:** a CME real mais recente (velocidade e data) dispara um aviso: "Tempestade solar chega em X horas!". O jogador escolhe **ligar a blindagem (gasta energia)** ou **ir para o abrigo e parar de trabalhar/coletar** (perde produção).
   - Mostrar a origem: "Baseado na CME real de 01/11/2026, 894 km/s (NASA DONKI)".

Extras, se der tempo:
- **📡 Atraso de comunicação:** pedidos de ajuda ou dicas ao "Controle da Missão" chegam com X minutos de atraso. Usar o atraso real Terra–Marte do dia, calculado pela distância.
- **🌱 Estufa:** plantar custa água e energia e devolve comida depois de N sols (tema do toolkit da CSA).
- **📚 Fatos reais (OSDR):** cartões curtos ao morrer ou ao fim de cada sol, ligados à causa ("Na Estação Espacial, a NASA viu ossos enfraquecerem… OSD-342").
- **🗺️ Escolha do local de pouso (Mars Trek):** Gale × Jezero × polo sul da Lua, cada um com parâmetros diferentes (dose, frio, gelo).

## Regras de dados no jogo (vindas do desafio)

- Use dados **embutidos** (JSON em `src/data/` gerado por script) como base e faça fetch ao vivo do DONKI só como bônus, com fallback.
- Rotule sempre: **"ao vivo"** só se o fetch funcionou; caso contrário, **"dados reais de DD/MM/AAAA"**.
- Tenha uma tela de **"Fontes / Dados da NASA"** acessível pelo menu, listando DONKI, RadLab, InSight, OSDR e Mars Trek com links.
- Não use o logo da NASA em texturas ou na UI geradas.

## Direção e rotina do jogo — 14/11/2026

O jogo tinha os sistemas, mas faltava uma direção única e uma rotina que se repete. O que mudou:

- **Animação de chegada com passeio pela base** (`src/story/cutscene/arrivalCutscene.ts`): depois do pouso, a câmera mostra a base, os painéis solares, a estufa, a cratera de gelo e o foguete, cada um com o nome e uma frase de até 5 palavras, e depois a rotina de cada viagem. Fecha mostrando a missão ("Fill the rocket. Fly home."): a tripulação anda até o foguete, embarca e ele decola rumo à Terra no céu. É uma prévia; quando a animação acaba, o foguete está de volta na plataforma, vazio. As frases ficam na tela a no máximo 2 palavras por segundo (regra do jogo, coberta por teste).
- **Meta sempre à vista** (`src/story/objectiveView.ts`, `StoryHud`): o painel do objetivo abre com `GOAL: FLY HOME` e o foguete em 10 degraus, um por bloco de gelo. Gelo entregue acende o degrau em azul e ele vira verde quando a fábrica o transforma em combustível. É o único medidor do foguete: a linha `ROCKET` saiu do painel de recursos.
- **Rotina de 3 passos** (atos 2 e 3): buscar gelo, carregar o foguete e voltar à base para recarregar o ar. O `StoryDirector` marca `needsBase` depois de cada entrega; o painel e a seta do objetivo seguem a mesma rotina. É um guia, não uma trava: pegar mais gelo antes de voltar pula o passo.
- **Uma coisa por vez**: o card do ato 2 só explica a rotina (tempestades e envio de dados aparecem na hora deles) e o painel de recursos mostra um aviso por vez, com um segundo só quando os dois são perigo.

Ficou de fora: marcar o pôr do sol como sinal de voltar para dentro e um resumo no fim de cada sol.

## Atualização da estufa — 14/11/2026

A estufa diferencia alface (rápida), batata (equilibrada) e soja (maior custo/rendimento), acompanha as três culturas colhidas e revela registros reais da API OSDR no caderno, com data e links. Veja o procedimento reprodutível em `docs/data/apis-nasa.md`. Tempos e rendimentos são regras do jogo, identificadas assim na tela; os estudos embutidos são históricos.

### Culturas como itens e modelos voxel

Batata, alface e soja têm IDs próprios, sprites de inventário e modelos 3D distintos, compartilhados entre mão e drops. As plantas do canteiro usam modelos próprios, com crescimento ancorado no piso. A colheita do painel solta o alimento no mundo; é preciso recolher e usar para comer. O inventário mantém nove slots de hotbar e 27 de mochila. As cenouras decorativas/mineráveis continuam separadas. Modelos e ícones novos foram construídos em código, sem assets externos, com assistência de IA.

O ponto de interação da estufa abre o painel de cultivo. As folhas das portas do airlock são recortadas no limite do vão durante o deslizamento, impedindo que apareçam atravessando os blocos laterais; o ciclo de pressão e a colisão continuam operantes.

## Educação e experiência do jogador — 14/11/2026

- **Causa da morte (#83, PRs #141 e #142, `src/player/deathReport.ts`):** feita fora desta leva. Com o RTG o CO2 só sobe com o filtro cheio, então a morte por ar ruim aparece como filtro, não como falta de energia.
- **Alertas (#82, PR #144):** feita fora desta leva (prioridade, texto de ação e seta para a estação). Com a bateria vazia o alerta de energia vale também para o modo de espera do RTG.
- **Noite e RTG (#85):** o RTG (`ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR`) paga só o suporte de vida (O2 e filtro de CO2); com a bateria vazia as máquinas param, mas ninguém morre dentro da base. O painel mostra o fluxo líquido da bateria (`+4/h`) e às 16h30 vem o aviso de pôr do sol. O aquecedor ficou na bateria de propósito, para a escolha de desligá-lo à noite continuar valendo.
- **Tutorial guiado (15/11/2026, substitui o treino de cadete #88):** 15 passos, um por vez, cada um com balão próprio, dica no painel e seta (`src/story/tutorialSteps.ts`): do básico (entrar, beber, comer, chamar a Terra no terminal de rádio) ao avançado (rover, gelo, foguete, luneta). 4 passos ainda entregam certificado (energia, estufa, academia e parede de água do abrigo, com um pulso de radiação simulado). As tempestades só começam depois do último passo. "Skip the tutorial" fica em Demo Tools. Desenho em `docs/superpowers/specs/2026-11-15-guided-tutorial-design.md`. A issue pedia regolito sobre o abrigo e o ARED; o jogo usa a parede de água e a esteira/bicicleta, que já são mecânicas reais dele.
- **Estufa (#89, `src/base/greenhouseCare.ts`):** o monitor mostra luz LED, água reciclada e poeira; as plantas amarelam quando param de crescer; o fato "Space science on Earth" é recompensa de descoberta (#216): a primeira colheita do jogador de cada planta (e a colheita seguinte a ter colhido as 3) mostra, depois que o monitor fecha, a abertura "DISCOVERY!" (sinal de Marte para a Terra) e o card do fato com ícones (`src/ui/FirstTimeHud.ts`), uma vez por partida, e fica no diário [J], aba LOG. A colheita da tripulação não mostra nada.
- **Animações de "primeira vez" (`src/story/firstTimeMoments.ts`, `src/ui/FirstTimeHud.ts`):** a primeira vez de cada ação principal (pegar gelo, beber, comer, ligar para a Terra, abrir o painel de energia, plantar, treinar, lavar, encher a parede do abrigo, dirigir o rover, carregar o foguete, sobreviver a uma tempestade solar) mostra uma abertura curta no meio da tela, com a palavra, a cor e a cena animada do momento, e depois um card com um fato real e a fonte. Uma vez por partida, uma de cada vez (fila), só com o jogo rodando, e fica no diário [J], aba LOG. Para criar um momento novo: uma entrada em `FIRST_TIME_MOMENTS` ligada a um contador do `_storySnapshot`.
- **Modais de trade-off (15/11/2026, `src/story/tradeoffScenes.ts`, `src/ui/TradeoffHud.ts`):** cada trade-off é explicado na hora da tarefa ou do evento, não antes da missão, num modal animado no meio da tela que pausa o jogo (uma ou duas palavras, uma frase de até 7 palavras; fecha com Enter, OK ou clique). São 10 cenas: EARTH (relatório pelo rádio), POWER (bateria), FOOD (plantar), WATER (parede de água), OUTSIDE (buscar gelo), NIGHT (pôr do sol), SLEEP (beliche), DUST STORM, SOLAR STORM e MARSQUAKE. Cada cena aparece **uma vez por partida** (fica guardada no navegador; Reset World apaga): na segunda vez a criança resolve sozinha. Nenhuma cena repete o trade-off de outra (meteoro = gelo lá fora, sem cena própria). O modal de antes do Play (PR #286) saiu. Para criar uma cena nova: uma entrada em `TRADEOFF_SCENES` com o gatilho.
- **Ritmo dos eventos (15/11/2026):** os eventos sorteados de Marte começam no primeiro selo do tutorial (antes era só no ato 2) e o primeiro vem em 50 a 100 s reais; a primeira tempestade de poeira vem de 2 a 4 horas de jogo depois do início do ato 2 (antes, 8 a 16). A tempestade solar continua só depois do tutorial.
- **Boletim (#90, `src/mission/missionReport.ts`):** vitória e janela fechada mostram 4 notas S/A/B/C (radiação, saúde, cultivo e engenharia) e um perfil com o ponto forte e uma dica. A água reciclada não entra na nota: o reciclador da tripulação não roda na partida (a tripulação é só ambiente desde o commit c097929).
