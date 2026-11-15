# MineMars: estado atual × requisitos do desafio

> Snapshot de 2026-11-14 (base: `main` em `8ac347f`). Atualize quando mecânicas mudarem.

## O que o jogo já é

Jogo voxel em primeira pessoa **no navegador** (Three.js + Vite, sem backend, deploy no GitHub Pages). O jogador sobrevive numa cratera de Marte ao redor de uma base/nave.

| Sistema | Onde | O que faz hoje |
|---|---|---|
| Mundo voxel | `src/world/VoxelWorld.js`, `terrainGenerator.js`, `src/data/marsTerrain.js` | Mundo 224×48×224 com chunks e meshing. O relevo é a **elevação real** de uma cratera de ~180 m dentro de Gale (HiRISE, 1 bloco ≈ 1 m); só a área das construções foi nivelada e a cratera de gelo é do jogo. Dá para quebrar e colocar blocos. |
| Base e nave | `src/world/nasaSpaceshipBuilder.js`, `nasaModelsBuilder.js` | Habitat principal, túnel pressurizado, estufa (domo), painéis solares (só visual), antena, rover e console, com colisão nos objetos |
| Sobrevivência | `src/player/SurvivalSystem.js`, `SURVIVAL_CONFIG` | 4 barras de 0–20: **O2, Vida, Água, Comida**. O O2 cai fora e recarrega dentro da área pressurizada. Água e comida caem sempre. Zerar qualquer uma tira vida, e vida zerada mata. |
| Consumíveis | `src/config/blockTypes.js` | Martian Ice (+água) e Mars Potato (+comida, +vida), usados com o botão direito |
| Céu astronômico | `src/sky/*` | Sol, Terra e Lua vistos de Marte, Fobos e Deimos, ciclo dia/noite em "sols", luneta (tecla Z), avanço de tempo (tecla T) |
| HUD | `src/ui/HudManager.js`, `index.html` | Barras estilo Minecraft, hotbar de 9 slots, inventário (tecla E, 36 slots), toasts, tela de morte e rótulos no céu. **UI em inglês.** |

## Organização da base (`src/base/`)

A base é dividida em zonas com placa, cor no piso e função: `CMD-1` comando, `LSS-1` suporte de vida, `HAB-1` beliches, `SHL-1` abrigo de tempestade, `MED-1` enfermaria, `GRN-1` estufa, `GYM-1` academia e `AL-1` airlock.

- **Telas vivas** (`baseDisplayText.js` + `baseCanvas.js`): status da base no comando, mapa de energia no suporte de vida, medidor de radiação dentro do abrigo (mostra os litros na parede de água) e painel da estufa. Redesenham só quando o conteúdo muda.
- **Pôsteres educativos** (`basePosters.js`): 8 pôsteres com um quadro "REAL DATA" e a fonte; três deles formam uma galeria no túnel da estufa. Mirar e apertar [F] mostra o dado.
- **Menu**: "NASA Data" (fontes e aviso de que o dado é embutido, não ao vivo) e "Demo Controls" (adiantar a próxima tempestade real, noite, meio-dia e bateria a 10 %), pensado para jurados e para gravar o vídeo.

A ala norte (`NORTH_WING` em `habitatLayout.js`) é um corredor central envidraçado que liga quatro módulos separados, cada um com a sua função: energia e aquecimento, cozinha, banheiro e oficina. O campo solar fica a oeste do módulo de energia.

O dormitório é um módulo próprio a leste do habitat (`EAST_WING` em `habitatLayout.js`), com três beliches, armários e mesa. A mobília de cenário de cada seção fica em `src/base/baseFurniture.js`.

A estufa é a maior estrutura da base: redoma de raio 14 (`DOME_X`, `DOME_RADIUS` em `habitatLayout.js`) com praça central e anel de caminhada. Toda a plantação é plantável: o canteiro do jardim e oito campos, quatro de dentro (A1 a A4) e quatro de fora (B1 a B4), em `GREENHOUSE_PLOTS` (`greenhouseLayout.js`). O monitor de comida mostra a estufa vista de cima (`src/ui/greenhouseMap.js`): o jogador toca num campo e escolhe a cultura. Campo maior custa mais água e energia de uma vez e rende mais refeições (`GREENHOUSE_PLOT_YIELD`). As plantas 3D de cada campo ficam em `src/base/greenhouseFields.js`.

O abrigo de tempestade, o terminal de rádio e o módulo norte são da issue #56 (`nasaModelsBuilder.js`); `baseDecor.js` só acrescenta placa, pôster e medidor a eles.

## Comparação com o que o desafio pede

| Requisito do desafio | Situação | Gap |
|---|---|---|
| Posto avançado na Lua/Marte | ✅ Marte | — |
| **Suporte de vida** | ✅ | O O2 do habitat só recarrega com energia da bateria (issue #30). |
| **Blindagem contra radiação** | ✅ | Tempestades solares a partir de CMEs reais do DONKI, dose em mSv (RadLab), blindagem ligada pelo item Shield Remote (hotbar) que gasta energia (issue #30) e abrigo de tempestade com parede de água que troca água por proteção (issue #56). |
| **Orçamento de energia** | ✅ | Bateria carregada pelo Sol (43 % da Terra, zero à noite); gastam O2, blindagem, fábrica de combustível e rádio (issue #30). |
| **Condição de vitória** | ✅ | Abastecer o MAV (gelo + energia), sobreviver a 3 tempestades e enviar os dados científicos (issue #30). Agora dentro de uma história em 3 atos, com janela de lançamento: se ela fechar, a partida termina sem decolagem. |
| **História (início, meio e fim)** | ✅ | Animação de pouso → ato 1 (tutorial guiado em 3 passos, HUD em ícones) → ato 2 (preparar a volta, tempestades) → ato 3 (janela de lançamento) → animação de decolagem. Ver [`../superpowers/specs/2026-11-14-story-arc-design.md`](../superpowers/specs/2026-11-14-story-arc-design.md). |
| **Produção de comida** | 🟡 | Batatas são um estoque finito; não há cultivo, nem custo de água/energia na estufa. |
| **Módulo norte (issue #56, parte B)** | ✅ | Sala de energia e aquecimento (consumo de cada sistema e corte de carga; o aquecedor gasta mais à noite e desligado congela canos e estufa), cozinha e despensa (ração da despensa × refeição fresca com cenoura, água e energia), banheiro (lavar vira água cinza; filtro gasto recupera menos que 98 %) e oficina com impressora 3D (regolito + energia consertam a estação mais gasta). O depósito de carga (B6) foi descartado: ensina pouco pelo esforço. |
| **Atraso de comunicação** | ✅ | Terminal de rádio no habitat (issue #56): o atraso vem da distância Terra–Marte calculada para a data (órbitas do JPL); pedir conselho ao Controle da Missão custa energia e a resposta chega atrasada, montada com a situação do momento do envio. Uma conjunção solar encenada deixa o rádio mudo e a criança decide sozinha. No ato 1 da história, o primeiro relatório ao Controle da Missão já ensina esse atraso (resposta só depois da ida e volta do sinal). |
| **Toda escolha tem custo (trade-off)** | ❌ | **Este é o gap principal.** Hoje não há nenhuma decisão com custo: a estratégia ótima é ficar dentro da nave. |
| **Dados reais da NASA** | ✅ | Tempestades (CMEs do DONKI), dose de radiação (RadLab, Curiosity) e o relevo do mundo (HiRISE, cratera em Gale: terreno e radiação vêm do mesmo lugar). O céu é "inspirado", não alimentado por dados. |
| **Atribuição de fontes no jogo** | ✅ | Tela "NASA Data" no menu e fonte em cada pôster e tela da base. |
| Público de 7 a 12 anos, linguagem simples | 🟡 | O texto é simples, mas o jogo **não ensina** nenhuma restrição real. Vale explicar termos como "sol" e "dose". |
| Navegador, sem conta | ✅ | — |
| Rejogabilidade | 🟡 | Mundo fixo e sem eventos aleatórios. |
| 2 ou 3 recursos centrais | ⚠️ | Hoje são 4 barras (O2, vida, água, comida) e nenhuma é de energia ou radiação. Considere **trocar** e não somar: Energia + O2 + Radiação, com água e comida abstraídas ou ligadas à estufa. |
| UI em inglês para submissão | ✅ | A UI já está em inglês (PR #8). Falta escrever em inglês a página de submissão e a demo. |

## Proposta de núcleo de trade-off (mínimo viável para a entrega)

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

## Atualização da estufa — 14/11/2026

O snapshot e vários gaps acima estão desatualizados: o código já contém estufa plantável, energia, comunicação e fontes NASA. A estufa agora diferencia alface (rápida), batata (equilibrada) e soja (maior custo/rendimento), acompanha as três culturas colhidas e revela registros reais da API OSDR no caderno, com data e links. Veja o procedimento reprodutível em `docs/data/apis-nasa.md`. Tempos e rendimentos são regras do jogo, identificadas assim na tela; os estudos embutidos são históricos.

### Culturas como itens e modelos voxel

Batata, alface e soja têm IDs próprios, sprites de inventário e modelos 3D distintos, compartilhados entre mão e drops. As plantas do canteiro usam modelos próprios, com crescimento ancorado no piso. A colheita do painel solta o alimento no mundo; é preciso recolher e usar para comer. O inventário mantém nove slots de hotbar e 27 de mochila. As cenouras decorativas/mineráveis continuam separadas. Modelos e ícones novos foram construídos em código, sem assets externos, com assistência de IA.

O ponto de interação da estufa abre o painel de cultivo. As folhas das portas do airlock são recortadas no limite do vão durante o deslizamento, impedindo que apareçam atravessando os blocos laterais; o ciclo de pressão e a colisão continuam operantes.
